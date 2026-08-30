/**
 * App keyboard shortcuts (opened from home, outside editors).
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isPrintShortcut(e) {
  if (!(e instanceof KeyboardEvent) || e.repeat || e.altKey || e.shiftKey) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  return e.key === "p" || e.key === "P";
}

/**
 * Ctrl/Cmd+S (no Alt / Shift) — open `#backup` or start the export.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isCollectionSaveShortcut(e) {
  if (!(e instanceof KeyboardEvent) || e.repeat || e.altKey || e.shiftKey) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  return e.key === "s" || e.key === "S";
}
