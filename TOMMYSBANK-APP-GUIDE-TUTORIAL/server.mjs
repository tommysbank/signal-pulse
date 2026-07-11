import { createServer } from "node:http";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const root = join(projectRoot, "public");
const stateFile = process.env.STATE_FILE || join(projectRoot, "data", "runtime-state.json");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const allowDemo = process.env.ALLOW_DEMO === "true" || process.env.NODE_ENV !== "production";
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const publicChannel = parsePublicChannel(process.env.TELEGRAM_PUBLIC_URL || "");
const scrapeInterval = Math.max(5_000, Number(process.env.SCRAPE_INTERVAL_MS || 8_000));
const priceInterval = Math.max(3_000, Number(process.env.PRICE_INTERVAL_MS || 3_000));
const deadCandidateWindow = Math.max(10 * 60_000, Number(process.env.DEAD_CANDIDATE_MINUTES || 30) * 60_000);
const missingPairWindow = Math.max(30 * 60_000, Number(process.env.MISSING_PAIR_MINUTES || 60) * 60_000);
const lowMarketCapWindow = Math.max(60 * 60_000, Number(process.env.LOW_MARKET_CAP_HOURS || 5) * 60 * 60_000);
const lowMarketCapCeilingUsd = Math.max(1_000, Number(process.env.LOW_MARKET_CAP_CEILING_USD || 6_000));
const deadMarketCapTouchUsd = Math.max(500, Number(process.env.DEAD_MARKET_CAP_TOUCH_USD || 3_000));
const majorDrawdownRatio = Math.min(0.75, Math.max(0.05, Number(process.env.MAJOR_DRAWDOWN_RATIO || 0.35)));
const entryCloseLossRatio = Math.min(0.95, Math.max(0.05, Number(process.env.ENTRY_CLOSE_LOSS_RATIO || 0.55)));
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";
const membershipSiteUrl = (process.env.MEMBERSHIP_SITE_URL || "").replace(/\/$/, "");
const membershipApiUrl = process.env.MEMBERSHIP_API_URL || (membershipSiteUrl ? `${membershipSiteUrl}/api/membership` : "");
const authRequired = process.env.REQUIRE_MEMBERSHIP !== "false"
  && Boolean(supabaseUrl && supabasePublishableKey && membershipApiUrl);

const clients = new Set();
const subscriptions = new Map();
const accessCache = new Map();
const demoSignals = [
  {
    id: "welcome-1",
    ticker: "NOVA",
    name: "Nova Protocol",
    chain: "SOL",
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHqD",
    entry: "$0.0042",
    marketCap: "$420K",
    target: "2×",
    confidence: "High",
    createdAt: new Date(Date.now() - 62_000).toISOString(),
    source: "demo"
  },
  {
    id: "welcome-2",
    ticker: "PEPEAI",
    name: "Pepe AI",
    chain: "ETH",
    address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    entry: "$0.000018",
    marketCap: "$1.8M",
    target: "1.5×",
    confidence: "Medium",
    createdAt: new Date(Date.now() - 24 * 60_000).toISOString(),
    source: "demo"
  }
];
const signals = allowDemo && !publicChannel ? [...demoSignals] : [];
const seenPosts = new Set();
const seenAddresses = new Set();
let scrapeTimer;
let priceTimer;
let persistTimer;
let scrapeFailures = 0;
let scrapeRunning = false;
let priceTrackingRunning = false;
let scraperInitialized = false;
const sourceStatus = {
  mode: publicChannel ? "public-scraping" : webhookSecret ? "telegram-webhook" : "demo",
  channel: publicChannel?.username || null,
  sourceUrl: publicChannel?.canonicalUrl || null,
  lastCheckedAt: null,
  lastSignalAt: null,
  lastError: null,
  lastPageMessages: 0,
  lastPageSignals: 0,
  lastPageRejected: 0
};

