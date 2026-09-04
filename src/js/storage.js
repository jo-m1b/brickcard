/**
 * IndexedDB persistence (cards + custom themes) + `.brickcard` import.
 * Default themes come from the JSON, not IndexedDB.
 * Format / export: `backup.js`.
 */

import { getPresetThemes, getPresetTheme, parseHexColor, clearPresetCache, clampLogoZoom, roundCropCoord, resolvePresetThemeId } from "./themes-data.js";
import { applyCardAppearanceSettings } from "./card-design.js";
import { getOptimizeImages } from "./image-optimize.js";
import { APP_ID } from "./version.js";
import { _t, getLocale } from "./i18n.js";

const DB_NAME_BASE = APP_ID;
const DB_GEN_KEY = `${APP_ID}:db-gen`;
const DB_VERSION = 2;
const STORE_CARDS = "cards";
const STORE_THEMES = "themes";

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} legoSetRef Set reference (e.g. "6140/6109")
 * @property {string} title Brickcard title (`\n` = line break)
 * @property {string} brickcardThemeId Associated Brickcard theme id
 * @property {number|null} numPieces Piece count
 * @property {number|null} numFigurines Figurine count (optional)
 * @property {number|null} releaseYear Release year (optional)
 * @property {string} imageDataUrl Photo (JPEG/PNG/SVG/WebP data URL)
 * @property {string} imageBackgroundColor Image-area background (hex); empty = white on screen
 * @property {number} imageZoom Photo crop zoom (1 = cover / 100%; < 1 = zoom out)
 * @property {number} imageOffsetX Photo horizontal offset (fraction)
 * @property {number} imageOffsetY Photo vertical offset (fraction)
 * @property {string} updatedAt ISO
 */

/** Default image background (transparent images). */
export const DEFAULT_IMAGE_BACKGROUND = "#ffffff";

/** Generic image load error (file or URL). */
export const IMAGE_LOAD_ERROR = "Image loading error!";
export const IMAGE_LOAD_ERROR_FORMAT =
  "Image loading error! Invalid format (SVG, PNG, WebP, JPG…).";
export const IMAGE_LOAD_ERROR_CORS =
  "Image loading error! Network or CORS - the source site refuses the load.";
export const IMAGE_URL_INVALID = "The image URL is invalid.";

/** Max side of imported rasters (cards and logos). */
export const IMAGE_MAX_SIDE = 2000;

/** JPEG / WebP quality after canvas resize. */
const IMAGE_ENCODE_QUALITY = 0.88;

/** File picker (cards and logos). */
export const IMAGE_FILE_ACCEPT = "image/*,image/svg+xml,.svg";

/**
 * @typedef {import("./themes-data.js").LegoTheme} LegoTheme
 */

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/** @type {Promise<void>|null} */
let seedPromise = null;

/** Current IndexedDB name (generation to escape a stuck delete/open). */
function getDbName() {
  try {
    const gen = String(localStorage.getItem(DB_GEN_KEY) || "").trim();
    if (gen) return `${DB_NAME_BASE}-${gen}`;
  } catch {
    /* ignore */
  }
  return DB_NAME_BASE;
}

/**
 * Reload query after reset: `?{timestamp}` (legacy `?_=`).
 * Bypasses the HTTP / SW cache of `index.html`.
 * @param {string} [search]
 */
export function isResetReloadQuery(search = typeof location !== "undefined" ? location.search : "") {
  if (!search || search === "?") return false;
  const params = new URLSearchParams(search);
  if (params.has("_")) return true;
  const keys = [...params.keys()];
  return keys.length === 1 && /^\d+$/.test(keys[0]) && params.get(keys[0]) === "";
}

/**
 * Reload query after **Retry** (boot failure): `?r={timestamp}`.
 * Same cache-bust as reset, without the `?{timestamp}` / `?_=` pattern that can
 * repair a stuck IndexedDB.
 * @param {string} [search]
 */
export function isBootRetryQuery(search = typeof location !== "undefined" ? location.search : "") {
  if (!search || search === "?") return false;
  const r = new URLSearchParams(search).get("r");
  return Boolean(r && /^\d+$/.test(r));
}

/**
 * After a buggy reset, the URL often has `?{timestamp}` / `?_=` and the old DB is stuck.
 * Switch to a new generation then (data already wiped anyway).
 */
