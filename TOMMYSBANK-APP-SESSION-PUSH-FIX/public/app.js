const canonicalAppHost = "app.tommysignals.com";
if (window.location.hostname.endsWith(".onrender.com")) {
  window.location.replace(`https://${canonicalAppHost}${window.location.pathname}${window.location.search}${window.location.hash}`);
}

const state = {
  signals: [],
  installPrompt: null,
  allowDemo: false,
  source: null,
  language: localStorage.getItem("tomysbank-language") || "en",
  historyFilter: "all",
  recapRange: localStorage.getItem("tomysbank-recap-range") || "today",
  selectedSignalId: null,
  pushSubscription: null,
  authConfig: null,
  supabase: null,
  session: null,
  membership: null,
  authMode: "login",
  eventsAbort: null,
  swRegistration: null,
  pushConfig: null,
  pendingNotificationAddress: "",
  privateInitialized: false,
  accessTracked: false
};

const LOGIN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_STARTED_KEY = "tomysbank-login-started-at";

const translations = {
  en: {
    liveSignals: "Live signals",
    headlineOne: "New calls every day.",
    headlineTwo: "Turn on notifications.",
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
    tutorial: "Tutorial",
    enableNotifications: "Enable notifications",
    builtForSpeed: "Built for speed",
    workflowTitle: "From signal to chart in seconds.",
    receive: "Receive",
    receiveText: "A verified signal appears as soon as it drops.",
    copy: "Copy",
    copyText: "Tap the contract once and it is ready to paste.",
    track: "Track",
    trackText: "Current X, peak X and market activity update automatically.",
    tutorialEyebrow: "Guide / Tutorial",
    tutorialTitle: "Read the TOMMYSBANK tutorial.",
    tutorialCopy: "Download the PDF guide in your preferred language and keep it on your phone.",
    downloadEnglishGuide: "Download English PDF",
    downloadItalianGuide: "Download Italian PDF",
    installationGuide: "Installation guide",
    riskNote: "Signals are not financial advice. Memecoins are extremely high-risk assets.",
    homeScreen: "Home screen",
    installTitle: "Install TOMMYSBANK like an app.",
    iosStep1: "Open in Safari",
    iosStep1Text: "This option is available from Safari on iPhone.",
    iosStep2: "Tap Share",
    iosStep2Text: "Use the square icon with the upward arrow.",
    iosStep3: "Add to Home Screen",
    iosStep3Text: "Scroll the menu and select Add to Home Screen.",
    iosStep4: "Open TOMMYSBANK",
    iosStep4Text: "Launch it from the new icon, then enable notifications.",
    androidStep1: "Open in Chrome",
    androidStep1Text: "Use Chrome on your Android phone.",
    androidStep2: "Open the menu",
    androidStep2Text: "Tap the three dots in the top-right corner.",
    androidStep3: "Install app",
    androidStep3Text: "Choose Install app or Add to Home screen.",
    androidStep4: "Allow alerts",
    androidStep4Text: "Open TOMMYSBANK and tap the bell to test notifications.",
    installNow: "Install now",
    live: "LIVE",
    final: "FINAL",
    callPrice: "CALL PRICE",
    current: "CURRENT P/L",
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
    verifiedTelegram: "Verified signal",
    monitoringActive: "Monitoring is live",
    emptyActive: "The next verified TOMMYSBANK signal will appear here in real time.",
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
    installFirstIos: "On iPhone, install TOMMYSBANK first, then enable notifications from the app.",
    notificationsBlocked: "Notifications were not allowed. Enable them in browser settings.",
    notificationsTesting: "Notifications enabled. A test alert is on its way.",
    notificationsFailed: "Push setup failed. Reopen the app and try again.",
    offline: "You are offline · showing saved signals",
    newSignal: "⚡ New signal: {ticker}",
    installed: "TOMMYSBANK installed ✓",
    installHelp: "Follow the steps shown for your phone.",
    liveCount: "{count} live",
    testNotifications: "Test notifications",
    recapEyebrow: "Performance recap",
    recapTitle: "Peak X totals",
    recapAll: "All",
    recapToday: "Day",
    recapWeek: "Week",
    recapMonth: "Month",
    recapCustom: "Custom",
    recapFrom: "From",
    recapTo: "To",
    recapApply: "Apply",
    recapSignals: "Signals",
    recapTotalX: "Total peak",
    recapValue: "$100 each would be",
    recapProfit: "Potential profit",
    recapAverage: "Average peak",
    recapEmpty: "No tracked signals in this period yet.",
    recapNote: "Totals use each coin peak after the call, not the current price.",
    finalPnl: "Result",
    potentialOn100: "$100 peak value",
    peakPotential: "Peak potential",
    rawMultiple: "{x} raw",
    lossValue: "{percent} · {x}",
    searchEyebrow: "Find signal",
    searchTitle: "Paste contract address",
    searchPlaceholder: "Paste a TOMMYSBANK signal address",
    searchOpen: "Open",
    searchFound: "Opened {ticker}",
    searchNotFound: "This address is not in TOMMYSBANK signals.",
    clearSearch: "Back to live",
    memberAccess: "Member access",
    checkingAccess: "Checking your access.",
    checkingAccessCopy: "Keeping your TOMMYSBANK session active. This only takes a moment.",
    memberTitle: "Your calls. One private account.",
    memberCopy: "Sign in with the account used on the TOMMYSBANK website.",
    memberLogin: "Log in",
    memberRegister: "Create account",
    memberEmail: "Email",
    memberPassword: "Password",
    memberReset: "Forgot password?",
    memberLogout: "Log out",
    membershipNeeded: "An active membership is required.",
    membershipNeededCopy: "Choose platform access on the TOMMYSBANK website.",
    chooseMembership: "Get access",
    checkAccess: "Check access again",
    accountTitle: "Your TOMMYSBANK account",
    activeLifetime: "Platform access active",
    activeMonthly: "Platform access active until {date}",
    loginFailed: "Email or password is incorrect.",
    registerSuccess: "Check your email to confirm the account, then log in.",
    resetSent: "Password reset email sent.",
    authSetupMissing: "Member access is not configured yet."
  },
  it: {
    liveSignals: "Segnali live",
    headlineOne: "Nuovi call ogni giorno.",
    headlineTwo: "Attiva le notifiche.",
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
    tutorial: "Tutorial",
    enableNotifications: "Attiva notifiche",
    builtForSpeed: "Pensata per la velocità",
    workflowTitle: "Dal segnale al grafico in pochi secondi.",
    receive: "Ricevi",
    receiveText: "Il segnale verificato appare appena viene pubblicato.",
    copy: "Copia",
    copyText: "Tocca una volta il contract ed è pronto da incollare.",
    track: "Segui",
    trackText: "X corrente, picco X e attività di mercato si aggiornano automaticamente.",
    tutorialEyebrow: "Guida / Tutorial",
    tutorialTitle: "Leggi il tutorial TOMMYSBANK.",
    tutorialCopy: "Scarica la guida PDF nella lingua che preferisci e salvala sul telefono.",
    downloadEnglishGuide: "Scarica PDF Inglese",
    downloadItalianGuide: "Scarica PDF Italiano",
    installationGuide: "Guida all’installazione",
    riskNote: "I segnali non sono consulenza finanziaria. Le memecoin sono asset ad altissimo rischio.",
    homeScreen: "Schermata Home",
    installTitle: "Installa TOMMYSBANK come un’app.",
    iosStep1: "Apri in Safari",
    iosStep1Text: "Questa opzione è disponibile da Safari su iPhone.",
    iosStep2: "Tocca Condividi",
    iosStep2Text: "Usa l’icona quadrata con la freccia verso l’alto.",
    iosStep3: "Aggiungi a Home",
    iosStep3Text: "Scorri il menu e seleziona Aggiungi alla schermata Home.",
    iosStep4: "Apri TOMMYSBANK",
    iosStep4Text: "Avviala dalla nuova icona, poi attiva le notifiche.",
    androidStep1: "Apri in Chrome",
    androidStep1Text: "Usa Chrome sul tuo telefono Android.",
    androidStep2: "Apri il menu",
    androidStep2Text: "Tocca i tre puntini in alto a destra.",
    androidStep3: "Installa app",
    androidStep3Text: "Scegli Installa app oppure Aggiungi a schermata Home.",
    androidStep4: "Consenti avvisi",
    androidStep4Text: "Apri TOMMYSBANK e tocca la campanella per provare le notifiche.",
    installNow: "Installa ora",
    live: "LIVE",
    final: "FINALE",
    callPrice: "PREZZO CALL",
    current: "P/L ORA",
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
    verifiedTelegram: "Segnale verificato",
    monitoringActive: "Monitoraggio attivo",
    emptyActive: "Il prossimo segnale TOMMYSBANK verificato apparirà qui in tempo reale.",
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
    installFirstIos: "Su iPhone installa prima TOMMYSBANK, poi attiva le notifiche dall’app.",
    notificationsBlocked: "Notifiche non consentite. Attivale nelle impostazioni del browser.",
    notificationsTesting: "Notifiche attive. Sta arrivando un messaggio di prova.",
    notificationsFailed: "Configurazione push non riuscita. Riapri l’app e riprova.",
    offline: "Sei offline · mostro i segnali salvati",
    newSignal: "⚡ Nuovo segnale: {ticker}",
    installed: "TOMMYSBANK installata ✓",
    installHelp: "Segui i passaggi mostrati per il tuo telefono.",
    liveCount: "{count} live",
    testNotifications: "Prova notifiche",
    recapEyebrow: "Recap performance",
    recapTitle: "Totale X sui picchi",
    recapAll: "Tutto",
    recapToday: "Giorno",
    recapWeek: "Settimana",
    recapMonth: "Mese",
    recapCustom: "Custom",
    recapFrom: "Da",
    recapTo: "A",
    recapApply: "Applica",
    recapSignals: "Segnali",
    recapTotalX: "Picco totale",
    recapValue: "100$ per call sarebbero",
    recapProfit: "Profitto potenziale",
    recapAverage: "Picco medio",
    recapEmpty: "Nessun segnale tracciato in questo periodo.",
    recapNote: "I totali usano il picco di ogni coin dopo la call, non il prezzo attuale.",
    finalPnl: "Risultato",
    potentialOn100: "Valore picco su 100$",
    peakPotential: "Potenziale al picco",
    rawMultiple: "{x} reale",
    lossValue: "{percent} · {x}",
    searchEyebrow: "Cerca segnale",
    searchTitle: "Incolla contract address",
    searchPlaceholder: "Incolla un address dei segnali TOMMYSBANK",
    searchOpen: "Apri",
    searchFound: "Aperto {ticker}",
    searchNotFound: "Questo address non è tra i segnali TOMMYSBANK.",
    clearSearch: "Torna live",
    memberAccess: "Accesso membri",
    checkingAccess: "Controllo accesso.",
    checkingAccessCopy: "Sto mantenendo attiva la tua sessione TOMMYSBANK. Ci vuole solo un attimo.",
    memberTitle: "Le tue call. Un solo account privato.",
    memberCopy: "Accedi con l’account usato sul sito TOMMYSBANK.",
    memberLogin: "Accedi",
    memberRegister: "Crea account",
    memberEmail: "Email",
    memberPassword: "Password",
    memberReset: "Password dimenticata?",
    memberLogout: "Esci",
    membershipNeeded: "È necessaria una membership attiva.",
    membershipNeededCopy: "Attiva l’accesso alla piattaforma sul sito TOMMYSBANK.",
    chooseMembership: "Ottieni accesso",
    checkAccess: "Controlla di nuovo",
    accountTitle: "Il tuo account TOMMYSBANK",
    activeLifetime: "Accesso piattaforma attivo",
    activeMonthly: "Accesso piattaforma attivo fino al {date}",
    loginFailed: "Email o password non corretti.",
    registerSuccess: "Controlla l’email per confermare l’account, poi accedi.",
    resetSent: "Email per il recupero password inviata.",
    authSetupMissing: "L’accesso membri non è ancora configurato."
  }
};