const chainIds = {
  SOL: "solana",
  ETH: "ethereum",
  BASE: "base",
  RBH: "robinhood"
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf"
};

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function bearerToken(req) {
  const authorization = String(req.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function tokenCacheKey(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function membershipAccess(req) {
  if (!authRequired) return { active: true, publicMode: true };
  const token = bearerToken(req);
  if (!token) return null;

  const cacheKey = tokenCacheKey(token);
  const cached = accessCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(membershipApiUrl, {
      headers: { authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const value = payload.membership?.active
      ? { user: payload.user, membership: payload.membership }
      : null;
    accessCache.set(cacheKey, { value, expiresAt: Date.now() + (value ? 30_000 : 5_000) });
    if (accessCache.size > 500) {
      for (const [key, entry] of accessCache) {
        if (entry.expiresAt <= Date.now()) accessCache.delete(key);
      }
    }
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function requireMember(req, res) {
  const access = await membershipAccess(req);
  if (access) return access;
  json(res, bearerToken(req) ? 403 : 401, {
    error: bearerToken(req) ? "Active membership required" : "Authentication required",
  });
  return null;
}

function publicSourceStatus() {
  const { channel, sourceUrl, ...status } = sourceStatus;
  return status;
}

function publicSignal(signal) {
  const { sourceUrl, ...visibleSignal } = signal;
  return visibleSignal;
}

async function restoreRuntimeState() {
  if (!publicChannel) return;
  try {
    const saved = JSON.parse(await readFile(stateFile, "utf8"));
    if (saved.channel !== publicChannel.username) return;
    for (const post of saved.seenPosts || []) seenPosts.add(post);
    for (const address of saved.seenAddresses || []) seenAddresses.add(address.toLowerCase());
    for (const signal of saved.signals || []) {
      signal.tracking ||= {};
      signal.tracking.lifecycle ||= "active";
      signals.push(signal);
    }
    for (const subscription of saved.subscriptions || []) {
      if (subscription?.endpoint) subscriptions.set(subscription.endpoint, subscription);
    }
    signals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    scraperInitialized = saved.baselined === true;
    sourceStatus.lastSignalAt = signals[0]?.createdAt || null;
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Impossibile ripristinare lo stato:", error.message);
  }
}

async function persistRuntimeState() {
  if (!publicChannel) return;
  const payload = {
    version: 1,
    channel: publicChannel.username,
    baselined: scraperInitialized,
    savedAt: new Date().toISOString(),
    seenPosts: [...seenPosts].slice(-500),
    seenAddresses: [...seenAddresses],
    signals,
    subscriptions: [...subscriptions.values()]
  };
  const temporary = `${stateFile}.tmp`;
  try {
    await mkdir(join(stateFile, ".."), { recursive: true });
    await writeFile(temporary, JSON.stringify(payload), "utf8");
    await rename(temporary, stateFile);
  } catch (error) {
    console.warn("Impossibile salvare lo stato:", error.message);
  }
}

function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => void persistRuntimeState(), 350);
  persistTimer.unref?.();
}

function parsePublicChannel(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["t.me", "www.t.me"].includes(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const username = parts[0] === "s" ? parts[1] : parts[0];
    if (!username || !/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
    return {
      username,
      canonicalUrl: `https://t.me/${username}`,
      previewUrl: `https://t.me/s/${username}`
    };
  } catch {
    return null;
  }
}

function decodeHtml(value) {
  const entities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\""
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => entities[name.toLowerCase()] ?? entity);
}

function htmlToText(value) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPublicPosts(html) {
  const chunks = html.split(/<div class="tgme_widget_message_wrap[^"]*"/i).slice(1);
  const posts = [];

  for (const chunk of chunks) {
    const post = chunk.match(/data-post="([^"]+)"/i)?.[1];
    const datetime = chunk.match(/<time[^>]+datetime="([^"]+)"/i)?.[1];
    const textHtml = chunk.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
    if (!post || !textHtml) continue;

    posts.push({
      post,
      message_id: post.split("/").pop(),
      text: htmlToText(textHtml),
      date: datetime ? Math.floor(new Date(datetime).getTime() / 1000) : null,
      sourceUrl: `https://t.me/${post}`
    });
  }

  return posts;
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 1_000_000) throw new Error("Payload too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function pick(text, patterns, fallback = "—") {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return fallback;
}

function extractAddress(text) {
  const exactLine = text.match(/^\s*(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})\s*$/m)?.[1];
  if (exactLine) return exactLine;

  const labelled = text.match(/(?:CA|contract|address|token)\s*[:\-]\s*(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})/i)?.[1];
  if (labelled) return labelled;

  const evm = [...text.matchAll(/\b(0x[a-fA-F0-9]{40})\b/g)].map((match) => match[1]);
  if (evm.length) return evm.at(-1);

  const solana = [...text.matchAll(/\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/g)].map((match) => match[1]);
  return solana.at(-1) || "";
}

function classifyPublicSignal(text, address) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!address) return { accepted: false, reason: "missing-address" };

  if (/\b(?:scam|warning|beware|do not buy|don't buy|fake ca|fake contract|impersonator|hacked)\b/i.test(normalized)) {
    return { accepted: false, reason: "safety-warning" };
  }

  if (/\b(?:giveaway|airdrop|sponsored|advertisement|paid promo|whitelist)\b/i.test(normalized)) {
    return { accepted: false, reason: "promotion" };
  }

  if (/^\s*prelaunch\b/i.test(normalized) || /\b(?:launching tomorrow|not live yet|wait for (?:burn|launch))\b/i.test(normalized)) {
    return { accepted: false, reason: "prelaunch" };
  }

  if (
    /^\s*\d+(?:\.\d+)?x\b/i.test(normalized) ||
    /\b(?:did|already|hit|reached)\s+\d+(?:\.\d+)?x\b/i.test(normalized)
  ) {
    return { accepted: false, reason: "performance-update" };
  }

  const hasChain = /\(?\s*(?:🔥\s*)?(?:SOL|ETH|BASE|RBH)\s*\)/iu.test(text);
  if (!hasChain) return { accepted: false, reason: "missing-chain-marker" };

  const hasTicker =
    /\$[A-Z][A-Z0-9_]{1,12}\b/.test(text) ||
    /(?:update\s+)?\(?\s*(?:🔥\s*)?(?:SOL|ETH|BASE|RBH)\s*\)\s*[A-Za-z0-9_]{2,}/iu.test(text);
  if (!hasTicker) return { accepted: false, reason: "missing-token-marker" };

  const hasCallLanguage =
    /\bgambles?\s+channel\b/i.test(normalized) ||
    /\b(?:just|now)\s+(?:went|gone|is)\s+live\b/i.test(normalized) ||
    /\bnew launch\b/i.test(normalized) ||
    /\blow cap gamble\b/i.test(normalized) ||
    /\bpinned in (?:the )?chat earlier\b/i.test(normalized);
  if (!hasCallLanguage) return { accepted: false, reason: "missing-call-language" };

  return { accepted: true, reason: "verified-call-pattern" };
}

