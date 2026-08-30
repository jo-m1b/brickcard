/**
 * Tab title: default `APP_DOCUMENT_TITLE`, overlays, lock during PDF print.
 */

import { APP_DOCUMENT_TITLE } from "./version.js";
import { _t } from "./i18n.js";

export { APP_DOCUMENT_TITLE };

function defaultDocumentTitle() {
  return _t(APP_DOCUMENT_TITLE);
}

/** @type {boolean} */
let printTitleLocked = false;

/** @type {(string|null|undefined)[]} */
let routeParts = [];

/** @type {(string|null|undefined)[][]} */
let modalStack = [];

/**
 * @param {(string|null|undefined)[]} parts
 * @returns {string}
 */
function formatDocumentTitle(parts) {
  const segments = [];
  for (const part of parts) {
    const s = String(part || "").trim();
    if (s && s !== APP_DOCUMENT_TITLE && s !== defaultDocumentTitle()) segments.push(s);
  }
  segments.push(defaultDocumentTitle());
  return segments.join(" | ");
}

function currentParts() {
  if (modalStack.length) return modalStack[modalStack.length - 1];
  return routeParts;
}

function applyDocumentTitle() {
  if (printTitleLocked) return;
  document.title = formatDocumentTitle(currentParts());
}

/**
 * Title of the main route / modal.
 * `{title} | {section?} | {default}`; no argument → default title (home).
 * Clears the child-modal stack.
 * @param {...(string|null|undefined)} parts
 */
export function setAppDocumentTitle(...parts) {
  routeParts = parts;
  modalStack = [];
  applyDocumentTitle();
}

/**
 * Child modal (confirmation, image URL, stacked editor) above the route.
 * @param {...(string|null|undefined)} parts
 */
export function pushModalDocumentTitle(...parts) {
  modalStack.push(parts);
  applyDocumentTitle();
}

/** Remove the last child modal. No-op if the stack is empty. */
export function popModalDocumentTitle() {
  if (!modalStack.length) return;
  modalStack.pop();
  applyDocumentTitle();
}

/**
 * Replace the title with the PDF filename during the print dialog.
 * Firefox fires `afterprint` on the clone (dialog still open): do not
 * restore the title in that handler, or Save to PDF → `127.0.0.1.pdf`.
 * @param {string} printTitle
 */
export function beginPrintDocumentTitle(printTitle) {
  printTitleLocked = true;
  document.title = String(printTitle || "");
}

/** Restore the app title after printing. */
export function endPrintDocumentTitle() {
  if (!printTitleLocked) return;
  printTitleLocked = false;
  applyDocumentTitle();
}