const latest = document.querySelector("#latestSignal");
const activeList = document.querySelector("#activeSignalList");
const historyList = document.querySelector("#historyList");
const leaderboardList = document.querySelector("#leaderboardList");
const recapGrid = document.querySelector("#recapGrid");
const customRecap = document.querySelector("#customRecap");
const recapFrom = document.querySelector("#recapFrom");
const recapTo = document.querySelector("#recapTo");
const recapApply = document.querySelector("#recapApply");
const activeCount = document.querySelector("#activeCount");
const latestTime = document.querySelector("#latestTime");
const featuredTemplate = document.querySelector("#featuredTemplate");
const toast = document.querySelector("#toast");
const notifyButton = document.querySelector("#notificationButton");
const languageButton = document.querySelector("#languageButton");
const installButton = document.querySelector("#installButton");
const infoDialog = document.querySelector("#infoDialog");
const installDialog = document.querySelector("#installDialog");
const accountDialog = document.querySelector("#accountDialog");
const authGateTitle = document.querySelector("#authGateTitle");
const authGateCopy = document.querySelector("#authGateCopy");
const filterButton = document.querySelector("#filterButton");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const membershipRequired = document.querySelector("#membershipRequired");
const membershipSiteLink = document.querySelector("#membershipSiteLink");
const profileButton = document.querySelector("#profileButton");
const signalSearchForm = document.querySelector("#signalSearchForm");
const signalSearchInput = document.querySelector("#signalSearchInput");
const clearSearchButton = document.querySelector("#clearSearchButton");
const maxDisplayX = 10_000;
const maxDisplayMarketCapUsd = 5_000_000_000;
const ANALYTICS_ENDPOINT = "https://tommysignals.com/api/track";
const VISITOR_KEY = "tomysbank-visitor-id";
const SESSION_KEY = "tomysbank-session-id";

