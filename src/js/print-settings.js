/**
 * Réglages d’impression (localStorage) + calcul de grille A4.
 * N’impacte que le document imprimé et le libellé de feuilles du menu.
 */

import { formCheckboxMarkup } from "./form-checkbox.js";
import { formRadioMarkup } from "./form-radio.js";
import { CARD_SORT_KEYS } from "./card-sort.js";

const SETTINGS_KEY = "brickcard:print-settings";

export const PRINT_GRID_MIN = 1;
export const PRINT_GRID_MAX = 10;
export const DEFAULT_PRINT_GRID = 3;

/** @typedef {"both" | "faceOnly" | "backOnly"} PrintSide */
/** @typedef {"alternate" | "grouped"} SheetAssembly */
/** @typedef {import("./card-sort.js").CardSortKey} CardSortKey */

export const DEFAULT_PRINT_SIDE = /** @type {PrintSide} */ ("both");
export const DEFAULT_SHEET_ASSEMBLY = /** @type {SheetAssembly} */ ("alternate");
export const DEFAULT_CARD_PRINT_ORDER = /** @type {CardSortKey} */ ("legoSetRef");
export const DEFAULT_CUT_MARK_FACE = true;
export const DEFAULT_CUT_MARK_BACK = false;
export const DEFAULT_BLEED_FACE = false;
export const DEFAULT_BLEED_BACK = true;

/** @type {{ value: CardSortKey, label: string }[]} */
export const PRINT_CARD_ORDER_OPTIONS = [
  { value: "legoSetRef", label: "Référence" },
  { value: "title", label: "Titre" },
  { value: "releaseYear", label: "Année de sortie" },
  { value: "pieceCount", label: "Nombre de pièces" },
  { value: "figurineCount", label: "Nombre de figurines" },
  { value: "updatedAt", label: "Date de modification" },
];

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const PAGE_PAD_MM = 5;
const CARD_W_MM = 63;
const CARD_H_MM = 88;
const GAP_X_MM = 5;
const GAP_Y_MM = 5;

/**
 * @typedef {{
 *   printGrid: number,
 *   cardPrintOrder: CardSortKey,
 *   printSide: PrintSide,
 *   sheetAssembly: SheetAssembly,
 *   cutMarkFace: boolean,
 *   cutMarkBack: boolean,
 *   bleedFace: boolean,
 *   bleedBack: boolean,
 * }} PrintSettings
 */

/**
 * @typedef {{
 *   cols: number,
 *   rows: number,
 *   scale: number,
 *   cardsPerPage: number,
 *   cardWmm: number,
 *   cardHmm: number,
 * }} PrintLayout
 */

/** @param {unknown} value @returns {number} */
export function normalizePrintGrid(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_PRINT_GRID;
  return Math.min(PRINT_GRID_MAX, Math.max(PRINT_GRID_MIN, n));
}

/** @param {unknown} value @returns {PrintSide} */
export function normalizePrintSide(value) {
  if (value === "faceOnly" || value === "backOnly" || value === "both") {
    return value;
  }
  return DEFAULT_PRINT_SIDE;
}

/** @param {unknown} value @returns {SheetAssembly} */
export function normalizeSheetAssembly(value) {
  if (value === "grouped" || value === "alternate") return value;
  return DEFAULT_SHEET_ASSEMBLY;
}

/** @param {unknown} value @returns {CardSortKey} */
export function normalizeCardPrintOrder(value) {
  if (CARD_SORT_KEYS.includes(/** @type {CardSortKey} */ (value))) {
    return /** @type {CardSortKey} */ (value);
  }
  return DEFAULT_CARD_PRINT_ORDER;
}

/** @param {unknown} value @returns {boolean} */
export function normalizeCutMarkFace(value) {
  if (typeof value === "boolean") return value;
  return DEFAULT_CUT_MARK_FACE;
}

/** @param {unknown} value @returns {boolean} */
export function normalizeCutMarkBack(value) {
  if (typeof value === "boolean") return value;
  return DEFAULT_CUT_MARK_BACK;
}

/** @param {unknown} value @returns {boolean} */
export function normalizeBleedFace(value) {
  if (typeof value === "boolean") return value;
  return DEFAULT_BLEED_FACE;
}

