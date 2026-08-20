/**
 * Persistance IndexedDB (cartes + thèmes personnalisés) + export/import `.brickcard`.
 * Les thèmes par défaut viennent du JSON, pas d’IndexedDB.
 */

import { getPresetThemes, getPresetTheme, parseHexColor, clearPresetCache, clampLogoZoom, roundCropCoord } from "./themes-data.js";
import { downloadBlob } from "./card-export.js";
import { APP_ID } from "./version.js";

const DB_NAME_BASE = "brickcard-generator";
const DB_GEN_KEY = "brickcard-generator:db-gen";
const DB_VERSION = 2;
const STORE_CARDS = "cards";
const STORE_THEMES = "themes";
const EXPORT_VERSION = 3;
const BACKUP_EXT = ".brickcard";
const BACKUP_INVALID = "Ce fichier n’est pas une sauvegarde Brickcard valide.";

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} legoSetRef Référence set (ex. "6140/6109")
 * @property {string} title Titre de la Brickcard (`\n` = saut de ligne)
 * @property {string} brickcardThemeId Id du thème Brickcard associé
 * @property {number|null} pieceCount Nombre de pièces
 * @property {number|null} figurineCount Nombre de figurines (optionnel)
 * @property {number|null} releaseYear Année de sortie (optionnel)
 * @property {string} imageDataUrl Photo (data URL JPEG/PNG)
 * @property {string} imageBackgroundColor Fond derrière l’image (hex) ; vide = blanc à l’affichage
 * @property {number} imageZoom Zoom de cadrage photo (1 = cover / 100 % ; < 1 = dézoom)
 * @property {number} imageOffsetX Décalage horizontal photo (fraction)
 * @property {number} imageOffsetY Décalage vertical photo (fraction)
 * @property {string} updatedAt ISO
 */

/** Fond image par défaut (images transparentes). */
export const DEFAULT_IMAGE_BACKGROUND = "#ffffff";

/** Erreur générique de chargement d’image (fichier ou URL). */
export const IMAGE_LOAD_ERROR = "Erreur de chargement de l’image !";
export const IMAGE_LOAD_ERROR_FORMAT = `${IMAGE_LOAD_ERROR} Format invalide (SVG, PNG, WebP, JPG…).`;
export const IMAGE_LOAD_ERROR_CORS = `${IMAGE_LOAD_ERROR} Réseau ou CORS - le site source refuse le chargement.`;
export const IMAGE_URL_INVALID = "L’URL de l’image est invalide.";

/**
 * @typedef {import("./themes-data.js").LegoTheme} LegoTheme
 */

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/** @type {Promise<void>|null} */
let seedPromise = null;

/** Nom IndexedDB courant (génération pour échapper à un delete/open coincé). */
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
 * Après un reset buggé, l’URL a souvent `?_=` et la base historique est coincée.
 * On bascule alors sur une nouvelle génération (données déjà vidées de toute façon).
 */
function repairWedgedDbIfNeeded() {
  try {
    if (localStorage.getItem(DB_GEN_KEY)) return;
    if (typeof location === "undefined") return;
    if (!new URLSearchParams(location.search).has("_")) return;
    localStorage.setItem(DB_GEN_KEY, String(Date.now()));
    deleteDatabaseBestEffort(DB_NAME_BASE);
    deleteDatabaseBestEffort("lego-set-cards");
  } catch {
    /* ignore */
  }
}

/** @returns {string} ancien nom de base */
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
      reject(req.error || new Error("Impossible d'ouvrir IndexedDB"));
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
    tx.onabort = () => reject(tx.error || new Error("Transaction annulée"));
  });
}

/** Supprime l'ancienne base / clés (projet renommé Brickcard Generator). */
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

/** Best-effort : ne bloque jamais le flux appelant. */
function deleteDatabaseBestEffort(name) {
  try {
    indexedDB.deleteDatabase(name);
  } catch {
    /* ignore */
  }
}

/**
 * Ferme la connexion singleton si elle existe.
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
    /* open bloqué / erreur */
  }
}

/**
 * Dev only : vide IndexedDB + localStorage liés à l’app (retour usine).
 * Stratégie : basculer sur un nouveau nom de base (génération) pour ne jamais
 * dépendre d’un `deleteDatabase` qui peut rester bloqué indéfiniment.
 * Recharger la page ensuite pour reseeder les thèmes depuis le JSON.
 */
