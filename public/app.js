const state = {
  signals: [],
  installPrompt: null,
  allowDemo: false,
  source: null
};

const latest = document.querySelector("#latestSignal");
const list = document.querySelector("#signalList");
const latestTime = document.querySelector("#latestTime");
const featuredTemplate = document.querySelector("#featuredTemplate");
const toast = document.querySelector("#toast");
const notifyButton = document.querySelector("#notificationButton");
const installButton = document.querySelector("#installButton");
const infoDialog = document.querySelector("#infoDialog");

const chainColors = {
  SOL: ["#bafc52", "#71d8ff"],
  ETH: ["#a890ff", "#6d78ff"],
  BASE: ["#72a7ff", "#345dff"]
};

function relativeTime(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date)) / 1000));
  if (seconds < 10) return "adesso";
  if (seconds < 60) return `${seconds}s fa`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m fa`;
  return `${Math.floor(minutes / 60)}h fa`;
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: number < 1 ? 6 : 2
  }).format(number);
}

function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
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

function renderChart(fragment, signal) {
  const history = signal.tracking?.history || [];
  const line = fragment.querySelector(".chart-line");
  const area = fragment.querySelector(".chart-area");
  const entry = fragment.querySelector(".chart-entry");
  if (!history.length) {
    line.setAttribute("d", "");
    area.setAttribute("d", "");
    entry.setAttribute("y1", "36");
    entry.setAttribute("y2", "36");
    return;
  }

  const values = history.map((point) => Number(point.x)).filter(Number.isFinite);
  if (!values.length) return;
  const width = 320;
  const height = 72;
  const min = Math.min(...values, 1);
  const max = Math.max(...values, 1);
  const range = Math.max(max - min, 0.05);
  const yFor = (value) => 6 + (height - 12) * (1 - (value - min) / range);
  const chartValues = values.length === 1 ? [values[0], values[0]] : values;
  const points = chartValues.map((value, index) => ({
    x: index / (chartValues.length - 1) * width,
    y: yFor(value)
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${points.at(-1).x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`;
  line.setAttribute("d", path);
  area.setAttribute("d", areaPath);
  entry.setAttribute("y1", String(yFor(1)));
  entry.setAttribute("y2", String(yFor(1)));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
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
  showToast("Address copiato ✓");
}

function bindCopyActions(container, signal) {
  container.querySelectorAll("[data-action='copy']").forEach((button) => {
    button.addEventListener("click", () => copyAddress(signal.address));
  });
}