function repairWedgedDbIfNeeded() {
  try {
    if (localStorage.getItem(DB_GEN_KEY)) return;
    if (typeof location === "undefined") return;
    if (!isResetReloadQuery(location.search)) return;
    localStorage.setItem(DB_GEN_KEY, String(Date.now()));
    deleteDatabaseBestEffort(DB_NAME_BASE);
    deleteDatabaseBestEffort("lego-set-cards");
  } catch {
    /* ignore */
  }
}

/** @returns {string} previous database name */
function bumpDbGeneration() {
  const prev = getDbName();
  const next = String(Date.now());
  try {
    localStorage.setItem(DB_GEN_KEY, next);
  } catch {
    /* ignore */
  }
  return prev;
}

export function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** @param {object} card */
function isValidCard(card) {
  return Boolean(card && typeof card.id === "string" && card.id);
}

/** @param {object} theme */
function isValidTheme(theme) {
  if (!theme || typeof theme.id !== "string") return false;
  const hasName =
    typeof theme.name === "string" || typeof theme.themeName === "string";
  const hasLogoField =
    typeof theme.logoDataUrl === "string" ||
    typeof theme.image === "string" ||
    theme.logoDataUrl === undefined;
  return hasName && hasLogoField;
}

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  if (dbPromise) return dbPromise;

  const dbName = getDbName();

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction;

      if (!db.objectStoreNames.contains(STORE_CARDS)) {
        const store = db.createObjectStore(STORE_CARDS, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("legoSetRef", "legoSetRef", { unique: false });
        store.createIndex("brickcardThemeId", "brickcardThemeId", { unique: false });
      } else if (event.oldVersion < 2 && tx) {
        const store = tx.objectStore(STORE_CARDS);
        if (store.indexNames.contains("legoThemeId")) {
          store.deleteIndex("legoThemeId");
        }
        if (!store.indexNames.contains("brickcardThemeId")) {
          store.createIndex("brickcardThemeId", "brickcardThemeId", { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(STORE_THEMES)) {
        db.createObjectStore(STORE_THEMES, { keyPath: "id" });
      }
    };

    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        try {
          db.close();
        } catch {
          /* ignore */
        }
        if (dbPromise) dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error || new Error(_t("Unable to open IndexedDB")));
    };
  });

  return dbPromise;
}

/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** @param {IDBTransaction} tx */
function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error(_t("Transaction cancelled")));
  });
}

/** Remove the old `lego-set-cards` database / keys. */
let legacyStoragePurged = false;
function purgeLegacyBrowserStorage() {
  if (legacyStoragePurged) return;
  legacyStoragePurged = true;
  try {
    localStorage.removeItem("lego-set-cards:v1");
    localStorage.removeItem("lego-set-cards:theme");
  } catch {
    /* ignore */
  }
  try {
    indexedDB.deleteDatabase("lego-set-cards");
  } catch {
    /* ignore */
  }
}

/** Best-effort: never blocks the caller. */
function deleteDatabaseBestEffort(name) {
  try {
    indexedDB.deleteDatabase(name);
  } catch {
    /* ignore */
  }
}

/**
 * Close the singleton connection if it exists.
 * @returns {Promise<void>}
 */
async function closeDbConnection() {
  const pending = dbPromise;
  dbPromise = null;
  seedPromise = null;
  if (!pending) return;
  try {
    const db = await Promise.race([
      pending,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), 500);
      }),
    ]);
    try {
      db.close();
    } catch {
      /* ignore */
    }
  } catch {
    /* open stuck / error */
  }
}

/**
 * Dev only: wipe IndexedDB + app localStorage (factory reset).
 * Strategy: switch to a new database name (generation) so we never
 * depend on a `deleteDatabase` that can stay stuck forever.
 * Reload the page afterwards to reseed themes from the JSON.
 */
