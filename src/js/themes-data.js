/**
 * Thèmes LEGO prédéfinis — métadonnées dans `data/themes-presets.json`.
 * Logos : chemin relatif (`logoSrc`, ex. img/…) — optionnel, pas de fallback généré.
 * Sans `color` → chaîne vide ; l’affichage carte utilise la couleur configurée puis le gris d’usine.
 */

/**
 * @typedef {Object} LegoTheme
 * @property {string} id
 * @property {string} themeName Affichage (ex. "Aquazone", "CITY")
 * @property {string} color Couleur du thème (cartes), hex #rrggbb ou "" si non définie
 * @property {string} logoDataUrl Logo PNG/SVG/WebP (data URL ou chemin relatif), optionnel
 * @property {boolean} isBuiltin Thème par défaut (lecture seule, non supprimable)
 * @property {string} createdAt ISO (personnalisés) ; vide pour les thèmes par défaut
 * @property {string} updatedAt ISO (personnalisés) ; vide pour les thèmes par défaut
 */

/**
 * Entrée dans data/themes-presets.json
 * @typedef {Object} PresetMeta
 * @property {string} id
 * @property {string} themeName
 * @property {string} [color] Hex ; omis → pas de couleur propre (cascade carte)
 * @property {string} [logoSrc] Chemin relatif depuis src/ (ex. "img/logo-theme-….png")
 */

const PRESETS_URL = "data/themes-presets.json";

/** Gris neutre d’usine — dernier recours pour l’accent carte. */
export const DEFAULT_THEME_COLOR = "#6e6e6e";

/** Hosts locaux (bouton reset + fetch sans cache HTTP). */
export function isLocalDevHost() {
  const host = location.hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
}

/** Invalide le cache mémoire des presets (après wipe / avant reseed). */
export function clearPresetCache() {
  presetMetaPromise = null;
  presetThemesPromise = null;
}

/** @type {Promise<PresetMeta[]>|null} */
let presetMetaPromise = null;

/** @type {Promise<LegoTheme[]>|null} */
let presetThemesPromise = null;

/** @returns {Promise<PresetMeta[]>} */
async function loadPresetMeta() {
  if (!presetMetaPromise) {
    const url = isLocalDevHost()
      ? `${PRESETS_URL}?_=${Date.now()}`
      : PRESETS_URL;
    presetMetaPromise = fetch(url, {
      cache: isLocalDevHost() ? "no-store" : "default",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Impossible de charger ${PRESETS_URL} (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.themes;
        if (!Array.isArray(list) || !list.length) {
          throw new Error("themes-presets.json : tableau « themes » manquant ou vide");
        }
        return list.filter((t) => t && typeof t.id === "string" && t.themeName);
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
 * Parse une couleur hex ; chaîne vide si absente / invalide.
 * @param {string|null|undefined} hex
 * @returns {string} #rrggbb ou ""
 */
export function parseHexColor(hex) {
  const raw = String(hex || "").trim();
  if (isHexColor(raw)) return raw.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return "";
}

/**
 * Couleur explicite ou gris d’usine (pour contextes qui exigent toujours un hex).
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
    // En local : toujours relire le JSON (pas de cache mémoire entre resets)
    clearPresetCache();
  }

  if (!presetThemesPromise) {
    presetThemesPromise = (async () => {
      const meta = await loadPresetMeta();
      return meta.map((entry) => {
        const color = parseHexColor(entry.color ?? entry.accentColor);
        const themeName = String(entry.themeName).trim();
        let logoDataUrl = "";
        if (entry.logoSrc) {
          const path = String(entry.logoSrc).split("?")[0];
          logoDataUrl = isLocalDevHost() ? `${path}?_=${Date.now()}` : path;
        }

        return {
          id: entry.id,
          themeName,
          isBuiltin: true,
          color,
          logoDataUrl,
          createdAt: "",
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
 * Contraste texte sur fond couleur.
 * @param {string} hex
 * @returns {"#ffffff"|"#141414"}
 */
export function contrastText(hex) {
  const c = String(hex || "#000000").replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.55 ? "#141414" : "#ffffff";
}
