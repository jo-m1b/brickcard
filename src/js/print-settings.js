/**
 * Réglages d’impression (localStorage) + calcul de grille A4.
 * N’impacte que le document imprimé et le libellé de feuilles du menu.
 */

import { formRadioMarkup } from "./form-radio.js";
import { CARD_SORT_KEYS } from "./card-sort.js";

const SETTINGS_KEY = "brickcard:print-settings";

export const PRINT_GRID_MIN = 1;
export const PRINT_GRID_MAX = 10;
export const DEFAULT_PRINT_GRID = 3;

/** @typedef {"faceAndBack" | "faceOnly" | "backOnly"} CardSidesToPrint */
/** @typedef {"alternate" | "grouped"} SheetRectoVerso */
/** @typedef {import("./card-sort.js").CardSortKey} CardSortKey */

export const DEFAULT_CARD_SIDES_TO_PRINT = /** @type {CardSidesToPrint} */ ("faceAndBack");
export const DEFAULT_SHEET_RECTO_VERSO = /** @type {SheetRectoVerso} */ ("alternate");
export const DEFAULT_CARD_SORT = /** @type {CardSortKey} */ ("legoSetRef");

/** @type {{ value: CardSortKey, label: string }[]} */
export const PRINT_CARD_SORT_OPTIONS = [
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
const GAP_X_MM = 3;
const GAP_Y_MM = 5;

/**
 * @typedef {{
 *   printGrid: number,
 *   cardSort: CardSortKey,
 *   cardSidesToPrint: CardSidesToPrint,
 *   sheetRectoVerso: SheetRectoVerso,
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

/** @param {unknown} value @returns {CardSidesToPrint} */
export function normalizeCardSidesToPrint(value) {
  if (value === "faceOnly" || value === "backOnly" || value === "faceAndBack") {
    return value;
  }
  return DEFAULT_CARD_SIDES_TO_PRINT;
}

/** @param {unknown} value @returns {SheetRectoVerso} */
export function normalizeSheetRectoVerso(value) {
  if (value === "grouped" || value === "alternate") return value;
  return DEFAULT_SHEET_RECTO_VERSO;
}

/** @param {unknown} value @returns {CardSortKey} */
export function normalizeCardSort(value) {
  if (CARD_SORT_KEYS.includes(/** @type {CardSortKey} */ (value))) {
    return /** @type {CardSortKey} */ (value);
  }
  return DEFAULT_CARD_SORT;
}

/**
 * Radios horizontales « Tri des cartes » (Paramètres et `#print`).
 * @param {{ idPrefix: string, name: string, selected: CardSortKey }} opts
 * @returns {string}
 */
export function printCardSortRadiosMarkup(opts) {
  return PRINT_CARD_SORT_OPTIONS.map((opt) =>
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
    cardSort: DEFAULT_CARD_SORT,
    cardSidesToPrint: DEFAULT_CARD_SIDES_TO_PRINT,
    sheetRectoVerso: DEFAULT_SHEET_RECTO_VERSO,
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
      cardSort: normalizeCardSort(parsed?.cardSort),
      cardSidesToPrint: normalizeCardSidesToPrint(parsed?.cardSidesToPrint),
      sheetRectoVerso: normalizeSheetRectoVerso(parsed?.sheetRectoVerso),
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
    cardSort:
      partial.cardSort != null ? normalizeCardSort(partial.cardSort) : current.cardSort,
    cardSidesToPrint:
      partial.cardSidesToPrint != null
        ? normalizeCardSidesToPrint(partial.cardSidesToPrint)
        : current.cardSidesToPrint,
    sheetRectoVerso:
      partial.sheetRectoVerso != null
        ? normalizeSheetRectoVerso(partial.sheetRectoVerso)
        : current.sheetRectoVerso,
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
  if (settings.cardSidesToPrint === "faceOnly") {
    return `${sheets} feuille${s} A4 (faces)`;
  }
  if (settings.cardSidesToPrint === "backOnly") {
    return `${sheets} feuille${s} A4 (dos)`;
  }
  if (settings.sheetRectoVerso === "grouped") {
    return `${sheets} feuille${s} A4 — rectos puis versos`;
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
    settings.cardSidesToPrint === "faceOnly"
      ? "face"
      : settings.cardSidesToPrint === "backOnly"
        ? "dos"
        : "face-et-dos";
  const parts = ["brickcard", date, "grille", grid, sides];
  if (settings.cardSidesToPrint === "faceAndBack") {
    parts.push(
      "recto-verso",
      settings.sheetRectoVerso === "grouped" ? "regrouper" : "alterner"
    );
  }
  parts.push(`${n}-carte${n > 1 ? "s" : ""}`);
  return parts.join("-");
}