/** @param {unknown} value @returns {boolean} */
export function normalizeBleedBack(value) {
  if (typeof value === "boolean") return value;
  return DEFAULT_BLEED_BACK;
}

/**
 * Radios horizontales « Ordre d’impression des cartes » (Paramètres et `#print`).
 * @param {{ idPrefix: string, name: string, selected: CardSortKey }} opts
 * @returns {string}
 */
export function printCardOrderRadiosMarkup(opts) {
  return PRINT_CARD_ORDER_OPTIONS.map((opt) =>
    formRadioMarkup({
      id: `${opts.idPrefix}-${opt.value}`,
      name: opts.name,
      value: opt.value,
      label: opt.label,
      checked: opts.selected === opt.value,
    })
  ).join("");
}

/**
 * Groupe de cases « Tracé de découpe » (Paramètres et `#print`).
 * @param {{ idPrefix: string, name: string, face: boolean, back: boolean }} opts
 * @returns {string}
 */
export function printCutMarksGroupMarkup(opts) {
  const hintId = `${opts.idPrefix}-hint`;
  return `<fieldset class="form-check-group" aria-describedby="${hintId}">
    <legend class="form-label">Tracé de découpe</legend>
    <p class="form-hint" id="${hintId}">Imprimer un tracé technique pour faciliter la découpe des cartes</p>
    <div class="form-check-list form-check-list--row">
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-face`,
        name: opts.name,
        value: "face",
        label: "Sur la face avant",
        checked: opts.face,
      })}
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-back`,
        name: opts.name,
        value: "back",
        label: "Sur le dos (arrière)",
        checked: opts.back,
      })}
    </div>
  </fieldset>`;
}

/**
 * Lit les cases Face / Dos d’un groupe « Tracé de découpe ».
 * @param {NodeListOf<Element>|Element[]} inputs
 * @returns {{ cutMarkFace: boolean, cutMarkBack: boolean }}
 */
export function cutMarksFromCheckboxes(inputs) {
  let face = false;
  let back = false;
  for (const input of inputs) {
    if (!(input instanceof HTMLInputElement)) continue;
    if (input.value === "face") face = input.checked;
    if (input.value === "back") back = input.checked;
  }
  return { cutMarkFace: face, cutMarkBack: back };
}

/**
 * Groupe de cases « Fond perdu » (Paramètres et `#print`).
 * Les cases d’un côté sont désactivées si le tracé de découpe correspondant
 * est coché (inutile d’imprimer un fond perdu avec un filet de coupe).
 * @param {{
 *   idPrefix: string,
 *   name: string,
 *   face: boolean,
 *   back: boolean,
 *   cutMarkFace: boolean,
 *   cutMarkBack: boolean,
 * }} opts
 * @returns {string}
 */
export function printBleedGroupMarkup(opts) {
  const hintId = `${opts.idPrefix}-hint`;
  return `<fieldset class="form-check-group" aria-describedby="${hintId}">
    <legend class="form-label">Fond perdu</legend>
    <p class="form-hint" id="${hintId}">Étendre la couleur de fond des cartes au-delà de la zone de coupe pour éviter des bords avec du blanc lors de la découpe</p>
    <div class="form-check-list form-check-list--row">
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-face`,
        name: opts.name,
        value: "face",
        label: "Sur la face avant",
        checked: opts.face,
        disabled: opts.cutMarkFace,
      })}
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-back`,
        name: opts.name,
        value: "back",
        label: "Sur le dos (arrière)",
        checked: opts.back,
        disabled: opts.cutMarkBack,
      })}
    </div>
  </fieldset>`;
}

/**
 * Lit les cases Face / Dos d’un groupe « Fond perdu ».
 * @param {NodeListOf<Element>|Element[]} inputs
 * @returns {{ bleedFace: boolean, bleedBack: boolean }}
 */
export function bleedFromCheckboxes(inputs) {
  let face = false;
  let back = false;
  for (const input of inputs) {
    if (!(input instanceof HTMLInputElement)) continue;
    if (input.value === "face") face = input.checked;
    if (input.value === "back") back = input.checked;
  }
  return { bleedFace: face, bleedBack: back };
}

/**
 * Grise / désactive les cases Fond perdu selon le tracé de découpe.
 * @param {NodeListOf<Element>|Element[]} inputs
 * @param {{ cutMarkFace: boolean, cutMarkBack: boolean }} cutMarks
 */
