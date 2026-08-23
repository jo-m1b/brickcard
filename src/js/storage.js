/**
 * Persistance IndexedDB (cartes + thèmes personnalisés) + import `.brickcard`.
 * Les thèmes par défaut viennent du JSON, pas d’IndexedDB.
 * Format / export : `backup.js`.
 */

import { getPresetThemes, getPresetTheme, parseHexColor, clearPresetCache, clampLogoZoom, roundCropCoord } from "./themes-data.js";
import { applyCardAppearanceSettings } from "./card-design.js";
import { parseBrickcardBackup } from "./backup.js";
import { APP_ID } from "./version.js?v=0.8.0";

const DB_NAME_BASE = APP_ID;
const DB_GEN_KEY = `${APP_ID}:db-gen`;
const DB_VERSION = 2;
const STORE_CARDS = "cards";
const STORE_THEMES = "themes";
export { isBrickcardBackupFilename, parseBrickcardBackup } from "./backup.js";

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} legoSetRef Référence set (ex. "6140/6109")
 * @property {string} title Titre de la Brickcard (`\n` = saut de ligne)
 * @property {string} brickcardThemeId Id du thème Brickcard associé
 * @property {number|null} pieceCount Nombre de pièces
 * @property {number|null} figurineCount Nombre de figurines (optionnel)
 * @property {number|null} releaseYear Année de sortie (optionnel)
 * @property {string} imageDataUrl Photo (data URL JPEG/PNG/SVG)
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
 * Query de rechargement après reset : `?{timestamp}` (legacy `?_=`).
 * Sert à contourner le cache HTTP / SW de `index.html`.
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
 * Après un reset buggé, l’URL a souvent `?{timestamp}` / `?_=` et la base historique est coincée.
 * On bascule alors sur une nouvelle génération (données déjà vidées de toute façon).
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

/** Supprime l’ancienne base / clés `lego-set-cards`. */
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
    localStorage.removeItem("brickcard:ui-theme");
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
    localStorage.removeItem("brickcard:print-qty");
    localStorage.removeItem("brickcard:print-settings");
    localStorage.removeItem("brickcard:developer-enabled");
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
    name: String(t.name ?? t.themeName ?? "").trim() || "THÈME",
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
 * Retire scripts, gestionnaires d’événements et hôtes HTML d’un SVG
 * (défense en profondeur — un `<img>` n’exécute en général pas les scripts).
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
    throw new Error(IMAGE_LOAD_ERROR);
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
 * Si la data URL est un SVG, retire les scripts et ré-encode.
 * Sinon laisse la valeur inchangée. SVG illisible / uniquement script → vide.
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
        reject(err instanceof Error ? err : new Error(IMAGE_LOAD_ERROR));
      }
    };
    reader.onerror = () => reject(new Error(IMAGE_LOAD_ERROR));
    reader.readAsText(file);
  });
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
    throw new Error(IMAGE_LOAD_ERROR_FORMAT);
  }

  const name = pathName.includes(".") ? pathName : `image.${type.split("/")[1] || "png"}`;
  return new File([blob], name, { type });
}

/**
 * Compresse une image File/Blob en data URL.
 * SVG : conservé en vectoriel (scripts retirés). Rasters : JPEG, ou PNG si alpha.
 * @param {File|Blob} file
 * @param {{ maxSize?: number, quality?: number }} [opts]
 * @returns {Promise<string>}
 */
export async function compressImage(file, opts = {}) {
  if (await fileLooksLikeSvg(file)) {
    return encodeSvgFile(file);
  }

  const maxSize = opts.maxSize ?? 1600;
  const quality = opts.quality ?? 0.88;
  const keepAlpha =
    /image\/(png|webp)/i.test(file.type || "") ||
    /\.(png|webp)$/i.test(file.name || "");

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
 * Logo de thème : SVG conservé en vectoriel (scripts retirés) ;
 * PNG (et autres rasters) compressés en PNG transparent.
 * @param {File} file
 * @returns {Promise<string>} data URL
 */
export async function compressThemeImage(file) {
  if (await fileLooksLikeSvg(file)) {
    return encodeSvgFile(file);
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