export async function wipeAllLocalData() {
  clearPresetCache();

  const oldDbName = getDbName();
  await closeDbConnection();

  // Nouvelle génération AVANT de vider le reste du localStorage
  bumpDbGeneration();

  // Best-effort : nettoyer l’ancienne base (peut rester coincée — sans importance)
  deleteDatabaseBestEffort(oldDbName);
  deleteDatabaseBestEffort(DB_NAME_BASE);
  deleteDatabaseBestEffort("lego-set-cards");

  try {
    localStorage.removeItem("brickcard-generator:ui-theme");
    localStorage.removeItem("brickcard-generator:card-face-border-mm");
    localStorage.removeItem("brickcard-generator:card-radius-mm");
    localStorage.removeItem("brickcard-generator:card-image-radius-mm");
    localStorage.removeItem("brickcard-generator:card-default-color");
    localStorage.removeItem("brickcard-generator:migrate-accent-default-v1");
    localStorage.removeItem("brickcard-generator:migrate-empty-theme-color-v1");
    localStorage.removeItem("brickcard-generator:list-sort");
    localStorage.removeItem("brickcard-generator:list-sort-dir");
    localStorage.removeItem("brickcard-generator:themes-sort");
    localStorage.removeItem("brickcard-generator:themes-sort-dir");
    localStorage.removeItem("brickcard-generator:list-cols-max");
    localStorage.removeItem("brickcard-generator:print-qty");
    localStorage.removeItem("brickcard-generator:print-settings");
    localStorage.removeItem("lego-set-cards:v1");
    localStorage.removeItem("lego-set-cards:theme");
    /* Ne pas retirer DB_GEN_KEY : c’est la clé de la nouvelle base vide. */
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
  return list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** @returns {Promise<Set<string>>} */
async function presetIdSet() {
  const presets = await getPresetThemes();
  return new Set(presets.map((t) => t.id));
}

/**
 * Purge les thèmes par défaut encore stockés en IndexedDB
 * (ils se lisent désormais uniquement depuis le JSON).
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
  const piecesRaw = c.pieceCount ?? c.pieces;
  let pieceCount = null;
  if (piecesRaw !== null && piecesRaw !== undefined && piecesRaw !== "") {
    const n = Number(piecesRaw);
    pieceCount = Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  }

  const figurinesRaw = c.figurineCount ?? c.figurines ?? c.minifigCount;
  let figurineCount = null;
  if (figurinesRaw !== null && figurinesRaw !== undefined && figurinesRaw !== "") {
    const n = Number(figurinesRaw);
    figurineCount = Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
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
    brickcardThemeId: String(
      c.brickcardThemeId ?? c.legoThemeId ?? c.themeId ?? ""
    ).trim(),
    pieceCount,
    figurineCount,
    releaseYear,
    imageDataUrl: String(c.imageDataUrl ?? c.setImageDataUrl ?? c.image ?? ""),
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
    name: String(t.name ?? t.themeName ?? "").trim() || "THÈME",
    color: parseHexColor(t.color ?? t.accentColor),
    logoDataUrl: String(t.logoDataUrl ?? t.image ?? ""),
    logoZoom: clampLogoZoom(t.logoZoom),
    logoOffsetX: roundCropCoord(t.logoOffsetX),
    logoOffsetY: roundCropCoord(t.logoOffsetY),
    isBuiltin: Boolean(t.isBuiltin ?? t.builtin),
    updatedAt: String(t.updatedAt || t.createdAt || "").trim(),
  };
}

/**
 * Normalise une couleur de fond image : hex valide ou chaîne vide.
 * L’affichage utilise `DEFAULT_IMAGE_BACKGROUND` si vide.
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

/** Couleur de fond effective pour l’affichage (blanc si non précisée). */
export function resolveImageBackground(hex) {
  return normalizeImageBackground(hex) || DEFAULT_IMAGE_BACKGROUND;
}

/** Ouvre la DB sans attendre le seed des thèmes (affichage liste / empty rapide). */
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
        ? "Espace disque navigateur insuffisant pour enregistrer les cartes."
        : "Impossible d'enregistrer les cartes.";
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
        ? "Espace disque navigateur insuffisant pour enregistrer cette carte."
        : "Impossible d'enregistrer la carte.";
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

/** Vide le store des cartes uniquement (thèmes et réglages inchangés). */
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

/** @returns {Promise<LegoTheme[]>} thèmes personnalisés IndexedDB (sans les thèmes par défaut) */
async function loadCustomThemes() {
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

/** Personnalisés (alpha) puis thèmes par défaut (alpha). */
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
    throw new Error("Les thèmes par défaut ne peuvent pas être modifiés.");
  }

  const db = await openDb();
  const existing = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(id)
  );
  if (existing && (existing.isBuiltin || existing.builtin)) {
    throw new Error("Les thèmes par défaut ne peuvent pas être modifiés.");
  }

  const logoDataUrl = String(input.logoDataUrl ?? input.image ?? "");
  const color = parseHexColor(input.color ?? input.accentColor);
  const now = new Date().toISOString();

  const theme = normalizeTheme({
    ...input,
    id,
    logoDataUrl,
    color,
    isBuiltin: false,
    updatedAt: now,
  });

  if (!theme.name) {
    throw new Error("Le nom du thème est obligatoire.");
  }

  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).put(theme);
  await txDone(tx);
  return theme;
}

