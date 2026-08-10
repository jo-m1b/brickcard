/**
 * Persistance IndexedDB (cartes + thèmes) + export/import JSON.
 * Seed des thèmes LEGO prédéfinis au premier lancement.
 */

import { getPresetThemes, getPresetTheme, parseHexColor, isLocalDevHost, clearPresetCache } from "./themes-data.js";

const DB_NAME = "brickcard-generator";
const DB_VERSION = 2;
const STORE_CARDS = "cards";
const STORE_THEMES = "themes";
const EXPORT_VERSION = 3;

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} legoSetRef Référence set (ex. "6140/6109")
 * @property {string} title Titre de la Brickcard (`\n` = saut de ligne)
 * @property {string} description Legacy / import (plus édité dans l’UI)
 * @property {string} brickcardThemeId Id du thème Brickcard associé
 * @property {number|null} pieceCount Nombre de pièces
 * @property {number|null} figurineCount Nombre de figurines (optionnel)
 * @property {number|null} releaseYear Année de sortie (optionnel)
 * @property {string} imageDataUrl Photo (data URL JPEG/PNG)
 * @property {string} imageBackgroundColor Fond derrière l’image (hex) ; vide = blanc à l’affichage
 * @property {number} imageZoom Zoom de cadrage photo (1 = cover / 100 % ; < 1 = dézoom)
 * @property {number} imageOffsetX Décalage horizontal photo (fraction)
 * @property {number} imageOffsetY Décalage vertical photo (fraction)
 * @property {string} createdAt ISO
 * @property {string} updatedAt ISO
 */

/** Fond image par défaut (images transparentes). */
export const DEFAULT_IMAGE_BACKGROUND = "#ffffff";

/**
 * @typedef {import("./themes-data.js").LegoTheme} LegoTheme
 */

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/** @type {Promise<void>|null} */
let seedPromise = null;

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
    typeof theme.themeName === "string" || typeof theme.name === "string";
  const hasLogoField =
    typeof theme.logoDataUrl === "string" ||
    typeof theme.image === "string" ||
    theme.logoDataUrl === undefined;
  return hasName && hasLogoField;
}

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

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

    req.onsuccess = () => resolve(req.result);
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
function purgeLegacyBrowserStorage() {
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

/** @param {string} name */
function deleteDatabase(name) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`Suppression ${name} impossible`));
    // Connexion encore ouverte ailleurs : on attend un peu puis on continue
    req.onblocked = () => {
      setTimeout(() => resolve(), 400);
    };
  });
}

/**
 * Dev only : vide IndexedDB + localStorage liés à l’app (retour usine).
 * Recharger la page ensuite pour reseeder les thèmes depuis le JSON.
 */
