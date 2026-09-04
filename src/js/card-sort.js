/**
 * ASC card comparison (home list and print).
 */

import { getLocale } from "./i18n.js";

/** @typedef {"updatedAt"|"legoSetRef"|"title"|"releaseYear"|"numPieces"|"numFigurines"} CardSortKey */

/** @type {CardSortKey[]} */
export const CARD_SORT_KEYS = [
  "updatedAt",
  "legoSetRef",
  "title",
  "releaseYear",
  "numPieces",
  "numFigurines",
];

const SORT_KEY_ALIASES = {
  pieceCount: "numPieces",
  figurineCount: "numFigurines",
};

/**
 * @param {unknown} value
 * @param {CardSortKey} fallback
 * @returns {CardSortKey}
 */
export function normalizeCardSortKey(value, fallback) {
  const raw = String(value || "");
  const mapped = SORT_KEY_ALIASES[raw] || raw;
  if (CARD_SORT_KEYS.includes(/** @type {CardSortKey} */ (mapped))) {
    return /** @type {CardSortKey} */ (mapped);
  }
  return fallback;
}

/**
 * @param {import("./storage.js").Card} a
 * @param {import("./storage.js").Card} b
 * @param {CardSortKey} key
 * @returns {number}
 */
export function compareCardsAsc(a, b, key) {
  if (key === "updatedAt") {
    return String(a.updatedAt || "").localeCompare(String(b.updatedAt || ""));
  }
  if (key === "legoSetRef") {
    return String(a.legoSetRef || "").localeCompare(String(b.legoSetRef || ""), getLocale(), {
      numeric: true,
      sensitivity: "base",
    });
  }
  if (key === "title") {
    return String(a.title || "").localeCompare(String(b.title || ""), getLocale(), {
      sensitivity: "base",
    });
  }
  if (key === "releaseYear") {
    const ay = a.releaseYear;
    const by = b.releaseYear;
    if (ay == null && by == null) return 0;
    if (ay == null) return 1;
    if (by == null) return -1;
    return ay - by;
  }
  if (key === "numPieces") {
    const ap = a.numPieces;
    const bp = b.numPieces;
    if (ap == null && bp == null) return 0;
    if (ap == null) return 1;
    if (bp == null) return -1;
    return ap - bp;
  }
  if (key === "numFigurines") {
    const af = a.numFigurines;
    const bf = b.numFigurines;
    if (af == null && bf == null) return 0;
    if (af == null) return 1;
    if (bf == null) return -1;
    return af - bf;
  }
  return 0;
}
