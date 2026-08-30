/**
 * Card design (face border, corner / image radius, default color) — persisted in localStorage.
 *
 * Card accent color:
 * 1. theme color (if set)
 * 2. color configured here (if set)
 * 3. factory gray `DEFAULT_THEME_COLOR`
 *
 * Text / icon / Brickcard logo color (`--card-accent-fg`):
 * 1. `theme.secondaryColor` if valid hex
 * 2. else auto contrast (`contrastText`) on the accent
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

/** Default face border width (mm). */
export const DEFAULT_FACE_BORDER_MM = 3;

/** Min / max (mm) for the border setting. */
export const FACE_BORDER_MIN_MM = 0;
export const FACE_BORDER_MAX_MM = 10;

/** Default corner radius (mm) — 0 = square corners. */
export const DEFAULT_CARD_RADIUS_MM = 2;

/** Min / max (mm) for the card corner radius. */
export const CARD_RADIUS_MIN_MM = 0;
export const CARD_RADIUS_MAX_MM = 8;

/** Default image radius (mm) — 0 = square corners. */
export const DEFAULT_CARD_IMAGE_RADIUS_MM = 1;

/** Min / max (mm) for the image radius. */
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

/** @returns {number} width in mm */
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

/** Apply the CSS variable (do not persist). */
export function applyFaceBorderMm(mm) {
  const value = clampFaceBorderMm(mm);
  document.documentElement.style.setProperty(
    "--card-face-border-width",
    `${value}mm`
  );
  return value;
}

/** Persist and apply. @param {number} mm */
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

/** @returns {number} radius in mm */
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

/** Apply --card-radius (do not persist). */
export function applyCardRadiusMm(mm) {
  const value = clampCardRadiusMm(mm);
  document.documentElement.style.setProperty("--card-radius", `${value}mm`);
  return value;
}

/** Persist and apply. @param {number} mm */
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

/** @returns {number} radius in mm */
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

/** Apply --card-image-radius (do not persist). */
export function applyCardImageRadiusMm(mm) {
  const value = clampCardImageRadiusMm(mm);
  document.documentElement.style.setProperty("--card-image-radius", `${value}mm`);
  return value;
}

/** Persist and apply. @param {number} mm */
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
 * Configured color (step 2) — empty string = not configured.
 * @returns {string} hex #rrggbb or ""
 */
export function getConfiguredCardColor() {
  try {
    return parseHexColor(localStorage.getItem(COLOR_KEY) || "");
  } catch {
    return "";
  }
}

/**
 * Effective color for the picker display (configured or factory gray).
 * @returns {string} hex #rrggbb
 */
export function getConfiguredCardColorDisplay() {
  return getConfiguredCardColor() || DEFAULT_THEME_COLOR;
}

/** Apply --card-default-accent (resolved color with no theme). */
export function applyConfiguredCardColor() {
  const accent = resolveCardAccent(null);
  const root = document.documentElement;
  root.style.setProperty("--card-default-accent", accent);
  root.style.setProperty("--card-default-accent-fg", contrastText(accent));
  refreshRenderedCardAccents();
  return accent;
}

/**
 * Persist the default card color.
 * @param {string} [hex] hex or empty to revert to factory gray
 * @returns {string} stored value ("" or #rrggbb)
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
 * Resolve a card’s accent color.
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
 * Text / icon / Brickcard logo color on the accent.
 * @param {{ secondaryColor?: string }|null|undefined} legoTheme
 * @param {string} [accent] already-resolved hex (avoids a second pass)
 * @returns {string} hex #rrggbb
 */
export function resolveCardAccentFg(legoTheme, accent) {
  const fromTheme = parseHexColor(legoTheme?.secondaryColor);
  if (fromTheme) return fromTheme;
  return contrastText(accent ?? resolveCardAccent(legoTheme));
}

/**
 * Update already-mounted cards that have no theme color
 * (empty data-card-theme-color).
 */
export function refreshRenderedCardAccents() {
  document.querySelectorAll(".card, .card-back").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const themeColor = el.dataset.cardThemeColor ?? "";
    if (parseHexColor(themeColor)) return;
    const accent = resolveCardAccent(null);
    const fg = resolveCardAccentFg(
      { secondaryColor: el.dataset.cardThemeSecondaryColor },
      accent
    );
    el.style.setProperty("--card-accent", accent);
    el.style.setProperty("--card-accent-fg", fg);
  });
}

/**
 * Snapshot of the 4 “Card appearance” settings (`.brickcard` backup).
 * @returns {{
 *   faceBorderMm: number,
 *   cardRadiusMm: number,
 *   cardImageRadiusMm: number,
 *   defaultColor: string,
 * }}
 */
export function getCardAppearanceSettings() {
  return {
    faceBorderMm: getFaceBorderMm(),
    cardRadiusMm: getCardRadiusMm(),
    cardImageRadiusMm: getCardImageRadiusMm(),
    defaultColor: getConfiguredCardColor(),
  };
}

/**
 * Apply an appearance snapshot (backup import). Missing fields ignored.
 * @param {Partial<{
 *   faceBorderMm: unknown,
 *   cardRadiusMm: unknown,
 *   cardImageRadiusMm: unknown,
 *   defaultColor: unknown,
 * }>|null|undefined} raw
 * @returns {ReturnType<typeof getCardAppearanceSettings>}
 */
export function applyCardAppearanceSettings(raw) {
  if (!raw || typeof raw !== "object") return getCardAppearanceSettings();
  if (Object.prototype.hasOwnProperty.call(raw, "faceBorderMm")) {
    setFaceBorderMm(raw.faceBorderMm);
  }
  if (Object.prototype.hasOwnProperty.call(raw, "cardRadiusMm")) {
    setCardRadiusMm(raw.cardRadiusMm);
  }
  if (Object.prototype.hasOwnProperty.call(raw, "cardImageRadiusMm")) {
    setCardImageRadiusMm(raw.cardImageRadiusMm);
  }
  if (Object.prototype.hasOwnProperty.call(raw, "defaultColor")) {
    setConfiguredCardColor(/** @type {string} */ (raw.defaultColor));
  }
  return getCardAppearanceSettings();
}

/** Apply stored border, radii, and color at startup. */
export function initCardDesign() {
  applyFaceBorderMm(getFaceBorderMm());
  applyCardRadiusMm(getCardRadiusMm());
  applyCardImageRadiusMm(getCardImageRadiusMm());
  applyConfiguredCardColor();
}
