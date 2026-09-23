/**
 * Anonymous usage telemetry (localStorage).
 * Script injected only if enabled (default: off), and never on a local dev host.
 * Settings and the welcome ask follow `isTelemetryAvailable()` (off-local).
 */

import { isLocalDevHost } from "./themes-data.js";
import { _t, getLocale } from "./i18n.js";

const TELEMETRY_KEY = "brickcard:telemetry";
const SCRIPT_ID = "brickcard-telemetry";
const SCRIPT_SRC = "https://data.brickcard.org/script.js";
const WEBSITE_ID = "27efb7e5-60ce-4840-a3bb-325954f006a2";

/** Public Umami board (anonymous stats, no stored IP). */
export const TELEMETRY_PUBLIC_STATS_URL =
  "https://data.brickcard.org/share/B5pHUIJzX1WJhJ04";

/** Visible label for that board (the href stays the share URL). */
export const TELEMETRY_PUBLIC_STATS_LABEL = "data.brickcard.org";

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Translated sentence with trusted link HTML in place of `%(link)s`.
 * @param {string} msgid
 * @param {string} linkHtml
 */
export function htmlWithPublicStatsLink(msgid, linkHtml) {
  const sentinel = "\u0000LINK\u0000";
  const text = _t(msgid, { link: sentinel });
  return escapeHtml(text).replaceAll(sentinel, String(linkHtml));
}

/** Default: off until the user opts in (welcome modal or Settings). */
export const DEFAULT_TELEMETRY = false;

/** @type {string} */
let lastTrackedUrl = "";
/** First `trackTelemetryPage()` (end of `route()`) — avoids an early script track. */
let routeHasTracked = false;

/** @returns {boolean} */
export function getTelemetry() {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    if (raw === null || raw === "") return DEFAULT_TELEMETRY;
    return raw === "1";
  } catch {
    return DEFAULT_TELEMETRY;
  }
}

/** @param {boolean} on */
export function setTelemetry(on) {
  try {
    localStorage.setItem(TELEMETRY_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  applyTelemetry(on);
}

/**
 * Settings field and welcome ask (off-local).
 * Script injection stays off on a local dev host.
 */
export function isTelemetryAvailable() {
  return !isLocalDevHost();
}

/** True when the user already stored on (`"1"`) or off (`"0"`). */
export function hasTelemetryChoice() {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    return raw === "1" || raw === "0";
  } catch {
    return true;
  }
}

export function initTelemetry() {
  applyTelemetry(getTelemetry());
}

/** Current page view (pathname + hash), if telemetry is on. */
export function trackTelemetryPage() {
  routeHasTracked = true;
  trackCurrentView();
}

/** @param {boolean} on */
function applyTelemetry(on) {
  if (!on || isLocalDevHost()) {
    removeScript();
    return;
  }
  injectScript();
}

function telemetryPath(hash) {
  return (hash || "").replace(/^#/, "").split("?")[0];
}

/**
 * Hash sent to Umami: no dynamic id (card / custom theme editor).
 * @param {string} hash
 * @returns {string}
 */
function telemetryHash(hash) {
  const raw = telemetryPath(hash);
  if (raw.startsWith("edit-card/")) return "#edit-card";
  if (raw.startsWith("themes/edit/")) return "#themes/edit";
  return hash || "";
}

/**
 * Title sent to Umami: `{locale} · ` + UI label (no SEO suffix).
 * Home / editors: generic `_t`. `#developer/…`: 2nd `|` (`page | section`).
 * @param {string} hash
 * @returns {string}
 */
function telemetryTitle(hash) {
  const raw = telemetryPath(hash);
  let base;
  if (!raw || raw === "/") base = _t("Home");
  else if (raw.startsWith("edit-card/")) base = _t("Edit card");
  else if (raw.startsWith("themes/edit/")) base = _t("Edit theme");
  else {
    const keepPipes = raw === "developer" || raw.startsWith("developer/") ? 2 : 1;
    base = titleBeforeNthPipe(document.title, keepPipes);
  }
  return `${getLocale()} · ${base}`;
}

/**
 * @param {string} title
 * @param {number} n
 * @returns {string}
 */
function titleBeforeNthPipe(title, n) {
  const s = String(title || "");
  let seen = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "|") continue;
    seen++;
    if (seen === n) return s.slice(0, i).trim();
  }
  if (n > 1) {
    const first = s.indexOf("|");
    if (first !== -1) return s.slice(0, first).trim();
  }
  return s.trim();
}

function currentViewUrl() {
  return `${location.pathname}${telemetryHash(location.hash)}`;
}

function getTracker() {
  try {
    const tracker = window.umami;
    if (tracker && typeof tracker.track === "function") return tracker;
  } catch {
    /* ignore */
  }
  return null;
}

function trackCurrentView() {
  if (!getTelemetry() || isLocalDevHost()) return;
  const tracker = getTracker();
  if (!tracker) return;
  const url = currentViewUrl();
  if (url === lastTrackedUrl) return;
  lastTrackedUrl = url;
  tracker.track((props) => ({ ...props, url, title: telemetryTitle(location.hash) }));
}

function injectScript() {
  if (getTracker()) {
    if (routeHasTracked) trackCurrentView();
    return;
  }
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.dataset.websiteId = WEBSITE_ID;
  script.dataset.autoTrack = "false";
  script.addEventListener("load", () => {
    if (routeHasTracked) trackCurrentView();
  });
  document.head.appendChild(script);
}

function removeScript() {
  lastTrackedUrl = "";
  document.getElementById(SCRIPT_ID)?.remove();
}
