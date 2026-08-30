/**
 * Default LEGO themes — metadata in `data/themes-presets.json`.
 * Logos: relative path (`logoSrc`, e.g. data/theme-logo-…) — optional, no generated fallback.
 * No `color` → empty string; card display uses the configured color then factory gray.
 */

import { _t } from "./i18n.js";

/**
 * @typedef {Object} LegoTheme
 * @property {string} id
 * @property {string} name Display (e.g. "Aquazone", "CITY")
 * @property {string} color Theme color (cards), hex #rrggbb or "" if unset
 * @property {string} secondaryColor Texts / icons / Brickcard logo, hex #rrggbb or "" (auto contrast)
 * @property {string} logoDataUrl JPEG/PNG/SVG/WebP logo (data URL or relative path), optional
 * @property {number} logoZoom Logo width zoom (1 = 75% of the card width)
 * @property {number} logoOffsetX Horizontal logo offset (box fraction)
 * @property {number} logoOffsetY Vertical logo offset (box fraction)
 * @property {boolean} isBuiltin Default theme (read-only, not deletable)
 * @property {string} updatedAt ISO (custom); empty for default themes
 */

/**
 * Entry in data/themes-presets.json
 * @typedef {Object} PresetMeta
 * @property {string} id
 * @property {string} name
 * @property {string} [color] Hex; omitted → no own color (card cascade)
 * @property {string} [secondaryColor] Hex; omitted → black or white from the accent
 * @property {string} [logoSrc] Relative path from src/ (e.g. "data/theme-logo-….png")
 * @property {number} [logoZoom] Logo width (1 = 75% of the card); omitted → 1
 * @property {number} [logoOffsetX] Horizontal offset; omitted → 0
 * @property {number} [logoOffsetY] Vertical offset; omitted → 0
 */

const PRESETS_URL = "data/themes-presets.json";

/** Neutral factory gray — last resort for the card accent. */
export const DEFAULT_THEME_COLOR = "#6e6e6e";

/** Old default theme ids → current id (`themes-presets.json`). */
const PRESET_ID_ALIASES = {
  "the-lord-of-the-rings": "lord-of-the-rings",
};

/** @param {unknown} id @returns {string} */
export function resolvePresetThemeId(id) {
  const s = String(id || "").trim();
  return PRESET_ID_ALIASES[s] || s;
}

/** Local hosts (reset button + fetch with no HTTP cache). */
export function isLocalDevHost() {
  const host = location.hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
}

/** Invalidate the in-memory preset cache (after wipe / before reseed). */
export function clearPresetCache() {
  presetMetaPromise = null;
  presetThemesPromise = null;
}

/** @type {Promise<PresetMeta[]>|null} */
let presetMetaPromise = null;

/** @type {Promise<LegoTheme[]>|null} */
let presetThemesPromise = null;

/**
 * Round to 2 decimal places. `0.00` (and `-0`) → `0`.
 * @param {unknown} raw
 * @returns {number}
 */
export function roundCropCoord(raw) {
  const v = Number(raw);
  if (!Number.isFinite(v)) return 0;
  const rounded = Number(v.toFixed(2));
  return rounded === 0 ? 0 : rounded;
}

/**
 * Clamp logo zoom (same range as custom themes), rounded to 2 decimal places.
 * @param {unknown} raw
 * @returns {number}
 */
export function clampLogoZoom(raw) {
  return roundCropCoord(Math.min(2.5, Math.max(0.25, Number(raw) || 1)));
}

/** @returns {Promise<PresetMeta[]>} */
export async function loadPresetMeta() {
  if (!presetMetaPromise) {
    const url = isLocalDevHost()
      ? `${PRESETS_URL}?_=${Date.now()}`
      : PRESETS_URL;
    presetMetaPromise = fetch(url, {
      cache: isLocalDevHost() ? "no-store" : "default",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(_t("Unable to load %(url)s (%(status)s)", { url: PRESETS_URL, status: res.status }));
        }
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.themes;
        if (!Array.isArray(list) || !list.length) {
          throw new Error(_t("themes-presets.json: missing or empty \"themes\" array"));
        }
        return list.filter((t) => t && typeof t.id === "string" && (t.name || t.themeName));
      })
      .catch((err) => {
        presetMetaPromise = null;
        throw err;
      });
  }
  return presetMetaPromise;
}

/** @param {string} [hex] */
export function isHexColor(hex) {
  return /^#[0-9a-fA-F]{6}$/.test(String(hex || "").trim());
}

/**
 * Parse a hex color; empty string if missing / invalid.
 * @param {string|null|undefined} hex
 * @returns {string} #rrggbb or ""
 */
export function parseHexColor(hex) {
  const raw = String(hex || "").trim();
  if (isHexColor(raw)) return raw.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return "";
}

/**
 * Explicit color or factory gray (for contexts that always need a hex).
 * @param {{ color?: string, accentColor?: string }|string|null|undefined} themeOrHex
 * @returns {string} hex #rrggbb
 */
export function resolveThemeColor(themeOrHex) {
  const raw =
    typeof themeOrHex === "string"
      ? themeOrHex
      : String(themeOrHex?.color ?? themeOrHex?.accentColor ?? "").trim();
  return parseHexColor(raw) || DEFAULT_THEME_COLOR;
}

/** @returns {Promise<LegoTheme[]>} */
export async function getPresetThemes() {
  if (isLocalDevHost()) {
    // Locally: always re-read the JSON (no in-memory cache between resets)
    clearPresetCache();
  }

  if (!presetThemesPromise) {
    presetThemesPromise = (async () => {
      const meta = await loadPresetMeta();
      return meta.map((entry) => {
        const color = parseHexColor(entry.color ?? entry.accentColor);
        const name = String(entry.name ?? entry.themeName ?? "").trim();
        let logoDataUrl = "";
        if (entry.logoSrc) {
          const path = String(entry.logoSrc).split("?")[0];
          logoDataUrl = isLocalDevHost() ? `${path}?_=${Date.now()}` : path;
        }

        return {
          id: entry.id,
          name,
          isBuiltin: true,
          color,
          secondaryColor: parseHexColor(entry.secondaryColor),
          logoDataUrl,
          logoZoom: clampLogoZoom(entry.logoZoom),
          logoOffsetX: roundCropCoord(entry.logoOffsetX),
          logoOffsetY: roundCropCoord(entry.logoOffsetY),
          updatedAt: "",
        };
      });
    })().catch((err) => {
      presetThemesPromise = null;
      throw err;
    });
  }
  return presetThemesPromise;
}

/** @param {string} id @returns {Promise<LegoTheme|null>} */
export async function getPresetTheme(id) {
  const all = await getPresetThemes();
  return all.find((t) => t.id === id) || null;
}

/**
 * @param {LegoTheme[]} themes
 * @returns {{ custom: LegoTheme[], builtin: LegoTheme[] }}
 */
export function partitionThemes(themes) {
  /** @type {LegoTheme[]} */
  const custom = [];
  /** @type {LegoTheme[]} */
  const builtin = [];
  for (const t of themes) {
    if (t.isBuiltin) builtin.push(t);
    else custom.push(t);
  }
  return { custom, builtin };
}

/**
 * Text contrast on a color background.
 * Black only if the background is truly pale (light gray, pastel, near-white).
 * A saturated hue (yellow, orange, lime…) stays white.
 * @param {string} hex
 * @returns {"#ffffff"|"#141414"}
 */
export function contrastText(hex) {
  const c = String(hex || "#000000").replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const sat = max === 0 ? 0 : (max - min) / max;
  return luma > 0.72 && sat < 0.4 ? "#141414" : "#ffffff";
}
