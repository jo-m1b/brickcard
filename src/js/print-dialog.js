/**
 * Print settings modal (`#print`).
 * Close (X, Escape, backdrop; Cancel if there are cards) → home; settings stay saved.
 * “Start printing” prints without closing the modal.
 * Nothing to print: message instead of options, no footer (the close button is enough).
 * With cards: under the summary, a 150px strip of the A4 sheets Start printing will produce.
 * The summary and the strip stay put; only the options scroll.
 * The strip scrolls sideways with a drag, a swipe, or the wheel while hovering. No scrollbar.
 * Ctrl/Cmd+P: open the modal, or start printing if it is already open.
 */

import { ICON_CLOSE, ICON_PRINTER, modalTitleMarkup } from "./icons.js";
import { _t } from "./i18n.js";
import { setAppDocumentTitle } from "./document-title.js";
import { emptyViewMarkup } from "./empty-view.js";
import { bindFormRange, formRangeResetMarkup } from "./form-range.js";
import { formRadioMarkup } from "./form-radio.js";
import { isPrintShortcut } from "./hotkeys.js";
import { loadCards, loadThemes } from "./storage.js";
import { themeDisplayMap } from "./sets-presets.js";
import { buildPrintDocument } from "./print.js";
import { syncPrintMenu } from "./print-menu.js";
import { getPrintQty, totalPrintCount } from "./print-qty.js";
import { compareCardsAsc } from "./card-sort.js";
import {
  DEFAULT_PRINT_GRID,
  PRINT_GRID_MAX,
  PRINT_GRID_MIN,
  computePrintLayout,
  formatPrintCountLabel,
  formatPrintGridSize,
  formatPrintMenuDesc,
  getPrintSettings,
  normalizeCardPrintOrder,
  printCardOrderRadiosMarkup,
  printCutMarksGroupMarkup,
  printBleedGroupMarkup,
  cutMarksFromCheckboxes,
  bleedFromCheckboxes,
  syncPrintBleedDisabled,
  setPrintSettings,
} from "./print-settings.js";

/** Wait before rebuilding thumbnails while the grid slider is moving. */
const PREVIEW_DEBOUNCE_MS = 60;

/**
 * Copies selected for printing (quantity, ascending order).
 * @param {import("./storage.js").Card[]} cards
 * @param {import("./print-settings.js").PrintSettings} settings
 * @returns {import("./storage.js").Card[]}
 */
function cardsToPrint(cards, settings) {
  const selected = cards
    .filter((card) => getPrintQty(card.id) > 0)
    .sort((a, b) => compareCardsAsc(a, b, settings.cardPrintOrder));
  /** @type {import("./storage.js").Card[]} */
  const toPrint = [];
  for (const card of selected) {
    const qty = getPrintQty(card.id);
    for (let i = 0; i < qty; i++) toPrint.push(card);
  }
  return toPrint;
}

/**
 * Fit each full-size A4 sheet into its thumbnail frame.
 * The frame width follows the scaled sheet so horizontal scroll
 * matches the visible pages, not the 210mm layout size.
 * Height is measured without a scrollbar, so a wide row does not shrink the pages.
 * `--print-preview-scale` keeps the cut-mark hairline about 1px on screen.
 * @param {HTMLElement} preview
 */
function fitPrintPreviewSheets(preview) {
  const frames = [...preview.querySelectorAll(".print-dialog-preview-sheet")].filter(
    (frame) => frame instanceof HTMLElement
  );
  if (!frames.length) return;
  for (const frame of frames) frame.style.width = "0px";

  const sheet0 = frames[0].querySelector(".print-sheet");
  if (!(sheet0 instanceof HTMLElement)) return;
  const sheetH = sheet0.offsetHeight;
  const sheetW = sheet0.offsetWidth;
  if (!sheetH || !sheetW) return;

  const previousOverflow = preview.style.overflowX;
  preview.style.overflowX = "hidden";
  const innerH = frames[0].clientHeight;
  const borderX = frames[0].offsetWidth - frames[0].clientWidth;
  preview.style.overflowX = previousOverflow;
  if (!innerH) return;

  const scale = innerH / sheetH;
  for (const frame of frames) {
    const sheet = frame.querySelector(".print-sheet");
    if (!(sheet instanceof HTMLElement)) continue;
    sheet.style.transform = `scale(${scale})`;
    sheet.style.setProperty("--print-preview-scale", String(scale));
    frame.style.width = `${sheetW * scale + borderX}px`;
  }
  preview.classList.toggle("is-scrollable", preview.scrollWidth > preview.clientWidth + 1);
}

/**
 * Sideways scroll of the thumbnail strip: mouse / pen drag, touch swipe,
 * and the wheel while the pointer is over the strip. No scrollbar.
 * @param {HTMLElement} preview
 * @returns {() => void}
 */
