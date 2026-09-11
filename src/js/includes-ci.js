/**
 * Search comparison: case and accents ignored (`Sel` → `Sélecteur`).
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