function parseSignal(message) {
  const text = message.text || message.caption || "";
  const address = extractAddress(text);

  if (!address) return null;
  if (message.sourceUrl) {
    const classification = classifyPublicSignal(text, address);
    if (!classification.accepted) return null;
  }

  let chain = pick(text, [
    /\(?\s*(?:🔥\s*)?(SOL|ETH|BASE|RBH)\s*\)/iu,
    /(?:chain|network)\s*[:\-]\s*([A-Za-z]+)/i
  ], "");
  if (!chain) chain = address.startsWith("0x") ? "ETH" : "SOL";
  chain = chain.slice(0, 6).toUpperCase();

  const ticker = pick(text, [
    /\$([A-Z][A-Z0-9_]{1,12})\b/,
    /(?:ticker|token)\s*[:\-]\s*\$?([A-Z][A-Z0-9_]{1,12})/i,
    /(?:update\s+)?\(?\s*(?:🔥\s*)?(?:SOL|ETH|BASE|RBH)\s*\)\s*([A-Za-z0-9_]{2,16})/iu
  ], pick(text, [/^update\s+\([^)]*\)\s*([A-Za-z0-9_]{2,16})/im], "TOKEN")).toUpperCase();

  const inferredName = pick(text, [
    /(?:update\s+)?\(?\s*(?:🔥\s*)?(?:SOL|ETH|BASE|RBH)\s*\)\s*([^\n]+)/iu,
    /^update\s+\([^)]*\)\s*([^\n]+)/im
  ], ticker)
    .replace(/\s+Gambles Channel.*$/i, "")
    .trim();

  return {
    id: `tg-${message.message_id || randomUUID()}`,
    ticker,
    name: pick(text, [/(?:name|nome)\s*[:\-]\s*([^\n]+)/i], inferredName),
    chain,
    address,
    entry: pick(text, [/(?:entry|ingresso|buy)\s*[:\-]\s*([^\s\n]+)/i]),
    marketCap: pick(text, [/(?:MC|market\s*cap)\s*[:\-]\s*([^\s\n]+)/i]),
    target: pick(text, [/(?:target|TP)\s*[:\-]\s*([^\s\n]+)/i]),
    confidence: pick(text, [/(?:confidence|rating)\s*[:\-]\s*([^\n]+)/i], "New"),
    createdAt: message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString(),
    source: message.sourceUrl ? "telegram-public" : "telegram",
    sourceUrl: message.sourceUrl || null,
    tracking: {
      status: "waiting-pair",
      entryPriceUsd: null,
      currentPriceUsd: null,
      currentX: null,
      peakX: null,
      peakPriceUsd: null,
      peakAt: null,
      marketCapUsd: null,
      liquidityUsd: null,
      pairUrl: null,
      pairAddress: null,
      preferredPairAddress: text.match(/https?:\/\/dexscreener\.com\/[^/\s]+\/([A-Za-z0-9]+)/i)?.[1] || null,
      lastUpdatedAt: null,
      lifecycle: "active",
      endedAt: null,
      endReason: null,
      deadCandidateSince: null,
      missingPairSince: null,
      activityH1: null,
      volumeH1Usd: null,
      peakMarketCapUsd: null,
      minimumMarketCapUsd: null,
      lowMarketCapSince: null,
      history: []
    }
  };
}

function broadcastEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) client.write(payload);
}

function broadcast(signal) {
  broadcastEvent("signal", publicSignal(signal));
}

async function getWebPush() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return null;
  const { default: webpush } = await import("web-push");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  return webpush;
}

function subscriptionEligible(subscription) {
  if (!authRequired) return true;
  if (!subscription?.userId) return false;
  if (subscription.membershipPlan === "lifetime") return true;
  const expiresAt = new Date(subscription.membershipExpiresAt || 0).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

async function sendPushPayload(payload, targetSubscriptions = [...subscriptions.values()]) {
  const eligibleSubscriptions = targetSubscriptions.filter(subscriptionEligible);
  if (!eligibleSubscriptions.length) return { sent: 0, failed: targetSubscriptions.length };
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { sent: 0, failed: eligibleSubscriptions.length };
  }
  try {
    const webpush = await getWebPush();
    if (!webpush) return { sent: 0, failed: eligibleSubscriptions.length };
    const outcomes = await Promise.all(eligibleSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return true;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) subscriptions.delete(subscription.endpoint);
        return false;
      }
    }));
    schedulePersist();
    const sent = outcomes.filter(Boolean).length;
    return { sent, failed: outcomes.length - sent };
  } catch (error) {
    console.warn("Web Push non disponibile:", error.message);
    return { sent: 0, failed: eligibleSubscriptions.length };
  }
}

async function sendPush(signal) {
  return sendPushPayload({
    title: `New TOMYSBANK signal: $${signal.ticker}`,
    body: `${signal.chain} · Price tracking is live · Tap to copy the contract`,
    signal: publicSignal(signal)
  });
}

function publish(signal) {
  const addressKey = signal.address.toLowerCase();
  if (signals.some((item) => item.id === signal.id)) {
    return false;
  }
  signals.unshift(signal);
  seenAddresses.add(addressKey);
  sourceStatus.lastSignalAt = signal.createdAt;
  broadcast(signal);
  void sendPush(signal);
  schedulePersist();
  void updateTrackedPrices([signal]);
  return true;
}

function compactMoney(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1 ? 2 : 6
  }).format(value);
}

function choosePair(signal, pairs) {
  const address = signal.address.toLowerCase();
  const validPairs = pairs
    .filter((pair) => pair.baseToken?.address?.toLowerCase() === address && Number(pair.priceUsd) > 0)
    .sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
  const preferred = signal.tracking?.preferredPairAddress?.toLowerCase();
  if (preferred) {
    const exact = validPairs.find((pair) => pair.pairAddress?.toLowerCase() === preferred);
    if (exact) return exact;
  }
  return validPairs[0] || null;
}

function appendHistory(tracking, point) {
  tracking.history ||= [];
  tracking.history.push(point);
  if (tracking.history.length > 2_000) {
    const older = tracking.history.slice(0, -1_000).filter((_, index) => index % 10 === 0);
    tracking.history = [...older.slice(-1_000), ...tracking.history.slice(-1_000)];
  }
}

function completeSignal(signal, reason, now = new Date()) {
  signal.tracking ||= {};
  if (signal.tracking.lifecycle === "completed") return false;
  const peakX = Number(signal.tracking.peakX);
  const peakPriceUsd = Number(signal.tracking.peakPriceUsd);
  const peakMarketCapUsd = Number(signal.tracking.peakMarketCapUsd);
  const currentX = Number(signal.tracking.currentX);
  const currentPriceUsd = Number(signal.tracking.currentPriceUsd);
  const currentMarketCapUsd = Number(signal.tracking.marketCapUsd);
  signal.tracking.lifecycle = "completed";
  signal.tracking.status = "completed";
  signal.tracking.endedAt = now.toISOString();
  signal.tracking.endReason = reason;
  signal.tracking.finalX = Number.isFinite(peakX) && peakX > 0 ? peakX : Number.isFinite(currentX) && currentX > 0 ? currentX : null;
  signal.tracking.finalPriceUsd = Number.isFinite(peakPriceUsd) && peakPriceUsd > 0 ? peakPriceUsd : Number.isFinite(currentPriceUsd) && currentPriceUsd > 0 ? currentPriceUsd : null;
  signal.tracking.finalMarketCapUsd = Number.isFinite(peakMarketCapUsd) && peakMarketCapUsd > 0 ? peakMarketCapUsd : Number.isFinite(currentMarketCapUsd) && currentMarketCapUsd > 0 ? currentMarketCapUsd : null;
  signal.tracking.deadCandidateSince = null;
  signal.tracking.missingPairSince = null;
  broadcastEvent("price", publicSignal(signal));
  return true;
}

