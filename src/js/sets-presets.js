/**
 * Offline Rebrickable catalog (`data/sets-presets.json`) and helpers
 * to draft a card / resolve-or-create a custom theme from a catalog id.
 * Card ↔ theme link stays `brickcardThemeId`; Rebrickable ids are origin only.
 */

import { _t, getLocale } from "./i18n.js";
import { foldCI, queryNeedles } from "./includes-ci.js";
import {
  createId,
  createRebrickableThemeId,
  getTheme,
  loadThemes,
  parseRebrickableSetId,
  upsertTheme,
} from "./storage.js";
import { getPresetThemes, isLocalDevHost, parseRebrickableThemeId } from "./themes-data.js";

const CATALOG_URL = "data/sets-presets.json";

/**
 * @typedef {Object} CatalogTheme
 * @property {number} id
 * @property {string} name
 * @property {number|null} parentId Rebrickable parent theme id; null if unset
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
 * @typedef {CatalogSet & { themeName: string, themePath: string }} CatalogSetMatch
 */

/**
 * @typedef {CatalogTheme & { path: string }} CatalogThemeMatch
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
 *   setsImageUrl: string,
 *   setRecords: CatalogSetRecord[],
 * }} CatalogIndex
 */

/**
 * @typedef {{
 *   items: CatalogSetMatch[],
 *   matchCount: number,
 *   total: number,
 *   generatedAt: string,
 *   setsImageUrl: string,
 *   needles: string[],
 * }} CatalogSetSearch
 */

/**
 * @typedef {{
 *   items: CatalogThemeMatch[],
 *   matchCount: number,
 *   total: number,
 *   generatedAt: string,
 *   needles: string[],
 * }} CatalogThemeSearch
 */

/** @type {Promise<CatalogIndex>|null} */
let catalogPromise = null;

/** Printed set number: drop the Rebrickable `-\d+` suffix (`75192-1` → `75192`). */
export function catalogSetRef(setId) {
  return parseRebrickableSetId(setId).replace(/-\d+$/, "");
}

/**
 * Remote set image URL from `meta.setsImageUrl`.
 * `{id}` is the catalog `set_num` in lowercase (`75192-1`, `k10124-1`).
 * @param {unknown} setId
 * @param {string} [template]
 */
export function catalogSetImageUrl(setId, template = "") {
  const id = parseRebrickableSetId(setId);
  const pattern = typeof template === "string" ? template : "";
  if (!id || !pattern.includes("{id}")) return "";
  return pattern.replaceAll("{id}", id.toLowerCase());
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
        themes.set(String(id), {
          id,
          name,
          parentId: parseRebrickableThemeId(obj?.parentId),
        });
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
        const parent = theme?.parentId ? themes.get(String(theme.parentId)) : null;
        const themeHay = [parent?.name, theme?.name].filter(Boolean).join(" ");
        setRecords.push({
          set,
          foldId: foldCI(id),
          foldName: foldCI(set.name),
          foldTheme: foldCI(themeHay),
        });
      }

      const generatedAt =
        typeof data?.meta?.generatedAt === "string" ? data.meta.generatedAt : "";
      const setsImageUrl =
        typeof data?.meta?.setsImageUrl === "string" ? data.meta.setsImageUrl : "";

      return { themes, sets, generatedAt, setsImageUrl, setRecords };
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

/**
 * At most two catalog names: `"Parent > Theme"` or `"Theme"`.
 * @param {CatalogTheme|null|undefined} theme
 * @param {Map<string, CatalogTheme>} [themes]
 * @returns {string}
 */
export function catalogThemePathLabel(theme, themes) {
  const name = String(theme?.name || "").trim();
  if (!name) return "";
  const parent = theme.parentId && themes ? themes.get(String(theme.parentId)) : null;
  const parentName = String(parent?.name || "").trim();
  return parentName ? `${parentName} > ${name}` : name;
}

/** @param {CatalogSetRecord} rec @param {string[]} needles */
function recordMatchesNeedles(rec, needles) {
  return needles.every(
    (n) =>
      rec.foldId.includes(n) || rec.foldName.includes(n) || rec.foldTheme.includes(n)
  );
}

/**
 * Search the offline catalog (`id`, `name`, catalog theme name, and
 * immediate parent theme name). Space-separated tokens are AND (each
 * must match at least one field).
 * Case and accents ignored; leading `#` on a token is stripped.
 * `items` is the alphabetical list (`name`, then `id`); `matchCount` is the
 * full hit count. `limit` caps `items` when given; omitted → all hits.
 * Empty / whitespace query → no items.
 * @param {unknown} query
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<CatalogSetSearch>}
 */
export async function searchCatalogSets(query, opts = {}) {
  const catalog = await loadSetsPresets();
  const total = catalog.sets.size;
  const generatedAt = catalog.generatedAt;
  const setsImageUrl = catalog.setsImageUrl;
  const rawLimit = Number(opts.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(0, Math.round(rawLimit))
    : Infinity;
  const needles = queryNeedles(query);
  if (!needles.length) {
    return { items: [], matchCount: 0, total, generatedAt, setsImageUrl, needles };
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
      themePath: catalogThemePathLabel(theme, catalog.themes),
    };
  });
  return { items, matchCount, total, generatedAt, setsImageUrl, needles };
}

