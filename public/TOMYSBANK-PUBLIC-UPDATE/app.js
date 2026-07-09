const state = {
  signals: [],
  installPrompt: null,
  allowDemo: false,
  source: null,
  language: localStorage.getItem("tomysbank-language") || "en",
  historyFilter: "all",
  pushSubscription: null
};

const translations = {
  en: {
    liveSignals: "Live signals",
    headlineOne: "Move early.",
    headlineTwo: "Flex the wins.",
    commandCenter: "Command center",
    listening: "listening",
    upToFive: "Up to five at once",
    liveDesk: "Live desk",
    permanentRecord: "Permanent record",
    signalHistory: "Signal history",
    all: "All",
    finished: "Finished",
    verifiedPeaks: "Verified peaks",
    athSinceCall: "ATH SINCE CALL",
    signals: "Signals",
    install: "Install",
    guide: "Guide",
    enableNotifications: "Enable notifications",
    builtForSpeed: "Built for speed",
    workflowTitle: "From signal to chart in seconds.",
    receive: "Receive",
    receiveText: "A verified signal appears as soon as it drops.",
    copy: "Copy",
    copyText: "Tap the contract once and it is ready to paste.",
    track: "Track",
    trackText: "Current X, peak X and market activity update automatically.",
    installationGuide: "Installation guide",
    riskNote: "Signals are not financial advice. Memecoins are extremely high-risk assets.",
    homeScreen: "Home screen",
    installTitle: "Install TOMYSBANK like an app.",
    iosStep1: "Open in Safari",
    iosStep1Text: "This option is available from Safari on iPhone.",
    iosStep2: "Tap Share",
    iosStep2Text: "Use the square icon with the upward arrow.",
    iosStep3: "Add to Home Screen",
    iosStep3Text: "Scroll the menu and select Add to Home Screen.",
    iosStep4: "Open TOMYSBANK",
    iosStep4Text: "Launch it from the new icon, then enable notifications.",
    androidStep1: "Open in Chrome",
    androidStep1Text: "Use Chrome on your Android phone.",
    androidStep2: "Open the menu",
    androidStep2Text: "Tap the three dots in the top-right corner.",
    androidStep3: "Install app",
    androidStep3Text: "Choose Install app or Add to Home screen.",
    androidStep4: "Allow alerts",
    androidStep4Text: "Open TOMYSBANK and tap the bell to test notifications.",
    installNow: "Install now",
    live: "LIVE",
    final: "FINAL",
    callPrice: "CALL PRICE",
    current: "CURRENT",
    peakTracked: "PEAK TRACKED",
    chartSinceCall: "PRICE SINCE CALL",
    marketCap: "MARKET CAP",
    contractAddress: "CONTRACT ADDRESS",
    candleChart: "Candlestick chart since the signal",
    upCandle: "Up",
    downCandle: "Down",
    entryLine: "Entry",
    copyContract: "COPY CONTRACT",
    openChart: "OPEN CHART",
    verifiedTelegram: "Verified Telegram signal",
    monitoringActive: "Monitoring is live",
    emptyActive: "The next verified TOMYSBANK signal will appear here in real time.",
    emptyDesk: "Waiting for more live signals.",
    emptyHistory: "No signals have been recorded yet.",
    emptyLeaderboard: "The leaderboard will fill with tracked signals. Only chart-verified peaks count.",
    copied: "Contract copied ✓",
    pairWaiting: "Waiting for pair…",
    chartLive: "LIVE · {price}",
    updated: "updated {time}",
    chartFinal: "FINAL · peak {peak}",
    peak: "PEAK",
    now: "now",
    call: "Call {time}",
    active: "Active",
    closed: "Closed",
    notificationUnsupported: "Push notifications are not supported on this browser.",
    pushNotConfigured: "Push service is not configured yet.",
    installFirstIos: "On iPhone, install TOMYSBANK first, then enable notifications from the app.",
    notificationsBlocked: "Notifications were not allowed. Enable them in browser settings.",
    notificationsTesting: "Notifications enabled. A test alert is on its way.",
    notificationsFailed: "Push setup failed. Reopen the app and try again.",
    offline: "You are offline · showing saved signals",
    newSignal: "⚡ New signal: ${ticker}",
    installed: "TOMYSBANK installed ✓",
    installHelp: "Follow the steps shown for your phone.",
    liveCount: "{count} live",
    testNotifications: "Test notifications"
  },
  it: {
    liveSignals: "Segnali live",
    headlineOne: "Entra prima.",
    headlineTwo: "Fai parlare i risultati.",
    commandCenter: "Centro operativo",
    listening: "in ascolto",
    upToFive: "Fino a cinque insieme",
    liveDesk: "Desk live",
    permanentRecord: "Archivio permanente",
    signalHistory: "Storico segnali",
    all: "Tutti",
    finished: "Conclusi",
    verifiedPeaks: "Picchi verificati",
    athSinceCall: "ATH DAL CALL",
    signals: "Segnali",
    install: "Installa",
    guide: "Guida",
    enableNotifications: "Attiva notifiche",
    builtForSpeed: "Pensata per la velocità",
    workflowTitle: "Dal segnale al grafico in pochi secondi.",
    receive: "Ricevi",
    receiveText: "Il segnale verificato appare appena viene pubblicato.",
    copy: "Copia",
    copyText: "Tocca una volta il contract ed è pronto da incollare.",
    track: "Segui",
    trackText: "X corrente, picco X e attività di mercato si aggiornano automaticamente.",
    installationGuide: "Guida all’installazione",
    riskNote: "I segnali non sono consulenza finanziaria. Le memecoin sono asset ad altissimo rischio.",
    homeScreen: "Schermata Home",
    installTitle: "Installa TOMYSBANK come un’app.",
    iosStep1: "Apri in Safari",
    iosStep1Text: "Questa opzione è disponibile da Safari su iPhone.",
    iosStep2: "Tocca Condividi",
    iosStep2Text: "Usa l’icona quadrata con la freccia verso l’alto.",
    iosStep3: "Aggiungi a Home",
    iosStep3Text: "Scorri il menu e seleziona Aggiungi alla schermata Home.",
    iosStep4: "Apri TOMYSBANK",
    iosStep4Text: "Avviala dalla nuova icona, poi attiva le notifiche.",
    androidStep1: "Apri in Chrome",
    androidStep1Text: "Usa Chrome sul tuo telefono Android.",
    androidStep2: "Apri il menu",
    androidStep2Text: "Tocca i tre puntini in alto a destra.",
    androidStep3: "Installa app",
    androidStep3Text: "Scegli Installa app oppure Aggiungi a schermata Home.",
    androidStep4: "Consenti avvisi",
    androidStep4Text: "Apri TOMYSBANK e tocca la campanella per provare le notifiche.",
    installNow: "Installa ora",
    live: "LIVE",
    final: "FINALE",
    callPrice: "PREZZO CALL",
    current: "ORA",
    peakTracked: "PICCO RILEVATO",
    chartSinceCall: "PREZZO DAL CALL",
    marketCap: "MARKET CAP",
    contractAddress: "INDIRIZZO CONTRACT",
    candleChart: "Grafico a candele dal segnale",
    upCandle: "Sale",
    downCandle: "Scende",
    entryLine: "Ingresso",
    copyContract: "COPIA CONTRACT",
    openChart: "APRI GRAFICO",
    verifiedTelegram: "Segnale Telegram verificato",
    monitoringActive: "Monitoraggio attivo",
    emptyActive: "Il prossimo segnale TOMYSBANK verificato apparirà qui in tempo reale.",
    emptyDesk: "In attesa di altri segnali live.",
    emptyHistory: "Nessun segnale ancora registrato.",
    emptyLeaderboard: "La classifica si popolerà con i segnali tracciati. Contano solo i picchi verificati dal grafico.",
    copied: "Contract copiato ✓",
    pairWaiting: "In attesa della pair…",
    chartLive: "LIVE · {price}",
    updated: "aggiornato {time}",
    chartFinal: "FINALE · picco {peak}",
    peak: "PICCO",
    now: "ora",
    call: "Call {time}",
    active: "Attivo",
    closed: "Concluso",
    notificationUnsupported: "Le notifiche push non sono supportate da questo browser.",
    pushNotConfigured: "Il servizio notifiche non è ancora configurato.",
    installFirstIos: "Su iPhone installa prima TOMYSBANK, poi attiva le notifiche dall’app.",
    notificationsBlocked: "Notifiche non consentite. Attivale nelle impostazioni del browser.",
    notificationsTesting: "Notifiche attive. Sta arrivando un messaggio di prova.",
    notificationsFailed: "Configurazione push non riuscita. Riapri l’app e riprova.",
    offline: "Sei offline · mostro i segnali salvati",
    newSignal: "⚡ Nuovo segnale: ${ticker}",
    installed: "TOMYSBANK installata ✓",
    installHelp: "Segui i passaggi mostrati per il tuo telefono.",
    liveCount: "{count} live",
    testNotifications: "Prova notifiche"
  }
};

