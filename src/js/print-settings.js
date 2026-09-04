/**
 * Print settings (localStorage) + A4 grid math.
 * Affects only the printed document and the menu sheet label.
 */

import { filenameSlug } from "./card-export.js";
import { formCheckboxMarkup } from "./form-checkbox.js";
import { formRadioMarkup } from "./form-radio.js";
import { normalizeCardSortKey } from "./card-sort.js";
import { _t } from "./i18n.js";

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
  { value: "legoSetRef", label: "Reference" },
  { value: "title", label: "Title" },
  { value: "releaseYear", label: "Release year" },
  { value: "numPieces", label: "Number of pieces" },
  { value: "numFigurines", label: "Number of figurines" },
  { value: "updatedAt", label: "Date modified" },
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
  return normalizeCardSortKey(value, DEFAULT_CARD_PRINT_ORDER);
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
 * Horizontal radios “Card print order” (Settings and `#print`).
 * @param {{ idPrefix: string, name: string, selected: CardSortKey }} opts
 * @returns {string}
 */
export function printCardOrderRadiosMarkup(opts) {
  return PRINT_CARD_ORDER_OPTIONS.map((opt) =>
    formRadioMarkup({
      id: `${opts.idPrefix}-${opt.value}`,
      name: opts.name,
      value: opt.value,
      label: _t(opt.label),
      checked: opts.selected === opt.value,
    })
  ).join("");
}

/**
 * “Cut marks” checkbox group (Settings and `#print`).
 * @param {{ idPrefix: string, name: string, face: boolean, back: boolean }} opts
 * @returns {string}
 */
export function printCutMarksGroupMarkup(opts) {
  const hintId = `${opts.idPrefix}-hint`;
  return `<fieldset class="form-check-group" aria-describedby="${hintId}">
    <legend class="form-label">${_t("Cut marks")}</legend>
    <p class="form-hint" id="${hintId}">${_t("Print a technical outline to make cutting the cards easier")}</p>
    <div class="form-check-list form-check-list--row">
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-face`,
        name: opts.name,
        value: "face",
        label: _t("On the front"),
        checked: opts.face,
      })}
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-back`,
        name: opts.name,
        value: "back",
        label: _t("On the back"),
        checked: opts.back,
      })}
    </div>
  </fieldset>`;
}

/**
 * Read Face / Back checkboxes of a “Cut marks” group.
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
 * “Bleed” checkbox group (Settings and `#print`).
 * Checkboxes on a side are disabled if the matching cut mark
 * is checked (no point printing bleed with a cut hairline).
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
    <legend class="form-label">${_t("Bleed")}</legend>
    <p class="form-hint" id="${hintId}">${_t("Extend the card background color beyond the cut area to avoid white edges when cutting")}</p>
    <div class="form-check-list form-check-list--row">
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-face`,
        name: opts.name,
        value: "face",
        label: _t("On the front"),
        checked: opts.face,
        disabled: opts.cutMarkFace,
      })}
      ${formCheckboxMarkup({
        id: `${opts.idPrefix}-back`,
        name: opts.name,
        value: "back",
        label: _t("On the back"),
        checked: opts.back,
        disabled: opts.cutMarkBack,
      })}
    </div>
  </fieldset>`;
}

/**
 * Read Face / Back checkboxes of a “Bleed” group.
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
 * Gray out / disable Bleed checkboxes from the cut marks.
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
 * Bleed actually printed: never if the cut mark on the same
 * side is checked.
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
 * A4 grid: 3×3 = scale 1 (poker size).
 * Otherwise scale fills the usable width (enlarge at 1–2 / shrink at 4–10).
 * Rows are whole cards (never cut); 1…10 → square grids.
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
 * @param {number} numCards
 * @param {number} [printGrid]
 * @returns {number}
 */
export function countPrintSheets(
  numCards,
  printGrid = getPrintSettings().printGrid
) {
  const { cardsPerPage } = computePrintLayout(printGrid);
  if (!(numCards > 0) || !(cardsPerPage > 0)) return 0;
  return Math.ceil(numCards / cardsPerPage);
}

