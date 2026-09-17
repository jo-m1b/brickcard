/**
 * Search comparison: case and accents ignored (`Sel` → `Sélecteur`).
 * Space-separated tokens are AND (each must match at least one field).
 */

/** @param {string} s */
export function foldCI(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** @param {string} hay @param {string} needle */
export function includesCI(hay, needle) {
  return foldCI(hay).includes(foldCI(needle));
}

/**
 * Folded unique tokens (AND). Leading `#` on a token is ignored.
 * Empty / whitespace → [].
 * @param {unknown} query
 * @returns {string[]}
 */
export function queryNeedles(query) {
  const parts = String(query || "")
    .trim()
    .split(/\s+/)
    .map((t) => foldCI(t.replace(/^#+/, "")))
    .filter(Boolean);
  return [...new Set(parts)];
}

/**
 * Every needle must be a substring of at least one hay (after foldCI).
 * Empty needles → true (show all).
 * @param {string[]} needles
 * @param {...unknown} hays
 */
export function matchesNeedles(needles, ...hays) {
  if (!needles.length) return true;
  const folded = hays.map((h) => foldCI(h));
  return needles.every((n) => folded.some((f) => f.includes(n)));
}