function marketCapForHistoryPoint(point, marketCapPerX) {
  const recorded = Number(point.marketCapUsd);
  if (Number.isFinite(recorded) && recorded > 0) return recorded;
  const x = Number(point.x);
  return Number.isFinite(x) && x > 0 && Number.isFinite(marketCapPerX)
    ? marketCapPerX * x
    : null;
}

function evaluateLowMarketCapLifecycle(signal, now) {
  const tracking = signal.tracking;
  const marketCap = Number(tracking.marketCapUsd);
  const currentX = Number(tracking.currentX);
  const peakX = Number(tracking.peakX);
  if (!Number.isFinite(marketCap) || marketCap <= 0 || !Number.isFinite(currentX) || currentX <= 0) {
    return false;
  }

  const marketCapPerX = marketCap / currentX;
  const estimatedPeakMarketCap = Number.isFinite(peakX) && peakX > 0 ? marketCapPerX * peakX : marketCap;
  tracking.peakMarketCapUsd = Math.max(Number(tracking.peakMarketCapUsd) || 0, estimatedPeakMarketCap, marketCap);
  tracking.minimumMarketCapUsd = Math.min(Number(tracking.minimumMarketCapUsd) || marketCap, marketCap);

  if (marketCap > lowMarketCapCeilingUsd) {
    tracking.lowMarketCapSince = null;
    return false;
  }

  let lowSince = now.toISOString();
  let touchedDeadZone = marketCap <= deadMarketCapTouchUsd;
  const history = Array.isArray(tracking.history) ? tracking.history : [];
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const point = history[index];
    const pointMarketCap = marketCapForHistoryPoint(point, marketCapPerX);
    if (!Number.isFinite(pointMarketCap) || pointMarketCap > lowMarketCapCeilingUsd) break;
    lowSince = point.at || lowSince;
    if (pointMarketCap <= deadMarketCapTouchUsd) touchedDeadZone = true;
  }
  tracking.lowMarketCapSince = lowSince;

  const lowFor = now.getTime() - new Date(lowSince).getTime();
  const peakMarketCap = Number(tracking.peakMarketCapUsd);
  const marketCapDrawdown = peakMarketCap > 0 ? marketCap / peakMarketCap : 1;
  const xDrawdown = peakX > 0 ? currentX / peakX : 1;
  const majorDrawdown = Math.min(marketCapDrawdown, xDrawdown) <= majorDrawdownRatio;

  if (lowFor < lowMarketCapWindow || !touchedDeadZone || !majorDrawdown) return false;
  return completeSignal(signal, "low-market-cap-five-hours", now);
}

function evaluateEntryLossLifecycle(signal, now) {
  const tracking = signal.tracking;
  const currentX = Number(tracking.currentX);
  if (!Number.isFinite(currentX) || currentX <= 0) {
    return false;
  }

  const lossFromEntry = 1 - currentX;
  if (lossFromEntry < entryCloseLossRatio) return false;
  return completeSignal(signal, "entry-loss-55", now);
}

function evaluateLifecycle(signal, pair, now) {
  const tracking = signal.tracking;
  if (tracking.lifecycle === "completed") return false;
  if (evaluateLowMarketCapLifecycle(signal, now)) return true;
  if (evaluateEntryLossLifecycle(signal, now)) return true;
  const age = now.getTime() - new Date(signal.createdAt).getTime();
  if (age < deadCandidateWindow) return false;

  const h1 = pair.txns?.h1 || {};
  const activity = Number(h1.buys || 0) + Number(h1.sells || 0);
  const volumeH1 = Number(pair.volume?.h1 || 0);
  const liquidity = Number(pair.liquidity?.usd || 0);
  tracking.activityH1 = activity;
  tracking.volumeH1Usd = volumeH1;

  const inactive = activity <= 1 && volumeH1 < 100;
  const illiquid = liquidity > 0 && liquidity < 750;
  const severeDrawdown = Number(tracking.currentX) > 0 && Number(tracking.currentX) <= 0.05;
  const deadCandidate = inactive && (illiquid || severeDrawdown);

  if (!deadCandidate) {
    tracking.deadCandidateSince = null;
    return false;
  }

  tracking.deadCandidateSince ||= now.toISOString();
  if (now.getTime() - new Date(tracking.deadCandidateSince).getTime() < deadCandidateWindow) return false;
  return completeSignal(signal, illiquid ? "liquidity-and-activity" : "drawdown-and-activity", now);
}

