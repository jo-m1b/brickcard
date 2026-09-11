/**
 * Offline Rebrickable catalog (`data/sets-presets.json`) and helpers
 * to draft a card / resolve-or-create a custom theme from a catalog id.
 * Card ↔ theme link stays `brickcardThemeId`; Rebrickable ids are origin only.
 */

import { _t, getLocale } from "./i18n.js";
import { foldCI } from "./includes-ci.js";
import {
  createRebrickableCardId,
  createRebrickableThemeId,
  loadThemes,
  parseRebrickableSetId,
  upsertTheme,
} from "./storage.js";
import { isLocalDevHost, parseRebrickableThemeId } from "./themes-data.js";

const CATALOG_URL = "data/sets-presets.json";

/**
 * @typedef {Object} CatalogTheme
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} CatalogSet
 * @property {string} id Rebrickable `set_num` (includes `-\d+` suffix)
 * @property {string} name
 * @property {number|null} numPieces
 * @property {number|null} numFigurines
 * @property {number|null} releaseYear
 * @property {number|null} themeId
 */

/**
 * @typedef {CatalogSet & { themeName: string }} CatalogSetMatch
 */

/**
 * @typedef {{
 *   set: CatalogSet,
 *   foldId: string,
 *   foldName: string,
 *   foldTheme: string,
 * }} CatalogSetRecord
 */

/**
 * @typedef {{
 *   themes: Map<string, CatalogTheme>,
 *   sets: Map<string, CatalogSet>,
 *   generatedAt: string,
 *   setRecords: CatalogSetRecord[],
 * }} CatalogIndex
 */

/**
 * @typedef {{
 *   items: CatalogSetMatch[],
 *   matchCount: number,
 *   total: number,
 *   generatedAt: string,
 *   needles: string[],
 * }} CatalogSetSearch
 */

/** @type {Promise<CatalogIndex>|null} */
let catalogPromise = null;

/** Printed set number: drop the Rebrickable `-\d+` suffix (`75192-1` → `75192`). */
export function catalogSetRef(setId) {
  return parseRebrickableSetId(setId).replace(/-\d+$/, "");
}

/** @param {string[]} keys @param {unknown} row */
function rowToObject(keys, row) {
  if (!Array.isArray(row)) return null;
  return Object.fromEntries(keys.map((k, i) => [k, row[i]]));
}

/** @param {unknown} raw @returns {number|null} */
function catalogCount(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** @returns {Promise<CatalogIndex>} */
export async function loadSetsPresets() {
  if (catalogPromise) return catalogPromise;

  const url = isLocalDevHost() ? `${CATALOG_URL}?_=${Date.now()}` : CATALOG_URL;
  catalogPromise = fetch(url, {
    cache: isLocalDevHost() ? "no-store" : "default",
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          _t("Unable to load %(url)s (%(status)s)", {
            url: CATALOG_URL,
            status: res.status,
          })
        );
      }
      return res.json();
    })
    .then((data) => {
      const themesKeys = data?.meta?.themesKeys;
      const setsKeys = data?.meta?.setsKeys;
      const themeRows = data?.themes;
      const setRows = data?.sets;
      if (
        !Array.isArray(themesKeys) ||
        !Array.isArray(setsKeys) ||
        !Array.isArray(themeRows) ||
        !Array.isArray(setRows)
      ) {
        throw new Error(_t("sets-presets.json: missing or invalid catalog"));
      }

      /** @type {Map<string, CatalogTheme>} */
      const themes = new Map();
      for (const row of themeRows) {
        const obj = rowToObject(themesKeys, row);
        const id = parseRebrickableThemeId(obj?.id);
        const name = String(obj?.name ?? "").trim();
        if (!id || !name) continue;
        themes.set(String(id), { id, name });
      }

      /** @type {Map<string, CatalogSet>} */
      const sets = new Map();
      /** @type {CatalogSetRecord[]} */
      const setRecords = [];
      for (const row of setRows) {
        const obj = rowToObject(setsKeys, row);
        const id = parseRebrickableSetId(obj?.id);
        if (!id) continue;
        const set = {
          id,
          name: String(obj?.name ?? "").trim(),
          numPieces: catalogCount(obj?.numPieces),
          numFigurines: catalogCount(obj?.numFigurines),
          releaseYear: catalogCount(obj?.releaseYear),
          themeId: parseRebrickableThemeId(obj?.themeId),
        };
        sets.set(id, set);
        const theme = set.themeId ? themes.get(String(set.themeId)) : null;
        setRecords.push({
          set,
          foldId: foldCI(id),
          foldName: foldCI(set.name),
          foldTheme: foldCI(theme?.name || ""),
        });
      }

      const generatedAt =
        typeof data?.meta?.generatedAt === "string" ? data.meta.generatedAt : "";

      return { themes, sets, generatedAt, setRecords };
    })
    .catch((err) => {
      catalogPromise = null;
      throw err;
    });

  return catalogPromise;
}

/** Drop the in-memory catalog (tests / local reset). */
export function clearSetsPresetsCache() {
  catalogPromise = null;
}