/** @param {CatalogTheme} theme @param {Map<string, CatalogTheme>} themes */
function catalogThemeIsRoot(theme, themes) {
  return !theme.parentId || !themes.has(String(theme.parentId));
}

/** @param {string} [exceptThemeId] Brickcard theme id to ignore */
async function takenCatalogThemeIds(exceptThemeId = "") {
  const except = String(exceptThemeId || "").trim();
  /** @type {Set<number>} */
  const taken = new Set();
  const themes = await loadThemes();
  for (const theme of themes) {
    if (except && theme.id === except) continue;
    const id = parseRebrickableThemeId(theme.rebrickableThemeId);
    if (id) taken.add(id);
  }
  return taken;
}

/**
 * Search catalog themes (name + immediate parent name). Space-separated
 * tokens are AND. Case and accents ignored. Roots first, then children;
 * A–Z on `catalogThemePathLabel` within each group.
 * Omits catalog ids already linked to another Brickcard theme
 * (`findThemeByRebrickableId` / `loadThemes`). `exceptThemeId` is the
 * Brickcard theme being edited (its current origin stays available).
 * `total` is the count of still-unlinked catalog themes.
 * Empty / whitespace query → no items.
 * @param {unknown} query
 * @param {{ limit?: number, exceptThemeId?: string }} [opts]
 * @returns {Promise<CatalogThemeSearch>}
 */
export async function searchCatalogThemes(query, opts = {}) {
  const catalog = await loadSetsPresets();
  const generatedAt = catalog.generatedAt;
  const taken = await takenCatalogThemeIds(opts.exceptThemeId);
  /** @type {CatalogTheme[]} */
  const available = [];
  for (const theme of catalog.themes.values()) {
    if (taken.has(theme.id)) continue;
    available.push(theme);
  }
  const total = available.length;
  const rawLimit = Number(opts.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(0, Math.round(rawLimit))
    : Infinity;
  const needles = queryNeedles(query);
  if (!needles.length) {
    return { items: [], matchCount: 0, total, generatedAt, needles };
  }

  /** @type {CatalogTheme[]} */
  const matches = [];
  for (const theme of available) {
    const parent = theme.parentId
      ? catalog.themes.get(String(theme.parentId))
      : null;
    const hay = foldCI([parent?.name, theme.name].filter(Boolean).join(" "));
    if (needles.every((n) => hay.includes(n))) matches.push(theme);
  }
  const locale = getLocale();
  matches.sort((a, b) => {
    const aRoot = catalogThemeIsRoot(a, catalog.themes);
    const bRoot = catalogThemeIsRoot(b, catalog.themes);
    if (aRoot !== bRoot) return aRoot ? -1 : 1;
    const aPath = catalogThemePathLabel(a, catalog.themes);
    const bPath = catalogThemePathLabel(b, catalog.themes);
    return aPath.localeCompare(bPath, locale, { sensitivity: "base" });
  });

  const matchCount = matches.length;
  const items = matches.slice(0, limit).map((theme) => ({
    id: theme.id,
    name: theme.name,
    parentId: theme.parentId,
    path: catalogThemePathLabel(theme, catalog.themes),
  }));
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
 * First Brickcard theme with this catalog theme id (default theme, possibly
 * customized, then a custom theme).
 * @param {unknown} themeId
 * @returns {Promise<import("./themes-data.js").LegoTheme|null>}
 */
export async function findThemeByRebrickableId(themeId) {
  const id = parseRebrickableThemeId(themeId);
  if (!id) return null;
  const presets = await getPresetThemes();
  for (const preset of presets) {
    const live = (await getTheme(preset.id)) || preset;
    if (live.rebrickableThemeId !== id) continue;
    return live;
  }
  const themes = await loadThemes();
  for (const theme of themes) {
    if (theme.isBuiltin) continue;
    if (theme.rebrickableThemeId === id) return theme;
  }
  return null;
}

/**
 * Reuse a Brickcard theme with this catalog id, or create a custom one
 * (name only, id `rebrickable-{themeId}`). Call when persisting a card,
 * not while browsing the catalog.
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
  const catalog = await loadSetsPresets();
  const theme = set.themeId
    ? await findThemeByRebrickableId(set.themeId)
    : null;
  return {
    id: createId(),
    legoSetRef: catalogSetRef(set.id),
    title: set.name,
    brickcardThemeId: theme?.id || "",
    rebrickableSetId: set.id,
    rebrickableThemeId: set.themeId,
    numPieces: set.numPieces,
    numFigurines: set.numFigurines,
    releaseYear: set.releaseYear,
    imageDataUrl: catalogSetImageUrl(set.id, catalog.setsImageUrl),
    imageBackgroundColor: "",
    imageZoom: 1,
    imageOffsetX: 0,
    imageOffsetY: 0,
  };
}