function bindPrintPreviewDrag(preview) {
  /** @type {number|null} */
  let pointerId = null;
  let startX = 0;
  let startScroll = 0;

  const canScroll = () => preview.scrollWidth > preview.clientWidth + 1;

  const endDrag = () => {
    pointerId = null;
    preview.classList.remove("is-dragging");
    document.body.classList.remove("print-preview-dragging");
  };

  /** @param {PointerEvent} e */
  const onDown = (e) => {
    if (e.button !== 0 || !canScroll()) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startScroll = preview.scrollLeft;
    preview.setPointerCapture(e.pointerId);
  };

  /** @param {PointerEvent} e */
  const onMove = (e) => {
    if (e.pointerId !== pointerId) return;
    preview.classList.add("is-dragging");
    document.body.classList.add("print-preview-dragging");
    preview.scrollLeft = startScroll - (e.clientX - startX);
  };

  /** @param {PointerEvent} e */
  const onUp = (e) => {
    if (e.pointerId !== pointerId) return;
    endDrag();
  };

  /** Vertical wheel and horizontal wheel / trackpad both move the strip. */
  const onWheel = (e) => {
    if (!canScroll()) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!delta) return;
    e.preventDefault();
    preview.scrollLeft += delta;
  };

  preview.addEventListener("pointerdown", onDown);
  preview.addEventListener("pointermove", onMove);
  preview.addEventListener("pointerup", onUp);
  preview.addEventListener("pointercancel", onUp);
  preview.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    endDrag();
    preview.removeEventListener("pointerdown", onDown);
    preview.removeEventListener("pointermove", onMove);
    preview.removeEventListener("pointerup", onUp);
    preview.removeEventListener("pointercancel", onUp);
    preview.removeEventListener("wheel", onWheel);
  };
}

/**
 * @param {HTMLElement} host `#modal-root`
 * @param {{
 *   onClose: () => void,
 *   toast?: (msg: string, type?: string) => void,
 * }} opts
 * @returns {() => void} cleanup
 */