export async function wipeAllLocalData() {
  clearPresetCache();
  seedPromise = null;

  // 1) Vider les stores pendant que la connexion est ouverte (fiable)
  try {
    const db = await openDb();
    const tx = db.transaction([STORE_CARDS, STORE_THEMES], "readwrite");
    tx.objectStore(STORE_CARDS).clear();
    tx.objectStore(STORE_THEMES).clear();
    await txDone(tx);
    db.close();
  } catch {
    /* ignore */
  }
  dbPromise = null;

  // 2) Supprimer complètement les bases
  await deleteDatabase(DB_NAME);
  await deleteDatabase("lego-set-cards");

  try {
    localStorage.removeItem("brickcard-generator:ui-theme");
    localStorage.removeItem("brickcard-generator:card-face-border-mm");
    localStorage.removeItem("brickcard-generator:card-radius-mm");
    localStorage.removeItem("brickcard-generator:card-default-color");
    localStorage.removeItem("brickcard-generator:migrate-accent-default-v1");
    localStorage.removeItem("brickcard-generator:migrate-empty-theme-color-v1");
    localStorage.removeItem("brickcard-generator:list-sort");
    localStorage.removeItem("brickcard-generator:list-sort-dir");
    localStorage.removeItem("brickcard-generator:list-cols-max");
    localStorage.removeItem("brickcard-generator:print-qty");
    localStorage.removeItem("lego-set-cards:v1");
    localStorage.removeItem("lego-set-cards:theme");
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

/**
 * Insère les thèmes prédéfinis manquants.
 * Ne réécrit pas un thème déjà présent (conserve les couleurs / logos personnalisés).
 * Migration one-shot éventuelle : réécrit les builtins depuis le JSON.
 * En local : retire aussi les builtins absents du JSON.
 */
async function seedThemesIfNeeded() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const db = await openDb();
    const existing = await reqToPromise(
      db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).getAll()
    );
    const presets = await getPresetThemes();
    const presetIds = new Set(presets.map((t) => t.id));
    const have = new Set((existing || []).map((t) => t.id));

    const MIGRATE_EMPTY_COLOR_KEY = "brickcard-generator:migrate-empty-theme-color-v1";
    let needEmptyColorMigrate = false;
    try {
      needEmptyColorMigrate = !localStorage.getItem(MIGRATE_EMPTY_COLOR_KEY);
    } catch {
      /* ignore */
    }

    const tx = db.transaction(STORE_THEMES, "readwrite");
    const store = tx.objectStore(STORE_THEMES);

    if (needEmptyColorMigrate) {
      for (const preset of presets) store.put(preset);
      for (const row of existing || []) {
        if (row.isBuiltin && !presetIds.has(row.id)) store.delete(row.id);
      }
    } else {
      for (const preset of presets) {
        if (!have.has(preset.id)) store.put(preset);
      }
      if (isLocalDevHost()) {
        for (const row of existing || []) {
          if (row.isBuiltin && !presetIds.has(row.id)) store.delete(row.id);
        }
      }
    }

    await txDone(tx);

    if (needEmptyColorMigrate) {
      try {
        localStorage.setItem(MIGRATE_EMPTY_COLOR_KEY, "1");
      } catch {
        /* ignore */
      }
    }
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
    description: String(c.description ?? c.subtitle ?? "").trim(),
    brickcardThemeId: String(
      c.brickcardThemeId ?? c.legoThemeId ?? c.themeId ?? ""
    ).trim(),
    pieceCount,
    figurineCount,
    releaseYear,
    imageDataUrl: String(c.imageDataUrl ?? c.setImageDataUrl ?? c.image ?? ""),
    imageBackgroundColor: normalizeImageBackground(c.imageBackgroundColor),
    imageZoom: Number(c.imageZoom ?? c.zoom) || 1,
    imageOffsetX: Number(c.imageOffsetX ?? c.offsetX) || 0,
    imageOffsetY: Number(c.imageOffsetY ?? c.offsetY) || 0,
    createdAt: c.createdAt || now,
    updatedAt: c.updatedAt || now,
  };
}

/** @param {object} t @returns {LegoTheme} */
function normalizeTheme(t) {
  return {
    id: typeof t.id === "string" && t.id ? t.id : createId(),
    themeName: String(t.themeName ?? t.name ?? "").trim() || "THÈME",
    color: parseHexColor(t.color ?? t.accentColor),
    logoDataUrl: String(t.logoDataUrl ?? t.image ?? ""),
    isBuiltin: Boolean(t.isBuiltin ?? t.builtin),
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

async function ready() {
  purgeLegacyBrowserStorage();
  await openDb();
  await seedThemesIfNeeded();
}

/** @returns {Promise<Card[]>} */
export async function loadCards() {
  await ready();
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
 * @param {Omit<Card, "id" | "createdAt" | "updatedAt"> & { id?: string }} input
 * @returns {Promise<Card>}
 */
export async function upsertCard(input) {
  await ready();
  const db = await openDb();
  const now = new Date().toISOString();
  const id = input.id || createId();

  const existing = await reqToPromise(
    db.transaction(STORE_CARDS, "readonly").objectStore(STORE_CARDS).get(id)
  );

  const card = normalizeCard({
    ...input,
    id,
    createdAt: existing?.createdAt || now,
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

/** @param {string} id @returns {Promise<Card|null>} */
export async function getCard(id) {
  await ready();
  const db = await openDb();
  const card = await reqToPromise(
    db.transaction(STORE_CARDS, "readonly").objectStore(STORE_CARDS).get(id)
  );
  return isValidCard(card) ? normalizeCard(card) : null;
}

/** @returns {Promise<LegoTheme[]>} */
export async function loadThemes() {
  await ready();
  const db = await openDb();
  const rows = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).getAll()
  );
  return (rows || [])
    .filter(isValidTheme)
    .map(normalizeTheme)
    .sort((a, b) => a.themeName.localeCompare(b.themeName, "fr"));
}

/** @param {string} id @returns {Promise<LegoTheme|null>} */
export async function getTheme(id) {
  if (!id) return null;
  await ready();
  const db = await openDb();
  const theme = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(id)
  );
  return isValidTheme(theme) ? normalizeTheme(theme) : null;
}

/**
 * @param {Partial<LegoTheme> & { id?: string }} input
 * @returns {Promise<LegoTheme>}
 */
export async function upsertTheme(input) {
  await ready();
  const db = await openDb();
  const id = input.id || createId();
  const existing = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(id)
  );

  const logoDataUrl = String(input.logoDataUrl ?? input.image ?? "");
  const color = parseHexColor(input.color ?? input.accentColor);

  const theme = normalizeTheme({
    ...input,
    id,
    logoDataUrl,
    color,
    isBuiltin: existing
      ? Boolean(existing.isBuiltin ?? existing.builtin)
      : Boolean(input.isBuiltin ?? input.builtin),
  });

  if (!theme.themeName) {
    throw new Error("Le nom du thème est obligatoire.");
  }

  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).put(theme);
  await txDone(tx);
  return theme;
}

/** Restaure un thème builtin à ses valeurs d'usine. */
export async function resetThemeToPreset(id) {
  const preset = await getPresetTheme(id);
  if (!preset) throw new Error("Ce thème n'est pas un préréglage.");
  await ready();
  const db = await openDb();
  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).put(preset);
  await txDone(tx);
  return preset;
}