const chainColors = {
  SOL: ["#bafc52", "#71d8ff"],
  ETH: ["#a890ff", "#6d78ff"],
  BASE: ["#72a7ff", "#345dff"],
  RBH: ["#d4ff62", "#ffe56b"]
};

function stableId(key) {
  let value = localStorage.getItem(key);
  if (!value) {
    value = `tb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, value);
  }
  return value;
}

function appSessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = `app_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

function trackApp(type, metadata = {}) {
  const payload = {
    type,
    source: "app",
    visitorId: stableId(VISITOR_KEY),
    sessionId: appSessionId(),
    path: window.location.pathname + window.location.search + window.location.hash,
    page: document.title,
    language: state.language,
    level: metadata.level,
    message: metadata.message,
    plan: metadata.plan || state.membership?.plan,
    metadata: {
      appHost: window.location.hostname,
      standalone: isStandalone(),
      membershipPlan: state.membership?.plan || null,
      membershipActive: Boolean(state.membership?.active),
      ...metadata,
    },
  };
  fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

function trackAppError(type, error, metadata = {}) {
  trackApp(type, {
    ...metadata,
    level: "error",
    message: error?.message || String(error || "Unknown error"),
    stack: error?.stack || "",
  });
}

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
  root.querySelectorAll?.("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
  root.querySelectorAll?.("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
}

function accessToken() {
  return state.session?.access_token || "";
}

function authHeaders(extra = {}) {
  const token = accessToken();
  return token ? { ...extra, authorization: `Bearer ${token}` } : extra;
}

async function refreshSupabaseSession(force = false) {
  if (!state.supabase) return null;
  const { data: current } = await state.supabase.auth.getSession();
  let session = current?.session || null;
  const expiresAt = Number(session?.expires_at || 0) * 1000;
  const expiresSoon = session && expiresAt && expiresAt - Date.now() < 5 * 60_000;

  if (session && (force || expiresSoon)) {
    const { data, error } = await state.supabase.auth.refreshSession();
    if (!error && data?.session) session = data.session;
  }

  state.session = session;
  return state.session;
}

function recordLoginStart() {
  localStorage.setItem(LOGIN_STARTED_KEY, String(Date.now()));
}

function clearLoginStart() {
  localStorage.removeItem(LOGIN_STARTED_KEY);
}

function loginIsExpired() {
  const startedAt = Number(localStorage.getItem(LOGIN_STARTED_KEY) || 0);
  if (!startedAt) return false;
  return Date.now() - startedAt > LOGIN_MAX_AGE_MS;
}

async function enforceLoginWindow() {
  if (!state.session || !loginIsExpired()) return false;
  await state.supabase?.auth.signOut();
  state.session = null;
  state.membership = null;
  state.accessTracked = false;
  clearLoginStart();
  trackApp("app_login_expired", { level: "error" });
  showAuthGate("login");
  setAuthMessage(t("memberCopy"));
  return true;
}

async function apiFetch(url, options = {}) {
  const makeRequest = () => fetch(url, {
    ...options,
    headers: authHeaders(options.headers || {})
  });

  let response = await makeRequest();
  if ((response.status === 401 || response.status === 403) && state.supabase && state.session) {
    const previousToken = accessToken();
    await refreshSupabaseSession(true);
    if (accessToken() && accessToken() !== previousToken) response = await makeRequest();
  }
  return response;
}

function setAuthMessage(message, error = false) {
  authMessage.textContent = message || "";
  authMessage.classList.toggle("error", error);
}

function setAuthMode(mode) {
  state.authMode = "login";
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === state.authMode);
  });
  document.querySelector("#authPassword").autocomplete = "current-password";
  document.querySelector("#authSubmit").textContent = t("memberLogin");
  setAuthMessage("");
}

function membershipLabel() {
  if (state.membership?.plan === "lifetime") return t("activeLifetime");
  const date = state.membership?.expiresAt
    ? new Intl.DateTimeFormat(state.language === "it" ? "it-IT" : "en-US", { dateStyle: "medium" })
      .format(new Date(state.membership.expiresAt))
    : "—";
  return t("activeMonthly", { date });
}

function updateAccountUi() {
  const email = state.session?.user?.email || "";
  const initials = email ? email.slice(0, 2).toUpperCase() : "TP";
  profileButton.textContent = initials;
  document.querySelector("#accountEmail").textContent = email;
  document.querySelector("#accountPlan").textContent = state.membership?.active ? membershipLabel() : t("membershipNeeded");
}

function setAuthGateText(titleKey, copyKey) {
  if (authGateTitle) authGateTitle.textContent = t(titleKey);
  if (authGateCopy) authGateCopy.textContent = t(copyKey);
}

function showAuthPending() {
  document.body.classList.add("auth-pending");
  document.body.classList.remove("auth-required");
  setAuthGateText("checkingAccess", "checkingAccessCopy");
  authForm.hidden = true;
  document.querySelector(".auth-tabs").hidden = true;
  membershipRequired.hidden = true;
}

function showAuthGate(reason = "login") {
  document.body.classList.remove("auth-pending");
  document.body.classList.add("auth-required");
  setAuthGateText("memberTitle", "memberCopy");
  const signedIn = Boolean(state.session);
  authForm.hidden = signedIn;
  document.querySelector(".auth-tabs").hidden = signedIn;
  membershipRequired.hidden = reason !== "membership";
  if (state.authConfig?.membershipSiteUrl) {
    membershipSiteLink.href = `${state.authConfig.membershipSiteUrl}/#checkout`;
  }
  updateAccountUi();
}

function unlockApp() {
  document.body.classList.remove("auth-pending", "auth-required");
  membershipRequired.hidden = true;
  updateAccountUi();
}

async function refreshAccess() {
  if (state.supabase) await refreshSupabaseSession(false);
  if (!state.session) {
    state.membership = null;
    state.accessTracked = false;
    showAuthGate("login");
    return false;
  }
  const response = await apiFetch("/api/access");
  if (!response.ok) {
    state.membership = null;
    state.accessTracked = false;
    trackApp("app_access_denied", { level: "error", status: response.status });
    showAuthGate("membership");
    return false;
  }
  const payload = await response.json();
  state.membership = payload.membership;
  if (!state.accessTracked) {
    trackApp("app_authenticated", {
      plan: state.membership?.plan,
      expiresAt: state.membership?.expiresAt || null,
      email: state.session?.user?.email || "",
    });
    state.accessTracked = true;
  }
  unlockApp();
  return true;
}

async function initializeMemberAccess(config) {
  state.authConfig = config;
  if (!config.authRequired) {
    trackApp("app_public_mode");
    unlockApp();
    return true;
  }
  if (!window.supabase?.createClient || !config.supabaseUrl || !config.supabasePublishableKey) {
    trackApp("app_auth_config_error", { level: "error", message: "Supabase client or keys missing" });
    showAuthGate("login");
    setAuthMessage(t("authSetupMissing"), true);
    return false;
  }

  state.supabase = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  await refreshSupabaseSession(false);
  if (state.session && !localStorage.getItem(LOGIN_STARTED_KEY)) recordLoginStart();
  if (await enforceLoginWindow()) return false;
  const allowed = await refreshAccess();

  state.supabase.auth.onAuthStateChange((event, session) => {
    state.session = session;
    if (event === "SIGNED_IN" && session) recordLoginStart();
    if (event === "SIGNED_OUT") clearLoginStart();
    window.setTimeout(async () => {
      const active = await refreshAccess();
      if (active) {
        await initializePrivateApp();
        await syncPushSubscription({ silent: true });
      }
    }, 0);
  });
  return allowed;
}

function setLanguage(language) {
  state.language = language === "it" ? "it" : "en";
  localStorage.setItem("tomysbank-language", state.language);
  document.documentElement.lang = state.language;
  renderLanguageButton();
  localize();
  if (document.body.classList.contains("auth-pending")) setAuthGateText("checkingAccess", "checkingAccessCopy");
  if (document.body.classList.contains("auth-required")) setAuthGateText("memberTitle", "memberCopy");
  document.querySelector("#authSubmit").textContent = t("memberLogin");
  updateAccountUi();
  renderAll();
}

function renderLanguageButton() {
  if (!languageButton) return;
  const isItalian = state.language === "it";
  const currentFlag = isItalian ? "🇮🇹" : "🇬🇧";
  const nextFlag = isItalian ? "🇬🇧" : "🇮🇹";
  const currentCode = isItalian ? "IT" : "EN";
  languageButton.innerHTML = `
    <span class="language-flag active">${currentFlag}</span>
    <span class="language-code">${currentCode}</span>
    <span class="language-arrow">↔</span>
    <span class="language-flag">${nextFlag}</span>`;
  languageButton.setAttribute("aria-label", isItalian ? "Cambia lingua in inglese" : "Change language to Italian");
  languageButton.title = isItalian ? "Cambia lingua in inglese" : "Change language to Italian";
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

function normalizeAddress(value) {
  return String(value || "").trim().toLowerCase();
}

function extractAddressFromSearch(value) {
  const text = String(value || "").trim();
  const evm = text.match(/\b(0x[a-fA-F0-9]{40})\b/)?.[1];
  if (evm) return evm;
  const solana = text.match(/\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/)?.[1];
  return solana || text;
}

function findSignalByAddress(value) {
  const address = normalizeAddress(extractAddressFromSearch(value));
  if (!address) return null;
  return state.signals.find((signal) => normalizeAddress(signal.address) === address) || null;
}

function selectedSignal() {
  if (!state.selectedSignalId) return null;
  return state.signals.find((signal) => signal.id === state.selectedSignalId) || null;
}

function clearSelectedSignal() {
  state.selectedSignalId = null;
  if (signalSearchInput) signalSearchInput.value = "";
  renderAll();
}

function openSignalFromSearch(value) {
  const signal = findSignalByAddress(value);
  if (!signal) {
    trackApp("app_signal_search_miss", { queryLength: String(value || "").length });
    showToast(t("searchNotFound"));
    return;
  }
  state.selectedSignalId = signal.id;
  if (signalSearchInput) signalSearchInput.value = signal.address;
  renderAll();
  document.querySelector("#latestSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  trackApp("app_signal_search_opened", { signalId: signal.id, ticker: signal.ticker, chain: signal.chain });
  showToast(t("searchFound", { ticker: `$${signal.ticker}` }));
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
  if (!Number.isFinite(number) || number <= 0 || number > maxDisplayMarketCapUsd) return "—";
  return new Intl.NumberFormat(state.language === "it" ? "it-IT" : "en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2
  }).format(number);
}

function safeX(value, max = maxDisplayX) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= max ? number : null;
}

function safePeakX(signal) {
  const tracking = signal?.tracking || {};
  let best = safeX(tracking.peakX) ?? safeX(tracking.finalX) ?? safeX(tracking.currentX);
  for (const point of Array.isArray(tracking.history) ? tracking.history : []) {
    const x = safeX(point?.x);
    if (x && (!best || x > best)) best = x;
  }
  return best;
}

function safeCurrentX(signal) {
  return safeX(signal?.tracking?.currentX);
}

function formatX(value) {
  const number = safeX(value);
  return number ? `${number.toFixed(2)}×` : "—";
}

function formatAggregateX(value) {
  const number = safeX(value, maxDisplayX * 1_000);
  return number ? `${number.toFixed(2)}×` : "—";
}

function formatSignedMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const absolute = Math.abs(number);
  const formatted = new Intl.NumberFormat(state.language === "it" ? "it-IT" : "en-US", {
    style: "currency",
    currency: "USD",
    notation: absolute >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: absolute >= 1 ? 2 : 6
  }).format(absolute);
  if (number > 0) return `+${formatted}`;
  if (number < 0) return `-${formatted}`;
  return formatted;
}

