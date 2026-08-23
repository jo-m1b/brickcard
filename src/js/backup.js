/**
 * Format, parse, migrations et export des sauvegardes `.brickcard`.
 * `version` = `APP_VERSION` (SemVer), même sans changement de structure.
 */

import { downloadBlob } from "./card-export.js";
import { getCardAppearanceSettings } from "./card-design.js";
import { APP_ID, APP_VERSION } from "./version.js?v=0.7.5";

export const BACKUP_EXT = ".brickcard";
export const BACKUP_INVALID = "Ce fichier n’est pas une sauvegarde Brickcard valide.";

/** Id sentinelle : cartes sans thème connu (case « Sans thème »). */
export const UNTHEMED_BACKUP_THEME_ID = "";

/** Nombre de réglages « Apparence des cartes » inclus dans une sauvegarde. */
export const CARD_APPEARANCE_SETTING_COUNT = 4;

/**
 * Migrations de structure, dans l’ordre SemVer croissant.
 * Chaque entrée s’applique si la version du fichier est < `since`.
 * @type {{ since: string, apply: (data: BackupData) => BackupData }[]}
 */
const BACKUP_MIGRATIONS = [
  // Exemple futur : { since: "0.8.0", apply(data) { return data; } },
];

/**
 * @typedef {import("./storage.js").Card} Card
 * @typedef {import("./themes-data.js").LegoTheme} LegoTheme
 */

/**
 * @typedef {Object} BackupCardAppearance
 * @property {unknown} faceBorderMm
 * @property {unknown} cardRadiusMm
 * @property {unknown} cardImageRadiusMm
 * @property {unknown} defaultColor
 */

/**
 * @typedef {Object} BackupData
 * @property {string} version
 * @property {string} app
 * @property {string} [exportedAt]
 * @property {unknown[]} cards
 * @property {unknown[]} themes
 * @property {{ cardAppearance: BackupCardAppearance }} [settings]
 */

/**
 * @typedef {Object} BackupBuildOpts
 * @property {"full"|"custom"} [kind]
 * @property {Card[]} cards
 * @property {LegoTheme[]} themes Tous les thèmes (pour grouper les cartes)
 * @property {LegoTheme[]} customThemes
 * @property {string[]} [selectedThemeIds]
 * @property {boolean} [includeSettings]
 * @property {boolean} [includeImages]
 * @property {boolean} [includeThemeLogos]
 */

/** @param {string} [name] */
export function isBrickcardBackupFilename(name) {
  return String(name || "").toLowerCase().endsWith(BACKUP_EXT);
}

/** @param {unknown} card */
function isValidCardLike(card) {
  return Boolean(card && typeof card === "object" && typeof /** @type {{ id?: unknown }} */ (card).id === "string" && /** @type {{ id: string }} */ (card).id);
}

/** @param {unknown} theme */
function isValidThemeLike(theme) {
  if (!theme || typeof theme !== "object") return false;
  const t = /** @type {Record<string, unknown>} */ (theme);
  if (typeof t.id !== "string") return false;
  const hasName = typeof t.name === "string" || typeof t.themeName === "string";
  const hasLogoField =
    typeof t.logoDataUrl === "string" ||
    typeof t.image === "string" ||
    t.logoDataUrl === undefined;
  return hasName && hasLogoField;
}

/**
 * @param {string} version
 * @returns {[number, number, number]|null}
 */
function parseSemver(version) {
  const raw = String(version || "")
    .trim()
    .replace(/^v/i, "");
  const m = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(raw);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number|null} -1 / 0 / 1
 */
function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

/** @param {string} a @param {string} b */
function semverLt(a, b) {
  return compareSemver(a, b) === -1;
}

/** @param {string} a @param {string} b */
function semverGt(a, b) {
  return compareSemver(a, b) === 1;
}

/** @param {unknown} raw */
function normalizeSemverString(raw) {
  if (typeof raw !== "string") return "";
  const parsed = parseSemver(raw);
  if (!parsed) return "";
  return `${parsed[0]}.${parsed[1]}.${parsed[2]}`;
}

/** Photo, fond et cadrage — omis si les images ne sont pas incluses. */
function stripCardImage(card) {
  const {
    imageDataUrl: _imageDataUrl,
    imageBackgroundColor: _imageBackgroundColor,
    imageZoom: _imageZoom,
    imageOffsetX: _imageOffsetX,
    imageOffsetY: _imageOffsetY,
    ...rest
  } = card;
  return rest;
}

/** Logo et cadrage — omis si les logos ne sont pas inclus. */
function stripThemeLogo(theme) {
  const {
    logoDataUrl: _logoDataUrl,
    logoZoom: _logoZoom,
    logoOffsetX: _logoOffsetX,
    logoOffsetY: _logoOffsetY,
    ...rest
  } = theme;
  return rest;
}

