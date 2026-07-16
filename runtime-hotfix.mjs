import { readFile, writeFile } from "node:fs/promises";

const stateFile = process.env.STATE_FILE || new URL("./data/runtime-state.json", import.meta.url).pathname;
const indexFile = new URL("./public/index.html", import.meta.url).pathname;
const swFile = new URL("./public/sw.js", import.meta.url).pathname;

function isKnownInvalidSignal(signal = {}) {
  const ticker = String(signal.ticker || "").toUpperCase();
  const name = String(signal.name || "").toLowerCase();
  const address = String(signal.address || "").toLowerCase();
  return ticker === "TOKE"
    || name.includes("tokelio")
    || address.startsWith("0x10f24ebcc0045cdb2282bb55af2dbb01b75");
}

async function scrubRuntimeState() {
  try {
    const raw = await readFile(stateFile, "utf8");
    const data = JSON.parse(raw);
    const before = Array.isArray(data.signals) ? data.signals.length : 0;
    data.signals = (data.signals || []).filter((signal) => !isKnownInvalidSignal(signal));
    data.seenAddresses = (data.seenAddresses || []).filter((address) => {
      const value = String(address || "").toLowerCase();
      return !value.startsWith("0x10f24ebcc0045cdb2282bb55af2dbb01b75");
    });
    data.hotfixScrubbedAt = new Date().toISOString();
    await writeFile(stateFile, JSON.stringify(data), "utf8");
    console.log(`[runtime-hotfix] state scrubbed: ${before} -> ${data.signals.length}`);
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("[runtime-hotfix] state scrub skipped:", error.message);
  }
}

async function forceFreshClientShell() {
  try {
    let html = await readFile(indexFile, "utf8");
    html = html.replace(/app\.js\?v=[^"]+/g, "app.js?v=20260716-runtime-hotfix-clean");
    await writeFile(indexFile, html, "utf8");
  } catch (error) {
    console.warn("[runtime-hotfix] index refresh skipped:", error.message);
  }

  try {
    let sw = await readFile(swFile, "utf8");
    sw = sw.replace(/const CACHE = "[^"]+";/, 'const CACHE = "tomysbank-v25-runtime-hotfix-clean";');
    await writeFile(swFile, sw, "utf8");
  } catch (error) {
    console.warn("[runtime-hotfix] service worker refresh skipped:", error.message);
  }
}

await scrubRuntimeState();
await forceFreshClientShell();
await import("./server.mjs?runtime-hotfix=20260716");