/** Folded tokens (AND). Leading `#` on a token is ignored. */
function catalogQueryNeedles(query) {
  const parts = String(query || "")
    .trim()
    .split(/\s+/)
    .map((t) => foldCI(t.replace(/^#+/, "")))
    .filter(Boolean);
  return [...new Set(parts)];
}

/** @param {CatalogSetRecord} rec @param {string[]} needles */
function recordMatchesNeedles(rec, needles) {
  return needles.every(
    (n) =>
      rec.foldId.includes(n) || rec.foldName.includes(n) || rec.foldTheme.includes(n)
  );
}

/**
 * Search the offline catalog (`id`, `name`, and catalog theme name).
 * Space-separated tokens are AND (each must match at least one field).
 * Case and accents ignored; leading `#` on a token is stripped.
 * `items` is the alphabetical prefix (`name`, then `id`); `matchCount` is the
 * full hit count. Empty / whitespace query → no items.
 * @param {unknown} query
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<CatalogSetSearch>}
 */
export async function searchCatalogSets(query, opts = {}) {
  const catalog = await loadSetsPresets();
  const total = catalog.sets.size;
  const generatedAt = catalog.generatedAt;
  const rawLimit = Number(opts.limit);
  const limit = Number.isFinite(rawLimit) ? Math.max(0, Math.round(rawLimit)) : 50;
  const needles = catalogQueryNeedles(query);
  if (!needles.length) {
    return { items: [], matchCount: 0, total, generatedAt, needles };
  }

  /** @type {CatalogSet[]} */
  const matches = [];
  for (const rec of catalog.setRecords) {
    if (recordMatchesNeedles(rec, needles)) matches.push(rec.set);
  }
  const locale = getLocale();
  matches.sort((a, b) => {
    const byName = a.name.localeCompare(b.name, locale, { sensitivity: "base" });
    if (byName) return byName;
    return a.id.localeCompare(b.id, locale, { sensitivity: "base" });
  });

  const matchCount = matches.length;
  /** @type {CatalogSetMatch[]} */
  const items = matches.slice(0, limit).map((set) => {
    const theme = set.themeId ? catalog.themes.get(String(set.themeId)) : null;
    return {
      id: set.id,
      name: set.name,
      numPieces: set.numPieces,
      numFigurines: set.numFigurines,
      releaseYear: set.releaseYear,
      themeId: set.themeId,
      themeName: theme?.name || "",
    };
  });
  return { items, matchCount, total, generatedAt, needles };
}

/** @param {unknown} id @returns {Promise<CatalogSet|null>} */
export async function getCatalogSet(id) {
  const key = parseRebrickableSetId(id);
  if (!key) return null;
  const catalog = await loadSetsPresets();
  return catalog.sets.get(key) || null;
}

/** @param {unknown} id @returns {Promise<CatalogTheme|null>} */
export async function getCatalogTheme(id) {
  const key = parseRebrickableThemeId(id);
  if (!key) return null;
  const catalog = await loadSetsPresets();
  return catalog.themes.get(String(key)) || null;
}

/**
 * First Brickcard theme with this catalog theme id (default themes, then custom).
 * @param {unknown} themeId
 * @returns {Promise<import("./themes-data.js").LegoTheme|null>}
 */
export async function findThemeByRebrickableId(themeId) {
  const id = parseRebrickableThemeId(themeId);
  if (!id) return null;
  const themes = await loadThemes();
  /** @type {import("./themes-data.js").LegoTheme|null} */
  let custom = null;
  for (const theme of themes) {
    if (theme.rebrickableThemeId !== id) continue;
    if (theme.isBuiltin) return theme;
    if (!custom) custom = theme;
  }
  return custom;
}

/**
 * Reuse a Brickcard theme with this catalog id, or create a custom one
 * (name only). Call when persisting a card, not while browsing the catalog.
 * @param {unknown} themeId
 * @returns {Promise<import("./themes-data.js").LegoTheme>}
 */
export async function resolveOrCreateThemeFromRebrickable(themeId) {
  const id = parseRebrickableThemeId(themeId);
  if (!id) {
    throw new Error(
      _t("Unknown Rebrickable theme “%(id)s”", { id: String(themeId ?? "") })
    );
  }
  const existing = await findThemeByRebrickableId(id);
  if (existing) return existing;
  const catalog = await getCatalogTheme(id);
  if (!catalog) {
    throw new Error(_t("Unknown Rebrickable theme “%(id)s”", { id }));
  }
  return upsertTheme({
    id: createRebrickableThemeId(id),
    name: catalog.name,
    rebrickableThemeId: id,
  });
}

/**
 * Card fields from a catalog set (not persisted; does not create a theme).
 * `brickcardThemeId` is set only if a matching theme already exists.
 * @param {unknown} setId
 * @returns {Promise<Omit<import("./storage.js").Card, "updatedAt">>}
 */
export async function cardDraftFromRebrickableSet(setId) {
  const rawId = parseRebrickableSetId(setId);
  const set = await getCatalogSet(rawId);
  if (!set) {
    throw new Error(
      _t("Unknown Rebrickable set “%(id)s”", { id: rawId || String(setId ?? "") })
    );
  }
  const theme = set.themeId
    ? await findThemeByRebrickableId(set.themeId)
    : null;
  return {
    id: createRebrickableCardId(set.id),
    legoSetRef: catalogSetRef(set.id),
    title: set.name,
    brickcardThemeId: theme?.id || "",
    rebrickableSetId: set.id,
    rebrickableThemeId: set.themeId,
    numPieces: set.numPieces,
    numFigurines: set.numFigurines,
    releaseYear: set.releaseYear,
    imageDataUrl: "",
    imageBackgroundColor: "",
    imageZoom: 1,
    imageOffsetX: 0,
    imageOffsetY: 0,
  };
}