export async function wipeAllLocalData() {
  clearPresetCache();

  const oldDbName = getDbName();
  await closeDbConnection();

  // New generation BEFORE clearing the rest of localStorage
  bumpDbGeneration();

  // Best-effort: clean the old database (may stay stuck — does not matter)
  deleteDatabaseBestEffort(oldDbName);
  deleteDatabaseBestEffort(DB_NAME_BASE);
  deleteDatabaseBestEffort("lego-set-cards");

  try {
    localStorage.removeItem("brickcard:ui-theme");
    localStorage.removeItem("brickcard:ui-locale");
    localStorage.removeItem("brickcard:card-face-border-mm");
    localStorage.removeItem("brickcard:card-radius-mm");
    localStorage.removeItem("brickcard:card-image-radius-mm");
    localStorage.removeItem("brickcard:card-default-color");
    localStorage.removeItem("brickcard:migrate-accent-default-v1");
    localStorage.removeItem("brickcard:migrate-empty-theme-color-v1");
    localStorage.removeItem("brickcard:list-sort");
    localStorage.removeItem("brickcard:list-sort-dir");
    localStorage.removeItem("brickcard:themes-sort");
    localStorage.removeItem("brickcard:themes-sort-dir");
    localStorage.removeItem("brickcard:list-cols-max");
    localStorage.removeItem("brickcard:optimize-images");
    localStorage.removeItem("brickcard:telemetry");
    localStorage.removeItem("brickcard:print-qty");
    localStorage.removeItem("brickcard:print-settings");
    localStorage.removeItem("brickcard:developer-enabled");
    localStorage.removeItem("lego-set-cards:v1");
    localStorage.removeItem("lego-set-cards:theme");
    /* Do not remove DB_GEN_KEY: it is the key of the new empty database. */
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  if (typeof caches !== "undefined" && caches.keys) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
  }
}

/** @param {LegoTheme[]} list */
function sortThemesByName(list) {
  return list.sort((a, b) => a.name.localeCompare(b.name, getLocale()));
}

/** @returns {Promise<Set<string>>} */
async function presetIdSet() {
  const presets = await getPresetThemes();
  return new Set(presets.map((t) => t.id));
}

/**
 * Purge default themes still stored in IndexedDB
 * (they are now read from the JSON only).
 */
async function seedThemesIfNeeded() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const db = await openDb();
    const existing = await reqToPromise(
      db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).getAll()
    );
    const presetIds = await presetIdSet();
    const stale = (existing || []).filter(
      (row) => row && (row.isBuiltin || row.builtin || presetIds.has(row.id))
    );
    if (!stale.length) return;

    const tx = db.transaction(STORE_THEMES, "readwrite");
    const store = tx.objectStore(STORE_THEMES);
    for (const row of stale) store.delete(row.id);
    await txDone(tx);
  })();

  try {
    await seedPromise;
  } catch (err) {
    seedPromise = null;
    throw err;
  }
}

/** @param {object} c @returns {Card} */
function normalizeCard(c) {
  const now = new Date().toISOString();
  const piecesRaw = c.numPieces ?? c.pieceCount ?? c.pieces;
  let numPieces = null;
  if (piecesRaw !== null && piecesRaw !== undefined && piecesRaw !== "") {
    const n = Number(piecesRaw);
    numPieces = Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  }

  const figurinesRaw = c.numFigurines ?? c.figurineCount ?? c.figurines ?? c.minifigCount;
  let numFigurines = null;
  if (figurinesRaw !== null && figurinesRaw !== undefined && figurinesRaw !== "") {
    const n = Number(figurinesRaw);
    numFigurines = Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  }

  const yearRaw = c.releaseYear ?? c.year;
  let releaseYear = null;
  if (yearRaw !== null && yearRaw !== undefined && yearRaw !== "") {
    const y = Number(yearRaw);
    if (Number.isFinite(y)) {
      const rounded = Math.round(y);
      if (rounded >= 1900 && rounded <= 2100) releaseYear = rounded;
    }
  }

  return {
    id: typeof c.id === "string" && c.id ? c.id : createId(),
    legoSetRef: String(c.legoSetRef ?? c.ref ?? "").trim(),
    title: String(c.title ?? c.setTitle ?? "").trim(),
    brickcardThemeId: resolvePresetThemeId(
      c.brickcardThemeId ?? c.legoThemeId ?? c.themeId ?? ""
    ),
    numPieces,
    numFigurines,
    releaseYear,
    imageDataUrl: sanitizeSvgDataUrl(
      String(c.imageDataUrl ?? c.setImageDataUrl ?? c.image ?? "")
    ),
    imageBackgroundColor: normalizeImageBackground(c.imageBackgroundColor),
    imageZoom: roundCropCoord(c.imageZoom ?? c.zoom) || 1,
    imageOffsetX: roundCropCoord(c.imageOffsetX ?? c.offsetX),
    imageOffsetY: roundCropCoord(c.imageOffsetY ?? c.offsetY),
    updatedAt: c.updatedAt || c.createdAt || now,
  };
}