/** Supprime un thème personnalisé uniquement. */
export async function deleteTheme(id) {
  await ready();
  if (await getPresetTheme(id)) {
    throw new Error("Les thèmes par défaut ne peuvent pas être supprimés.");
  }
  const db = await openDb();
  const existing = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(id)
  );
  if (!existing) return;
  if (existing.isBuiltin || existing.builtin) {
    throw new Error("Les thèmes par défaut ne peuvent pas être supprimés.");
  }
  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).delete(id);
  await txDone(tx);
}

/** @param {string} [name] */
export function isBrickcardBackupFilename(name) {
  return String(name || "").toLowerCase().endsWith(BACKUP_EXT);
}

/**
 * @param {string|object} input
 * @returns {{ version: number, app: string, cards: unknown[], themes: unknown[] }}
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
  if (!Number.isInteger(backup.version) || /** @type {number} */ (backup.version) < 1) {
    throw new Error(BACKUP_INVALID);
  }
  if (/** @type {number} */ (backup.version) > EXPORT_VERSION) {
    throw new Error(
      `Cette sauvegarde (v${backup.version}) n’est pas compatible avec cette version de l’app.`
    );
  }
  if (!Array.isArray(backup.cards) || !Array.isArray(backup.themes)) {
    throw new Error(BACKUP_INVALID);
  }
  if (!backup.cards.some(isValidCard)) {
    throw new Error("Aucune carte valide trouvée dans le fichier.");
  }
  return {
    version: /** @type {number} */ (backup.version),
    app: /** @type {string} */ (backup.app),
    cards: backup.cards,
    themes: backup.themes,
  };
}

/** @returns {Promise<{ cards: number, themes: number }>} */
export async function exportBackup() {
  const [cards, themes] = await Promise.all([loadCards(), loadCustomThemes()]);
  const payload = {
    version: EXPORT_VERSION,
    app: APP_ID,
    exportedAt: new Date().toISOString(),
    cards,
    themes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `brickcard-export-${stamp}${BACKUP_EXT}`);
  return { cards: cards.length, themes: themes.length };
}

/**
 * @param {string|object} input
 * @param {"merge"|"replace"} mode
 * @returns {Promise<{ imported: number, total: number, themesImported: number }>}
 */
export async function importBackup(input, mode = "merge") {
  const data = parseBrickcardBackup(input);
  const incoming = data.cards;
  const incomingThemes = data.themes;

  const valid = incoming.filter(isValidCard).map((c) => normalizeCard(c));

  if (!valid.length) {
    throw new Error("Aucune carte valide trouvée dans le fichier.");
  }

  /** @type {Card[]} */
  let result;
  if (mode === "replace") {
    result = valid;
  } else {
    const map = new Map((await loadCards()).map((c) => [c.id, c]));
    for (const card of valid) {
      map.set(card.id, card);
    }
    result = Array.from(map.values()).sort((a, b) =>
      String(b.updatedAt).localeCompare(String(a.updatedAt))
    );
  }

  await saveCards(result);

  let themesImported = 0;
  if (incomingThemes.length) {
    const presetIds = await presetIdSet();
    const validThemes = incomingThemes
      .filter(isValidTheme)
      .map(normalizeTheme)
      .filter((t) => !t.isBuiltin && !presetIds.has(t.id))
      .map((t) => ({ ...t, isBuiltin: false }));
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
        await upsertTheme(theme);
        themesImported += 1;
      }
    }
  }

  return { imported: valid.length, total: result.length, themesImported };
}