/**
 * @param {number} numCards
 * @param {PrintSettings} [settings]
 * @returns {string}
 */
export function formatPrintSheetsLabel(numCards, settings = getPrintSettings()) {
  const sheets = countPrintSheets(numCards, settings.printGrid);
  if (!sheets) return "";
  if (settings.printSide === "faceOnly") {
    return sheets === 1
      ? _t("%(count)s A4 sheet (fronts)", { count: sheets })
      : _t("%(count)s A4 sheets (fronts)", { count: sheets });
  }
  if (settings.printSide === "backOnly") {
    return sheets === 1
      ? _t("%(count)s A4 sheet (backs)", { count: sheets })
      : _t("%(count)s A4 sheets (backs)", { count: sheets });
  }
  if (settings.sheetAssembly === "grouped") {
    return sheets === 1
      ? _t("%(count)s A4 sheet · fronts then backs", { count: sheets })
      : _t("%(count)s A4 sheets · fronts then backs", { count: sheets });
  }
  return sheets === 1
    ? _t("%(count)s A4 sheet duplex", { count: sheets })
    : _t("%(count)s A4 sheets duplex", { count: sheets });
}

/** @param {PrintLayout} layout @returns {string} */
export function formatPrintGridLabel(layout) {
  return _t("Grid %(cols)s×%(rows)s", { cols: layout.cols, rows: layout.rows });
}

/** @param {PrintLayout} [layout] @returns {string} */
export function formatPrintGridSize(layout) {
  const l = layout || computePrintLayout(getPrintSettings().printGrid);
  return `${l.cols}×${l.rows}`;
}

/**
 * Header menu label (`#print-menu-desc`): grid then sheets.
 * @param {number} numCards
 * @param {PrintSettings} [settings]
 * @returns {string}
 */
export function formatPrintMenuDesc(numCards, settings = getPrintSettings()) {
  const layout = computePrintLayout(settings.printGrid);
  const sheets = formatPrintSheetsLabel(numCards, settings);
  if (!sheets) return formatPrintGridLabel(layout);
  return `${formatPrintGridLabel(layout)}\n${sheets}`;
}

/** @param {number} numCards @returns {string} */
export function formatPrintCountLabel(numCards) {
  const n = Math.max(0, Math.round(Number(numCards) || 0));
  return n === 1
    ? _t("%(count)s card to print", { count: n })
    : _t("%(count)s cards to print", { count: n });
}

/**
 * Filename offered to the “Save as PDF” dialog
 * (`document.title` during `window.print()`, no `.pdf`).
 * Locked via `beginPrintDocumentTitle` / `endPrintDocumentTitle` so the
 * navigation title does not overwrite the filename.
 * @param {number} numCards
 * @param {PrintSettings} [settings]
 * @returns {string}
 */
export function formatPrintPdfBasename(
  numCards,
  settings = getPrintSettings()
) {
  const n = Math.max(0, Math.round(Number(numCards) || 0));
  const layout = computePrintLayout(settings.printGrid);
  const date = new Date().toISOString().slice(0, 10);
  const grid = `${layout.cols}x${layout.rows}`;
  const sides =
    settings.printSide === "faceOnly"
      ? _t("front")
      : settings.printSide === "backOnly"
        ? _t("back")
        : _t("front and back");
  const cardsLabel =
    n === 1 ? _t("%(count)s card", { count: n }) : _t("%(count)s cards", { count: n });
  const parts = [
    "brickcard",
    date,
    filenameSlug(_t("grid")),
    grid,
    filenameSlug(sides),
  ];
  if (settings.printSide === "both") {
    parts.push(
      filenameSlug(_t("duplex")),
      filenameSlug(settings.sheetAssembly === "grouped" ? _t("Group") : _t("Alternate"))
    );
  }
  parts.push(filenameSlug(cardsLabel));
  return parts.join("-");
}