/** @param {object} t @returns {LegoTheme} */
function normalizeTheme(t) {
  return {
    id: typeof t.id === "string" && t.id ? t.id : createId(),
    name: String(t.name ?? t.themeName ?? "").trim() || _t("THEME"),
    color: parseHexColor(t.color ?? t.accentColor),
    secondaryColor: parseHexColor(t.secondaryColor),
    logoDataUrl: sanitizeSvgDataUrl(String(t.logoDataUrl ?? t.image ?? "")),
    logoZoom: clampLogoZoom(t.logoZoom),
    logoOffsetX: roundCropCoord(t.logoOffsetX),
    logoOffsetY: roundCropCoord(t.logoOffsetY),
    isBuiltin: Boolean(t.isBuiltin ?? t.builtin),
    updatedAt: String(t.updatedAt || t.createdAt || "").trim(),
  };
}

/**
 * Normalize an image background color: valid hex or empty string.
 * Display uses `DEFAULT_IMAGE_BACKGROUND` if empty.
 * @param {string} [hex]
 * @returns {string}
 */
export function normalizeImageBackground(hex) {
  const raw = String(hex || "").trim();
  if (!raw) return "";
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return "";
}

/** Effective background color for display (white if unset). */
export function resolveImageBackground(hex) {
  return normalizeImageBackground(hex) || DEFAULT_IMAGE_BACKGROUND;
}

/** Open the DB without waiting for theme seed (fast list / empty display). */
async function openDbReady() {
  purgeLegacyBrowserStorage();
  repairWedgedDbIfNeeded();
  await openDb();
}

async function ready() {
  await openDbReady();
  await seedThemesIfNeeded();
}

/** @returns {Promise<Card[]>} */
export async function loadCards() {
  await openDbReady();
  const db = await openDb();
  const rows = await reqToPromise(
    db.transaction(STORE_CARDS, "readonly").objectStore(STORE_CARDS).getAll()
  );
  return (rows || [])
    .filter(isValidCard)
    .map(normalizeCard)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

/** @param {Card[]} cards */
export async function saveCards(cards) {
  await ready();
  const db = await openDb();
  const tx = db.transaction(STORE_CARDS, "readwrite");
  const store = tx.objectStore(STORE_CARDS);
  store.clear();
  for (const card of cards) {
    if (isValidCard(card)) store.put(normalizeCard(card));
  }
  try {
    await txDone(tx);
  } catch (err) {
    const msg =
      err && err.name === "QuotaExceededError"
        ? _t("Not enough browser storage space to save the cards.")
        : _t("Unable to save the cards.");
    throw new Error(msg);
  }
}

/**
 * @param {Omit<Card, "id" | "updatedAt"> & { id?: string }} input
 * @returns {Promise<Card>}
 */
export async function upsertCard(input) {
  await ready();
  const db = await openDb();
  const now = new Date().toISOString();
  const id = input.id || createId();

  const card = normalizeCard({
    ...input,
    id,
    updatedAt: now,
  });

  const tx = db.transaction(STORE_CARDS, "readwrite");
  tx.objectStore(STORE_CARDS).put(card);
  try {
    await txDone(tx);
  } catch (err) {
    const msg =
      err && err.name === "QuotaExceededError"
        ? _t("Not enough browser storage space to save this card.")
        : _t("Unable to save the card.");
    throw new Error(msg);
  }
  return card;
}

/** @param {string} id @returns {Promise<Card[]>} */
export async function deleteCard(id) {
  await ready();
  const db = await openDb();
  const tx = db.transaction(STORE_CARDS, "readwrite");
  tx.objectStore(STORE_CARDS).delete(id);
  await txDone(tx);
  return loadCards();
}

/** Clear the cards store only (themes and settings unchanged). */
export async function deleteAllCards() {
  await ready();
  const db = await openDb();
  const tx = db.transaction(STORE_CARDS, "readwrite");
  tx.objectStore(STORE_CARDS).clear();
  await txDone(tx);
}

/** @param {string} id @returns {Promise<Card|null>} */
export async function getCard(id) {
  await ready();
  const db = await openDb();
  const card = await reqToPromise(
    db.transaction(STORE_CARDS, "readonly").objectStore(STORE_CARDS).get(id)
  );
  return isValidCard(card) ? normalizeCard(card) : null;
}

/** @returns {Promise<LegoTheme[]>} custom IndexedDB themes (without default themes) */
export async function loadCustomThemes() {
  await ready();
  const db = await openDb();
  const rows = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).getAll()
  );
  const presetIds = await presetIdSet();
  return sortThemesByName(
    (rows || [])
      .filter(isValidTheme)
      .map(normalizeTheme)
      .filter((t) => !t.isBuiltin && !presetIds.has(t.id))
      .map((t) => ({ ...t, isBuiltin: false }))
  );
}