export function syncPrintBleedDisabled(inputs, cutMarks) {
  for (const input of inputs) {
    if (!(input instanceof HTMLInputElement)) continue;
    if (input.value === "face") input.disabled = Boolean(cutMarks.cutMarkFace);
    if (input.value === "back") input.disabled = Boolean(cutMarks.cutMarkBack);
  }
}

/**
 * Fond perdu effectivement imprimé : jamais si le tracé de découpe du même
 * côté est coché.
 * @param {PrintSettings} [settings]
 * @returns {{ face: boolean, back: boolean }}
 */
export function effectivePrintBleed(settings = getPrintSettings()) {
  return {
    face: settings.bleedFace && !settings.cutMarkFace,
    back: settings.bleedBack && !settings.cutMarkBack,
  };
}

/**
 * Grille A4 : 3×3 = échelle 1 (taille poker).
 * Sinon l’échelle remplit la largeur utile (agrandir à 1–2 / réduire à 4–10).
 * Les lignes sont des cartes entières (jamais coupées) ; 1…10 → grilles carrées.
 * @param {unknown} [printGrid]
 * @returns {PrintLayout}
 */
export function computePrintLayout(printGrid = DEFAULT_PRINT_GRID) {
  const c = normalizePrintGrid(printGrid);
  const innerW = PAGE_W_MM - 2 * PAGE_PAD_MM;
  const innerH = PAGE_H_MM - 2 * PAGE_PAD_MM;
  const rowW = c * CARD_W_MM + (c - 1) * GAP_X_MM;
  const scale = c === DEFAULT_PRINT_GRID ? 1 : innerW / rowW;
  const cardH = CARD_H_MM * scale;
  const gapY = GAP_Y_MM * scale;
  const rows = Math.max(1, Math.floor((innerH + gapY) / (cardH + gapY)));
  return {
    cols: c,
    rows,
    scale,
    cardsPerPage: c * rows,
    cardWmm: CARD_W_MM * scale,
    cardHmm: CARD_H_MM * scale,
  };
}

/** @returns {PrintSettings} */
function defaultPrintSettings() {
  return {
    printGrid: DEFAULT_PRINT_GRID,
    cardPrintOrder: DEFAULT_CARD_PRINT_ORDER,
    printSide: DEFAULT_PRINT_SIDE,
    sheetAssembly: DEFAULT_SHEET_ASSEMBLY,
    cutMarkFace: DEFAULT_CUT_MARK_FACE,
    cutMarkBack: DEFAULT_CUT_MARK_BACK,
    bleedFace: DEFAULT_BLEED_FACE,
    bleedBack: DEFAULT_BLEED_BACK,
  };
}

/** @returns {PrintSettings} */
export function getPrintSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultPrintSettings();
    const parsed = JSON.parse(raw);
    return {
      printGrid: normalizePrintGrid(parsed?.printGrid),
      cardPrintOrder: normalizeCardPrintOrder(parsed?.cardPrintOrder),
      printSide: normalizePrintSide(parsed?.printSide),
      sheetAssembly: normalizeSheetAssembly(parsed?.sheetAssembly),
      cutMarkFace: normalizeCutMarkFace(parsed?.cutMarkFace),
      cutMarkBack: normalizeCutMarkBack(parsed?.cutMarkBack),
      bleedFace: normalizeBleedFace(parsed?.bleedFace),
      bleedBack: normalizeBleedBack(parsed?.bleedBack),
    };
  } catch {
    return defaultPrintSettings();
  }
}

/**
 * @param {Partial<PrintSettings>} partial
 * @returns {PrintSettings}
 */
