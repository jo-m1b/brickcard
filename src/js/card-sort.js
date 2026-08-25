/**
 * Comparaison ASC des cartes (liste d’accueil et impression).
 */

/** @typedef {"updatedAt"|"legoSetRef"|"title"|"releaseYear"|"pieceCount"|"figurineCount"} CardSortKey */

/** @type {CardSortKey[]} */
export const CARD_SORT_KEYS = [
  "updatedAt",
  "legoSetRef",
  "title",
  "releaseYear",
  "pieceCount",
  "figurineCount",
];

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
    return String(a.legoSetRef || "").localeCompare(String(b.legoSetRef || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
  if (key === "title") {
    return String(a.title || "").localeCompare(String(b.title || ""), undefined, {
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
  if (key === "pieceCount") {
    const ap = a.pieceCount;
    const bp = b.pieceCount;
    if (ap == null && bp == null) return 0;
    if (ap == null) return 1;
    if (bp == null) return -1;
    return ap - bp;
  }
  if (key === "figurineCount") {
    const af = a.figurineCount;
    const bf = b.figurineCount;
    if (af == null && bf == null) return 0;
    if (af == null) return 1;
    if (bf == null) return -1;
    return af - bf;
  }
  return 0;
}