/** Les sauvegardes n’ont que des thèmes perso : `isBuiltin` / `builtin` inutiles. */
function stripThemeBuiltinFlag(theme) {
  const { isBuiltin: _isBuiltin, builtin: _builtin, ...rest } = theme;
  return rest;
}

/**
 * @param {Card[]} cards
 * @param {LegoTheme[]} themes
 * @returns {Map<string, Card[]>}
 */
export function groupCardsForBackup(cards, themes) {
  const known = new Set((themes || []).map((t) => t.id));
  /** @type {Map<string, Card[]>} */
  const groups = new Map();
  for (const card of cards || []) {
    const id = String(card.brickcardThemeId || "");
    const key = id && known.has(id) ? id : UNTHEMED_BACKUP_THEME_ID;
    const list = groups.get(key) || [];
    list.push(card);
    groups.set(key, list);
  }
  return groups;
}

/**
 * Thèmes ayant au moins une carte (plus « Sans thème » si besoin).
 * @param {Card[]} cards
 * @param {LegoTheme[]} themes
 * @returns {{ id: string, name: string, cardCount: number, isCustom: boolean }[]}
 */
export function listBackupThemeChoices(cards, themes) {
  const groups = groupCardsForBackup(cards, themes);
  const themeById = new Map((themes || []).map((t) => [t.id, t]));
  /** @type {{ id: string, name: string, cardCount: number, isCustom: boolean }[]} */
  const choices = [];
  for (const [id, groupCards] of groups) {
    if (id === UNTHEMED_BACKUP_THEME_ID) continue;
    const theme = themeById.get(id);
    if (!theme) continue;
    choices.push({
      id,
      name: theme.name,
      cardCount: groupCards.length,
      isCustom: !theme.isBuiltin,
    });
  }
  const unthemed = groups.get(UNTHEMED_BACKUP_THEME_ID);
  if (unthemed?.length) {
    choices.push({
      id: UNTHEMED_BACKUP_THEME_ID,
      name: "Sans thème",
      cardCount: unthemed.length,
      isCustom: false,
    });
  }
  choices.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return choices;
}

/**
 * @param {Card[]} cards
 * @param {LegoTheme[]} themes
 * @param {Iterable<string>} selectedThemeIds
 * @returns {Card[]}
 */
function selectCardsByThemes(cards, themes, selectedThemeIds) {
  const selected = new Set(selectedThemeIds);
  const groups = groupCardsForBackup(cards, themes);
  /** @type {Card[]} */
  const out = [];
  for (const [id, list] of groups) {
    if (selected.has(id)) out.push(...list);
  }
  return out;
}

/**
 * @param {BackupBuildOpts} opts
 * @returns {BackupData}
 */
export function buildBackupPayload(opts) {
  const kind = opts.kind === "custom" ? "custom" : "full";
  const includeImages = kind === "full" ? true : opts.includeImages !== false;
  const includeThemeLogos = kind === "full" ? true : opts.includeThemeLogos !== false;
  const includeSettings = kind === "full" ? true : Boolean(opts.includeSettings);
  const cardsIn = opts.cards || [];
  const customThemes = opts.customThemes || [];
  const themes = opts.themes || [];

  /** @type {Card[]} */
  let cards;
  /** @type {LegoTheme[]} */
  let exportedThemes;

  if (kind === "full") {
    cards = cardsIn;
    exportedThemes = customThemes;
  } else {
    const choices = listBackupThemeChoices(cardsIn, themes);
    const selectedThemeIds = opts.selectedThemeIds || choices.map((c) => c.id);
    const selected = new Set(selectedThemeIds);
    cards = selectCardsByThemes(cardsIn, themes, selected);
    exportedThemes = customThemes.filter((t) => selected.has(t.id));
  }

  const exportedCards = includeImages ? cards : cards.map(stripCardImage);
  if (!includeThemeLogos) {
    exportedThemes = exportedThemes.map(stripThemeLogo);
  }
  exportedThemes = exportedThemes.map(stripThemeBuiltinFlag);

  /** @type {BackupData} */
  const payload = {
    version: APP_VERSION,
    app: APP_ID,
    exportedAt: new Date().toISOString(),
    cards: exportedCards,
    themes: exportedThemes,
  };
  if (includeSettings) {
    payload.settings = { cardAppearance: getCardAppearanceSettings() };
  }
  return payload;
}

/** Sauvegarde impossible sans au moins une carte. */
export function isBackupPayloadEmpty(payload) {
  return !payload || !payload.cards.length;
}