function applyPair(signal, pair) {
  const price = Number(pair.priceUsd);
  if (!Number.isFinite(price) || price <= 0) return false;

  signal.tracking ||= {};
  const tracking = signal.tracking;
  const now = new Date().toISOString();

  if (!Number.isFinite(Number(tracking.entryPriceUsd)) || Number(tracking.entryPriceUsd) <= 0) {
    tracking.entryPriceUsd = price;
    tracking.peakPriceUsd = price;
    tracking.peakX = 1;
    tracking.peakAt = now;
  }

  const currentX = price / Number(tracking.entryPriceUsd);
  tracking.currentPriceUsd = price;
  tracking.currentX = currentX;
  if (!Number.isFinite(Number(tracking.peakX)) || currentX > Number(tracking.peakX)) {
    tracking.peakX = currentX;
    tracking.peakPriceUsd = price;
    tracking.peakAt = now;
  }
  tracking.marketCapUsd = Number(pair.marketCap || pair.fdv) || null;
  tracking.liquidityUsd = Number(pair.liquidity?.usd) || null;
  tracking.pairUrl = pair.url || tracking.pairUrl || null;
  tracking.pairAddress = pair.pairAddress || tracking.pairAddress || null;
  tracking.lastUpdatedAt = now;
  tracking.status = "tracking";
  tracking.lifecycle ||= "active";
  tracking.missingPairSince = null;
  appendHistory(tracking, {
    at: now,
    priceUsd: price,
    x: currentX,
    marketCapUsd: tracking.marketCapUsd
  });
  evaluateLifecycle(signal, pair, new Date(now));

  signal.entry = compactMoney(Number(tracking.entryPriceUsd));
  signal.marketCap = compactMoney(tracking.marketCapUsd);
  signal.target = `${Number(tracking.peakX).toFixed(2)}×`;
  return true;
}

