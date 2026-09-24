/**
 * App keyboard shortcuts.
 * Command modifier is Ctrl (Linux / Windows) or Cmd (macOS).
 * Alt, Shift, and key repeat are ignored, except `/`, `?`, and `,`
 * (Shift is allowed so AZERTY still matches) and Ctrl/Cmd+Alt+N.
 */

/**
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
function isPlainKeyEvent(e) {
  return e instanceof KeyboardEvent && !e.repeat && !e.isComposing;
}

/**
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
function isCommandShortcut(e) {
  if (!isPlainKeyEvent(e) || e.altKey || e.shiftKey) return false;
  return e.ctrlKey || e.metaKey;
}

/**
 * Ctrl/Cmd+P — open `#print`, or start printing if it is already open.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isPrintShortcut(e) {
  if (!isCommandShortcut(e)) return false;
  return e.key === "p" || e.key === "P";
}

/**
 * Ctrl/Cmd+S — open `#backup`, start the export, or save a draft editor.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isCollectionSaveShortcut(e) {
  if (!isCommandShortcut(e)) return false;
  return e.key === "s" || e.key === "S";
}

/**
 * Ctrl/Cmd+Enter — primary footer button of the front dialog.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isPrimaryActionShortcut(e) {
  if (!isCommandShortcut(e)) return false;
  return e.key === "Enter";
}

/**
 * Ctrl/Cmd+F — focus the visible search bar (browser find stays when none).
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isFindShortcut(e) {
  if (!isCommandShortcut(e)) return false;
  return e.key === "f" || e.key === "F";
}

/**
 * Ctrl/Cmd+Alt+N — open `#new-card`.
 * Ctrl/Cmd+N alone is reserved by Chrome and Firefox (new window) and is not
 * delivered to the page. It is still accepted when a browser does deliver it
 * (including an ASCII control character for Ctrl+N, `code` KeyN).
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isNewCardShortcut(e) {
  if (!isPlainKeyEvent(e) || e.shiftKey) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  if (e.key === "n" || e.key === "N") return true;
  if (e.code !== "KeyN" || e.key.length !== 1) return false;
  return e.key.charCodeAt(0) < 32;
}

/**
 * Ctrl/Cmd+, — open `#settings`. Shift is allowed (some layouts type comma with Shift).
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isSettingsShortcut(e) {
  if (!isPlainKeyEvent(e) || e.altKey) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  return e.key === ",";
}

/**
 * Plain N outside a text field — open `#new-card`.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isBareNewCardKey(e) {
  if (!isPlainKeyEvent(e)) return false;
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
  if (e.key !== "n" && e.key !== "N") return false;
  return !isTypingTarget(e.target);
}

/**
 * `,` outside a text field — open `#settings`. Shift is allowed.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isBareSettingsKey(e) {
  if (!isPlainKeyEvent(e)) return false;
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key !== ",") return false;
  return !isTypingTarget(e.target);
}

/**
 * `T` outside a text field — open `#themes`.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isBareThemesKey(e) {
  if (!isPlainKeyEvent(e)) return false;
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
  if (e.key !== "t" && e.key !== "T") return false;
  return !isTypingTarget(e.target);
}

/**
 * `D` outside a text field — open `#developer`.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isBareDeveloperKey(e) {
  if (!isPlainKeyEvent(e)) return false;
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
  if (e.key !== "d" && e.key !== "D") return false;
  return !isTypingTarget(e.target);
}

/**
 * `?` outside a text field — open `#page/about`.
 * Shift is required on most layouts; `key` is `?`, not `/`.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isBareAboutKey(e) {
  if (!isPlainKeyEvent(e)) return false;
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key !== "?") return false;
  return !isTypingTarget(e.target);
}

/**
 * `/` outside a text field — focus the visible search bar.
 * Shift is allowed (AZERTY types `/` with Shift; `?` is a different `key`).
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function isSearchFocusKey(e) {
  if (!isPlainKeyEvent(e)) return false;
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key !== "/") return false;
  return !isTypingTarget(e.target);
}

/**
 * Text entry: letters should type, not run a bare shortcut.
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
export function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  const el = target.closest("input, textarea, select, [contenteditable='true']");
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    const type = (el.type || "text").toLowerCase();
    return ![
      "button",
      "checkbox",
      "radio",
      "range",
      "file",
      "color",
      "submit",
      "reset",
      "image",
    ].includes(type);
  }
  return false;
}

/** `aria-keyshortcuts` values (Control and Meta so Linux and macOS both match). */
export const SHORTCUT_NEW_CARD = "n Control+Alt+n Meta+Alt+n";
export const SHORTCUT_SETTINGS = ", Control+, Meta+,";
export const SHORTCUT_THEMES = "t";
export const SHORTCUT_DEVELOPER = "d";
export const SHORTCUT_ABOUT = "?";
export const SHORTCUT_PRINT = "Control+p Meta+p";
export const SHORTCUT_SAVE = "Control+s Meta+s";
export const SHORTCUT_PRIMARY = "Control+Enter Meta+Enter";
export const SHORTCUT_FIND = "Control+f Meta+f /";

