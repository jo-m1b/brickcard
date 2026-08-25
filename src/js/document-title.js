/**
 * Titre de l’onglet : défaut `APP_DOCUMENT_TITLE`, overlays, verrou pendant l’impression PDF.
 */

import { APP_DOCUMENT_TITLE } from "./version.js";

export { APP_DOCUMENT_TITLE };

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
    if (s && s !== APP_DOCUMENT_TITLE) segments.push(s);
  }
  segments.push(APP_DOCUMENT_TITLE);
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
 * Titre de la route / modale principale.
 * `{titre} | {section?} | {défaut}` ; sans argument → titre par défaut (accueil).
 * Vide la pile des modales enfants.
 * @param {...(string|null|undefined)} parts
 */
export function setAppDocumentTitle(...parts) {
  routeParts = parts;
  modalStack = [];
  applyDocumentTitle();
}

/**
 * Modale enfant (confirmation, URL d’image, éditeur superposé) au-dessus de la route.
 * @param {...(string|null|undefined)} parts
 */
export function pushModalDocumentTitle(...parts) {
  modalStack.push(parts);
  applyDocumentTitle();
}

/** Retire la dernière modale enfant. Sans effet si la pile est vide. */
export function popModalDocumentTitle() {
  if (!modalStack.length) return;
  modalStack.pop();
  applyDocumentTitle();
}

/**
 * Remplace le titre par le nom de fichier PDF le temps de `window.print()`.
 * Les mises à jour overlay / enfants sont mémorisées et réappliquées après.
 * @param {string} printTitle
 */
export function beginPrintDocumentTitle(printTitle) {
  printTitleLocked = true;
  document.title = String(printTitle || "");
}

/** Restaure le titre applicatif après l’impression. */
export function endPrintDocumentTitle() {
  if (!printTitleLocked) return;
  printTitleLocked = false;
  applyDocumentTitle();
}