/** Supprime un thème custom uniquement. */
export async function deleteTheme(id) {
  await ready();
  const theme = await getTheme(id);
  if (!theme) return;
  if (theme.isBuiltin) {
    throw new Error("Les thèmes prédéfinis ne peuvent pas être supprimés (réinitialise-les plutôt).");
  }
  const db = await openDb();
  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).delete(id);
  await txDone(tx);
}

/** @returns {Promise<{ cards: number, themes: number }>} */
export async function exportToJson() {
  const [cards, themes] = await Promise.all([loadCards(), loadThemes()]);
  const payload = {
    version: EXPORT_VERSION,
    app: "brickcard-generator",
    exportedAt: new Date().toISOString(),
    cards,
    themes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `brickcard-export-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { cards: cards.length, themes: themes.length };
}

/**
 * @param {string|object} input
 * @param {"merge"|"replace"} mode
 * @returns {Promise<{ imported: number, total: number, themesImported: number }>}
 */
export async function importFromJson(input, mode = "merge") {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  let incoming = [];
  let incomingThemes = [];

  if (Array.isArray(data)) {
    incoming = data;
  } else if (data && Array.isArray(data.cards)) {
    incoming = data.cards;
    if (Array.isArray(data.themes)) incomingThemes = data.themes;
  } else {
    throw new Error("Fichier JSON invalide : tableau de cartes ou { cards: [...] } attendu.");
  }

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
    const validThemes = incomingThemes.filter(isValidTheme).map(normalizeTheme);
    if (mode === "replace") {
      // Conserve les builtins manquants, remplace le reste
      await ready();
      const db = await openDb();
      const tx = db.transaction(STORE_THEMES, "readwrite");
      const store = tx.objectStore(STORE_THEMES);
      store.clear();
      for (const preset of await getPresetThemes()) store.put(preset);
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
  if (!raw) throw new Error("Indique une URL d’image.");

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL invalide.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("L’URL doit commencer par http:// ou https://");
  }

  let res;
  try {
    res = await fetch(url.href, {
      mode: "cors",
      credentials: "omit",
      cache: "no-cache",
    });
  } catch {
    throw new Error(
      "Téléchargement impossible (réseau ou CORS : le site source refuse le chargement depuis le navigateur)."
    );
  }

  if (!res.ok) {
    throw new Error(`Téléchargement échoué (HTTP ${res.status}).`);
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
    throw new Error("Le lien ne pointe pas vers une image.");
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
          reject(new Error("Image invalide (dimensions nulles)."));
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
          reject(new Error("Canvas non supporté"));
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
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Impossible de décoder l'image (format non supporté ?)."));
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
          reject(new Error("SVG vide"));
          return;
        }
        resolve(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`);
      };
      reader.onerror = () => reject(new Error("Impossible de lire le SVG"));
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
        if (!ctx) throw new Error("Canvas non supporté");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de charger l'image"));
    };
    img.src = url;
  });
}