const SHORTCUT_SAVE_PRIMARY = `${SHORTCUT_SAVE} ${SHORTCUT_PRIMARY}`;
const SHORTCUT_PRINT_PRIMARY = `${SHORTCUT_PRINT} ${SHORTCUT_PRIMARY}`;

/**
 * @param {Element} el
 * @param {string} value
 */
function setKeyshortcuts(el, value) {
  if (el.getAttribute("aria-keyshortcuts") !== value) {
    el.setAttribute("aria-keyshortcuts", value);
  }
}

/**
 * Expose implemented shortcuts on the controls they activate.
 * @param {ParentNode} [root]
 */
export function applyShortcutAffordances(root = document) {
  root.querySelectorAll("#btn-new-card").forEach((el) => setKeyshortcuts(el, SHORTCUT_NEW_CARD));
  root.querySelectorAll("#btn-settings").forEach((el) => setKeyshortcuts(el, SHORTCUT_SETTINGS));
  root.querySelectorAll("#btn-print-menu").forEach((el) => setKeyshortcuts(el, SHORTCUT_PRINT));
  root.querySelectorAll("#btn-print-dialog-run").forEach((el) => setKeyshortcuts(el, SHORTCUT_PRINT_PRIMARY));
  root.querySelectorAll("#btn-card-save, #theme-save, #preset-theme-save, #btn-backup-dialog-run, [data-confirm-action='save']").forEach((el) => {
    setKeyshortcuts(el, SHORTCUT_SAVE_PRIMARY);
  });
  root.querySelectorAll("#btn-import-dialog-run").forEach((el) => setKeyshortcuts(el, SHORTCUT_PRIMARY));
  root.querySelectorAll('a[href="#page/about"]').forEach((el) => setKeyshortcuts(el, SHORTCUT_ABOUT));
  root.querySelectorAll('a.tile[href="#themes"]').forEach((el) => setKeyshortcuts(el, SHORTCUT_THEMES));
  root.querySelectorAll('a.tile[href="#developer"]').forEach((el) => setKeyshortcuts(el, SHORTCUT_DEVELOPER));
  root.querySelectorAll('a.tile[href="#backup"]').forEach((el) => setKeyshortcuts(el, SHORTCUT_SAVE));
  root.querySelectorAll(".search-bar input[type='search']").forEach((el) => setKeyshortcuts(el, SHORTCUT_FIND));
  root.querySelectorAll(".modal-footer button.btn.primary:not(.icon-only)").forEach((el) => {
    if (!el.hasAttribute("aria-keyshortcuts")) setKeyshortcuts(el, SHORTCUT_PRIMARY);
  });
}