function renderFeatured(signal, animate = false) {
  const fragment = featuredTemplate.content.cloneNode(true);
  const article = fragment.querySelector("article");
  const logo = fragment.querySelector(".token-logo");
  const [start, end] = chainColors[signal.chain] || ["#bafc52", "#ffcc66"];

  logo.textContent = signal.ticker.slice(0, 1);
  logo.style.background = `linear-gradient(145deg, ${start}, ${end})`;
  fragment.querySelector(".token-name b").textContent = `$${signal.ticker}`;
  fragment.querySelector(".token-name span").textContent = signal.chain;
  fragment.querySelector(".token-full-name").textContent = signal.name;
  const tracking = signal.tracking || {};
  fragment.querySelector("[data-tracking='entryPrice']").textContent = formatUsd(tracking.entryPriceUsd);
  fragment.querySelector("[data-tracking='currentX']").textContent = formatX(tracking.currentX);
  fragment.querySelector("[data-tracking='peakX']").textContent = formatX(tracking.peakX);
  fragment.querySelector("[data-tracking='marketCap']").textContent = formatMoney(tracking.marketCapUsd);
  fragment.querySelector("[data-tracking='trackingStatus']").textContent =
    tracking.status === "tracking" ? `LIVE · ${formatUsd(tracking.currentPriceUsd)}` : "In attesa della pair…";
  renderChart(fragment, signal);
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

function listCard(signal) {
  const card = document.createElement("article");
  card.className = "list-card";
  card.innerHTML = `
    <div class="list-logo">${signal.ticker.slice(0, 1)}</div>
    <div class="list-main">
      <div class="list-title"><b>$${signal.ticker}</b><span class="chain-tag">${signal.chain}</span><span class="list-time">${relativeTime(signal.createdAt)}</span></div>
      <div class="list-meta">
        <span class="list-address">${shortAddress(signal.address)}</span>
        <strong class="list-peak">PICCO ${formatX(signal.tracking?.peakX)}</strong>
      </div>
    </div>
    <button class="list-copy" aria-label="Copia address di ${signal.ticker}">
      <svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
    </button>`;
  card.querySelector(".list-copy").addEventListener("click", () => copyAddress(signal.address));
  return card;
}

function renderAll() {
  if (!state.signals.length) {
    latest.classList.remove("skeleton");
    latest.innerHTML = `
      <div class="empty-state">
        <div>
          <div class="empty-state-icon">⌁</div>
          <h3>Monitoraggio attivo</h3>
          <p>Nessuno storico importato. Il prossimo nuovo segnale di MadApes apparirà qui in tempo reale.</p>
        </div>
      </div>`;
    list.replaceChildren();
    latestTime.textContent = "in ascolto";
    return;
  }
  renderFeatured(state.signals[0]);
  list.replaceChildren(...state.signals.slice(1).map(listCard));
}

async function surfaceNotification(signal) {
  if (Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;
  await registration.showNotification(`Nuovo segnale: $${signal.ticker}`, {
    body: `${signal.chain} · Tracking prezzo attivato · Tocca per aprire`,
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
  state.signals.splice(100);
  renderFeatured(signal, true);
  list.prepend(...state.signals.slice(1, 2).map(listCard));
  while (list.children.length > 20) list.lastElementChild.remove();
  showToast(`⚡ Nuovo segnale: $${signal.ticker}`);
  if (document.visibilityState !== "visible") void surfaceNotification(signal);
}

function receivePrice(signal) {
  const index = state.signals.findIndex((item) => item.id === signal.id);
  if (index < 0) return;
  state.signals[index] = signal;
  renderAll();
  localStorage.setItem("cached-signals", JSON.stringify(state.signals.slice(0, 20)));
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("Notifiche non supportate su questo browser");
    return;
  }

  const permission = await Notification.requestPermission();
  notifyButton.classList.toggle("enabled", permission === "granted");
  if (permission !== "granted") {
    showToast("Notifiche non attivate");
    return;
  }

  showToast("Notifiche attivate ✓");
  try {
    const registration = await navigator.serviceWorker.ready;
    const config = await fetch("/api/config").then((response) => response.json());
    if (!config.vapidPublicKey) return;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.warn("Registrazione push rimandata:", error);
  }
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function installApp() {
  if (state.installPrompt) {
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    return;
  }
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  showToast(isIos ? "Su iPhone: Condividi → Aggiungi a Home" : "Apri il menu del browser → Installa app");
}

async function initialize() {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js");
  }

  notifyButton.classList.toggle("enabled", "Notification" in window && Notification.permission === "granted");

  try {
    const payload = await fetch("/api/signals").then((response) => response.json());
    state.signals = payload.signals || [];
    state.allowDemo = payload.allowDemo;
    state.source = payload.source || null;
    if (state.source?.channel) {
      document.querySelector("#sourceLabel").textContent =
        state.source.channel === "mad_apes_gambles" ? "MAD APES" : `@${state.source.channel}`;
    }
    renderAll();
  } catch {
    const cached = JSON.parse(localStorage.getItem("cached-signals") || "[]");
    state.signals = cached;
    renderAll();
    showToast("Sei offline · mostro gli ultimi segnali");
  }

  if (state.signals.length) localStorage.setItem("cached-signals", JSON.stringify(state.signals.slice(0, 20)));

  const events = new EventSource("/api/events");
  events.addEventListener("ready", () => document.querySelector(".live-pill").classList.remove("reconnecting"));
  events.addEventListener("signal", (event) => receiveSignal(JSON.parse(event.data)));
  events.addEventListener("price", (event) => receivePrice(JSON.parse(event.data)));
  events.onerror = () => document.querySelector(".live-pill").classList.add("reconnecting");

  if (state.allowDemo) {
    const demoButton = document.createElement("button");
    demoButton.className = "text-button";
    demoButton.textContent = "Simula segnale";
    demoButton.addEventListener("click", () => fetch("/api/demo", { method: "POST" }));
    document.querySelector(".history .section-heading").append(demoButton);
  }
}

notifyButton.addEventListener("click", enableNotifications);
installButton.addEventListener("click", installApp);
document.querySelector("#infoButton").addEventListener("click", () => infoDialog.showModal());
document.querySelector(".dialog-close").addEventListener("click", () => infoDialog.close());
infoDialog.addEventListener("click", (event) => {
  if (event.target === infoDialog) infoDialog.close();
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
});
window.addEventListener("appinstalled", () => showToast("Signal Pulse installata ✓"));
setInterval(() => {
  if (state.signals[0]) latestTime.textContent = relativeTime(state.signals[0].createdAt);
}, 15_000);

initialize();
