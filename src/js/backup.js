/**
 * Format, parse, migrations and export of `.brickcard` backups.
 * `version` = `APP_VERSION` (SemVer), even with no structure change.
 */

import { downloadBlob } from "./card-export.js";
import { getCardAppearanceSettings } from "./card-design.js";
import { APP_ID, APP_VERSION } from "./version.js";
import { _t, getLocale } from "./i18n.js";

export const BACKUP_EXT = ".brickcard";
export const BACKUP_INVALID = "The loaded backup is invalid!";
export const BACKUP_URL_INVALID = "The backup URL is invalid.";
export const BACKUP_LOAD_ERROR = "Backup loading error!";
export const BACKUP_LOAD_ERROR_CORS =
  "Backup loading error! Network or CORS - the source site refuses the load.";

/** Demo backup shipped with the app (`src/data/`), path relative to `src/`. */
export const DEMO_BACKUP_SRC = "data/backup-demo-jo.brickcard";

/** Sentinel id: cards with no known theme (“No theme” checkbox). */
export const UNTHEMED_BACKUP_THEME_ID = "";

/** Number of “Card appearance” settings included in a backup. */
export const CARD_APPEARANCE_NUM_SETTINGS = 4;

/**
 * Structure migrations, in ascending SemVer order.
 * Each entry applies if the file version is < `since`.
 * @type {{ since: string, apply: (data: BackupData) => BackupData }[]}
 */
const BACKUP_MIGRATIONS = [
  // Future example: { since: "0.8.0", apply(data) { return data; } },
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
 * @property {LegoTheme[]} themes All themes (to group cards)
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

/** Photo, background and crop — omitted if images are not included. */
function stripCardImage(card) {
  const {
    imageDataUrl: _imageDataUrl,
    imageBackgroundColor: _imageBackgroundColor,
    imageZoom: _imageZoom,
    imageOffsetX: _imageOffsetX,
    imageOffsetY: _imageOffsetY,
    setImageDataUrl: _setImageDataUrl,
    image: _image,
    zoom: _zoom,
    offsetX: _offsetX,
    offsetY: _offsetY,
    ...rest
  } = card;
  return rest;
}

/** Logo and crop — omitted if logos are not included. */
function stripThemeLogo(theme) {
  const {
    logoDataUrl: _logoDataUrl,
    logoZoom: _logoZoom,
    logoOffsetX: _logoOffsetX,
    logoOffsetY: _logoOffsetY,
    image: _image,
    ...rest
  } = theme;
  return rest;
}

/** @param {unknown} card */
function cardThemeId(card) {
  if (!card || typeof card !== "object") return "";
  const c = /** @type {Record<string, unknown>} */ (card);
  return String(c.brickcardThemeId ?? c.legoThemeId ?? c.themeId ?? "").trim();
}

/** Backups only have custom themes: `isBuiltin` / `builtin` unused. */
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
    const id = cardThemeId(card);
    const key = id && known.has(id) ? id : UNTHEMED_BACKUP_THEME_ID;
    const list = groups.get(key) || [];
    list.push(card);
    groups.set(key, list);
  }
  return groups;
}

/**
 * Themes with at least one card (plus “No theme” if needed).
 * @param {Card[]} cards
 * @param {LegoTheme[]} themes
 * @returns {{ id: string, name: string, numCards: number, isCustom: boolean }[]}
 */