export function setPrintSettings(partial) {
  const current = getPrintSettings();
  const next = {
    printGrid:
      partial.printGrid != null
        ? normalizePrintGrid(partial.printGrid)
        : current.printGrid,
    cardPrintOrder:
      partial.cardPrintOrder != null
        ? normalizeCardPrintOrder(partial.cardPrintOrder)
        : current.cardPrintOrder,
    printSide:
      partial.printSide != null
        ? normalizePrintSide(partial.printSide)
        : current.printSide,
    sheetAssembly:
      partial.sheetAssembly != null
        ? normalizeSheetAssembly(partial.sheetAssembly)
        : current.sheetAssembly,
    cutMarkFace:
      partial.cutMarkFace != null
        ? normalizeCutMarkFace(partial.cutMarkFace)
        : current.cutMarkFace,
    cutMarkBack:
      partial.cutMarkBack != null
        ? normalizeCutMarkBack(partial.cutMarkBack)
        : current.cutMarkBack,
    bleedFace:
      partial.bleedFace != null
        ? normalizeBleedFace(partial.bleedFace)
        : current.bleedFace,
    bleedBack:
      partial.bleedBack != null
        ? normalizeBleedBack(partial.bleedBack)
        : current.bleedBack,
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

/**
 * @param {number} cardCount
 * @param {number} [printGrid]
 * @returns {number}
 */
export function countPrintSheets(
  cardCount,
  printGrid = getPrintSettings().printGrid
) {
  const { cardsPerPage } = computePrintLayout(printGrid);
  if (!(cardCount > 0) || !(cardsPerPage > 0)) return 0;
  return Math.ceil(cardCount / cardsPerPage);
}

/**
 * @param {number} cardCount
 * @param {PrintSettings} [settings]
 * @returns {string}
 */
export function formatPrintSheetsLabel(cardCount, settings = getPrintSettings()) {
  const sheets = countPrintSheets(cardCount, settings.printGrid);
  if (!sheets) return "";
  const s = sheets > 1 ? "s" : "";
  if (settings.printSide === "faceOnly") {
    return `${sheets} feuille${s} A4 (faces)`;
  }
  if (settings.printSide === "backOnly") {
    return `${sheets} feuille${s} A4 (dos)`;
  }
  if (settings.sheetAssembly === "grouped") {
    return `${sheets} feuille${s} A4 · rectos puis versos`;
  }
  return `${sheets} feuille${s} A4 recto-verso`;
}

/** @param {PrintLayout} layout @returns {string} */
export function formatPrintGridLabel(layout) {
  return `Grille ${layout.cols}×${layout.rows}`;
}

/** @param {PrintLayout} [layout] @returns {string} */
export function formatPrintGridSize(layout) {
  const l = layout || computePrintLayout(getPrintSettings().printGrid);
  return `${l.cols}×${l.rows}`;
}

/**
 * Libellé du menu header (`#print-menu-desc`) : grille puis feuilles.
 * @param {number} cardCount
 * @param {PrintSettings} [settings]
 * @returns {string}
 */
export function formatPrintMenuDesc(cardCount, settings = getPrintSettings()) {
  const layout = computePrintLayout(settings.printGrid);
  const sheets = formatPrintSheetsLabel(cardCount, settings);
  if (!sheets) return formatPrintGridLabel(layout);
  return `${formatPrintGridLabel(layout)}\n${sheets}`;
}

/** @param {number} cardCount @returns {string} */
export function formatPrintCountLabel(cardCount) {
  const n = Math.max(0, Math.round(Number(cardCount) || 0));
  return `${n} carte${n > 1 ? "s" : ""} à imprimer`;
}

/**
 * Nom de fichier proposé au dialogue « Enregistrer au format PDF »
 * (`document.title` pendant `window.print()`, sans `.pdf`).
 * Verrouillé via `beginPrintDocumentTitle` / `endPrintDocumentTitle` pour ne pas
 * écraser le nom de fichier avec le titre de navigation.
 * @param {number} cardCount
 * @param {PrintSettings} [settings]
 * @returns {string}
 */
export function formatPrintPdfBasename(
  cardCount,
  settings = getPrintSettings()
) {
  const n = Math.max(0, Math.round(Number(cardCount) || 0));
  const layout = computePrintLayout(settings.printGrid);
  const date = new Date().toISOString().slice(0, 10);
  const grid = `${layout.cols}x${layout.rows}`;
  const sides =
    settings.printSide === "faceOnly"
      ? "face"
      : settings.printSide === "backOnly"
        ? "dos"
        : "face-et-dos";
  const parts = ["brickcard", date, "grille", grid, sides];
  if (settings.printSide === "both") {
    parts.push(
      "recto-verso",
      settings.sheetAssembly === "grouped" ? "regrouper" : "alterner"
    );
  }
  parts.push(`${n}-carte${n > 1 ? "s" : ""}`);
  return parts.join("-");
}