const latest = document.querySelector("#latestSignal");
const activeList = document.querySelector("#activeSignalList");
const historyList = document.querySelector("#historyList");
const leaderboardList = document.querySelector("#leaderboardList");
const activeCount = document.querySelector("#activeCount");
const latestTime = document.querySelector("#latestTime");
const featuredTemplate = document.querySelector("#featuredTemplate");
const toast = document.querySelector("#toast");
const notifyButton = document.querySelector("#notificationButton");
const languageButton = document.querySelector("#languageButton");
const installButton = document.querySelector("#installButton");
const infoDialog = document.querySelector("#infoDialog");
const installDialog = document.querySelector("#installDialog");
const filterButton = document.querySelector("#filterButton");

const chainColors = {
  SOL: ["#bafc52", "#71d8ff"],
  ETH: ["#a890ff", "#6d78ff"],
  BASE: ["#72a7ff", "#345dff"],
  RBH: ["#d4ff62", "#ffe56b"]
};

function t(key, values = {}) {
  let value = translations[state.language]?.[key] ?? translations.en[key] ?? key;
  for (const [name, replacement] of Object.entries(values)) {
    value = value.replace(`{${name}}`, replacement);
  }
  return value;
}

function localize(root = document) {
  root.querySelectorAll?.("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll?.("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
}

function setLanguage(language) {
  state.language = language === "it" ? "it" : "en";
  localStorage.setItem("tomysbank-language", state.language);
  document.documentElement.lang = state.language;
  languageButton.textContent = state.language.toUpperCase();
  localize();
  renderAll();
}

function relativeTime(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date)) / 1000));
  if (seconds < 10) return t("now");
  const locale = state.language === "it" ? "it" : "en";
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });
  if (seconds < 60) return formatter.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return formatter.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return formatter.format(-hours, "hour");
  return formatter.format(-Math.floor(hours / 24), "day");
}