/** @param {unknown} payload */
export function backupPayloadBytes(payload) {
  return new Blob([JSON.stringify(payload, null, 2)]).size;
}

/**
 * Poids estimé des cartes d’un thème (images incluses ou non).
 * @param {Card[]} cards
 * @param {boolean} includeImages
 */
export function estimateThemeCardsBytes(cards, includeImages) {
  const exported = includeImages ? cards || [] : (cards || []).map(stripCardImage);
  return backupPayloadBytes(exported);
}

/**
 * Hint d’une case thème : `12 cartes · 2 Mo`
 * @param {number} cardCount
 * @param {number} bytes
 */
export function formatBackupThemeChoiceHint(cardCount, bytes) {
  const n = Math.max(0, Math.round(Number(cardCount) || 0));
  return `${n} carte${n > 1 ? "s" : ""} · ${formatBackupSize(bytes)}`;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatBackupSize(bytes) {
  const n = Math.max(0, Math.round(Number(bytes) || 0));
  if (n < 1000) return `${n} octet${n > 1 ? "s" : ""}`;
  if (n < 1_000_000) {
    const ko = n / 1000;
    const rounded = ko >= 10 ? Math.round(ko) : Math.round(ko * 10) / 10;
    return `${String(rounded).replace(".", ",")} Ko`;
  }
  if (n < 1_000_000_000) {
    const mo = n / 1_000_000;
    const rounded = mo >= 10 ? Math.round(mo) : Math.round(mo * 10) / 10;
    return `${String(rounded).replace(".", ",")} Mo`;
  }
  const go = n / 1_000_000_000;
  const rounded = go >= 10 ? Math.round(go) : Math.round(go * 10) / 10;
  return `${String(rounded).replace(".", ",")} Go`;
}

/** @param {number} n @param {string} word */
function formatFrCount(n, word) {
  const v = Math.max(0, Math.round(Number(n) || 0));
  return `${v} ${word}${v > 1 ? "s" : ""}`;
}

/**
 * Recap pied de modale : comptes > 0 puis taille (à afficher en gras).
 * @param {{ cardCount: number, themeCount: number, settingCount: number, bytes: number }} recap
 * @returns {{ items: string[], size: string }}
 */
export function formatBackupFooterRecap(recap) {
  const cards = Math.max(0, Math.round(Number(recap.cardCount) || 0));
  const themes = Math.max(0, Math.round(Number(recap.themeCount) || 0));
  const settings = Math.max(0, Math.round(Number(recap.settingCount) || 0));
  /** @type {string[]} */
  const items = [];
  if (cards > 0) items.push(formatFrCount(cards, "carte"));
  if (themes > 0) items.push(formatFrCount(themes, "thème"));
  if (settings > 0) items.push(formatFrCount(settings, "paramètre"));
  return { items, size: formatBackupSize(recap.bytes) };
}

/** @param {unknown[]} cards */
export function countBackupCardImages(cards) {
  return (cards || []).filter((c) =>
    Boolean(c && typeof c === "object" && String(/** @type {{ imageDataUrl?: unknown }} */ (c).imageDataUrl || "").trim())
  ).length;
}

/** @param {unknown[]} themes */
export function countBackupThemeLogos(themes) {
  return (themes || []).filter((t) =>
    Boolean(t && typeof t === "object" && String(/** @type {{ logoDataUrl?: unknown }} */ (t).logoDataUrl || "").trim())
  ).length;
}

/**
 * @param {{
 *   kind?: "full"|"custom",
 *   cardCount: number,
 *   themeCount: number,
 *   imageCount?: number,
 *   logoCount?: number,
 *   date?: string,
 * }} opts
 */
export function formatBackupFilename(opts) {
  const kind = opts.kind === "custom" ? "custom" : "full";
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const cards = Math.max(0, Math.round(Number(opts.cardCount) || 0));
  const themes = Math.max(0, Math.round(Number(opts.themeCount) || 0));
  const images = Math.max(0, Math.round(Number(opts.imageCount) || 0));
  const logos = Math.max(0, Math.round(Number(opts.logoCount) || 0));
  const parts = [
    "brickcard-backup",
    date,
    kind,
    `${cards}-${cards > 1 ? "cards" : "card"}`,
  ];
  if (themes > 0) {
    parts.push(`${themes}-${themes > 1 ? "themes" : "theme"}`);
  }
  if (images > 0) {
    parts.push(`${images}-${images > 1 ? "images" : "image"}`);
  }
  if (logos > 0) {
    parts.push(`${logos}-${logos > 1 ? "logos" : "logo"}`);
  }
  return `${parts.join("-")}${BACKUP_EXT}`;
}

/** @param {BackupData} data @returns {BackupData} */
function migrateLegacyIntegerBackup(data) {
  return {
    version: "0.0.0",
    app: data.app,
    exportedAt: data.exportedAt,
    cards: Array.isArray(data.cards) ? data.cards : [],
    themes: Array.isArray(data.themes) ? data.themes : [],
  };
}

/** @param {unknown} raw */
function readCardAppearance(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const src = /** @type {Record<string, unknown>} */ (raw);
  return {
    faceBorderMm: src.faceBorderMm,
    cardRadiusMm: src.cardRadiusMm,
    cardImageRadiusMm: src.cardImageRadiusMm,
    defaultColor: src.defaultColor,
  };
}

/**
 * @param {BackupData} raw
 * @returns {BackupData}
 */
export function migrateBackup(raw) {
  let data = {
    version: raw.version,
    app: raw.app,
    exportedAt: raw.exportedAt,
    cards: Array.isArray(raw.cards) ? raw.cards : [],
    themes: Array.isArray(raw.themes) ? raw.themes : [],
    settings: raw.settings,
  };

  if (typeof raw.version === "number") {
    if (!Number.isInteger(raw.version) || raw.version < 1 || raw.version > 3) {
      throw new Error(BACKUP_INVALID);
    }
    data = migrateLegacyIntegerBackup(data);
  }

  const ver = normalizeSemverString(data.version);
  if (!ver) throw new Error(BACKUP_INVALID);
  if (semverGt(ver, APP_VERSION)) {
    throw new Error(
      `Cette sauvegarde (v${ver}) n’est pas compatible avec cette version de l’app.`
    );
  }

  data.version = ver;
  for (const migration of BACKUP_MIGRATIONS) {
    if (semverLt(data.version, migration.since)) {
      data = migration.apply(data);
      data.version = migration.since;
    }
  }

  if (data.settings != null) {
    if (typeof data.settings !== "object" || Array.isArray(data.settings)) {
      throw new Error(BACKUP_INVALID);
    }
    const appearance = readCardAppearance(
      /** @type {{ cardAppearance?: unknown }} */ (data.settings).cardAppearance
    );
    if (appearance) data.settings = { cardAppearance: appearance };
    else delete data.settings;
  }

  return data;
}

/**
 * @param {string|object} input
 * @returns {BackupData}
 */
export function parseBrickcardBackup(input) {
  let data;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      throw new Error(BACKUP_INVALID);
    }
  } else {
    data = input;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(BACKUP_INVALID);
  }
  const backup = /** @type {Record<string, unknown>} */ (data);
  if (backup.app !== APP_ID) {
    throw new Error(BACKUP_INVALID);
  }
  if (!Array.isArray(backup.cards) || !Array.isArray(backup.themes)) {
    throw new Error(BACKUP_INVALID);
  }

  const migrated = migrateBackup(/** @type {BackupData} */ (backup));
  const hasCard = migrated.cards.some(isValidCardLike);
  const hasTheme = migrated.themes.some(isValidThemeLike);
  const hasSettings = Boolean(migrated.settings?.cardAppearance);
  if (!hasCard && !hasTheme && !hasSettings) {
    throw new Error("Aucune donnée valide trouvée dans le fichier.");
  }
  return migrated;
}