function performanceClass(multiplier) {
  const number = safeX(multiplier);
  if (!number || number === 1) return "neutral";
  return number > 1 ? "positive" : "negative";
}

function formatCurrentPerformance(multiplier) {
  const number = safeX(multiplier);
  if (!number) return "—";
  if (number >= 1) return formatX(number);
  const loss = (number - 1) * 100;
  return `${loss.toFixed(1)}%`;
}

function formatPeakValue(multiplier, stake = 100) {
  const number = safeX(multiplier);
  if (!number) return "—";
  return formatMoney(number * stake);
}

function formatPeakProfit(multiplier, stake = 100) {
  const number = safeX(multiplier);
  if (!number) return "—";
  return formatSignedMoney((number - 1) * stake);
}

function sanitizeIncomingSignal(signal) {
  if (!signal || typeof signal !== "object") return signal;
  const tracking = { ...(signal.tracking || {}) };
  for (const key of ["currentX", "peakX", "finalX"]) {
    if (!safeX(tracking[key])) tracking[key] = null;
  }
  for (const key of ["marketCapUsd", "peakMarketCapUsd", "finalMarketCapUsd"]) {
    const value = Number(tracking[key]);
    if (!Number.isFinite(value) || value <= 0 || value > maxDisplayMarketCapUsd) tracking[key] = null;
  }
  tracking.history = Array.isArray(tracking.history)
    ? tracking.history.filter((point) => safeX(point?.x))
    : [];
  return { ...signal, tracking };
}

