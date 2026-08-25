/**
 * Modale de paramètres d’impression (`#print`).
 * Fermeture (X, Échap, backdrop ; Annuler s’il y a des cartes) → accueil ; les réglages restent enregistrés.
 * « Lancer l’impression » imprime sans fermer la modale.
 * Rien à imprimer : message à la place des options, pas de pied (la croix suffit).
 * Ctrl/Cmd+P : ouvrir la modale, ou lancer l’impression si elle est déjà ouverte.
 */

import { ICON_CLOSE, ICON_PRINTER, modalTitleMarkup } from "./icons.js";
import { setAppDocumentTitle } from "./document-title.js";
import { emptyViewMarkup } from "./empty-view.js";
import { bindFormRange, formRangeResetMarkup } from "./form-range.js";
import { formRadioMarkup } from "./form-radio.js";
import { loadCards } from "./storage.js";
import { printCards } from "./print.js";
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
  normalizeCardSort,
  printCardSortRadiosMarkup,
  setPrintSettings,
} from "./print-settings.js";

/** Ctrl/Cmd+P (sans Alt / Maj) — ouvrir `#print` ou lancer l’impression. */
export function isPrintShortcut(e) {
  if (!(e instanceof KeyboardEvent) || e.repeat || e.altKey || e.shiftKey) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  return e.key === "p" || e.key === "P";
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
  const cardCount = totalPrintCount();
  const empty = cardCount < 1;

  document.body.classList.add("modal-open");

  let settings = getPrintSettings();
  const initialGrid = formatPrintGridSize(computePrintLayout(settings.printGrid));

  host.innerHTML = `
    <div class="modal-backdrop" id="print-dialog-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="print-dialog-title"${empty ? ` aria-describedby="print-dialog-empty"` : ` aria-describedby="print-dialog-count print-dialog-desc"`}>
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="print-dialog-title">${modalTitleMarkup("Paramètres d’impression", ICON_PRINTER)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-print-dialog-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          ${
            empty
              ? emptyViewMarkup({
                  id: "print-dialog-empty",
                  titleTag: "p",
                  title: "Aucune carte à imprimer !",
                  text: "Sélectionnez au moins une carte à imprimer parmi celles de votre collection.",
                })
              : `
          <div class="modal-confirm-msg" id="print-dialog-recap">
            <h2 class="section-title" id="print-dialog-count"></h2>
            <p class="view-desc" id="print-dialog-desc"></p>
          </div>
          <div class="form-field">
            <label class="form-label" for="print-dialog-grid">Grille d’impression</label>
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
          <fieldset class="form-check-group">
            <legend class="form-label">Tri des cartes</legend>
            <div class="form-check-list form-check-list--row">
              ${printCardSortRadiosMarkup({
                idPrefix: "print-dialog-card-sort",
                name: "print-dialog-card-sort",
                selected: settings.cardSort,
              })}
            </div>
          </fieldset>
          <fieldset class="form-check-group">
            <legend class="form-label">Côtés des cartes à imprimer</legend>
            <div class="form-check-list form-check-list--row">
              ${formRadioMarkup({
                id: "print-dialog-card-sides-face-and-back",
                name: "print-dialog-card-sides",
                value: "faceAndBack",
                label: "Face et dos",
                checked: settings.cardSidesToPrint === "faceAndBack",
              })}
              ${formRadioMarkup({
                id: "print-dialog-card-sides-face-only",
                name: "print-dialog-card-sides",
                value: "faceOnly",
                label: "Face seulement",
                checked: settings.cardSidesToPrint === "faceOnly",
              })}
              ${formRadioMarkup({
                id: "print-dialog-card-sides-back-only",
                name: "print-dialog-card-sides",
                value: "backOnly",
                label: "Dos seulement",
                checked: settings.cardSidesToPrint === "backOnly",
              })}
            </div>
          </fieldset>
          <fieldset class="form-check-group" id="print-dialog-duplex-field">
            <legend class="form-label">Impression recto-verso des feuilles</legend>
            <div class="form-check-list">
              ${formRadioMarkup({
                id: "print-dialog-recto-verso-alternate",
                name: "print-dialog-recto-verso",
                value: "alternate",
                label: "Alterner",
                hint: "Une feuille à la fois (imprimante recto-verso)",
                checked: settings.sheetRectoVerso === "alternate",
              })}
              ${formRadioMarkup({
                id: "print-dialog-recto-verso-grouped",
                name: "print-dialog-recto-verso",
                value: "grouped",
                label: "Regrouper",
                hint: "Tous les rectos d’abord, puis retourner la pile pour ensuite imprimer tous les versos",
                checked: settings.sheetRectoVerso === "grouped",
              })}
            </div>
          </fieldset>`
          }
        </div>
        ${
          empty
            ? ""
            : `<div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-print-dialog-run">
              ${ICON_PRINTER}
              <span>Lancer l’impression</span>
            </button>
            <button type="button" class="btn secondary sm" id="btn-print-dialog-cancel">
              Annuler
            </button>
          </div>
        </div>`
        }
      </div>
    </div>
  `;

  setAppDocumentTitle("Paramètres d’impression");

  const backdrop = host.querySelector("#print-dialog-backdrop");
  const btnClose = host.querySelector("#btn-print-dialog-close");
  const btnCancel = host.querySelector("#btn-print-dialog-cancel");
  const close = () => onClose();

  /** @type {ReturnType<typeof bindFormRange>|null} */
  let gridRangeField = null;

  if (!empty) {
    const countEl = host.querySelector("#print-dialog-count");
    const descEl = host.querySelector("#print-dialog-desc");
    const gridRow = /** @type {HTMLElement|null} */ (
      host.querySelector("#print-dialog-grid")?.closest(".form-range-row")
    );
    const sortInputs = host.querySelectorAll('input[name="print-dialog-card-sort"]');
    const sidesInputs = host.querySelectorAll('input[name="print-dialog-card-sides"]');
    const duplexInputs = host.querySelectorAll('input[name="print-dialog-recto-verso"]');
    const duplexField = host.querySelector("#print-dialog-duplex-field");
    const runBtn = host.querySelector("#btn-print-dialog-run");

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
      syncPrintMenu();
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

    sortInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        persist({ cardSort: normalizeCardSort(input.value) });
      });
    });
    sidesInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        if (input.value !== "faceAndBack" && input.value !== "faceOnly" && input.value !== "backOnly") {
          return;
        }
        persist({ cardSidesToPrint: input.value });
      });
    });
    duplexInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        if (input.value !== "alternate" && input.value !== "grouped") return;
        persist({ sheetRectoVerso: input.value });
      });
    });

    runBtn?.addEventListener("click", async () => {
      if (runBtn instanceof HTMLButtonElement) runBtn.disabled = true;
      try {
        const cards = await loadCards();
        const selected = cards
          .filter((card) => getPrintQty(card.id) > 0)
          .sort((a, b) => compareCardsAsc(a, b, settings.cardSort));
        /** @type {import("./storage.js").Card[]} */
        const toPrint = [];
        for (const card of selected) {
          const qty = getPrintQty(card.id);
          for (let i = 0; i < qty; i++) toPrint.push(card);
        }
        if (!toPrint.length) {
          toast?.("Aucune carte à imprimer", "error");
          return;
        }
        await printCards(toPrint);
      } catch (err) {
        toast?.(err.message || "Erreur d'impression", "error");
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
    gridRangeField?.destroy();
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
    btnCancel?.removeEventListener("click", close);
  };
}