function shortAddress(address) {
  if (address.length < 20) return address;
  return `${address.slice(0, 9)}...${address.slice(-8)}`;
}

function graphUrl(signal) {
  return signal.tracking?.pairUrl || `https://dexscreener.com/search?q=${encodeURIComponent(signal.address)}`;
}

function formatUsd(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "—";
  if (number < 0.001) return `$${number.toPrecision(3)}`;
  return new Intl.NumberFormat(state.language === "it" ? "it-IT" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: number < 1 ? 6 : 2
  }).format(number);
}

function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "—";
  return new Intl.NumberFormat(state.language === "it" ? "it-IT" : "en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2
  }).format(number);
}

function formatX(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `${number.toFixed(2)}×` : "—";
}

function isActive(signal) {
  return signal.tracking?.lifecycle !== "completed";
}

function renderCandles(fragment, signal) {
  const values = (signal.tracking?.history || [])
    .map((point) => Number(point.x))
    .filter((value) => Number.isFinite(value) && value > 0);
  const group = fragment.querySelector(".candles");
  const entry = fragment.querySelector(".chart-entry");
  group.replaceChildren();

  if (!values.length) {
    entry.setAttribute("y1", "46");
    entry.setAttribute("y2", "46");
    return;
  }

  const candleLimit = 26;
  const bucketSize = Math.max(1, Math.ceil(values.length / candleLimit));
  const candles = [];
  for (let index = 0; index < values.length; index += bucketSize) {
    const bucket = values.slice(index, index + bucketSize);
    candles.push({
      open: bucket[0],
      high: Math.max(...bucket),
      low: Math.min(...bucket),
      close: bucket.at(-1)
    });
  }
  if (candles.length === 1) candles.push({ ...candles[0] });

  const width = 320;
  const height = 92;
  const allValues = candles.flatMap((candle) => [candle.high, candle.low]).concat(1);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = Math.max(max - min, 0.05);
  const yFor = (value) => 6 + (height - 12) * (1 - (value - min) / range);
  const slot = width / candles.length;
  const bodyWidth = Math.max(3, Math.min(8, slot * 0.55));
  const namespace = "http://www.w3.org/2000/svg";

  candles.forEach((candle, index) => {
    const rising = candle.close >= candle.open;
    const className = rising ? "candle-up" : "candle-down";
    const x = slot * index + slot / 2;
    const wick = document.createElementNS(namespace, "line");
    wick.setAttribute("x1", x);
    wick.setAttribute("x2", x);
    wick.setAttribute("y1", yFor(candle.high));
    wick.setAttribute("y2", yFor(candle.low));
    wick.setAttribute("class", `candle-wick ${className}`);
    const body = document.createElementNS(namespace, "rect");
    const top = Math.min(yFor(candle.open), yFor(candle.close));
    const bodyHeight = Math.max(2, Math.abs(yFor(candle.open) - yFor(candle.close)));
    body.setAttribute("x", x - bodyWidth / 2);
    body.setAttribute("y", top);
    body.setAttribute("width", bodyWidth);
    body.setAttribute("height", bodyHeight);
    body.setAttribute("rx", "1");
    body.setAttribute("class", className);
    group.append(wick, body);
  });

  entry.setAttribute("y1", String(yFor(1)));
  entry.setAttribute("y2", String(yFor(1)));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

async function copyAddress(address) {
  try {
    await navigator.clipboard.writeText(address);
  } catch {
    const input = document.createElement("textarea");
    input.value = address;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  if (navigator.vibrate) navigator.vibrate(35);
  showToast(t("copied"));
}

function bindCopyActions(container, signal) {
  container.querySelectorAll("[data-action='copy']").forEach((button) => {
    button.addEventListener("click", () => copyAddress(signal.address));
  });
}

function renderFeatured(signal, animate = false) {
  const fragment = featuredTemplate.content.cloneNode(true);
  localize(fragment);
  const article = fragment.querySelector("article");
  const logo = fragment.querySelector(".token-logo");
  const [start, end] = chainColors[signal.chain] || ["#bafc52", "#ffcc66"];
  const tracking = signal.tracking || {};

  logo.textContent = signal.ticker.slice(0, 1);
  logo.style.background = `linear-gradient(145deg, ${start}, ${end})`;
  fragment.querySelector(".token-name b").textContent = `$${signal.ticker}`;
  fragment.querySelector(".token-name span").textContent = signal.chain;
  fragment.querySelector(".token-full-name").textContent = signal.name;
  fragment.querySelector("[data-tracking='entryPrice']").textContent = formatUsd(tracking.entryPriceUsd);
  fragment.querySelector("[data-tracking='currentX']").textContent = formatX(tracking.currentX);
  fragment.querySelector("[data-tracking='peakX']").textContent = formatX(tracking.peakX);
  fragment.querySelector("[data-tracking='marketCap']").textContent = formatMoney(tracking.marketCapUsd);
  fragment.querySelector("[data-tracking='trackingStatus']").textContent =
    tracking.lifecycle === "completed"
      ? t("chartFinal", { peak: formatX(tracking.peakX) })
      : tracking.status === "tracking"
        ? `${t("chartLive", { price: formatUsd(tracking.currentPriceUsd) })} · ${t("updated", { time: relativeTime(tracking.lastUpdatedAt) })}`
        : t("pairWaiting");
  fragment.querySelector(".fresh-badge").textContent = tracking.lifecycle === "completed" ? t("final") : t("live");
  renderCandles(fragment, signal);
  fragment.querySelector(".address-text").textContent = signal.address;
  fragment.querySelector(".open-trade").href = graphUrl(signal);
  const sourceLink = fragment.querySelector(".source-link");
  if (signal.sourceUrl) sourceLink.href = signal.sourceUrl;
  else sourceLink.removeAttribute("href");
  fragment.querySelector("time").textContent = relativeTime(signal.createdAt);
  bindCopyActions(fragment, signal);

  latest.replaceChildren(article);
  latest.classList.remove("skeleton");
  latest.classList.toggle("new-arrival", animate);
  latestTime.textContent = relativeTime(signal.createdAt);
}

function activeCard(signal) {
  const card = document.createElement("article");
  card.className = "active-card";
  card.innerHTML = `
    <div class="active-card-top">
      <div><b>$${signal.ticker}</b><span>${signal.chain}</span></div>
      <span class="active-dot">${t("live")}</span>
    </div>
    <div class="active-values">
      <div><span>${t("current")}</span><strong>${formatX(signal.tracking?.currentX)}</strong></div>
      <div><span>${t("peak")}</span><strong>${formatX(signal.tracking?.peakX)}</strong></div>
    </div>
    <button class="active-copy">${t("copyContract")}</button>`;
  card.querySelector(".active-copy").addEventListener("click", () => copyAddress(signal.address));
  return card;
}

function historyCard(signal) {
  const active = isActive(signal);
  const card = document.createElement("a");
  card.className = `history-card ${active ? "is-active" : "is-completed"}`;
  card.href = graphUrl(signal);
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.innerHTML = `
    <span class="history-logo">${signal.ticker.slice(0, 1)}</span>
    <span class="history-main">
      <span class="history-title"><b>$${signal.ticker}</b><i>${signal.chain}</i><em>${active ? t("active") : t("closed")}</em></span>
      <span>${t("call", { time: relativeTime(signal.createdAt) })}</span>
    </span>
    <span class="history-result">
      <strong>${formatX(signal.tracking?.peakX)}</strong>
      <span>${t("peak")}</span>
    </span>`;
  return card;
}

function renderLeaderboard() {
  const ranked = state.signals
    .filter((signal) => Number.isFinite(Number(signal.tracking?.peakX)))
    .sort((a, b) => Number(b.tracking.peakX) - Number(a.tracking.peakX))
    .slice(0, 5);

  if (!ranked.length) {
    leaderboardList.innerHTML = `<div class="leaderboard-empty">${t("emptyLeaderboard")}</div>`;
    return;
  }

  leaderboardList.replaceChildren(...ranked.map((signal, index) => {
    const card = document.createElement("a");
    card.className = "leader-card";
    card.href = graphUrl(signal);
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.innerHTML = `
      <span class="leader-rank">${index + 1}</span>
      <span class="leader-token">
        <b>$${signal.ticker} · ${signal.chain}</b>
        <span>${t("call", { time: relativeTime(signal.createdAt) })} · ${t("current")} ${formatX(signal.tracking?.currentX)}</span>
      </span>
      <span class="leader-values">
        <strong>${formatX(signal.tracking?.peakX)}</strong>
        <span>${t("peak")}</span>
      </span>`;
    return card;
  }));
}

function renderAll() {
  const activeSignals = state.signals
    .filter(isActive)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const featured = activeSignals[0];
  activeCount.textContent = t("liveCount", { count: Math.min(activeSignals.length, 5) });

  if (!featured) {
    latest.classList.remove("skeleton");
    latest.innerHTML = `
      <div class="empty-state">
        <div>
          <div class="empty-state-icon">⌁</div>
          <h3>${t("monitoringActive")}</h3>
          <p>${t("emptyActive")}</p>
        </div>
      </div>`;
    latestTime.textContent = t("listening");
  } else {
    renderFeatured(featured);
  }

  const visibleActive = activeSignals.slice(1, 5);
  if (visibleActive.length) activeList.replaceChildren(...visibleActive.map(activeCard));
  else activeList.innerHTML = `<div class="section-empty">${t("emptyDesk")}</div>`;

  const historySignals = state.historyFilter === "completed"
    ? state.signals.filter((signal) => !isActive(signal))
    : state.signals;
  if (historySignals.length) historyList.replaceChildren(...historySignals.map(historyCard));
  else historyList.innerHTML = `<div class="section-empty">${t("emptyHistory")}</div>`;
  filterButton.textContent = state.historyFilter === "all" ? t("all") : t("finished");

  renderLeaderboard();
}

async function surfaceNotification(signal) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;
  await registration.showNotification(`TOMYSBANK · $${signal.ticker}`, {
    body: `${signal.chain} · ${t("trackText")}`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `signal-${signal.id}`,
    renotify: true,
    data: { url: "/", address: signal.address }
  });
}

function receiveSignal(signal) {
  if (state.signals.some((item) => item.id === signal.id)) return;
  state.signals.unshift(signal);
  renderAll();
  showToast(t("newSignal", { ticker: signal.ticker }));
  if (document.visibilityState !== "visible") void surfaceNotification(signal);
}

function receivePrice(signal) {
  const index = state.signals.findIndex((item) => item.id === signal.id);
  if (index < 0) return;
  state.signals[index] = signal;
  renderAll();
  try {
    localStorage.setItem("cached-signals", JSON.stringify(state.signals.slice(0, 100)));
  } catch {
    // The server remains the authoritative permanent history.
  }
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

async function enableNotifications() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos && !isStandalone()) {
    openInstallGuide("ios");
    showToast(t("installFirstIos"));
    return;
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    showToast(t("notificationUnsupported"));
    return;
  }

  try {
    const config = await fetch("/api/config").then((response) => response.json());
    if (!config.pushReady || !config.vapidPublicKey) {
      showToast(t("pushNotConfigured"));
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast(t("notificationsBlocked"));
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
      });
    }
    state.pushSubscription = subscription;
    notifyButton.classList.add("enabled");
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subscription, language: state.language })
    });
    if (!response.ok) throw new Error(`Push subscription failed with ${response.status}`);
    showToast(t("notificationsTesting"));
  } catch (error) {
    console.warn("Push setup failed:", error);
    showToast(t("notificationsFailed"));
  }
}

function showDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function openInstallGuide(platform) {
  const selected = platform || (/iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android");
  document.querySelectorAll(".platform-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.platform === selected);
  });
  document.querySelectorAll("[data-guide]").forEach((guide) => {
    guide.classList.toggle("hidden", guide.dataset.guide !== selected);
  });
  showDialog(installDialog);
}

async function nativeInstall() {
  if (state.installPrompt) {
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    installDialog.close();
    return;
  }
  showToast(t("installHelp"));
}

async function initialize() {
  setLanguage(state.language);
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register("/sw.js");
    void registration.update();
    if (Notification.permission === "granted") {
      state.pushSubscription = await registration.pushManager?.getSubscription();
      notifyButton.classList.toggle("enabled", Boolean(state.pushSubscription));
    }
  }

  try {
    const payload = await fetch("/api/signals").then((response) => response.json());
    state.signals = payload.signals || [];
    state.allowDemo = payload.allowDemo;
    state.source = payload.source || null;
    document.querySelector("#sourceLabel").textContent = "TOMYSBANK";
    renderAll();
  } catch {
    state.signals = JSON.parse(localStorage.getItem("cached-signals") || "[]");
    renderAll();
    showToast(t("offline"));
  }

  if (state.signals.length) {
    try {
      localStorage.setItem("cached-signals", JSON.stringify(state.signals.slice(0, 100)));
    } catch {
      // The server remains the authoritative permanent history.
    }
  }

  const events = new EventSource("/api/events");
  events.addEventListener("ready", () => document.querySelector(".live-pill").classList.remove("reconnecting"));
  events.addEventListener("signal", (event) => receiveSignal(JSON.parse(event.data)));
  events.addEventListener("price", (event) => receivePrice(JSON.parse(event.data)));
  events.onerror = () => document.querySelector(".live-pill").classList.add("reconnecting");
}

languageButton.addEventListener("click", () => setLanguage(state.language === "en" ? "it" : "en"));
notifyButton.addEventListener("click", enableNotifications);
installButton.addEventListener("click", () => openInstallGuide());
document.querySelector("#nativeInstallButton").addEventListener("click", nativeInstall);
document.querySelector("#infoButton").addEventListener("click", () => showDialog(infoDialog));
document.querySelector("#openInstallGuide").addEventListener("click", () => {
  infoDialog.close();
  openInstallGuide();
});
filterButton.addEventListener("click", () => {
  state.historyFilter = state.historyFilter === "all" ? "completed" : "all";
  renderAll();
});
document.querySelectorAll(".platform-tab").forEach((button) => {
  button.addEventListener("click", () => openInstallGuide(button.dataset.platform));
});
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
});
window.addEventListener("appinstalled", () => showToast(t("installed")));
setInterval(() => {
  const active = state.signals.filter(isActive).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  latestTime.textContent = active[0] ? relativeTime(active[0].createdAt) : t("listening");
}, 15_000);

initialize();