function sanitizeIncomingSignals(signals) {
  return Array.isArray(signals) ? signals.map(sanitizeIncomingSignal) : [];
}

function setPerformanceText(node, multiplier, formatter = formatCurrentPerformance) {
  if (!node) return;
  node.textContent = formatter(multiplier);
  node.classList.remove("positive", "negative", "neutral");
  node.classList.add(performanceClass(multiplier));
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function recapRangeDates() {
  const now = new Date();
  if (state.recapRange === "all") return { start: null, end: null };
  if (state.recapRange === "week") {
    const today = startOfLocalDay(now);
    const mondayOffset = (today.getDay() + 6) % 7;
    return { start: addDays(today, -mondayOffset), end: addDays(addDays(today, -mondayOffset), 7) };
  }
  if (state.recapRange === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
  if (state.recapRange === "custom") {
    const start = recapFrom?.value ? new Date(`${recapFrom.value}T00:00:00`) : null;
    const end = recapTo?.value ? addDays(new Date(`${recapTo.value}T00:00:00`), 1) : null;
    return { start, end };
  }
  const start = startOfLocalDay(now);
  return { start, end: addDays(start, 1) };
}

function signalInRange(signal, start, end) {
  const timestamp = new Date(signal.createdAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  if (start && timestamp < start.getTime()) return false;
  if (end && timestamp >= end.getTime()) return false;
  return true;
}

function recapSignals() {
  const { start, end } = recapRangeDates();
  return state.signals
    .filter((signal) => signalInRange(signal, start, end))
    .filter((signal) => safePeakX(signal));
}

function renderRecap() {
  if (!recapGrid) return;
  document.querySelectorAll("[data-recap-range]").forEach((button) => {
    button.classList.toggle("active", button.dataset.recapRange === state.recapRange);
  });
  customRecap?.classList.toggle("hidden", state.recapRange !== "custom");

  const periodSignals = recapSignals();
  const count = periodSignals.length;
  const totalX = periodSignals.reduce((sum, signal) => sum + (safePeakX(signal) || 0), 0);
  const totalValue = totalX * 100;
  const totalProfit = (totalX - count) * 100;
  const average = count ? totalX / count : 0;

  recapGrid.querySelector("[data-recap='signals']").textContent = String(count);
  recapGrid.querySelector("[data-recap='totalX']").textContent = count ? formatAggregateX(totalX) : "0.00×";
  recapGrid.querySelector("[data-recap='value']").textContent = count ? formatMoney(totalValue) : "$0";
  recapGrid.querySelector("[data-recap='profit']").textContent = count ? formatSignedMoney(totalProfit) : "$0";
  const note = document.querySelector("#recapNote");
  if (note) {
    note.textContent = count
      ? `${t("recapNote")} · ${t("recapAverage")}: ${formatX(average)}`
      : t("recapEmpty");
  }
}

function isActive(signal) {
  return signal.tracking?.lifecycle !== "completed";
}

function visibleChartHistory(signal) {
  const history = Array.isArray(signal.tracking?.history) ? signal.tracking.history : [];
  if (isActive(signal) || history.length <= 1) return history;

  const peakAt = new Date(signal.tracking?.peakAt || 0).getTime();
  if (Number.isFinite(peakAt) && peakAt > 0) {
    let peakIndex = -1;
    history.forEach((point, index) => {
      const pointAt = new Date(point.at || 0).getTime();
      if (Number.isFinite(pointAt) && pointAt <= peakAt) peakIndex = index;
    });
    if (peakIndex >= 0) return history.slice(0, peakIndex + 1);
  }

  let peakIndex = 0;
  let peakX = 0;
  history.forEach((point, index) => {
    const x = safeX(point.x);
    if (x && x > peakX) {
      peakX = x;
      peakIndex = index;
    }
  });
  return history.slice(0, peakIndex + 1);
}

function renderCandles(fragment, signal) {
  const values = visibleChartHistory(signal)
    .map((point) => safeX(point.x))
    .filter(Boolean);
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
  trackApp("app_contract_copied", { addressEnding: String(address || "").slice(-8) });
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
  const completed = tracking.lifecycle === "completed";
  const peakX = safePeakX(signal);
  const currentX = safeCurrentX(signal);
  const displayX = completed ? peakX : currentX;
  const displayMarketCap = completed
    ? tracking.finalMarketCapUsd ?? tracking.peakMarketCapUsd ?? tracking.marketCapUsd
    : tracking.marketCapUsd;

  logo.textContent = signal.ticker.slice(0, 1);
  logo.style.background = `linear-gradient(145deg, ${start}, ${end})`;
  fragment.querySelector(".token-name b").textContent = `$${signal.ticker}`;
  fragment.querySelector(".token-name span").textContent = signal.chain;
  fragment.querySelector(".token-full-name").textContent = signal.name;
  fragment.querySelector("[data-tracking='entryPrice']").textContent = formatUsd(tracking.entryPriceUsd);
  const currentValue = fragment.querySelector("[data-tracking='currentX']");
  const currentLabel = currentValue?.previousElementSibling;
  if (currentLabel) currentLabel.textContent = completed ? t("final") : t("current");
  setPerformanceText(currentValue, displayX, formatX);
  setPerformanceText(fragment.querySelector("[data-tracking='peakX']"), peakX, formatX);
  fragment.querySelector("[data-tracking='marketCap']").textContent = formatMoney(displayMarketCap);
  fragment.querySelector("[data-tracking='trackingStatus']").textContent =
    completed
      ? t("chartFinal", { peak: formatX(peakX) })
      : tracking.status === "tracking"
        ? `${t("chartLive", { price: formatUsd(tracking.currentPriceUsd) })} · ${t("updated", { time: relativeTime(tracking.lastUpdatedAt) })}`
        : t("pairWaiting");
  fragment.querySelector(".fresh-badge").textContent = completed ? t("final") : t("live");
  renderCandles(fragment, signal);
  fragment.querySelector(".address-text").textContent = signal.address;
  const openTrade = fragment.querySelector(".open-trade");
  openTrade.href = graphUrl(signal);
  openTrade.addEventListener("click", () => trackApp("app_chart_opened", { signalId: signal.id, ticker: signal.ticker, chain: signal.chain, sourceButton: "featured" }));
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
  const currentX = safeCurrentX(signal);
  const peakX = safePeakX(signal);
  card.innerHTML = `
    <div class="active-card-top">
      <div><b>$${signal.ticker}</b><span>${signal.chain}</span></div>
      <span class="active-dot">${t("live")}</span>
    </div>
    <div class="active-values">
      <div><span>${t("current")}</span><strong class="${performanceClass(currentX)}">${formatCurrentPerformance(currentX)}</strong></div>
      <div><span>${t("peak")}</span><strong class="${performanceClass(peakX)}">${formatX(peakX)}</strong></div>
    </div>
    <button class="active-copy">${t("copyContract")}</button>`;
  card.querySelector(".active-copy").addEventListener("click", () => copyAddress(signal.address));
  card.addEventListener("click", (event) => {
    if (!event.target.closest("button")) trackApp("app_signal_card_viewed", { signalId: signal.id, ticker: signal.ticker, chain: signal.chain });
  });
  return card;
}

function historyCard(signal) {
  const active = isActive(signal);
  const card = document.createElement("a");
  const peakX = safePeakX(signal);
  const finalX = safePeakX(signal);
  const meta = active
    ? `${t("call", { time: relativeTime(signal.createdAt) })} · ${t("current")} ${formatCurrentPerformance(safeCurrentX(signal))}`
    : `${t("call", { time: relativeTime(signal.createdAt) })} · ${t("finalPnl")} ${formatCurrentPerformance(finalX)}`;
  card.className = `history-card ${active ? "is-active" : "is-completed"}`;
  card.href = graphUrl(signal);
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.addEventListener("click", () => trackApp("app_chart_opened", { signalId: signal.id, ticker: signal.ticker, chain: signal.chain }));
  card.innerHTML = `
    <span class="history-logo">${signal.ticker.slice(0, 1)}</span>
    <span class="history-main">
      <span class="history-title"><b>$${signal.ticker}</b><i>${signal.chain}</i><em>${active ? t("active") : t("closed")}</em></span>
      <span>${meta}</span>
    </span>
    <span class="history-result">
      <strong class="${performanceClass(peakX)}">${formatX(peakX)}</strong>
      <span>${active ? t("peak") : t("peakPotential")}</span>
      ${active ? "" : `<small>${t("potentialOn100")} ${formatPeakValue(peakX)}</small>`}
    </span>`;
  return card;
}

function renderLeaderboard() {
  const ranked = state.signals
    .filter((signal) => safePeakX(signal))
    .sort((a, b) => safePeakX(b) - safePeakX(a))
    .slice(0, 5);

  if (!ranked.length) {
    leaderboardList.innerHTML = `<div class="leaderboard-empty">${t("emptyLeaderboard")}</div>`;
    return;
  }

  leaderboardList.replaceChildren(...ranked.map((signal, index) => {
    const peakX = safePeakX(signal);
    const card = document.createElement("a");
    card.className = "leader-card";
    card.href = graphUrl(signal);
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.addEventListener("click", () => trackApp("app_chart_opened", { signalId: signal.id, ticker: signal.ticker, chain: signal.chain, sourceButton: "leaderboard" }));
    card.innerHTML = `
      <span class="leader-rank">${index + 1}</span>
      <span class="leader-token">
        <b>$${signal.ticker} · ${signal.chain}</b>
        <span>${t("call", { time: relativeTime(signal.createdAt) })} · ${t("current")} ${formatCurrentPerformance(safeCurrentX(signal))}</span>
      </span>
      <span class="leader-values">
        <strong class="${performanceClass(peakX)}">${formatX(peakX)}</strong>
        <span>${t("peak")}</span>
      </span>`;
    return card;
  }));
}

function renderAll() {
  const activeSignals = state.signals
    .filter(isActive)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const selected = selectedSignal();
  const featured = selected || activeSignals[0];
  activeCount.textContent = t("liveCount", { count: Math.min(activeSignals.length, 5) });
  clearSearchButton?.classList.toggle("hidden", !selected);

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

  renderRecap();
  renderLeaderboard();
}

async function surfaceNotification(signal) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;
  await registration.showNotification(`TOMMYSBANK · $${signal.ticker}`, {
    body: `${signal.chain} · ${t("trackText")}`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `signal-${signal.id}`,
    renotify: true,
    data: { url: "/", address: signal.address }
  });
  trackApp("app_notification_shown", { signalId: signal.id, ticker: signal.ticker, chain: signal.chain });
}

function receiveSignal(signal) {
  signal = sanitizeIncomingSignal(signal);
  if (state.signals.some((item) => item.id === signal.id)) return;
  state.signals.unshift(signal);
  renderAll();
  trackApp("app_signal_received", { signalId: signal.id, ticker: signal.ticker, chain: signal.chain });
  showToast(t("newSignal", { ticker: signal.ticker }));
  if (document.visibilityState !== "visible") void surfaceNotification(signal);
}

function receivePrice(signal) {
  signal = sanitizeIncomingSignal(signal);
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

async function getAppConfig() {
  if (state.pushConfig) return state.pushConfig;
  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) throw new Error(`Config unavailable: ${response.status}`);
  state.pushConfig = await response.json();
  return state.pushConfig;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (state.swRegistration) return state.swRegistration;
  const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  state.swRegistration = await navigator.serviceWorker.ready;
  void registration.update();
  return state.swRegistration;
}

async function syncPushSubscription({ forceSubscribe = false, silent = true } = {}) {
  if (!state.session) return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (Notification.permission !== "granted") {
    notifyButton.classList.remove("enabled");
    return false;
  }

  const config = await getAppConfig();
  if (!config.pushReady || !config.vapidPublicKey) {
    notifyButton.classList.remove("enabled");
    return false;
  }

  const registration = await registerServiceWorker();
  if (!registration?.pushManager) return false;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription && forceSubscribe) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
    });
  }
  if (!subscription) {
    notifyButton.classList.remove("enabled");
    return false;
  }

  state.pushSubscription = subscription;
  const response = await apiFetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription, language: state.language, silent })
  });
  if (!response.ok) throw new Error(`Push subscription failed with ${response.status}`);
  notifyButton.classList.add("enabled");
  trackApp("notification_synced", {
    endpointHost: new URL(subscription.endpoint).hostname,
    silent,
    reason: forceSubscribe ? "new_subscription" : "existing_subscription"
  });
  return true;
}

