/**
 * Comparaison de recherche : casse et accents ignorés (`Sel` → `Sélecteur`).
 */

/** @param {string} s */
function fold(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** @param {string} hay @param {string} needle */
export function includesCI(hay, needle) {
  return fold(hay).includes(fold(needle));
}
