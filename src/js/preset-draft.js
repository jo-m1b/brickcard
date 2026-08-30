/**
 * Isolated default-themes draft (developer tool).
 * IndexedDB `brickcard-preset-draft` — never the collection cards / themes
 * stores, nor the UI localStorage keys.
 */

import {
  downloadBlob,
  extFromSrc,
  mimeFromDataUrl,
  slugifyFilename,
} from "./card-export.js";
import {
  clampLogoZoom,
  clearPresetCache,
  loadPresetMeta,
  parseHexColor,
  roundCropCoord,
} from "./themes-data.js";

const DB_NAME = "brickcard-preset-draft";
const DB_VERSION = 1;
const STORE_THEMES = "themes";
const STORE_META = "meta";

/** Relative path from `src/` for a default theme logo. */
const PRESET_LOGO_DIR = "data";

/** kebab-case : `city`, `avatar-the-last-airbender` */
export const PRESET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * @typedef {Object} PresetDraftTheme
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {string} secondaryColor
 * @property {string} logoSrc Original path if the file was not replaced
 * @property {string} logoDataUrl Data URL if a logo was added / replaced; else ""
 * @property {number} logoZoom
 * @property {number} logoOffsetX
 * @property {number} logoOffsetY
 * @property {string} updatedAt ISO; empty until changed since the seed
 */

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

/** @param {string} [id] */
export function isValidPresetId(id) {
  return PRESET_ID_PATTERN.test(String(id || "").trim());
}

/** @param {string} name */
export function suggestPresetId(name) {
  if (!String(name || "").trim()) return "";
  const s = slugifyFilename(name);
  return isValidPresetId(s) ? s : "";
}

/**
 * @param {PresetDraftTheme} theme
 * @returns {string} Path or data URL to display
 */
export function presetDraftLogoUrl(theme) {
  const data = String(theme?.logoDataUrl || "").trim();
  if (data) return data;
  return String(theme?.logoSrc || "").trim().split("?")[0];
}

/**
 * @param {PresetDraftTheme} theme
 * @returns {import("./themes-data.js").LegoTheme}
 */
export function draftToLegoTheme(theme) {
  return {
    id: theme.id,
    name: theme.name,
    color: theme.color,
    secondaryColor: theme.secondaryColor,
    logoDataUrl: presetDraftLogoUrl(theme),
    logoZoom: clampLogoZoom(theme.logoZoom),
    logoOffsetX: roundCropCoord(theme.logoOffsetX),
    logoOffsetY: roundCropCoord(theme.logoOffsetY),
    isBuiltin: false,
    updatedAt: String(theme.updatedAt || "").trim(),
  };
}

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_THEMES)) {
        db.createObjectStore(STORE_THEMES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
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
        dbPromise = null;
      };
      resolve(db);
    };

    req.onerror = () => {
      dbPromise = null;
      reject(req.error || new Error("Unable to open the theme draft"));
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
    tx.onabort = () => reject(tx.error || new Error("Transaction cancelled"));
  });
}

async function closeDb() {
  if (!dbPromise) return;
  try {
    const db = await dbPromise;
    db.close();
  } catch {
    /* ignore */
  }
  dbPromise = null;
}

/** Old path `img/theme-logo-…` → `data/theme-logo-…`. */
function migratePresetLogoSrc(src) {
  const s = String(src || "").trim().split("?")[0];
  if (s.startsWith("img/theme-logo-")) {
    return `${PRESET_LOGO_DIR}/${s.slice("img/".length)}`;
  }
  return s;
}

/** @param {object} t @returns {PresetDraftTheme} */
function normalizeDraft(t) {
  return {
    id: typeof t.id === "string" ? t.id.trim() : "",
    name: String(t.name ?? t.themeName ?? "").trim(),
    color: parseHexColor(t.color ?? t.accentColor),
    secondaryColor: parseHexColor(t.secondaryColor),
    logoSrc: migratePresetLogoSrc(t.logoSrc),
    logoDataUrl: String(t.logoDataUrl || "").trim(),
    logoZoom: clampLogoZoom(t.logoZoom),
    logoOffsetX: roundCropCoord(t.logoOffsetX),
    logoOffsetY: roundCropCoord(t.logoOffsetY),
    updatedAt: String(t.updatedAt || "").trim(),
  };
}

/** @param {import("./themes-data.js").PresetMeta} entry */
function metaToDraft(entry) {
  const logoSrc = entry.logoSrc ? String(entry.logoSrc).split("?")[0] : "";
  return normalizeDraft({
    id: entry.id,
    name: entry.name ?? entry.themeName,
    color: entry.color ?? entry.accentColor,
    secondaryColor: entry.secondaryColor,
    logoSrc,
    logoDataUrl: "",
    logoZoom: entry.logoZoom,
    logoOffsetX: entry.logoOffsetX,
    logoOffsetY: entry.logoOffsetY,
    updatedAt: "",
  });
}

/** @param {IDBDatabase} db */
async function isSeeded(db) {
  if (!db.objectStoreNames.contains(STORE_META)) return false;
  const row = await reqToPromise(
    db.transaction(STORE_META, "readonly").objectStore(STORE_META).get("state")
  );
  return Boolean(row && row.seeded);
}

/** @param {IDBDatabase} db */
async function seedFromJson(db) {
  clearPresetCache();
  const meta = await loadPresetMeta();
  const drafts = meta.map(metaToDraft).filter((t) => t.id && t.name);
  const tx = db.transaction([STORE_THEMES, STORE_META], "readwrite");
  const themeStore = tx.objectStore(STORE_THEMES);
  for (const d of drafts) themeStore.put(d);
  tx.objectStore(STORE_META).put({
    key: "state",
    seeded: true,
    seededAt: new Date().toISOString(),
  });
  await txDone(tx);
  return drafts;
}