/** Custom (alpha) then default themes (alpha). */
export async function loadThemes() {
  const [custom, presets] = await Promise.all([
    loadCustomThemes(),
    getPresetThemes(),
  ]);
  return [...custom, ...sortThemesByName([...presets])];
}

/** @param {string} id @returns {Promise<LegoTheme|null>} */
export async function getTheme(id) {
  if (!id) return null;
  const preset = await getPresetTheme(id);
  if (preset) return preset;
  await ready();
  const db = await openDb();
  const theme = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(id)
  );
  if (!isValidTheme(theme)) return null;
  const normalized = normalizeTheme(theme);
  if (normalized.isBuiltin) return null;
  return { ...normalized, isBuiltin: false };
}

/**
 * @param {Partial<LegoTheme> & { id?: string }} input
 * @returns {Promise<LegoTheme>}
 */
export async function upsertTheme(input) {
  await ready();
  const presetIds = await presetIdSet();
  const id = input.id || createId();
  if (presetIds.has(id)) {
    throw new Error(_t("Default themes cannot be modified."));
  }

  const db = await openDb();
  const existing = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(id)
  );
  if (existing && (existing.isBuiltin || existing.builtin)) {
    throw new Error(_t("Default themes cannot be modified."));
  }

  const logoDataUrl = String(input.logoDataUrl ?? input.image ?? "");
  const color = parseHexColor(input.color ?? input.accentColor);
  const secondaryColor = parseHexColor(input.secondaryColor);
  const now = new Date().toISOString();

  const theme = normalizeTheme({
    ...input,
    id,
    logoDataUrl,
    color,
    secondaryColor,
    isBuiltin: false,
    updatedAt: now,
  });

  if (!theme.name) {
    throw new Error(_t("The theme name is required."));
  }

  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).put(theme);
  await txDone(tx);
  return theme;
}

/**
 * Clear `brickcardThemeId` on cards associated with any of the themes.
 * @param {Iterable<string>} themeIds
 */
async function clearCardsThemeAssociation(themeIds) {
  const idSet =
    themeIds instanceof Set ? themeIds : new Set([...themeIds].filter(Boolean));
  if (!idSet.size) return;
  const cards = await loadCards();
  const changed = cards.filter((c) => idSet.has(c.brickcardThemeId));
  if (!changed.length) return;
  const db = await openDb();
  const tx = db.transaction(STORE_CARDS, "readwrite");
  const store = tx.objectStore(STORE_CARDS);
  for (const card of changed) {
    store.put({ ...card, brickcardThemeId: "" });
  }
  await txDone(tx);
}

/** Delete a custom theme only. */
export async function deleteTheme(id) {
  await ready();
  if (await getPresetTheme(id)) {
    throw new Error(_t("Default themes cannot be deleted."));
  }
  const db = await openDb();
  const existing = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(id)
  );
  if (!existing) return;
  if (existing.isBuiltin || existing.builtin) {
    throw new Error(_t("Default themes cannot be deleted."));
  }
  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).delete(id);
  await txDone(tx);
  await clearCardsThemeAssociation([id]);
}

/** Delete all custom themes and detach associated cards. */
export async function deleteAllCustomThemes() {
  await ready();
  const custom = await loadCustomThemes();
  if (!custom.length) return;
  const ids = custom.map((t) => t.id);
  const db = await openDb();
  const tx = db.transaction(STORE_THEMES, "readwrite");
  const store = tx.objectStore(STORE_THEMES);
  for (const id of ids) store.delete(id);
  await txDone(tx);
  await clearCardsThemeAssociation(ids);
}

/**
 * @param {string|object} input
 * @param {"merge"|"replace"|{
 *   mode?: "merge"|"replace",
 *   includeImages?: boolean,
 *   includeThemeLogos?: boolean,
 * }} [modeOrOpts]
 * @returns {Promise<{ imported: number, total: number, themesImported: number, settingsApplied: boolean }>}
 */