async function fetchDexPairs(chainId, group) {
  const addresses = group.map((signal) => encodeURIComponent(signal.address)).join(",");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://api.dexscreener.com/tokens/v1/${chainId}/${addresses}?_=${Date.now()}`, {
      headers: {
        "accept": "application/json",
        "cache-control": "no-cache",
        "user-agent": "TOMYSBANK/0.2 (+price-tracker)"
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Dexscreener returned ${response.status}`);
    const pairs = await response.json();
    return Array.isArray(pairs) ? pairs : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function updateTrackedPrices(targetSignals = signals) {
  if (priceTrackingRunning || !targetSignals.length) return;
  priceTrackingRunning = true;
  let updated = false;

  try {
    const groups = new Map();
    for (const signal of targetSignals) {
      signal.tracking ||= {};
      signal.tracking.lifecycle ||= "active";
      if (signal.tracking.lifecycle === "completed") continue;
      const chainId = chainIds[signal.chain];
      if (!chainId || !signal.address) continue;
      if (!groups.has(chainId)) groups.set(chainId, []);
      groups.get(chainId).push(signal);
    }

    for (const [chainId, group] of groups) {
      for (let index = 0; index < group.length; index += 30) {
        const chunk = group.slice(index, index + 30);
        try {
          const pairs = await fetchDexPairs(chainId, chunk);
          for (const signal of chunk) {
            const pair = choosePair(signal, pairs);
            if (!pair) {
              signal.tracking ||= {};
              signal.tracking.status = "waiting-pair";
              signal.tracking.missingPairSince ||= new Date().toISOString();
              const age = Date.now() - new Date(signal.createdAt).getTime();
              const missingFor = Date.now() - new Date(signal.tracking.missingPairSince).getTime();
              if (signal.tracking.entryPriceUsd && age >= missingPairWindow && missingFor >= missingPairWindow) {
                if (completeSignal(signal, "pair-unavailable")) {
                  updated = true;
                }
              }
              continue;
            }
            if (applyPair(signal, pair)) {
              updated = true;
              broadcastEvent("price", publicSignal(signal));
            }
          }
        } catch (error) {
          console.warn(`Prezzi ${chainId}:`, error.message);
        }
      }
    }
  } finally {
    priceTrackingRunning = false;
    if (updated) schedulePersist();
  }
}

function startPriceTracking() {
  const tick = async () => {
    await updateTrackedPrices();
    priceTimer = setTimeout(tick, priceInterval);
    priceTimer.unref?.();
  };
  void tick();
}

async function scrapePublicChannel() {
  if (!publicChannel || scrapeRunning) return;
  scrapeRunning = true;
  let nextDelay = scrapeInterval;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch(`${publicChannel.previewUrl}?_=${Date.now()}`, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.8",
        "cache-control": "no-cache",
        "user-agent": "TOMYSBANK/0.2 (+public-channel-monitor)"
      },
      redirect: "follow",
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after") || 0) * 1000;
      if (retryAfter) nextDelay = Math.min(Math.max(retryAfter, scrapeInterval), 60_000);
      throw new Error(`Telegram public page returned ${response.status}`);
    }

    const posts = extractPublicPosts(await response.text());
    if (!posts.length) throw new Error("No public messages found; page structure may have changed");

    const classifiedPosts = posts.map((post) => {
      const address = extractAddress(post.text);
      const classification = classifyPublicSignal(post.text, address);
      return { post, classification, signal: classification.accepted ? parseSignal(post) : null };
    });
    const validSignals = classifiedPosts.filter(({ signal }) => signal);
    sourceStatus.lastPageMessages = posts.length;
    sourceStatus.lastPageSignals = validSignals.length;
    sourceStatus.lastPageRejected = classifiedPosts.length - validSignals.length;

    if (!scraperInitialized) {
      for (const post of posts) seenPosts.add(post.post);
      for (const post of posts) {
        const address = extractAddress(post.text);
        if (address) seenAddresses.add(address.toLowerCase());
      }
      scraperInitialized = true;
      schedulePersist();
    } else {
      for (const { post, signal } of validSignals) {
        if (!seenPosts.has(post.post)) publish(signal);
      }
      for (const post of posts) seenPosts.add(post.post);
      schedulePersist();
    }

    if (seenPosts.size > 500) {
      const recent = [...seenPosts].slice(-300);
      seenPosts.clear();
      for (const id of recent) seenPosts.add(id);
    }

    scrapeFailures = 0;
    sourceStatus.lastCheckedAt = new Date().toISOString();
    sourceStatus.lastError = null;
  } catch (error) {
    scrapeFailures += 1;
    sourceStatus.lastCheckedAt = new Date().toISOString();
    sourceStatus.lastError = error.name === "AbortError" ? "Telegram request timed out" : error.message;
    nextDelay = Math.max(nextDelay, Math.min(scrapeInterval * 2 ** scrapeFailures, 60_000));
    console.warn(`Scraper ${publicChannel.username}: ${sourceStatus.lastError}; retry in ${nextDelay}ms`);
  } finally {
    scrapeRunning = false;
    scrapeTimer = setTimeout(scrapePublicChannel, nextDelay);
    scrapeTimer.unref?.();
  }
}

function demoSignal() {
  const samples = [
    ["WAVE", "SOL", "E8h2pPq4xv3dXj9ZwB7T2aN8qF6cK5mR1sL4uY7gH9Qa", "$0.0084", "$680K", "2×"],
    ["MOONX", "BASE", "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", "$0.0017", "$310K", "3×"],
    ["BYTE", "SOL", "4Nd1mYpQ7cKv8Rj2eH6uTx9ZsA3bFg5wLqP8nC2dV7Xa", "$0.012", "$1.2M", "1.8×"]
  ];
  const [ticker, chain, address, entry, marketCap, target] = samples[Math.floor(Math.random() * samples.length)];
  return {
    id: `demo-${randomUUID()}`,
    ticker,
    name: ticker,
    chain,
    address: `${address.slice(0, -3)}${Math.random().toString(36).slice(2, 5)}`,
    entry,
    marketCap,
    target,
    confidence: "High",
    createdAt: new Date().toISOString(),
    source: "demo"
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(root, safePath);
  if (!filePath.startsWith(root)) return json(res, 403, { error: "Forbidden" });

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mime[extname(filePath)] || "application/octet-stream",
      "cache-control": requested === "/sw.js" ? "no-cache" : "public, max-age=300"
    });
    res.end(body);
  } catch {
    const body = await readFile(join(root, "index.html"));
    res.writeHead(200, { "content-type": mime[".html"], "cache-control": "no-cache" });
    res.end(body);
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (req.method === "GET" && url.pathname === "/healthz") {
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/signals") {
      if (!await requireMember(req, res)) return;
      return json(res, 200, {
        signals: signals.map(publicSignal),
        allowDemo: allowDemo && !publicChannel,
        source: publicSourceStatus()
      });
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
      if (!await requireMember(req, res)) return;
      const activeSignals = signals.filter((signal) => signal.tracking?.lifecycle !== "completed").length;
      return json(res, 200, {
        ok: !sourceStatus.lastError,
        source: publicSourceStatus(),
        signalCount: signals.length,
        activeSignals,
        completedSignals: signals.length - activeSignals,
        pushSubscriptions: subscriptions.size,
        pushReady: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        connectedClients: clients.size
      });
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      return json(res, 200, {
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
        pushReady: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        authRequired,
        supabaseUrl,
        supabasePublishableKey,
        membershipSiteUrl
      });
    }

    if (req.method === "GET" && url.pathname === "/api/access") {
      const access = await requireMember(req, res);
      if (!access) return;
      return json(res, 200, {
        user: access.user || null,
        membership: access.membership || { active: true, plan: "public" }
      });
    }

    if (req.method === "GET" && url.pathname === "/api/events") {
      const access = await requireMember(req, res);
      if (!access) return;
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "connection": "keep-alive"
      });
      res.write("event: ready\ndata: {}\n\n");
      clients.add(res);
      const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 20_000);
      const membershipExpiry = new Date(access.membership?.expiresAt || 0).getTime();
      const expiryDelay = Number.isFinite(membershipExpiry) && membershipExpiry > Date.now()
        ? Math.min(membershipExpiry - Date.now(), 2_147_000_000)
        : null;
      const expiryTimer = expiryDelay ? setTimeout(() => res.end(), expiryDelay) : null;
      expiryTimer?.unref?.();
      req.on("close", () => {
        clearInterval(heartbeat);
        if (expiryTimer) clearTimeout(expiryTimer);
        clients.delete(res);
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/demo") {
      if (!await requireMember(req, res)) return;
      if (!allowDemo) return json(res, 404, { error: "Not found" });
      const signal = demoSignal();
      publish(signal);
      return json(res, 201, signal);
    }

    if (req.method === "POST" && url.pathname === "/api/push/subscribe") {
      const access = await requireMember(req, res);
      if (!access) return;
      const body = await readBody(req);
      const subscription = body.subscription || body;
      const language = body.language === "it" ? "it" : "en";
      if (!subscription.endpoint) return json(res, 400, { error: "Invalid subscription" });
      subscriptions.set(subscription.endpoint, {
        ...subscription,
        userId: access.user?.id || null,
        membershipPlan: access.membership?.plan || null,
        membershipExpiresAt: access.membership?.expiresAt || null,
      });
      schedulePersist();
      if (body.silent === true) return json(res, 201, { ok: true });
      const delivery = await sendPushPayload({
        title: "TOMYSBANK",
        body: language === "it" ? "Le notifiche sono state attivate!" : "Notifications have been enabled!",
        test: true
      }, [subscriptions.get(subscription.endpoint)]);
      if (!delivery.sent) return json(res, 503, { error: "Push delivery failed" });
      return json(res, 201, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/push/test") {
      const access = await requireMember(req, res);
      if (!access) return;
      const body = await readBody(req);
      const subscription = body.subscription || body;
      if (!subscription.endpoint) return json(res, 400, { error: "Invalid subscription" });
      subscriptions.set(subscription.endpoint, {
        ...subscription,
        userId: access.user?.id || null,
        membershipPlan: access.membership?.plan || null,
        membershipExpiresAt: access.membership?.expiresAt || null,
      });
      const delivery = await sendPushPayload({
        title: "TOMYSBANK test notification",
        body: "Push notifications are configured correctly.",
        test: true
      }, [subscriptions.get(subscription.endpoint)]);
      if (!delivery.sent) return json(res, 503, { error: "Push delivery failed" });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/telegram") {
      if (!webhookSecret) return json(res, 503, { error: "Webhook not configured" });
      if (req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret) {
        return json(res, 401, { error: "Unauthorized" });
      }
      const update = await readBody(req);
      const message = update.channel_post || update.edited_channel_post;
      const signal = message && parseSignal(message);
      if (signal) publish(signal);
      return json(res, 200, { ok: true, parsed: Boolean(signal) });
    }

    return serveStatic(req, res);
  } catch (error) {
    console.error(error);
    return json(res, error.message === "Payload too large" ? 413 : 500, { error: "Internal error" });
  }
});

export { evaluateLowMarketCapLifecycle, membershipAccess };

if (process.env.TOMYSBANK_TEST !== "true") {
  await restoreRuntimeState();

  server.listen(port, host, () => {
    console.log(`TOMYSBANK disponibile su http://${host}:${port}`);
    if (publicChannel) {
      console.log(`Monitoraggio pubblico attivo: ${publicChannel.previewUrl}`);
      void scrapePublicChannel();
    }
    startPriceTracking();
  });
}