export function listBackupThemeChoices(cards, themes) {
  const groups = groupCardsForBackup(cards, themes);
  const themeById = new Map((themes || []).map((t) => [t.id, t]));
  /** @type {{ id: string, name: string, numCards: number, isCustom: boolean }[]} */
  const choices = [];
  for (const [id, groupCards] of groups) {
    if (id === UNTHEMED_BACKUP_THEME_ID) continue;
    const theme = themeById.get(id);
    if (!theme) continue;
    const themeName =
      String(theme.name || /** @type {{ themeName?: unknown }} */ (theme).themeName || "").trim() ||
      _t("THEME");
    choices.push({
      id,
      name: themeName,
      numCards: groupCards.length,
      isCustom: !theme.isBuiltin,
    });
  }
  const unthemed = groups.get(UNTHEMED_BACKUP_THEME_ID);
  if (unthemed?.length) {
    choices.push({
      id: UNTHEMED_BACKUP_THEME_ID,
      name: _t("No theme"),
      numCards: unthemed.length,
      isCustom: false,
    });
  }
  choices.sort((a, b) => a.name.localeCompare(b.name, getLocale()));
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

/** Backup impossible without at least one card. */
export function isBackupPayloadEmpty(payload) {
  return !payload || !payload.cards.length;
}

/**
 * Themes from the file to import: those with cards, plus empty custom themes.
 * @param {Card[]} cards
 * @param {LegoTheme[]} themes
 * @param {LegoTheme[]} customThemes
 * @returns {{ id: string, name: string, numCards: number, isCustom: boolean }[]}
 */
export function listImportThemeChoices(cards, themes, customThemes) {
  const choices = listBackupThemeChoices(cards, themes);
  const chosen = new Set(choices.map((c) => c.id));
  /** @type {{ id: string, name: string, numCards: number, isCustom: boolean }[]} */
  const empty = [];
  for (const theme of customThemes || []) {
    if (!theme || !theme.id || chosen.has(theme.id)) continue;
    empty.push({
      id: theme.id,
      name: String(theme.name || "").trim() || _t("THEME"),
      numCards: 0,
      isCustom: true,
    });
  }
  empty.sort((a, b) => a.name.localeCompare(b.name, getLocale()));
  return [...choices, ...empty];
}

/**
 * @param {BackupData} backup
 * @param {{
 *   themes: LegoTheme[],
 *   selectedThemeIds?: string[],
 *   includeSettings?: boolean,
 *   includeImages?: boolean,
 *   includeThemeLogos?: boolean,
 * }} opts
 * @returns {BackupData}
 */
export function buildImportPayload(backup, opts) {
  const includeImages = opts.includeImages !== false;
  const includeThemeLogos = opts.includeThemeLogos !== false;
  const includeSettings = Boolean(opts.includeSettings);
  const cardsIn = /** @type {Card[]} */ (backup.cards || []);
  const customThemes = /** @type {LegoTheme[]} */ (backup.themes || []);
  const themes = opts.themes || [];
  const choices = listImportThemeChoices(cardsIn, themes, customThemes);
  const selectedThemeIds = opts.selectedThemeIds || choices.map((c) => c.id);
  const selected = new Set(selectedThemeIds);
  const cards = selectCardsByThemes(cardsIn, themes, selected);
  let exportedThemes = customThemes.filter((t) => t && selected.has(t.id));
  const exportedCards = includeImages ? cards : cards.map(stripCardImage);
  if (!includeThemeLogos) {
    exportedThemes = exportedThemes.map(stripThemeLogo);
  }
  exportedThemes = exportedThemes.map(stripThemeBuiltinFlag);

  /** @type {BackupData} */
  const payload = {
    version: backup.version,
    app: backup.app,
    exportedAt: backup.exportedAt,
    cards: exportedCards,
    themes: exportedThemes,
  };
  if (includeSettings && backup.settings?.cardAppearance) {
    payload.settings = { cardAppearance: backup.settings.cardAppearance };
  }
  return payload;
}

/** Import impossible without a selected card, theme, or setting. */
export function isImportPayloadEmpty(payload) {
  if (!payload) return true;
  const hasCards = Array.isArray(payload.cards) && payload.cards.length > 0;
  const hasThemes = Array.isArray(payload.themes) && payload.themes.length > 0;
  const hasSettings = Boolean(payload.settings?.cardAppearance);
  return !hasCards && !hasThemes && !hasSettings;
}

/**
 * Download a backup from an http(s) URL (absolute or relative) and return the text.
 * The URL is not kept.
 * @param {string} urlString
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<string>}
 */
export async function fetchBackupAsText(urlString, opts = {}) {
  const raw = String(urlString || "").trim();
  if (!raw) throw new Error(_t(BACKUP_URL_INVALID));

  let url;
  try {
    url = new URL(raw, document.baseURI);
  } catch {
    throw new Error(_t(BACKUP_URL_INVALID));
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(_t(BACKUP_URL_INVALID));
  }

  let res;
  try {
    res = await fetch(url.href, {
      mode: "cors",
      credentials: "omit",
      cache: "no-cache",
      signal: opts.signal,
    });
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && err.name === "AbortError") {
      throw err;
    }
    throw new Error(_t(BACKUP_LOAD_ERROR_CORS));
  }

  if (!res.ok) {
    throw new Error(_t("Backup loading error! HTTP %(status)s.", { status: res.status }));
  }

  return res.text();
}