export async function importBackup(input, modeOrOpts = "merge") {
  const opts =
    modeOrOpts && typeof modeOrOpts === "object"
      ? modeOrOpts
      : { mode: modeOrOpts };
  const mode = opts.mode === "replace" ? "replace" : "merge";
  const includeImages = opts.includeImages !== false;
  const includeThemeLogos = opts.includeThemeLogos !== false;

  const { parseBrickcardBackup } = await import("./backup.js");
  const data = parseBrickcardBackup(input);
  const incoming = data.cards;
  const incomingThemes = data.themes;

  const valid = incoming.filter(isValidCard).map((c) => normalizeCard(c));

  /** @param {Card} incomingCard @param {Card|undefined} existing */
  function mergeCard(incomingCard, existing) {
    if (includeImages || !existing) return incomingCard;
    return {
      ...incomingCard,
      imageDataUrl: existing.imageDataUrl,
      imageBackgroundColor: existing.imageBackgroundColor,
      imageZoom: existing.imageZoom,
      imageOffsetX: existing.imageOffsetX,
      imageOffsetY: existing.imageOffsetY,
    };
  }

  /** @type {Card[]} */
  let result;
  if (mode === "replace") {
    result = valid;
    await saveCards(result);
  } else if (valid.length) {
    const map = new Map((await loadCards()).map((c) => [c.id, c]));
    for (const card of valid) {
      map.set(card.id, mergeCard(card, map.get(card.id)));
    }
    result = Array.from(map.values()).sort((a, b) =>
      String(b.updatedAt).localeCompare(String(a.updatedAt))
    );
    await saveCards(result);
  } else {
    result = await loadCards();
  }

  const presetIds = await presetIdSet();
  const validThemes = incomingThemes
    .filter(isValidTheme)
    .map(normalizeTheme)
    .filter((t) => !t.isBuiltin && !presetIds.has(t.id))
    .map((t) => ({ ...t, isBuiltin: false }));

  let themesImported = 0;
  if (mode === "replace") {
    await ready();
    const db = await openDb();
    const tx = db.transaction(STORE_THEMES, "readwrite");
    const store = tx.objectStore(STORE_THEMES);
    store.clear();
    for (const theme of validThemes) store.put(theme);
    await txDone(tx);
    themesImported = validThemes.length;
  } else {
    for (const theme of validThemes) {
      let next = theme;
      if (!includeThemeLogos) {
        const existing = await getTheme(theme.id);
        if (existing && !existing.isBuiltin) {
          next = {
            ...theme,
            logoDataUrl: existing.logoDataUrl,
            logoZoom: existing.logoZoom,
            logoOffsetX: existing.logoOffsetX,
            logoOffsetY: existing.logoOffsetY,
          };
        }
      }
      await upsertTheme(next);
      themesImported += 1;
    }
  }

  const settingsApplied = Boolean(data.settings?.cardAppearance);
  if (settingsApplied) {
    applyCardAppearanceSettings(data.settings.cardAppearance);
  }

  return {
    imported: valid.length,
    total: result.length,
    themesImported,
    settingsApplied,
  };
}

/** @param {string} [type] */
function isSvgMime(type) {
  return /svg/i.test(String(type || ""));
}

/** @param {File|Blob} file */
function isSvgNamedFile(file) {
  if (isSvgMime(file?.type)) return true;
  const name = file && "name" in file ? String(file.name || "") : "";
  return /\.svg$/i.test(name);
}

/** @param {string} text */
function textLooksLikeSvg(text) {
  return /<svg[\s>/]/i.test(String(text || ""));
}

/** @param {Blob} blob */
async function blobLooksLikeSvg(blob) {
  try {
    return textLooksLikeSvg(await blob.slice(0, 2048).text());
  } catch {
    return false;
  }
}

/** @param {File|Blob} file */
async function fileLooksLikeSvg(file) {
  if (isSvgNamedFile(file)) return true;
  return blobLooksLikeSvg(file);
}

/**
 * Strip scripts, event handlers and HTML hosts from an SVG
 * (defense in depth — an `<img>` usually does not run scripts).
 * @param {string} text
 * @returns {string}
 */
