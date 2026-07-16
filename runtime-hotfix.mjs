import { readFile, writeFile } from "node:fs/promises";

const projectRoot = new URL(".", import.meta.url);
const stateFile = process.env.STATE_FILE || new URL("./data/runtime-state.json", projectRoot).pathname;
const serverFile = new URL("./server.mjs", projectRoot).pathname;
const indexFile = new URL("./public/index.html", projectRoot).pathname;
const swFile = new URL("./public/sw.js", projectRoot).pathname;
const clientHotfixFile = new URL("./public/runtime-hotfix-client.js", projectRoot).pathname;

const INVALID_ADDRESS_PREFIX = "0x10f24ebcc0045cdb2282bb55af2dbb01b75";
const HOTFIX_VERSION = "20260716-v3-root-clean";

function isKnownInvalidSignal(signal = {}) {
  const ticker = String(signal.ticker || "").toUpperCase();
  const name = String(signal.name || "").toLowerCase();
  const address = String(signal.address || "").toLowerCase();
  return ticker === "TOKE"
    || name.includes("tokelio")
    || address.startsWith(INVALID_ADDRESS_PREFIX);
}

async function scrubRuntimeState() {
  try {
    const raw = await readFile(stateFile, "utf8");
    const data = JSON.parse(raw);
    const before = Array.isArray(data.signals) ? data.signals.length : 0;

    data.signals = (data.signals || []).filter((signal) => !isKnownInvalidSignal(signal));
    data.seenAddresses = (data.seenAddresses || []).filter((address) => {
      const value = String(address || "").toLowerCase();
      return !value.startsWith(INVALID_ADDRESS_PREFIX);
    });
    data.hotfixScrubbedAt = new Date().toISOString();

    await writeFile(stateFile, JSON.stringify(data), "utf8");
    console.log(`[runtime-hotfix] state scrubbed: ${before} -> ${data.signals.length}`);
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("[runtime-hotfix] state scrub skipped:", error.message);
  }
}