async function enableNotifications() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos && !isStandalone()) {
    trackApp("notification_install_required", { platform: "ios" });
    openInstallGuide("ios");
    showToast(t("installFirstIos"));
    return;
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    trackApp("notification_unsupported", { level: "error" });
    showToast(t("notificationUnsupported"));
    return;
  }

  try {
    const config = await getAppConfig();
    if (!config.pushReady || !config.vapidPublicKey) {
      trackApp("notification_config_missing", { level: "error" });
      showToast(t("pushNotConfigured"));
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      trackApp("notification_permission_denied", { level: "error", permission });
      showToast(t("notificationsBlocked"));
      return;
    }

    const synced = await syncPushSubscription({ forceSubscribe: true, silent: false });
    if (!synced) throw new Error("Push subscription could not be created");
    trackApp("notification_enabled");
    showToast(t("notificationsTesting"));
  } catch (error) {
    console.warn("Push setup failed:", error);
    trackAppError("notification_error", error);
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

function handleEventBlock(block) {
  let eventName = "message";
  const dataLines = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return;
  const data = JSON.parse(dataLines.join("\n"));
  if (eventName === "ready") document.querySelector(".live-pill").classList.remove("reconnecting");
  if (eventName === "signal") receiveSignal(data);
  if (eventName === "price") receivePrice(data);
}

async function connectPrivateEvents() {
  state.eventsAbort?.abort();
  const controller = new AbortController();
  state.eventsAbort = controller;

  try {
    const response = await apiFetch("/api/events", {
      headers: { accept: "text/event-stream" },
      signal: controller.signal
    });
    if (!response.ok || !response.body) throw new Error(`Events unavailable: ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!controller.signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";
      for (const block of blocks) {
        if (block && !block.startsWith(":")) handleEventBlock(block);
      }
    }
  } catch (error) {
    if (controller.signal.aborted) return;
    document.querySelector(".live-pill").classList.add("reconnecting");
    trackAppError("app_events_error", error);
    window.setTimeout(() => {
      if (state.privateInitialized && state.session) void connectPrivateEvents();
    }, 3_000);
  }
}

async function initializePrivateApp() {
  if (state.privateInitialized) return;
  state.privateInitialized = true;

  if ("serviceWorker" in navigator) {
    try {
      await registerServiceWorker();
      await syncPushSubscription({ silent: true });
    } catch (error) {
      trackAppError("service_worker_error", error);
    }
  }

  try {
    const response = await apiFetch("/api/signals");
    if (!response.ok) {
      state.privateInitialized = false;
      await refreshAccess();
      return;
    }
    const payload = await response.json();
    state.signals = sanitizeIncomingSignals(payload.signals);
    state.allowDemo = payload.allowDemo;
    state.source = payload.source || null;
    document.querySelector("#sourceLabel").textContent = "TOMMYSBANK";
    renderAll();
    trackApp("app_loaded_signals", { count: state.signals.length, sourceMode: state.source?.mode || "" });
  } catch (error) {
    trackAppError("app_load_signals_error", error);
    state.signals = sanitizeIncomingSignals(JSON.parse(localStorage.getItem("cached-signals") || "[]"));
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

  if (state.pendingNotificationAddress) {
    const address = state.pendingNotificationAddress;
    state.pendingNotificationAddress = "";
    window.setTimeout(() => openSignalFromSearch(address), 250);
  }

  void connectPrivateEvents();
}

async function initialize() {
  trackApp("app_open", { referrer: document.referrer || "" });
  setLanguage(state.language);
  showAuthPending();
  state.pendingNotificationAddress = new URLSearchParams(window.location.search).get("address") || "";
  try {
    const config = await getAppConfig();
    const allowed = await initializeMemberAccess(config);
    if (allowed) await initializePrivateApp();
  } catch (error) {
    trackAppError("app_initialize_error", error);
    showAuthGate("login");
    setAuthMessage(error.message || t("authSetupMissing"), true);
  }
}

async function resumePrivateApp(reason = "resume") {
  if (!state.supabase) return;
  try {
    const active = await refreshAccess();
    if (!active) return;
    await syncPushSubscription({ silent: true }).catch((error) => trackAppError("notification_resync_error", error, { reason }));
    if (state.privateInitialized) {
      void connectPrivateEvents();
    } else {
      await initializePrivateApp();
    }
    trackApp("app_resumed", { reason });
  } catch (error) {
    trackAppError("app_resume_error", error, { reason });
  }
}

async function signOutMember() {
  trackApp("app_logout", { email: state.session?.user?.email || "" });
  state.eventsAbort?.abort();
  state.eventsAbort = null;
  state.privateInitialized = false;
  state.signals = [];
  state.membership = null;
  localStorage.removeItem("cached-signals");
  clearLoginStart();
  await state.supabase?.auth.signOut();
  state.session = null;
  accountDialog.close();
  showAuthGate("login");
}

document.querySelectorAll("[data-auth-mode]").forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
});
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.supabase) {
    trackApp("app_login_error", { level: "error", message: t("authSetupMissing") });
    setAuthMessage(t("authSetupMissing"), true);
    return;
  }
  const email = document.querySelector("#authEmail").value.trim();
  const password = document.querySelector("#authPassword").value;
  setAuthMessage("");

  trackApp("app_login_submit", { email });
  const { data, error } = await state.supabase.auth.signInWithPassword({ email, password });
  if (error) {
    trackApp("app_login_error", { level: "error", email, message: error.message || t("loginFailed") });
    setAuthMessage(t("loginFailed"), true);
    return;
  }
  state.session = data.session;
  recordLoginStart();

  const allowed = await refreshAccess();
  if (allowed) {
    trackApp("app_login_success", { email, plan: state.membership?.plan || "" });
    await initializePrivateApp();
  }
});
document.querySelector("#authReset").addEventListener("click", async () => {
  const email = document.querySelector("#authEmail").value.trim();
  if (!state.supabase || !email) return;
  const { error } = await state.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: state.authConfig?.membershipSiteUrl || window.location.origin
  });
  trackApp(error ? "app_password_reset_error" : "app_password_reset_requested", {
    level: error ? "error" : "info",
    email,
    message: error?.message || "",
  });
  setAuthMessage(error ? error.message : t("resetSent"), Boolean(error));
});
document.querySelector("#checkAccessButton").addEventListener("click", async () => {
  trackApp("app_access_recheck_clicked");
  const allowed = await refreshAccess();
  if (allowed) await initializePrivateApp();
});
document.querySelector("#gateLogoutButton").addEventListener("click", signOutMember);
profileButton.addEventListener("click", () => {
  trackApp("app_profile_opened");
  updateAccountUi();
  showDialog(accountDialog);
});
document.querySelector("#logoutButton").addEventListener("click", signOutMember);

languageButton.addEventListener("click", () => {
  setLanguage(state.language === "en" ? "it" : "en");
  trackApp("app_language_changed", { language: state.language });
});
notifyButton.addEventListener("click", enableNotifications);
installButton.addEventListener("click", () => {
  trackApp("app_install_guide_opened", { sourceButton: "bottom_nav" });
  openInstallGuide();
});
document.querySelector("#nativeInstallButton").addEventListener("click", () => {
  trackApp("app_native_install_clicked");
  void nativeInstall();
});
document.querySelector("#infoButton").addEventListener("click", () => {
  trackApp("app_info_opened");
  showDialog(infoDialog);
});
document.querySelector("#openInstallGuide").addEventListener("click", () => {
  infoDialog.close();
  trackApp("app_install_guide_opened", { sourceButton: "info_dialog" });
  openInstallGuide();
});
filterButton.addEventListener("click", () => {
  state.historyFilter = state.historyFilter === "all" ? "completed" : "all";
  trackApp("app_history_filter_changed", { filter: state.historyFilter });
  renderAll();
});
signalSearchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  openSignalFromSearch(signalSearchInput?.value || "");
});
signalSearchInput?.addEventListener("input", () => {
  if (!signalSearchInput.value.trim() && state.selectedSignalId) clearSelectedSignal();
});
clearSearchButton?.addEventListener("click", clearSelectedSignal);
document.querySelectorAll("[data-recap-range]").forEach((button) => {
  button.addEventListener("click", () => {
    state.recapRange = button.dataset.recapRange || "today";
    localStorage.setItem("tomysbank-recap-range", state.recapRange);
    trackApp("app_recap_range_changed", { range: state.recapRange });
    if (state.recapRange === "custom" && !recapFrom?.value && !recapTo?.value) {
      const today = new Date().toISOString().slice(0, 10);
      recapFrom.value = today;
      recapTo.value = today;
    }
    renderAll();
  });
});
recapApply?.addEventListener("click", renderAll);
[recapFrom, recapTo].forEach((input) => input?.addEventListener("change", renderAll));
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
window.addEventListener("appinstalled", () => {
  trackApp("app_installed");
  showToast(t("installed"));
});
if ("serviceWorker" in navigator) {
  let reloadingForNewWorker = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForNewWorker) return;
    reloadingForNewWorker = true;
    window.location.reload();
  });
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "notification-click" && event.data.address) {
      state.pendingNotificationAddress = event.data.address;
      if (state.signals.length) window.setTimeout(() => openSignalFromSearch(event.data.address), 300);
    }
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.session) {
    window.setTimeout(() => void resumePrivateApp("visibility"), 250);
  }
});
window.addEventListener("online", () => {
  if (state.session) void resumePrivateApp("online");
});
window.addEventListener("error", (event) => {
  trackAppError("app_javascript_error", event.error || event.message, {
    filename: event.filename || "",
    lineno: event.lineno || "",
    colno: event.colno || "",
  });
});
window.addEventListener("unhandledrejection", (event) => {
  trackAppError("app_unhandled_rejection", event.reason || "Unhandled rejection");
});
setInterval(() => {
  const active = state.signals.filter(isActive).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  latestTime.textContent = active[0] ? relativeTime(active[0].createdAt) : t("listening");
}, 15_000);

initialize();
