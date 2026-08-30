/**
 * Télémétrie d’usage anonyme (localStorage).
 * Script injecté seulement si activée (défaut : case cochée). Hors local.
 */

import { isLocalDevHost } from "./themes-data.js";
import { _t, getLocale } from "./i18n.js";

const TELEMETRY_KEY = "brickcard:telemetry";
const SCRIPT_ID = "brickcard-telemetry";
const SCRIPT_SRC = "https://data.brickcard.org/script.js";
const WEBSITE_ID = "27efb7e5-60ce-4840-a3bb-325954f006a2";

/** Défaut : case cochée. */
export const DEFAULT_TELEMETRY = true;

/** @type {string} */
let lastTrackedUrl = "";
/** Premier `trackTelemetryPage()` (fin de `route()`) — évite un track script trop tôt. */
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

/** Disponible hors local seulement (pas d’injection, pas de champ Paramètres). */
export function isTelemetryAvailable() {
  return !isLocalDevHost();
}

export function initTelemetry() {
  applyTelemetry(getTelemetry());
}

/** Page vue courante (pathname + hash), si la télémétrie est active. */
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
 * Hash envoyé à Umami : sans id dynamique (éditeur de carte / thème perso).
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
 * Titre envoyé à Umami : `{locale} · ` + libellé UI (sans suffixe SEO).
 * Accueil / éditeurs : `_t` générique. `#developer/…` : 2ᵉ `|` (`page | section`).
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