function patchServerSource(source) {
  let patched = source;

  if (!patched.includes("runtimeHotfixInvalidSignal")) {
    const helper = `
function runtimeHotfixInvalidSignal(signal = {}) {
  const ticker = String(signal.ticker || "").toUpperCase();
  const name = String(signal.name || "").toLowerCase();
  const address = String(signal.address || "").toLowerCase();
  return ticker === "TOKE" || name.includes("tokelio") || address.startsWith("${INVALID_ADDRESS_PREFIX}");
}

`;
    const marker = "function publicSourceStatus()";
    const index = patched.indexOf(marker);
    patched = index >= 0 ? `${patched.slice(0, index)}${helper}${patched.slice(index)}` : `${helper}${patched}`;
  }

  patched = patched.replace(
    /function publish\(signal\) \{\n\s*const addressKey = signal\.address\.toLowerCase\(\);/,
    `function publish(signal) {
  if (runtimeHotfixInvalidSignal(signal)) {
    console.warn("[runtime-hotfix] blocked invalid signal", signal.ticker || signal.address);
    return;
  }
  const addressKey = signal.address.toLowerCase();`
  );

  patched = patched.replace(
    /function publicSignal\(signal\) \{\n\s*sanitizeSignalTracking\(signal\);/,
    `function publicSignal(signal) {
  if (runtimeHotfixInvalidSignal(signal)) return null;
  sanitizeSignalTracking(signal);`
  );

  patched = patched.replace(
    /for \(const signal of saved\.signals \|\| \[\]\) \{\n\s*signal\.tracking \|\|= \{\};/,
    `for (const signal of saved.signals || []) {
      if (runtimeHotfixInvalidSignal(signal)) continue;
      signal.tracking ||= {};`
  );

  patched = patched.replace(
    /signals\.forEach\(sanitizeSignalTracking\);\n\s*const payload = \{/,
    `const cleanSignals = signals.filter((signal) => !runtimeHotfixInvalidSignal(signal));
  signals.splice(0, signals.length, ...cleanSignals);
  signals.forEach(sanitizeSignalTracking);
  const payload = {`
  );

  patched = patched.replace(
    /signals: signals\.map\(publicSignal\),/g,
    `signals: signals.map(publicSignal).filter(Boolean),`
  );

  patched = patched.replace(
    /activeSignals: signals\.filter\(isActiveSignal\)\.length,/g,
    `activeSignals: signals.filter((signal) => !runtimeHotfixInvalidSignal(signal) && isActiveSignal(signal)).length,`
  );

  return patched;
}

async function patchServerRuntime() {
  try {
    const before = await readFile(serverFile, "utf8");
    const after = patchServerSource(before);
    if (after !== before) {
      await writeFile(serverFile, after, "utf8");
      console.log("[runtime-hotfix] server patched");
    }
  } catch (error) {
    console.warn("[runtime-hotfix] server patch skipped:", error.message);
  }
}

function clientHotfixSource() {
  return `(() => {
  const INVALID_PREFIX = "${INVALID_ADDRESS_PREFIX}";
  const STYLE_ID = "runtime-hotfix-style";
  const SCRIPT_VERSION = "${HOTFIX_VERSION}";

  function text(el) {
    return String(el?.textContent || "");
  }

  function isInvalidCard(el) {
    const value = text(el).toLowerCase();
    return value.includes("$toke") || value.includes("tokelio") || value.includes(INVALID_PREFIX);
  }

  function removeInvalidCards() {
    document.querySelectorAll("section, article, .signal-card, .history-row, [data-signal-id], [class*='card']").forEach((el) => {
      if (isInvalidCard(el)) el.remove();
    });
  }

  function removeExternalChartSection() {
    const needles = [
      "grafico live esterno",
      "grafico mercato live",
      "live external chart",
      "live market chart",
      "in attesa del grafico live",
      "waiting for live chart"
    ];
    document.querySelectorAll("section, .external-chart, [id*='chart'], [class*='chart']").forEach((el) => {
      const value = text(el).toLowerCase();
      if (needles.some((needle) => value.includes(needle))) el.remove();
    });
  }

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 && number < 10000 ? number : 0;
  }

  function signalPeak(signal) {
    return safeNumber(signal.peakX)
      || safeNumber(signal.peakMultiplier)
      || safeNumber(signal.tracking?.peakX)
      || safeNumber(signal.tracking?.athX)
      || safeNumber(signal.currentX);
  }

  function signalCurrent(signal) {
    return safeNumber(signal.currentX)
      || safeNumber(signal.tracking?.currentX)
      || safeNumber(signal.tracking?.latestX);
  }

  function formatAge(createdAt) {
    const created = Date.parse(createdAt || "");
    if (!created) return "";
    const minutes = Math.max(0, Math.round((Date.now() - created) / 60000));
    if (minutes < 60) return minutes + " min fa";
    const hours = Math.round(minutes / 60);
    if (hours < 48) return "Call " + hours + " h fa";
    return "Call " + Math.round(hours / 24) + " gg fa";
  }

  function findDeskAnchor() {
    const headings = [...document.querySelectorAll("h1,h2,h3,p,span,section")];
    return headings.find((el) => /desk live|centro operativo|live desk|fino a cinque|up to five/i.test(text(el)));
  }

  function renderHall(signals) {
    const hall = signals
      .filter((signal) => !isInvalidCard({ textContent: JSON.stringify(signal) }))
      .map((signal) => ({ signal, peak: signalPeak(signal), current: signalCurrent(signal) }))
      .filter((row) => row.peak >= 1.01)
      .sort((a, b) => b.peak - a.peak)
      .slice(0, 5);

    let box = document.getElementById("runtimeHallOfX");
    if (!hall.length) {
      if (box) box.remove();
      return;
    }

    if (!box) {
      box = document.createElement("section");
      box.id = "runtimeHallOfX";
      box.className = "runtime-hall";
      const anchor = findDeskAnchor();
      const parentSection = anchor?.closest("section") || anchor;
      if (parentSection?.parentElement) parentSection.parentElement.insertBefore(box, parentSection);
      else document.body.prepend(box);
    }

    box.innerHTML = \`
      <div class="runtime-hall-head">
        <div>
          <p>PICCHI VERIFICATI</p>
          <h2>Hall of X</h2>
        </div>
        <span>ATH DAL CALL</span>
      </div>
      <div class="runtime-hall-list">
        \${hall.map(({ signal, peak, current }, index) => \`
          <div class="runtime-hall-row">
            <b>\${index + 1}</b>
            <div>
              <strong>$\${String(signal.ticker || signal.symbol || "MEME").replace(/^\\$/, "")} · \${String(signal.chain || "").toUpperCase()}</strong>
              <small>\${formatAge(signal.createdAt)} · P/L ORA \${current ? current.toFixed(2) + "x" : "—"}</small>
            </div>
            <em>\${peak.toFixed(2)}x</em>
          </div>
        \`).join("")}
      </div>\`;
  }

  async function refreshHall() {
    try {
      const response = await fetch("/api/signals?hotfix=" + Date.now(), { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      renderHall(Array.isArray(data.signals) ? data.signals : []);
    } catch {}
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = \`
      .runtime-hall{margin:28px auto;max-width:760px;padding:22px;border:1px solid rgba(172,255,61,.18);border-radius:24px;background:linear-gradient(135deg,rgba(13,17,26,.94),rgba(17,31,19,.9));box-shadow:0 18px 50px rgba(0,0,0,.28)}
      .runtime-hall-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}
      .runtime-hall-head p{margin:0;color:#8f96a8;font-size:12px;font-weight:900;letter-spacing:.28em}
      .runtime-hall-head h2{margin:6px 0 0;color:#fff;font-size:24px}
      .runtime-hall-head span{border:1px solid rgba(172,255,61,.36);border-radius:12px;padding:9px 13px;color:#b0ff3d;font-size:12px;font-weight:900;letter-spacing:.15em}
      .runtime-hall-list{display:grid;gap:12px}
      .runtime-hall-row{display:grid;grid-template-columns:44px 1fr auto;gap:14px;align-items:center;padding:16px;border-radius:18px;background:rgba(5,8,14,.66)}
      .runtime-hall-row b{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#aaff3f;color:#081006;font-size:18px}
      .runtime-hall-row:not(:first-child) b{background:#202634;color:#98a0b3}
      .runtime-hall-row strong{display:block;color:#fff;font-size:18px}
      .runtime-hall-row small{display:block;margin-top:4px;color:#8f96a8;font-size:13px}
      .runtime-hall-row em{font-style:normal;color:#aaff3f;font-size:26px;font-weight:900}
      @media(max-width:640px){.runtime-hall{margin:22px 18px;padding:18px}.runtime-hall-row{grid-template-columns:38px 1fr;}.runtime-hall-row em{grid-column:2;font-size:22px}}
    \`;
    document.head.appendChild(style);
  }

  function run() {
    injectStyle();
    removeInvalidCards();
    removeExternalChartSection();
    refreshHall();
  }

  if ("caches" in window) caches.keys().then((keys) => keys.filter((key) => !key.includes(SCRIPT_VERSION)).forEach((key) => caches.delete(key))).catch(() => {});
  if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});

  run();
  setInterval(run, 10000);
  new MutationObserver(() => {
    removeInvalidCards();
    removeExternalChartSection();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();`;
}

async function forceFreshClientShell() {
  try {
    await writeFile(clientHotfixFile, clientHotfixSource(), "utf8");

    let html = await readFile(indexFile, "utf8");
    html = html.replace(/app\.js\?v=[^"]+/g, `app.js?v=${HOTFIX_VERSION}`);
    html = html.replace(/runtime-hotfix-client\.js\?v=[^"]+/g, `runtime-hotfix-client.js?v=${HOTFIX_VERSION}`);
    if (!html.includes("runtime-hotfix-client.js")) {
      html = html.replace("</body>", `  <script src="/runtime-hotfix-client.js?v=${HOTFIX_VERSION}" defer></script>\n</body>`);
    }
    await writeFile(indexFile, html, "utf8");
  } catch (error) {
    console.warn("[runtime-hotfix] index/client refresh skipped:", error.message);
  }

  try {
    let sw = await readFile(swFile, "utf8");
    sw = sw.replace(/const CACHE = "[^"]+";/, `const CACHE = "tomysbank-${HOTFIX_VERSION}";`);
    await writeFile(swFile, sw, "utf8");
  } catch (error) {
    console.warn("[runtime-hotfix] service worker refresh skipped:", error.message);
  }
}

await scrubRuntimeState();
await patchServerRuntime();
await forceFreshClientShell();
await import(`./server.mjs?runtime-hotfix=${HOTFIX_VERSION}`);