/** @returns {Promise<PresetDraftTheme[]>} */
export async function loadPresetDraftThemes() {
  const db = await openDb();
  if (await isSeeded(db)) {
    const rows = await reqToPromise(
      db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).getAll()
    );
    return (rows || []).map(normalizeDraft).filter((t) => t.id);
  }
  return seedFromJson(db);
}

/** @param {string} id @returns {Promise<PresetDraftTheme|null>} */
export async function getPresetDraftTheme(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  const db = await openDb();
  const row = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(key)
  );
  return row ? normalizeDraft(row) : null;
}

/**
 * @param {PresetDraftTheme} theme
 * @param {{ previousId?: string }} [opts]
 */
export async function upsertPresetDraftTheme(theme, opts = {}) {
  const next = normalizeDraft({
    ...theme,
    updatedAt: new Date().toISOString(),
  });
  if (!next.id || !isValidPresetId(next.id)) {
    throw new Error("Invalid identifier (kebab-case slug, e.g. city).");
  }
  if (!next.name) {
    throw new Error("The name is required.");
  }

  const db = await openDb();
  const previousId = String(opts.previousId || "").trim();
  const colliding = await reqToPromise(
    db.transaction(STORE_THEMES, "readonly").objectStore(STORE_THEMES).get(next.id)
  );
  if (colliding && colliding.id !== previousId) {
    throw new Error(`The identifier “${next.id}” already exists.`);
  }

  const tx = db.transaction(STORE_THEMES, "readwrite");
  const store = tx.objectStore(STORE_THEMES);
  if (previousId && previousId !== next.id) {
    store.delete(previousId);
  }
  store.put(next);
  await txDone(tx);
  return next;
}

/** @param {string} id */
export async function deletePresetDraftTheme(id) {
  const key = String(id || "").trim();
  if (!key) return;
  const db = await openDb();
  const tx = db.transaction(STORE_THEMES, "readwrite");
  tx.objectStore(STORE_THEMES).delete(key);
  await txDone(tx);
}

/** Delete the draft then re-seed from `themes-presets.json`. */
export async function resetPresetDraft() {
  await closeDb();
  await new Promise((resolve, reject) => {
    let done = false;
    /** @param {unknown} [err] */
    const finish = (err) => {
      if (done) return;
      done = true;
      if (err) reject(err);
      else resolve();
    };
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => finish();
    req.onerror = () =>
      finish(req.error || new Error("Unable to delete the theme draft"));
    req.onblocked = () => {
      setTimeout(() => finish(), 300);
    };
  });
  return loadPresetDraftThemes();
}

/** @param {PresetDraftTheme} theme */
export function presetDraftLogoExt(theme) {
  const data = String(theme.logoDataUrl || "").trim();
  if (data.startsWith("data:")) return mimeFromDataUrl(data).ext;
  if (data) return extFromSrc(data) || "";
  return extFromSrc(theme.logoSrc) || "";
}

/** @param {PresetDraftTheme} theme */
function toPresetMeta(theme) {
  /** @type {import("./themes-data.js").PresetMeta} */
  const out = { id: theme.id, name: theme.name };
  const ext = presetDraftLogoExt(theme);
  if (ext) out.logoSrc = `${PRESET_LOGO_DIR}/theme-logo-${theme.id}.${ext}`;
  if (theme.color) out.color = theme.color;
  if (theme.secondaryColor) out.secondaryColor = theme.secondaryColor;
  const zoom = clampLogoZoom(theme.logoZoom);
  if (zoom !== 0 && zoom !== 1) out.logoZoom = zoom;
  const ox = roundCropCoord(theme.logoOffsetX);
  const oy = roundCropCoord(theme.logoOffsetY);
  if (ox !== 0) out.logoOffsetX = ox;
  if (oy !== 0) out.logoOffsetY = oy;
  return out;
}

/** @returns {Promise<{ count: number }>} */
export async function downloadPresetDraftJson() {
  const themes = await loadPresetDraftThemes();
  const payload = {
    themes: themes
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id, "en"))
      .map(toPresetMeta),
  };
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, "themes-presets.json");
  return { count: payload.themes.length };
}

/**
 * @param {string} src
 * @returns {Promise<Blob>}
 */
async function srcToBlob(src) {
  const raw = String(src || "").trim();
  if (raw.startsWith("data:")) {
    const res = await fetch(raw);
    return res.blob();
  }
  const res = await fetch(raw.split("?")[0], { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.blob();
}

/** @returns {Promise<{ ok: number, skipped: number }>} */
export async function downloadPresetDraftLogos() {
  const themes = await loadPresetDraftThemes();
  /** @type {{ name: string, blob: Blob }[]} */
  const files = [];
  let skipped = 0;

  for (const theme of themes) {
    const src = presetDraftLogoUrl(theme);
    const ext = presetDraftLogoExt(theme);
    if (!src || !ext) {
      if (src || ext) skipped += 1;
      continue;
    }
    try {
      const blob = await srcToBlob(src);
      files.push({ name: `theme-logo-${theme.id}.${ext}`, blob });
    } catch {
      skipped += 1;
    }
  }

  for (const file of files) {
    downloadBlob(file.blob, file.name);
  }

  return { ok: files.length, skipped };
}