/**
 * @param {BackupBuildOpts} [opts]
 * @returns {Promise<{ cards: number, themes: number, settings: boolean, filename: string, bytes: number }>}
 */
export async function exportBackup(opts = /** @type {BackupBuildOpts} */ ({})) {
  let cards = opts.cards;
  let customThemes = opts.customThemes;
  let themes = opts.themes;
  if (!cards || !customThemes || !themes) {
    const storage = await import("./storage.js");
    cards = cards ?? (await storage.loadCards());
    customThemes = customThemes ?? (await storage.loadCustomThemes());
    themes = themes ?? (await storage.loadThemes());
  }
  const kind = opts.kind === "custom" ? "custom" : "full";
  const includeImages = kind === "full" ? true : opts.includeImages !== false;
  const includeThemeLogos = kind === "full" ? true : opts.includeThemeLogos !== false;
  const payload = buildBackupPayload({
    kind,
    cards,
    customThemes,
    themes,
    selectedThemeIds: opts.selectedThemeIds,
    includeSettings: opts.includeSettings,
    includeImages,
    includeThemeLogos,
  });
  const filename = formatBackupFilename({
    kind,
    cardCount: payload.cards.length,
    themeCount: payload.themes.length,
    imageCount: countBackupCardImages(payload.cards),
    logoCount: countBackupThemeLogos(payload.themes),
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
  return {
    cards: payload.cards.length,
    themes: payload.themes.length,
    settings: Boolean(payload.settings),
    filename,
    bytes: blob.size,
  };
}