/** @param {unknown} payload */
export function backupPayloadBytes(payload) {
  return new Blob([JSON.stringify(payload, null, 2)]).size;
}

/**
 * Estimated size of a theme's cards (images included or not).
 * @param {Card[]} cards
 * @param {boolean} includeImages
 */
export function estimateThemeCardsBytes(cards, includeImages) {
  const exported = includeImages ? cards || [] : (cards || []).map(stripCardImage);
  return backupPayloadBytes(exported);
}

/**
 * Theme checkbox hint: `12 cards · 2 MB`
 * @param {number} numCards
 * @param {number} bytes
 */
export function formatBackupThemeChoiceHint(numCards, bytes) {
  const n = Math.max(0, Math.round(Number(numCards) || 0));
  const cards =
    n === 1 ? _t("%(count)s card", { count: n }) : _t("%(count)s cards", { count: n });
  return `${cards} · ${formatBackupSize(bytes)}`;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatBackupSize(bytes) {
  const n = Math.max(0, Math.round(Number(bytes) || 0));
  if (n < 1000) {
    return n === 1 ? _t("%(n)s byte", { n }) : _t("%(n)s bytes", { n });
  }
  const localeNum = (value) =>
    value.toLocaleString(getLocale(), { maximumFractionDigits: 1 });
  if (n < 1_000_000) {
    const ko = n / 1000;
    const rounded = ko >= 10 ? Math.round(ko) : Math.round(ko * 10) / 10;
    return _t("%(n)s kB", { n: localeNum(rounded) });
  }
  if (n < 1_000_000_000) {
    const mo = n / 1_000_000;
    const rounded = mo >= 10 ? Math.round(mo) : Math.round(mo * 10) / 10;
    return _t("%(n)s MB", { n: localeNum(rounded) });
  }
  const go = n / 1_000_000_000;
  const rounded = go >= 10 ? Math.round(go) : Math.round(go * 10) / 10;
  return _t("%(n)s GB", { n: localeNum(rounded) });
}

/** @param {number} n @param {"card"|"theme"|"setting"} kind */
function formatCountItem(n, kind) {
  const v = Math.max(0, Math.round(Number(n) || 0));
  if (kind === "card") {
    return v === 1 ? _t("%(count)s card", { count: v }) : _t("%(count)s cards", { count: v });
  }
  if (kind === "theme") {
    return v === 1 ? _t("%(count)s theme", { count: v }) : _t("%(count)s themes", { count: v });
  }
  return v === 1
    ? _t("%(count)s setting", { count: v })
    : _t("%(count)s settings", { count: v });
}

/**
 * Modal footer recap: counts > 0 then size (to show in bold).
 * @param {{ numCards: number, numThemes: number, numSettings: number, bytes: number }} recap
 * @returns {{ items: string[], size: string }}
 */
export function formatBackupFooterRecap(recap) {
  const cards = Math.max(0, Math.round(Number(recap.numCards) || 0));
  const themes = Math.max(0, Math.round(Number(recap.numThemes) || 0));
  const settings = Math.max(0, Math.round(Number(recap.numSettings) || 0));
  /** @type {string[]} */
  const items = [];
  if (cards > 0) items.push(formatCountItem(cards, "card"));
  if (themes > 0) items.push(formatCountItem(themes, "theme"));
  if (settings > 0) items.push(formatCountItem(settings, "setting"));
  return { items, size: formatBackupSize(recap.bytes) };
}

/**
 * Toast recap: optional filename + same items as the footer, size in bold (HTML).
 * @param {{ numCards: number, numThemes: number, numSettings: number, bytes: number }} recap
 * @param {{ filename?: string }} [opts]
 * @returns {{ message: string, messageHtml: string }}
 */
export function formatBackupToastRecap(recap, opts = {}) {
  const { items, size } = formatBackupFooterRecap(recap);
  const filename = String(opts.filename || "").trim();
  /** @type {string[]} */
  const parts = [];
  if (filename) parts.push(filename);
  parts.push(...items);
  const message = size ? [...parts, size].join(" · ") : parts.join(" · ");
  const htmlParts = parts.map(escapeBackupToastHtml);
  if (size) htmlParts.push(`<strong>${escapeBackupToastHtml(size)}</strong>`);
  return { message, messageHtml: htmlParts.join(" · ") };
}

/** @param {string} s */
function escapeBackupToastHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {unknown[]} cards */
export function countBackupCardImages(cards) {
  return (cards || []).filter((c) => {
    if (!c || typeof c !== "object") return false;
    const card = /** @type {Record<string, unknown>} */ (c);
    return Boolean(String(card.imageDataUrl ?? card.setImageDataUrl ?? card.image ?? "").trim());
  }).length;
}

/** @param {unknown[]} themes */
export function countBackupThemeLogos(themes) {
  return (themes || []).filter((t) => {
    if (!t || typeof t !== "object") return false;
    const theme = /** @type {Record<string, unknown>} */ (t);
    return Boolean(String(theme.logoDataUrl ?? theme.image ?? "").trim());
  }).length;
}

/**
 * @param {{
 *   kind?: "full"|"custom",
 *   numCards: number,
 *   numThemes: number,
 *   numImages?: number,
 *   numLogos?: number,
 *   date?: string,
 * }} opts
 */
export function formatBackupFilename(opts) {
  const kind = opts.kind === "custom" ? "custom" : "full";
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const cards = Math.max(0, Math.round(Number(opts.numCards) || 0));
  const themes = Math.max(0, Math.round(Number(opts.numThemes) || 0));
  const images = Math.max(0, Math.round(Number(opts.numImages) || 0));
  const logos = Math.max(0, Math.round(Number(opts.numLogos) || 0));
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
      throw new Error(_t(BACKUP_INVALID));
    }
    data = migrateLegacyIntegerBackup(data);
  }

  const ver = normalizeSemverString(data.version);
  if (!ver) throw new Error(_t(BACKUP_INVALID));
  if (semverGt(ver, APP_VERSION)) {
    throw new Error(
      _t("The version (v%(version)s) of the loaded backup is incompatible!", { version: ver })
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
      throw new Error(_t(BACKUP_INVALID));
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
      throw new Error(_t(BACKUP_INVALID));
    }
  } else {
    data = input;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(_t(BACKUP_INVALID));
  }
  const backup = /** @type {Record<string, unknown>} */ (data);
  if (backup.app !== APP_ID) {
    throw new Error(_t(BACKUP_INVALID));
  }
  if (!Array.isArray(backup.cards) || !Array.isArray(backup.themes)) {
    throw new Error(_t(BACKUP_INVALID));
  }

  const migrated = migrateBackup(/** @type {BackupData} */ (backup));
  const hasCard = migrated.cards.some(isValidCardLike);
  const hasTheme = migrated.themes.some(isValidThemeLike);
  const hasSettings = Boolean(migrated.settings?.cardAppearance);
  if (!hasCard && !hasTheme && !hasSettings) {
    throw new Error(_t(BACKUP_INVALID));
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
    numCards: payload.cards.length,
    numThemes: payload.themes.length,
    numImages: countBackupCardImages(payload.cards),
    numLogos: countBackupThemeLogos(payload.themes),
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