/**
 * Télécharge une image depuis une URL http(s) et renvoie un File
 * (l’URL n’est pas conservée — uniquement pour import).
 * @param {string} urlString
 * @returns {Promise<File>}
 */
export async function fetchImageAsFile(urlString) {
  const raw = String(urlString || "").trim();
  if (!raw) throw new Error(IMAGE_URL_INVALID);

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(IMAGE_URL_INVALID);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(IMAGE_URL_INVALID);
  }

  let res;
  try {
    res = await fetch(url.href, {
      mode: "cors",
      credentials: "omit",
      cache: "no-cache",
    });
  } catch {
    throw new Error(IMAGE_LOAD_ERROR_CORS);
  }

  if (!res.ok) {
    throw new Error(`${IMAGE_LOAD_ERROR} HTTP ${res.status}.`);
  }

  const blob = await res.blob();
  const pathName = decodeURIComponent(url.pathname.split("/").pop() || "image");
  const looksSvg = /\.svg$/i.test(pathName) || /svg/i.test(blob.type);
  let type = blob.type || "";

  if (!type || type === "application/octet-stream") {
    if (looksSvg) type = "image/svg+xml";
    else if (/\.webp$/i.test(pathName)) type = "image/webp";
    else if (/\.png$/i.test(pathName)) type = "image/png";
    else if (/\.jpe?g$/i.test(pathName)) type = "image/jpeg";
    else if (/\.gif$/i.test(pathName)) type = "image/gif";
    else type = "image/png";
  }

  if (!type.startsWith("image/") && type !== "image/svg+xml") {
    throw new Error(IMAGE_LOAD_ERROR_FORMAT);
  }

  const name = pathName.includes(".") ? pathName : `image.${type.split("/")[1] || "png"}`;
  return new File([blob], name, { type });
}

/**
 * Compresse une image File/Blob en JPEG data URL.
 * @param {File|Blob} file
 * @param {{ maxSize?: number, quality?: number }} [opts]
 * @returns {Promise<string>}
 */
export function compressImage(file, opts = {}) {
  const maxSize = opts.maxSize ?? 1600;
  const quality = opts.quality ?? 0.88;
  const keepAlpha =
    /image\/(png|webp|svg\+xml)/i.test(file.type || "") ||
    /\.(png|webp|svg)$/i.test(file.name || "");

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";

    const cleanup = () => URL.revokeObjectURL(url);

    img.onload = () => {
      try {
        let { naturalWidth: width, naturalHeight: height } = img;
        if (!width || !height) {
          width = img.width;
          height = img.height;
        }
        if (!width || !height) {
          cleanup();
          reject(new Error(IMAGE_LOAD_ERROR));
          return;
        }

        const scale = Math.min(1, maxSize / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error(IMAGE_LOAD_ERROR));
          return;
        }
        if (keepAlpha) {
          ctx.clearRect(0, 0, width, height);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = keepAlpha
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", quality);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        reject(new Error(IMAGE_LOAD_ERROR));
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new Error(IMAGE_LOAD_ERROR));
    };
    img.src = url;
  });
}

/**
 * Logo de thème : SVG conservé en vectoriel ; PNG (et autres rasters) compressés en PNG transparent.
 * @param {File} file
 * @returns {Promise<string>} data URL
 */
export function compressThemeImage(file) {
  const isSvg =
    file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");

  if (isSvg) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        if (!text.trim()) {
          reject(new Error(IMAGE_LOAD_ERROR));
          return;
        }
        resolve(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`);
      };
      reader.onerror = () => reject(new Error(IMAGE_LOAD_ERROR));
      reader.readAsText(file);
    });
  }

  const maxSize = 400;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error(IMAGE_LOAD_ERROR);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(url);
        reject(new Error(IMAGE_LOAD_ERROR));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(IMAGE_LOAD_ERROR));
    };
    img.src = url;
  });
}