export function renderPrintDialog(host, opts) {
  const { onClose, toast } = opts;
  const numCards = totalPrintCount();
  const empty = numCards < 1;

  document.body.classList.add("modal-open");

  let settings = getPrintSettings();
  const initialGrid = formatPrintGridSize(computePrintLayout(settings.printGrid));

  host.innerHTML = `
    <div class="modal-backdrop" id="print-dialog-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="print-dialog-title"${empty ? ` aria-describedby="print-dialog-empty"` : ` aria-describedby="print-dialog-num print-dialog-desc"`}>
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="print-dialog-title">${modalTitleMarkup(_t("Print settings"), ICON_PRINTER)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-print-dialog-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          ${
            empty
              ? emptyViewMarkup({
                  id: "print-dialog-empty",
                  titleTag: "p",
                  title: _t("No cards to print!"),
                  text: _t("Select at least one card to print from your collection."),
                })
              : `
          <div class="print-dialog-summary">
            <div class="modal-confirm-msg" id="print-dialog-recap">
              <h2 class="section-title" id="print-dialog-num"></h2>
              <p class="view-desc" id="print-dialog-desc"></p>
            </div>
            <div
              class="print-dialog-preview"
              id="print-dialog-preview"
              role="img"
              aria-label="${_t("Print preview")}"
              aria-busy="true"
            >
              <div class="print-dialog-preview-track"></div>
            </div>
          </div>
          <div class="print-dialog-settings" tabindex="-1">
          <div class="form-field">
            <label class="form-label" for="print-dialog-grid">${_t("Print grid")}</label>
            <div class="form-range-row">
              <input
                type="range"
                id="print-dialog-grid"
                min="${PRINT_GRID_MIN}"
                max="${PRINT_GRID_MAX}"
                step="1"
                value="${settings.printGrid}"
                aria-valuemin="${PRINT_GRID_MIN}"
                aria-valuemax="${PRINT_GRID_MAX}"
                aria-valuenow="${settings.printGrid}"
                aria-valuetext="${initialGrid}"
                aria-describedby="print-dialog-grid-out"
              />
              <output id="print-dialog-grid-out" for="print-dialog-grid">${initialGrid}</output>
              ${formRangeResetMarkup()}
            </div>
          </div>
          ${printCutMarksGroupMarkup({
            idPrefix: "print-dialog-cut-marks",
            name: "print-dialog-cut-marks",
            face: settings.cutMarkFace,
            back: settings.cutMarkBack,
          })}
          ${printBleedGroupMarkup({
            idPrefix: "print-dialog-bleed",
            name: "print-dialog-bleed",
            face: settings.bleedFace,
            back: settings.bleedBack,
            cutMarkFace: settings.cutMarkFace,
            cutMarkBack: settings.cutMarkBack,
          })}
          <fieldset class="form-check-group">
            <legend class="form-label">${_t("Card print order")}</legend>
            <div class="form-check-list form-check-list--row">
              ${printCardOrderRadiosMarkup({
                idPrefix: "print-dialog-card-print-order",
                name: "print-dialog-card-print-order",
                selected: settings.cardPrintOrder,
              })}
            </div>
          </fieldset>
          <fieldset class="form-check-group">
            <legend class="form-label">${_t("Print side")}</legend>
            <div class="form-check-list form-check-list--row">
              ${formRadioMarkup({
                id: "print-dialog-print-side-both",
                name: "print-dialog-print-side",
                value: "both",
                label: _t("Both sides"),
                checked: settings.printSide === "both",
              })}
              ${formRadioMarkup({
                id: "print-dialog-print-side-face-only",
                name: "print-dialog-print-side",
                value: "faceOnly",
                label: _t("Front only"),
                checked: settings.printSide === "faceOnly",
              })}
              ${formRadioMarkup({
                id: "print-dialog-print-side-back-only",
                name: "print-dialog-print-side",
                value: "backOnly",
                label: _t("Back only"),
                checked: settings.printSide === "backOnly",
              })}
            </div>
          </fieldset>
          <fieldset class="form-check-group" id="print-dialog-sheet-assembly-field">
            <legend class="form-label">${_t("Sheet assembly")}</legend>
            <div class="form-check-list">
              ${formRadioMarkup({
                id: "print-dialog-sheet-assembly-alternate",
                name: "print-dialog-sheet-assembly",
                value: "alternate",
                label: _t("Alternate"),
                hint: _t("One sheet at a time (duplex printer)"),
                checked: settings.sheetAssembly === "alternate",
              })}
              ${formRadioMarkup({
                id: "print-dialog-sheet-assembly-grouped",
                name: "print-dialog-sheet-assembly",
                value: "grouped",
                label: _t("Group"),
                hint: _t("All fronts first, then flip the stack to print all the backs"),
                checked: settings.sheetAssembly === "grouped",
              })}
            </div>
          </fieldset>
          </div>`
          }
        </div>
        ${
          empty
            ? ""
            : `<div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-print-dialog-run">
              ${ICON_PRINTER}
              <span>${_t("Start printing")}</span>
            </button>
            <button type="button" class="btn secondary sm" id="btn-print-dialog-cancel">
              ${_t("Cancel")}
            </button>
          </div>
        </div>`
        }
      </div>
    </div>
  `;

  setAppDocumentTitle(_t("Print settings"));

  const backdrop = host.querySelector("#print-dialog-backdrop");
  const btnClose = host.querySelector("#btn-print-dialog-close");
  const btnCancel = host.querySelector("#btn-print-dialog-cancel");
  const close = () => onClose();

  /** @type {ReturnType<typeof bindFormRange>|null} */
  let gridRangeField = null;
  let alive = true;
  /** @type {number} */
  let previewTimer = 0;
  let unbindPreviewDrag = () => {};

  if (!empty) {
    const countEl = host.querySelector("#print-dialog-num");
    const descEl = host.querySelector("#print-dialog-desc");
    const gridRow = /** @type {HTMLElement|null} */ (
      host.querySelector("#print-dialog-grid")?.closest(".form-range-row")
    );
    const orderInputs = host.querySelectorAll('input[name="print-dialog-card-print-order"]');
    const cutMarksInputs = host.querySelectorAll('input[name="print-dialog-cut-marks"]');
    const bleedInputs = host.querySelectorAll('input[name="print-dialog-bleed"]');
    const sideInputs = host.querySelectorAll('input[name="print-dialog-print-side"]');
    const assemblyInputs = host.querySelectorAll('input[name="print-dialog-sheet-assembly"]');
    const assemblyField = host.querySelector("#print-dialog-sheet-assembly-field");
    const runBtn = host.querySelector("#btn-print-dialog-run");
    const previewEl = host.querySelector("#print-dialog-preview");
    if (previewEl instanceof HTMLElement) unbindPreviewDrag = bindPrintPreviewDrag(previewEl);

    let previewToken = 0;
    /** @type {import("./storage.js").Card[]|null} */
    let cachedCards = null;
    /** @type {Map<string, import("./themes-data.js").LegoTheme>|null} */
    let themeMap = null;

    function renderPreview() {
      if (!(previewEl instanceof HTMLElement) || !cachedCards || !themeMap) return;
      const token = ++previewToken;
      const doc = buildPrintDocument(
        cardsToPrint(cachedCards, settings),
        themeMap,
        computePrintLayout(settings.printGrid),
        settings
      );
      if (!alive || token !== previewToken) return;
      const track = previewEl.querySelector(".print-dialog-preview-track");
      const prevCount = track instanceof HTMLElement ? track.childElementCount : 0;
      const scrollLeft = previewEl.scrollLeft;
      previewEl.className = `print-dialog-preview ${doc.className}`;
      const frames = [...doc.children].map((sheet) => {
        const frame = document.createElement("div");
        frame.className = "print-dialog-preview-sheet";
        frame.setAttribute("aria-hidden", "true");
        frame.appendChild(sheet);
        return frame;
      });
      if (track instanceof HTMLElement) {
        previewEl.replaceChildren(track);
        track.replaceChildren(...frames);
      } else {
        previewEl.replaceChildren(...frames);
      }
      fitPrintPreviewSheets(previewEl);
      previewEl.scrollLeft = frames.length === prevCount ? scrollLeft : 0;
      previewEl.setAttribute("aria-busy", "false");
    }

    function schedulePreview() {
      window.clearTimeout(previewTimer);
      previewTimer = window.setTimeout(() => {
        if (alive) renderPreview();
      }, PREVIEW_DEBOUNCE_MS);
    }

    void (async () => {
      try {
        const [cards, themes] = await Promise.all([loadCards(), loadThemes()]);
        if (!alive) return;
        cachedCards = cards;
        themeMap = await themeDisplayMap(themes);
        if (!alive) return;
        window.clearTimeout(previewTimer);
        renderPreview();
      } catch {
        if (!alive) return;
        if (previewEl instanceof HTMLElement) previewEl.setAttribute("aria-busy", "false");
      }
    })();

    function refresh() {
      if (countEl instanceof HTMLElement) {
        countEl.textContent = formatPrintCountLabel(numCards);
      }
      if (descEl instanceof HTMLElement) {
        const lines = formatPrintMenuDesc(numCards, settings).split("\n");
        descEl.replaceChildren(
          ...lines.flatMap((line, i) =>
            i === 0
              ? [document.createTextNode(line)]
              : [document.createElement("br"), document.createTextNode(line)]
          )
        );
      }
      if (assemblyField instanceof HTMLElement) {
        assemblyField.hidden = settings.printSide !== "both";
      }
      syncPrintBleedDisabled(bleedInputs, settings);
      syncPrintMenu();
      schedulePreview();
    }

    /** @param {Partial<typeof settings>} partial */
    function persist(partial) {
      settings = setPrintSettings(partial);
      refresh();
    }

    if (gridRow) {
      gridRangeField = bindFormRange(gridRow, {
        defaultValue: DEFAULT_PRINT_GRID,
        format: (v) => formatPrintGridSize(computePrintLayout(Number(v))),
        onChange(value) {
          persist({ printGrid: Number(value) });
        },
      });
    }

    orderInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        persist({ cardPrintOrder: normalizeCardPrintOrder(input.value) });
      });
    });
    cutMarksInputs.forEach((input) => {
      input.addEventListener("change", () => {
        persist(cutMarksFromCheckboxes(cutMarksInputs));
      });
    });
    bleedInputs.forEach((input) => {
      input.addEventListener("change", () => {
        persist(bleedFromCheckboxes(bleedInputs));
      });
    });
    sideInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        if (input.value !== "both" && input.value !== "faceOnly" && input.value !== "backOnly") {
          return;
        }
        persist({ printSide: input.value });
      });
    });
    assemblyInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        if (input.value !== "alternate" && input.value !== "grouped") return;
        persist({ sheetAssembly: input.value });
      });
    });

    runBtn?.addEventListener("click", async () => {
      if (runBtn instanceof HTMLButtonElement) runBtn.disabled = true;
      try {
        const cards = await loadCards();
        const toPrint = cardsToPrint(cards, settings);
        if (!toPrint.length) {
          toast?.(_t("No cards to print"), "error");
          return;
        }
        const { printCards } = await import("./print.js");
        await printCards(toPrint);
      } catch (err) {
        toast?.(err.message || _t("Print error"), "error");
      } finally {
        if (runBtn instanceof HTMLButtonElement && runBtn.isConnected) {
          runBtn.disabled = false;
        }
      }
    });

    refresh();
  }

  /** @param {MouseEvent} e */
  const onBackdropClick = (e) => {
    if (e.target === backdrop) close();
  };

  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (isPrintShortcut(e)) {
      e.preventDefault();
      const runBtn = host.querySelector("#btn-print-dialog-run");
      if (runBtn instanceof HTMLButtonElement && !runBtn.disabled) runBtn.click();
    }
  };

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", close);
  btnCancel?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  return () => {
    alive = false;
    unbindPreviewDrag();
    window.clearTimeout(previewTimer);
    gridRangeField?.destroy();
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
    btnCancel?.removeEventListener("click", close);
  };
}
