/**
 * Design des cartes (bordure face, arrondi coins / images, couleur par défaut) — persisté en localStorage.
 *
 * Couleur d’accent d’une carte :
 * 1. couleur du thème (si définie)
 * 2. couleur configurée ici (si définie)
 * 3. gris d’usine `DEFAULT_THEME_COLOR`
 */

import {
  contrastText,
  DEFAULT_THEME_COLOR,
  parseHexColor,
} from "./themes-data.js";

const BORDER_KEY = "brickcard:card-face-border-mm";
const RADIUS_KEY = "brickcard:card-radius-mm";
const IMAGE_RADIUS_KEY = "brickcard:card-image-radius-mm";
const COLOR_KEY = "brickcard:card-default-color";

/** Largeur de bordure face par défaut (mm). */
export const DEFAULT_FACE_BORDER_MM = 3;

/** Min / max (mm) pour le réglage de bordure. */
export const FACE_BORDER_MIN_MM = 0;
export const FACE_BORDER_MAX_MM = 10;

/** Rayon d’arrondi des coins par défaut (mm) — 0 = angles droits. */
export const DEFAULT_CARD_RADIUS_MM = 2;

/** Min / max (mm) pour l’arrondi des coins de carte. */
export const CARD_RADIUS_MIN_MM = 0;
export const CARD_RADIUS_MAX_MM = 8;

/** Rayon d’arrondi des images par défaut (mm) — 0 = angles droits. */
export const DEFAULT_CARD_IMAGE_RADIUS_MM = 1;

/** Min / max (mm) pour l’arrondi des images. */
export const CARD_IMAGE_RADIUS_MIN_MM = 0;
export const CARD_IMAGE_RADIUS_MAX_MM = 8;

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
function clampHalfMm(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 2) / 2));
}

/**
 * @param {unknown} value
 * @returns {number}
 */
export function clampFaceBorderMm(value) {
  return clampHalfMm(
    value,
    FACE_BORDER_MIN_MM,
    FACE_BORDER_MAX_MM,
    DEFAULT_FACE_BORDER_MM
  );
}

