/**
 * Modale de paramètres d’impression (enfant de `#modal-root`, sans route).
 * Fermeture (X, Échap, Annuler, backdrop) → pas d’impression ; les réglages restent enregistrés.
 * « Lancer l’impression » imprime sans fermer la modale.
 */

import { ICON_CLOSE, ICON_PRINTER } from "./icons.js";
import { focusTopModal } from "./modal-focus.js";
import { bindFormRange, formRangeResetMarkup } from "./form-range.js";
import {
  DEFAULT_PRINT_GRID,
  PRINT_GRID_MAX,
  PRINT_GRID_MIN,
  computePrintLayout,
  formatPrintCountLabel,
  formatPrintGridSize,
  formatPrintMenuDesc,
  getPrintSettings,
  setPrintSettings,
} from "./print-settings.js";

let dialogSeq = 0;

/**
 * Ouvre la modale Paramètres d’impression.
 * @param {HTMLElement} host `#modal-root`
 * @param {{
 *   cardCount: number,
 *   onSettingsChange?: () => void,
 *   onPrint?: () => void | Promise<void>,
 * }} opts
 * @returns {Promise<void>} se résout à la fermeture
 */
export function openPrintDialog(host, opts) {
  const cardCount = Math.max(0, Math.round(Number(opts?.cardCount) || 0));
  const onSettingsChange = opts?.onSettingsChange;
  const onPrint = opts?.onPrint;
  if (!host || !cardCount) return Promise.resolve();

  const existing = host.querySelector("#print-dialog-backdrop");
  if (existing) return Promise.resolve();

  return new Promise((resolve) => {
    const uid = `print-dialog-${++dialogSeq}`;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = "print-dialog-backdrop";
    backdrop.setAttribute("role", "presentation");

    const addedModalOpen = !document.body.classList.contains("modal-open");
    if (addedModalOpen) document.body.classList.add("modal-open");

    let settings = getPrintSettings();
    const initialGrid = formatPrintGridSize(computePrintLayout(settings.printGrid));

    backdrop.innerHTML = `
      <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="${uid}-title" aria-describedby="${uid}-count ${uid}-desc">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="${uid}-title">Paramètres d’impression</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" data-print-dismiss>
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="modal-confirm-msg" id="${uid}-recap">
            <h2 class="section-title" id="${uid}-count"></h2>
            <p class="view-desc" id="${uid}-desc"></p>
          </div>
          <div class="form-field">
            <label class="form-label" for="${uid}-print-grid">Grille d’impression</label>
            <div class="form-range-row">
              <input
                type="range"
                id="${uid}-print-grid"
                min="${PRINT_GRID_MIN}"
                max="${PRINT_GRID_MAX}"
                step="1"
                value="${settings.printGrid}"
                aria-valuemin="${PRINT_GRID_MIN}"
                aria-valuemax="${PRINT_GRID_MAX}"
                aria-valuenow="${settings.printGrid}"
                aria-valuetext="${initialGrid}"
                aria-describedby="${uid}-print-grid-out"
              />
              <output id="${uid}-print-grid-out" for="${uid}-print-grid">${initialGrid}</output>
              ${formRangeResetMarkup()}
            </div>
          </div>
          <div class="form-field">
            <p class="form-label" id="${uid}-card-sides-label">Côtés des cartes à imprimer</p>
            <div class="theme-mode-switch" role="radiogroup" aria-labelledby="${uid}-card-sides-label">
              <button type="button" class="btn ${settings.cardSidesToPrint === "faceAndBack" ? "primary" : "secondary"}" data-card-sides="faceAndBack" aria-pressed="${settings.cardSidesToPrint === "faceAndBack"}">Face et dos</button>
              <button type="button" class="btn ${settings.cardSidesToPrint === "faceOnly" ? "primary" : "secondary"}" data-card-sides="faceOnly" aria-pressed="${settings.cardSidesToPrint === "faceOnly"}">Face seulement</button>
              <button type="button" class="btn ${settings.cardSidesToPrint === "backOnly" ? "primary" : "secondary"}" data-card-sides="backOnly" aria-pressed="${settings.cardSidesToPrint === "backOnly"}">Dos seulement</button>
            </div>
          </div>
          <div class="form-field" id="${uid}-duplex-field">
            <p class="form-label" id="${uid}-recto-verso-label">Impression recto-verso des feuilles</p>
            <div class="theme-mode-switch" role="radiogroup" aria-labelledby="${uid}-recto-verso-label" aria-describedby="${uid}-recto-verso-hint">
              <button type="button" class="btn ${settings.sheetRectoVerso === "alternate" ? "primary" : "secondary"}" data-sheet-recto-verso="alternate" aria-pressed="${settings.sheetRectoVerso === "alternate"}">Alterner</button>
              <button type="button" class="btn ${settings.sheetRectoVerso === "grouped" ? "primary" : "secondary"}" data-sheet-recto-verso="grouped" aria-pressed="${settings.sheetRectoVerso === "grouped"}">Regrouper</button>
            </div>
            <p class="form-hint" id="${uid}-recto-verso-hint"></p>
          </div>
        </div>
        <div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" data-print-run>
              ${ICON_PRINTER}
              <span>Lancer l’impression</span>
            </button>
            <button type="button" class="btn secondary sm" data-print-dismiss>
              Annuler
            </button>
          </div>
        </div>
      </div>
    `;

    const countEl = backdrop.querySelector(`#${uid}-count`);
    const descEl = backdrop.querySelector(`#${uid}-desc`);
    const gridRow = /** @type {HTMLElement|null} */ (
      backdrop.querySelector(`#${uid}-print-grid`)?.closest(".form-range-row")
    );
    const sidesBtns = Array.from(backdrop.querySelectorAll("[data-card-sides]"));
    const duplexBtns = Array.from(backdrop.querySelectorAll("[data-sheet-recto-verso]"));
    const duplexField = backdrop.querySelector(`#${uid}-duplex-field`);
    const duplexHint = backdrop.querySelector(`#${uid}-recto-verso-hint`);
    const runBtn = backdrop.querySelector("[data-print-run]");

    function syncSidesButtons(cardSidesToPrint) {
      sidesBtns.forEach((btn) => {
        const on = btn.getAttribute("data-card-sides") === cardSidesToPrint;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.classList.toggle("primary", on);
        btn.classList.toggle("secondary", !on);
      });
    }

    function syncDuplexButtons(sheetRectoVerso) {
      duplexBtns.forEach((btn) => {
        const on = btn.getAttribute("data-sheet-recto-verso") === sheetRectoVerso;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.classList.toggle("primary", on);
        btn.classList.toggle("secondary", !on);
      });
    }

    function refresh() {
      if (countEl instanceof HTMLElement) {
        countEl.textContent = formatPrintCountLabel(cardCount);
      }
      if (descEl instanceof HTMLElement) {
        const lines = formatPrintMenuDesc(cardCount, settings).split("\n");
        descEl.replaceChildren(
          ...lines.flatMap((line, i) =>
            i === 0
              ? [document.createTextNode(line)]
              : [document.createElement("br"), document.createTextNode(line)]
          )
        );
      }
      if (duplexField instanceof HTMLElement) {
        duplexField.hidden = settings.cardSidesToPrint !== "faceAndBack";
      }
      if (duplexHint instanceof HTMLElement) {
        duplexHint.textContent =
          settings.sheetRectoVerso === "grouped"
            ? "Tous les rectos d’abord, puis retourner la pile pour ensuite imprimer tous les versos."
            : "Une feuille à la fois (imprimante recto-verso).";
      }
      syncSidesButtons(settings.cardSidesToPrint);
      syncDuplexButtons(settings.sheetRectoVerso);
      onSettingsChange?.();
    }

    /** @param {Partial<typeof settings>} partial */
    function persist(partial) {
      settings = setPrintSettings(partial);
      refresh();
    }

    /** @type {ReturnType<typeof bindFormRange>|null} */
    let gridRangeField = null;
    if (gridRow) {
      gridRangeField = bindFormRange(gridRow, {
        defaultValue: DEFAULT_PRINT_GRID,
        format: (v) => formatPrintGridSize(computePrintLayout(Number(v))),
        onChange(value) {
          persist({ printGrid: Number(value) });
        },
      });
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    let settled = false;

    const mo = new MutationObserver(() => {
      if (!backdrop.isConnected) finish();
    });

    function finish() {
      if (settled) return;
      settled = true;
      mo.disconnect();
      gridRangeField?.destroy();
      document.removeEventListener("keydown", onKey, true);
      backdrop.remove();
      if (addedModalOpen) document.body.classList.remove("modal-open");
      previouslyFocused?.focus?.();
      resolve();
    }

    /** @param {KeyboardEvent} e */
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (!backdrop.isConnected) {
        finish();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      finish();
    }

    sidesBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardSidesToPrint = btn.getAttribute("data-card-sides");
        if (!cardSidesToPrint) return;
        persist({ cardSidesToPrint });
      });
    });
    duplexBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const sheetRectoVerso = btn.getAttribute("data-sheet-recto-verso");
        if (!sheetRectoVerso) return;
        persist({ sheetRectoVerso });
      });
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) finish();
    });
    backdrop.querySelectorAll("[data-print-dismiss]").forEach((el) => {
      el.addEventListener("click", () => finish());
    });
    runBtn?.addEventListener("click", async () => {
      if (!onPrint) return;
      if (runBtn instanceof HTMLButtonElement) runBtn.disabled = true;
      try {
        await onPrint();
      } finally {
        if (runBtn instanceof HTMLButtonElement && backdrop.isConnected) {
          runBtn.disabled = false;
        }
      }
    });

    document.addEventListener("keydown", onKey, true);
    host.appendChild(backdrop);
    mo.observe(host, { childList: true });
    refresh();
    queueMicrotask(() => focusTopModal());
  });
}
