/**
 * Raccourcis clavier de l’app (ouverts depuis l’accueil, hors éditeurs).
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isPrintShortcut(e) {
  if (!(e instanceof KeyboardEvent) || e.repeat || e.altKey || e.shiftKey) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  return e.key === "p" || e.key === "P";
}

/**
 * Ctrl/Cmd+S (sans Alt / Maj) — ouvrir `#backup` ou lancer l’export.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isCollectionSaveShortcut(e) {
  if (!(e instanceof KeyboardEvent) || e.repeat || e.altKey || e.shiftKey) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  return e.key === "s" || e.key === "S";
}