function sanitizeSvgMarkup(text) {
  let s = String(text || "");
  s = s.replace(/<[a-zA-Z0-9_-]*:?script\b[^>]*>[\s\S]*?<\/[a-zA-Z0-9_-]*:?script>/gi, "");
  s = s.replace(/<[a-zA-Z0-9_-]*:?script\b[^>]*\/>/gi, "");
  s = s.replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, "");
  s = s.replace(/<(iframe|embed|object)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<(iframe|embed|object)\b[^>]*\/>/gi, "");
  s = s.replace(/\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g, "");
  s = s.replace(
    /(\b(?:href|src|xlink:href)\s*=\s*")\s*(?:javascript:|data:\s*text\/html)[^"]*/gi,
    "$1"
  );
  s = s.replace(
    /(\b(?:href|src|xlink:href)\s*=\s*')\s*(?:javascript:|data:\s*text\/html)[^']*/gi,
    "$1"
  );
  return s;
}

/** @param {string} text */
function encodeSvgMarkup(text) {
  const sanitized = sanitizeSvgMarkup(text);
  if (!sanitized.trim() || !textLooksLikeSvg(sanitized)) {
    throw new Error(_t(IMAGE_LOAD_ERROR));
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitized)}`;
}

/** @param {string} dataUrl */
function decodeSvgDataUrl(dataUrl) {
  const raw = String(dataUrl || "").trim();
  const comma = raw.indexOf(",");
  if (comma < 0) return "";
  const header = raw.slice(5, comma);
  if (!/^image\/svg\+xml/i.test(header)) return "";
  const payload = raw.slice(comma + 1);
  try {
    if (/;base64/i.test(header)) {
      const bin = atob(payload.replace(/\s/g, ""));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    }
    return decodeURIComponent(payload);
  } catch {
    return "";
  }
}

/**
 * If the data URL is an SVG, strip scripts and re-encode.
 * Otherwise leave the value unchanged. Unreadable / script-only SVG → empty.
 * @param {string} dataUrl
 * @returns {string}
 */
function sanitizeSvgDataUrl(dataUrl) {
  const raw = String(dataUrl || "");
  if (!/^data:image\/svg\+xml/i.test(raw.trim())) return raw;
  const decoded = decodeSvgDataUrl(raw);
  if (!decoded) return raw;
  try {
    return encodeSvgMarkup(decoded);
  } catch {
    return "";
  }
}

/** @param {File|Blob} file @returns {Promise<string>} */
function encodeSvgFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(encodeSvgMarkup(String(reader.result || "")));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(_t(IMAGE_LOAD_ERROR)));
      }
    };
    reader.onerror = () => reject(new Error(_t(IMAGE_LOAD_ERROR)));
    reader.readAsText(file);
  });
}

/**
 * Download an image from an http(s) URL and return a File
 * (the URL is not kept — import only).
 * @param {string} urlString
 * @returns {Promise<File>}
 */
export async function fetchImageAsFile(urlString) {
  const raw = String(urlString || "").trim();
  if (!raw) throw new Error(_t(IMAGE_URL_INVALID));

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(_t(IMAGE_URL_INVALID));
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(_t(IMAGE_URL_INVALID));
  }

  let res;
  try {
    res = await fetch(url.href, {
      mode: "cors",
      credentials: "omit",
      cache: "no-cache",
    });
  } catch {
    throw new Error(_t(IMAGE_LOAD_ERROR_CORS));
  }

  if (!res.ok) {
    throw new Error(_t("Image loading error! HTTP %(status)s.", { status: res.status }));
  }

  const blob = await res.blob();
  const pathName = decodeURIComponent(url.pathname.split("/").pop() || "image");
  const headerType = (res.headers.get("content-type") || "").split(";")[0].trim();
  let type = blob.type || headerType || "";
  const looksSvg =
    /\.svg$/i.test(pathName) || isSvgMime(type) || (await blobLooksLikeSvg(blob));

  if (looksSvg) {
    type = "image/svg+xml";
  } else if (!type || type === "application/octet-stream") {
    if (/\.webp$/i.test(pathName)) type = "image/webp";
    else if (/\.png$/i.test(pathName)) type = "image/png";
    else if (/\.jpe?g$/i.test(pathName)) type = "image/jpeg";
    else if (/\.gif$/i.test(pathName)) type = "image/gif";
    else type = "image/png";
  }

  if (!type.startsWith("image/") && type !== "image/svg+xml") {
    throw new Error(_t(IMAGE_LOAD_ERROR_FORMAT));
  }

  const name = pathName.includes(".") ? pathName : `image.${type.split("/")[1] || "png"}`;
  return new File([blob], name, { type });
}

/**
 * Raster source kind: MIME first, then extension.
 * JPEG / WebP / PNG kept; anything else → PNG.
 * @param {File|Blob} file
 * @returns {"jpeg"|"webp"|"png"|"other"}
 */
function rasterSourceKind(file) {
  const type = String(file?.type || "")
    .toLowerCase()
    .split(";")[0]
    .trim();
  const name = file && "name" in file ? String(file.name || "") : "";
  if (type === "image/jpeg" || type === "image/jpg") return "jpeg";
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  if (type.startsWith("image/") && type !== "image/svg+xml") return "other";
  if (/\.jpe?g$/i.test(name)) return "jpeg";
  if (/\.webp$/i.test(name)) return "webp";
  if (/\.png$/i.test(name)) return "png";
  return "other";
}

/** @param {"jpeg"|"webp"|"png"|"other"} kind */
function rasterOutputMime(kind) {
  if (kind === "jpeg") return "image/jpeg";
  if (kind === "webp") return "image/webp";
  return "image/png";
}

/** @param {File|Blob} file @returns {Promise<string>} */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(_t(IMAGE_LOAD_ERROR)));
    reader.readAsDataURL(file);
  });
}

/** @param {string} dataUrl */
function dataUrlMime(dataUrl) {
  const m = /^data:([^;,]+)/i.exec(String(dataUrl || ""));
  return (m?.[1] || "").toLowerCase();
}

/**
 * @param {File|Blob} file
 * @returns {Promise<{ img: HTMLImageElement, width: number, height: number, cleanup: () => void }>}
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (!width || !height) {
        cleanup();
        reject(new Error(_t(IMAGE_LOAD_ERROR)));
        return;
      }
      resolve({ img, width, height, cleanup });
    };
    img.onerror = () => {
      cleanup();
      reject(new Error(_t(IMAGE_LOAD_ERROR)));
    };
    img.src = url;
  });
}

/**
 * @param {HTMLImageElement} img
 * @param {number} width
 * @param {number} height
 * @param {"image/jpeg"|"image/webp"|"image/png"} outputType
 * @param {number} quality
 * @returns {string}
 */
function encodeRasterCanvas(img, width, height, outputType, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(_t(IMAGE_LOAD_ERROR));
  if (outputType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  if (outputType === "image/jpeg") {
    return canvas.toDataURL("image/jpeg", quality);
  }
  if (outputType === "image/webp") {
    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (dataUrlMime(dataUrl) === "image/webp") return dataUrl;
    return dataUrlMime(dataUrl) === "image/png" ? dataUrl : canvas.toDataURL("image/png");
  }
  return canvas.toDataURL("image/png");
}

/**
 * Compress a File/Blob image to a data URL (cards and logos).
 * SVG: kept as vectors, scripts stripped.
 * If “Optimize images”: rasters → WebP (max side 2000; PNG fallback).
 * Else: JPEG / WebP / PNG kept if they fit in 2000 px, otherwise resized
 * (same format; WebP → PNG if canvas encoding fails); anything else → PNG.
 * @param {File|Blob} file
 * @param {{ maxSize?: number, quality?: number }} [opts]
 * @returns {Promise<string>}
 */
export async function compressImage(file, opts = {}) {
  if (await fileLooksLikeSvg(file)) {
    return encodeSvgFile(file);
  }

  const maxSize = opts.maxSize ?? IMAGE_MAX_SIDE;
  const quality = opts.quality ?? IMAGE_ENCODE_QUALITY;
  const optimize = getOptimizeImages();
  const kind = rasterSourceKind(file);
  const loaded = await loadImageFromFile(file);
  const { img, cleanup } = loaded;
  try {
    const needsResize = Math.max(loaded.width, loaded.height) > maxSize;
    if (!optimize && !needsResize && kind !== "other") {
      cleanup();
      return fileToDataUrl(file);
    }
    const scale = Math.min(1, maxSize / Math.max(loaded.width, loaded.height));
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const outputType = optimize ? "image/webp" : rasterOutputMime(kind);
    const dataUrl = encodeRasterCanvas(img, width, height, outputType, quality);
    cleanup();
    return dataUrl;
  } catch (err) {
    cleanup();
    throw err instanceof Error ? err : new Error(_t(IMAGE_LOAD_ERROR));
  }
}
