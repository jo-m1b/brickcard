/**
 * Télémétrie d’usage anonyme (localStorage).
 * Script injecté seulement si activée (défaut : case cochée). Hors local.
 */

import { isLocalDevHost } from "./themes-data.js";

const TELEMETRY_KEY = "brickcard:telemetry";
const SCRIPT_ID = "brickcard-telemetry";
const SCRIPT_SRC = "https://data.brickcard.org/script.js";
const WEBSITE_ID = "27efb7e5-60ce-4840-a3bb-325954f006a2";

/** Défaut : case cochée. */
export const DEFAULT_TELEMETRY = true;

/** @type {string} */
let lastTrackedUrl = "";
let hashBound = false;

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

function currentViewUrl() {
  return `${location.pathname}${location.hash || ""}`;
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
  tracker.track((props) => ({ ...props, url, title: document.title }));
}

function onHashChange() {
  trackCurrentView();
}

function bindHash() {
  if (hashBound) return;
  window.addEventListener("hashchange", onHashChange);
  hashBound = true;
}

function unbindHash() {
  if (!hashBound) return;
  window.removeEventListener("hashchange", onHashChange);
  hashBound = false;
}

function injectScript() {
  bindHash();
  if (getTracker()) {
    trackCurrentView();
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
    trackCurrentView();
  });
  document.head.appendChild(script);
}

function removeScript() {
  unbindHash();
  lastTrackedUrl = "";
  document.getElementById(SCRIPT_ID)?.remove();
}
