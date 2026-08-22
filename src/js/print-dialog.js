/**
 * Modale de paramètres d’impression (`#print`).
 * Fermeture (X, Échap, backdrop ; Annuler s’il y a des cartes) → accueil ; les réglages restent enregistrés.
 * « Lancer l’impression » imprime sans fermer la modale.
 * Rien à imprimer : message à la place des options, pas de pied (la croix suffit).
 */

import { ICON_CLOSE, ICON_PRINTER, modalTitleMarkup } from "./icons.js";
import { emptyViewMarkup } from "./empty-view.js";
import { bindFormRange, formRangeResetMarkup } from "./form-range.js";
import { loadCards } from "./storage.js";
import { printCards } from "./print.js";
import { syncPrintMenu } from "./print-menu.js";
import { getPrintQty, totalPrintCount } from "./print-qty.js";
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
      <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="print-dialog-title"${empty ? ` aria-describedby="print-dialog-empty"` : ` aria-describedby="print-dialog-count print-dialog-desc"`}>
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
          <div class="form-field">
            <p class="form-label" id="print-dialog-card-sides-label">Côtés des cartes à imprimer</p>
            <div class="theme-mode-switch" role="radiogroup" aria-labelledby="print-dialog-card-sides-label">
              <button type="button" class="btn ${settings.cardSidesToPrint === "faceAndBack" ? "primary" : "secondary"}" data-card-sides="faceAndBack" aria-pressed="${settings.cardSidesToPrint === "faceAndBack"}">Face et dos</button>
              <button type="button" class="btn ${settings.cardSidesToPrint === "faceOnly" ? "primary" : "secondary"}" data-card-sides="faceOnly" aria-pressed="${settings.cardSidesToPrint === "faceOnly"}">Face seulement</button>
              <button type="button" class="btn ${settings.cardSidesToPrint === "backOnly" ? "primary" : "secondary"}" data-card-sides="backOnly" aria-pressed="${settings.cardSidesToPrint === "backOnly"}">Dos seulement</button>
            </div>
          </div>
          <div class="form-field" id="print-dialog-duplex-field">
            <p class="form-label" id="print-dialog-recto-verso-label">Impression recto-verso des feuilles</p>
            <div class="theme-mode-switch" role="radiogroup" aria-labelledby="print-dialog-recto-verso-label" aria-describedby="print-dialog-recto-verso-hint">
              <button type="button" class="btn ${settings.sheetRectoVerso === "alternate" ? "primary" : "secondary"}" data-sheet-recto-verso="alternate" aria-pressed="${settings.sheetRectoVerso === "alternate"}">Alterner</button>
              <button type="button" class="btn ${settings.sheetRectoVerso === "grouped" ? "primary" : "secondary"}" data-sheet-recto-verso="grouped" aria-pressed="${settings.sheetRectoVerso === "grouped"}">Regrouper</button>
            </div>
            <p class="form-hint" id="print-dialog-recto-verso-hint"></p>
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
    const sidesBtns = Array.from(host.querySelectorAll("[data-card-sides]"));
    const duplexBtns = Array.from(host.querySelectorAll("[data-sheet-recto-verso]"));
    const duplexField = host.querySelector("#print-dialog-duplex-field");
    const duplexHint = host.querySelector("#print-dialog-recto-verso-hint");
    const runBtn = host.querySelector("#btn-print-dialog-run");

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

    runBtn?.addEventListener("click", async () => {
      if (runBtn instanceof HTMLButtonElement) runBtn.disabled = true;
      try {
        const cards = await loadCards();
        /** @type {import("./storage.js").Card[]} */
        const toPrint = [];
        for (const card of cards) {
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