/** @returns {number} largeur en mm */
export function getFaceBorderMm() {
  try {
    const raw = localStorage.getItem(BORDER_KEY);
    if (raw !== null && raw !== "") {
      return clampFaceBorderMm(raw);
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_FACE_BORDER_MM;
}

/** Applique la variable CSS (sans persister). */
export function applyFaceBorderMm(mm) {
  const value = clampFaceBorderMm(mm);
  document.documentElement.style.setProperty(
    "--card-face-border-width",
    `${value}mm`
  );
  return value;
}

/** Persiste et applique. @param {number} mm */
export function setFaceBorderMm(mm) {
  const value = clampFaceBorderMm(mm);
  try {
    localStorage.setItem(BORDER_KEY, String(value));
  } catch {
    /* ignore */
  }
  applyFaceBorderMm(value);
  return value;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
export function clampCardRadiusMm(value) {
  return clampHalfMm(
    value,
    CARD_RADIUS_MIN_MM,
    CARD_RADIUS_MAX_MM,
    DEFAULT_CARD_RADIUS_MM
  );
}

/** @returns {number} rayon en mm */
export function getCardRadiusMm() {
  try {
    const raw = localStorage.getItem(RADIUS_KEY);
    if (raw !== null && raw !== "") {
      return clampCardRadiusMm(raw);
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CARD_RADIUS_MM;
}

/** Applique --card-radius (sans persister). */
export function applyCardRadiusMm(mm) {
  const value = clampCardRadiusMm(mm);
  document.documentElement.style.setProperty("--card-radius", `${value}mm`);
  return value;
}

/** Persiste et applique. @param {number} mm */
export function setCardRadiusMm(mm) {
  const value = clampCardRadiusMm(mm);
  try {
    localStorage.setItem(RADIUS_KEY, String(value));
  } catch {
    /* ignore */
  }
  applyCardRadiusMm(value);
  return value;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
export function clampCardImageRadiusMm(value) {
  return clampHalfMm(
    value,
    CARD_IMAGE_RADIUS_MIN_MM,
    CARD_IMAGE_RADIUS_MAX_MM,
    DEFAULT_CARD_IMAGE_RADIUS_MM
  );
}

/** @returns {number} rayon en mm */
export function getCardImageRadiusMm() {
  try {
    const raw = localStorage.getItem(IMAGE_RADIUS_KEY);
    if (raw !== null && raw !== "") {
      return clampCardImageRadiusMm(raw);
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CARD_IMAGE_RADIUS_MM;
}

/** Applique --card-image-radius (sans persister). */
export function applyCardImageRadiusMm(mm) {
  const value = clampCardImageRadiusMm(mm);
  document.documentElement.style.setProperty("--card-image-radius", `${value}mm`);
  return value;
}

/** Persiste et applique. @param {number} mm */
export function setCardImageRadiusMm(mm) {
  const value = clampCardImageRadiusMm(mm);
  try {
    localStorage.setItem(IMAGE_RADIUS_KEY, String(value));
  } catch {
    /* ignore */
  }
  applyCardImageRadiusMm(value);
  return value;
}

/**
 * Couleur configurée (étape 2) — chaîne vide = non configurée.
 * @returns {string} hex #rrggbb ou ""
 */
export function getConfiguredCardColor() {
  try {
    return parseHexColor(localStorage.getItem(COLOR_KEY) || "");
  } catch {
    return "";
  }
}

/**
 * Couleur effective pour l’affichage du sélecteur (configurée ou gris d’usine).
 * @returns {string} hex #rrggbb
 */
export function getConfiguredCardColorDisplay() {
  return getConfiguredCardColor() || DEFAULT_THEME_COLOR;
}

/** Applique --card-default-accent (couleur résolue sans thème). */
export function applyConfiguredCardColor() {
  const accent = resolveCardAccent(null);
  const root = document.documentElement;
  root.style.setProperty("--card-default-accent", accent);
  root.style.setProperty("--card-default-accent-fg", contrastText(accent));
  refreshRenderedCardAccents();
  return accent;
}

/**
 * Persiste la couleur par défaut des cartes.
 * @param {string} [hex] hex ou vide pour revenir au gris d’usine
 * @returns {string} valeur stockée ("" ou #rrggbb)
 */
export function setConfiguredCardColor(hex) {
  const value = parseHexColor(hex);
  try {
    if (value) localStorage.setItem(COLOR_KEY, value);
    else localStorage.removeItem(COLOR_KEY);
  } catch {
    /* ignore */
  }
  applyConfiguredCardColor();
  return value;
}

/**
 * Résout la couleur d’accent d’une carte.
 * @param {{ color?: string }|null|undefined} legoTheme
 * @returns {string} hex #rrggbb
 */
export function resolveCardAccent(legoTheme) {
  const fromTheme = parseHexColor(legoTheme?.color);
  if (fromTheme) return fromTheme;
  const configured = getConfiguredCardColor();
  if (configured) return configured;
  return DEFAULT_THEME_COLOR;
}

/**
 * Met à jour les cartes déjà montées qui n’ont pas de couleur de thème
 * (data-card-theme-color vide).
 */
export function refreshRenderedCardAccents() {
  document.querySelectorAll(".card, .card-back").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const themeColor = el.dataset.cardThemeColor ?? "";
    if (parseHexColor(themeColor)) return;
    const accent = resolveCardAccent(null);
    el.style.setProperty("--card-accent", accent);
    el.style.setProperty("--card-accent-fg", contrastText(accent));
  });
}

/** Applique bordure, arrondis et couleur stockés au démarrage. */
export function initCardDesign() {
  applyFaceBorderMm(getFaceBorderMm());
  applyCardRadiusMm(getCardRadiusMm());
  applyCardImageRadiusMm(getCardImageRadiusMm());
  applyConfiguredCardColor();
}
