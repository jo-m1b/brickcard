import { ICON_CLOSE, ICON_TOOLS, modalTitleMarkup } from "../icons.js";
import { bindFormColor, formColorMarkup } from "../form-color.js";
import { bindFormRange, formRangeResetMarkup } from "../form-range.js";
import { getTheme, setTheme } from "../theme.js";
import {
  CARD_IMAGE_RADIUS_MAX_MM,
  CARD_IMAGE_RADIUS_MIN_MM,
  CARD_RADIUS_MAX_MM,
  CARD_RADIUS_MIN_MM,
  DEFAULT_CARD_IMAGE_RADIUS_MM,
  DEFAULT_CARD_RADIUS_MM,
  DEFAULT_FACE_BORDER_MM,
  FACE_BORDER_MAX_MM,
  FACE_BORDER_MIN_MM,
  getCardImageRadiusMm,
  getCardRadiusMm,
  getConfiguredCardColor,
  getConfiguredCardColorDisplay,
  getFaceBorderMm,
  setCardImageRadiusMm,
  setCardRadiusMm,
  setConfiguredCardColor,
  setFaceBorderMm,
} from "../card-design.js";
import {
  DEFAULT_LIST_COLS_MAX,
  LIST_COLS_MAX,
  LIST_COLS_MIN,
  LIST_COLS_SLIDER_UNLIMITED,
  formatListColsLabel,
  getListColsMax,
  listColsFromSlider,
  listColsToSlider,
  setListColsMax,
} from "../list-layout.js";
import { DEFAULT_THEME_COLOR } from "../themes-data.js";
import { tileListMarkup } from "../tile.js";
import { confirmDialog } from "../confirm-dialog.js";
import { syncPrintMenu } from "../print-menu.js";
import {
  DEFAULT_PRINT_GRID,
  PRINT_GRID_MAX,
  PRINT_GRID_MIN,
  computePrintLayout,
  formatPrintGridSize,
  getPrintSettings,
  setPrintSettings,
} from "../print-settings.js";

/**
 * Modale de configuration.
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{
 *   onClose: () => void,
 *   onImport: () => void,
 *   onExport: () => void | Promise<void>,
 *   onClearCards?: () => void | Promise<void>,
 *   onDevReset?: () => void | Promise<void>,
 *   cardCount?: number,
 * }} opts
 * @returns {() => void} cleanup
 */
export function renderSettingsModal(host, opts) {
  const { onClose, onImport, onExport, onClearCards, onDevReset, cardCount = 0 } = opts;
  const showDevReset = Boolean(onDevReset);
  const currentTheme = getTheme();
  const faceBorderMm = getFaceBorderMm();
  const cardRadiusMm = getCardRadiusMm();
  const cardImageRadiusMm = getCardImageRadiusMm();
  const configuredColor = getConfiguredCardColor();
  const configuredColorDisplay = getConfiguredCardColorDisplay();
  const listColsMax = getListColsMax();
  const listColsSlider = listColsToSlider(listColsMax);
  const printSettings = getPrintSettings();
  const printGridSize = formatPrintGridSize(computePrintLayout(printSettings.printGrid));

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="settings-modal-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="settings-modal-title">${modalTitleMarkup("Paramètres", ICON_TOOLS)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-settings-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="settings-sections">
            <section class="settings-panel">
              <h2 class="section-title">Interface</h2>
              <div class="form-field">
                <p class="form-label" id="settings-theme-label">Mode d’affichage</p>
                <div class="theme-mode-switch" role="radiogroup" aria-labelledby="settings-theme-label">
                  <button type="button" class="btn ${currentTheme === "system" ? "primary" : "secondary"}" data-theme-mode="system" aria-pressed="${currentTheme === "system"}">Système</button>
                  <button type="button" class="btn ${currentTheme === "light" ? "primary" : "secondary"}" data-theme-mode="light" aria-pressed="${currentTheme === "light"}">Clair</button>
                  <button type="button" class="btn ${currentTheme === "dark" ? "primary" : "secondary"}" data-theme-mode="dark" aria-pressed="${currentTheme === "dark"}">Sombre</button>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label" for="settings-list-cols">Nombre de cartes par ligne maximum</label>
                <div class="form-range-row">
                  <input
                    type="range"
                    id="settings-list-cols"
                    min="${LIST_COLS_MIN}"
                    max="${LIST_COLS_SLIDER_UNLIMITED}"
                    step="1"
                    value="${listColsSlider}"
                    aria-valuemin="${LIST_COLS_MIN}"
                    aria-valuemax="${LIST_COLS_SLIDER_UNLIMITED}"
                    aria-valuenow="${listColsSlider}"
                    aria-valuetext="${formatListColsLabel(listColsMax)}"
                    aria-describedby="settings-list-cols-out"
                  />
                  <output id="settings-list-cols-out" for="settings-list-cols">${formatListColsLabel(listColsMax)}</output>
                  ${formRangeResetMarkup()}
                </div>
              </div>
            </section>

            <section class="settings-panel">
              <h2 class="section-title">Apparence des cartes</h2>
              <div class="form-field">
                <label class="form-label" for="settings-default-color-hex">Couleur par défaut</label>
                <p class="form-hint" id="settings-default-color-hint">Couleur appliquée par défaut aux cartes sans thème ou sans couleur personnalisée.</p>
                ${formColorMarkup({
                  id: "settings-default-color-hex",
                  value: configuredColor,
                  fallback: configuredColorDisplay,
                  placeholder: DEFAULT_THEME_COLOR,
                  describedBy: "settings-default-color-hint",
                })}
              </div>
              <div class="form-field">
                <label class="form-label" for="settings-face-border">Taille de la bordure (côté face)</label>
                <div class="form-range-row">
                  <input
                    type="range"
                    id="settings-face-border"
                    min="${FACE_BORDER_MIN_MM}"
                    max="${FACE_BORDER_MAX_MM}"
                    step="0.5"
                    value="${faceBorderMm}"
                    aria-valuemin="${FACE_BORDER_MIN_MM}"
                    aria-valuemax="${FACE_BORDER_MAX_MM}"
                    aria-valuenow="${faceBorderMm}"
                    aria-describedby="settings-face-border-out"
                  />
                  <output id="settings-face-border-out" for="settings-face-border">${faceBorderMm}&nbsp;mm</output>
                  ${formRangeResetMarkup()}
                </div>
              </div>
              <div class="form-field">
                <label class="form-label" for="settings-card-radius">Arrondi des coins</label>
                <div class="form-range-row">
                  <input
                    type="range"
                    id="settings-card-radius"
                    min="${CARD_RADIUS_MIN_MM}"
                    max="${CARD_RADIUS_MAX_MM}"
                    step="0.5"
                    value="${cardRadiusMm}"
                    aria-valuemin="${CARD_RADIUS_MIN_MM}"
                    aria-valuemax="${CARD_RADIUS_MAX_MM}"
                    aria-valuenow="${cardRadiusMm}"
                    aria-describedby="settings-card-radius-out"
                  />
                  <output id="settings-card-radius-out" for="settings-card-radius">${cardRadiusMm}&nbsp;mm</output>
                  ${formRangeResetMarkup()}
                </div>
              </div>
              <div class="form-field">
                <label class="form-label" for="settings-card-image-radius">Arrondi des images</label>
                <div class="form-range-row">
                  <input
                    type="range"
                    id="settings-card-image-radius"
                    min="${CARD_IMAGE_RADIUS_MIN_MM}"
                    max="${CARD_IMAGE_RADIUS_MAX_MM}"
                    step="0.5"
                    value="${cardImageRadiusMm}"
                    aria-valuemin="${CARD_IMAGE_RADIUS_MIN_MM}"
                    aria-valuemax="${CARD_IMAGE_RADIUS_MAX_MM}"
                    aria-valuenow="${cardImageRadiusMm}"
                    aria-describedby="settings-card-image-radius-out"
                  />
                  <output id="settings-card-image-radius-out" for="settings-card-image-radius">${cardImageRadiusMm}&nbsp;mm</output>
                  ${formRangeResetMarkup()}
                </div>
              </div>
            </section>

            <section class="settings-panel">
              <h2 class="section-title">Impression</h2>
              <div class="form-field">
                <label class="form-label" for="settings-print-grid">Grille d’impression</label>
                <div class="form-range-row">
                  <input
                    type="range"
                    id="settings-print-grid"
                    min="${PRINT_GRID_MIN}"
                    max="${PRINT_GRID_MAX}"
                    step="1"
                    value="${printSettings.printGrid}"
                    aria-valuemin="${PRINT_GRID_MIN}"
                    aria-valuemax="${PRINT_GRID_MAX}"
                    aria-valuenow="${printSettings.printGrid}"
                    aria-valuetext="${printGridSize}"
                    aria-describedby="settings-print-grid-out"
                  />
                  <output id="settings-print-grid-out" for="settings-print-grid">${printGridSize}</output>
                  ${formRangeResetMarkup()}
                </div>
              </div>
              <div class="form-field">
                <p class="form-label" id="settings-card-sides-label">Côtés des cartes à imprimer</p>
                <div class="theme-mode-switch" role="radiogroup" aria-labelledby="settings-card-sides-label">
                  <button type="button" class="btn ${printSettings.cardSidesToPrint === "faceAndBack" ? "primary" : "secondary"}" data-card-sides="faceAndBack" aria-pressed="${printSettings.cardSidesToPrint === "faceAndBack"}">Face et dos</button>
                  <button type="button" class="btn ${printSettings.cardSidesToPrint === "faceOnly" ? "primary" : "secondary"}" data-card-sides="faceOnly" aria-pressed="${printSettings.cardSidesToPrint === "faceOnly"}">Face seulement</button>
                  <button type="button" class="btn ${printSettings.cardSidesToPrint === "backOnly" ? "primary" : "secondary"}" data-card-sides="backOnly" aria-pressed="${printSettings.cardSidesToPrint === "backOnly"}">Dos seulement</button>
                </div>
              </div>
              <div class="form-field" id="settings-recto-verso-field">
                <p class="form-label" id="settings-recto-verso-label">Impression recto-verso des feuilles</p>
                <div class="theme-mode-switch" role="radiogroup" aria-labelledby="settings-recto-verso-label" aria-describedby="settings-recto-verso-hint">
                  <button type="button" class="btn ${printSettings.sheetRectoVerso === "alternate" ? "primary" : "secondary"}" data-sheet-recto-verso="alternate" aria-pressed="${printSettings.sheetRectoVerso === "alternate"}">Alterner</button>
                  <button type="button" class="btn ${printSettings.sheetRectoVerso === "grouped" ? "primary" : "secondary"}" data-sheet-recto-verso="grouped" aria-pressed="${printSettings.sheetRectoVerso === "grouped"}">Regrouper</button>
                </div>
                <p class="form-hint" id="settings-recto-verso-hint"></p>
              </div>
            </section>

            <section class="settings-panel">
              <h2 class="section-title">Gestion de la collection</h2>
              ${tileListMarkup([
                {
                  title: "Importer",
                  desc: "Charger une sauvegarde pour ajouter ou fusionner un lot de cartes, thèmes ou paramètres",
                  icon: "upload",
                  tag: "button",
                  id: "settings-import",
                },
                {
                  title: "Sauvegarder",
                  desc: "Enregistrer une sauvegarde de la collection de cartes, thèmes et paramètres",
                  icon: "download",
                  tag: "button",
                  id: "settings-export",
                  disabled: cardCount === 0,
                },
                {
                  title: "Thèmes",
                  desc: "Gérer et personnaliser les thèmes disponibles",
                  href: "#themes",
                  icon: "palette",
                },
                {
                  title: "Supprimer toutes les cartes",
                  desc: "Retirer définitivement toutes les cartes, sans modifier les thèmes ni les paramètres enregistrés",
                  icon: "delete-bin-2",
                  tag: "button",
                  id: "settings-clear-cards",
                  danger: true,
                  disabled: cardCount === 0,
                },
              ])}
            </section>

            ${
              showDevReset
                ? `<section class="settings-panel">
              <h2 class="section-title">Options pour les développeurs</h2>
              ${tileListMarkup([
                {
                  title: "Espace développeur",
                  desc: "Aide au développement, système de design et documentation",
                  href: "#developer",
                  icon: "tools",
                },
                {
                  title: "Réinitialiser",
                  desc: "Supprimer toutes les données locales enregistrées (cartes, thèmes et paramètres)",
                  icon: "close-circle",
                  tag: "button",
                  id: "settings-dev-reset",
                  danger: true,
                },
              ])}
            </section>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  const backdrop = host.querySelector("#settings-modal-backdrop");
  const btnClose = host.querySelector("#btn-settings-close");
  const themeBtns = /** @type {NodeListOf<HTMLButtonElement>} */ (
    host.querySelectorAll("[data-theme-mode]")
  );
  const printSidesBtns = Array.from(host.querySelectorAll("[data-card-sides]"));
  const printDuplexBtns = Array.from(host.querySelectorAll("[data-sheet-recto-verso]"));
  const printDuplexField = host.querySelector("#settings-recto-verso-field");
  const printDuplexHint = host.querySelector("#settings-recto-verso-hint");

  /** @type {ReturnType<typeof bindFormRange>[]} */
  const rangeFields = [];

  /**
   * @param {string} id
   * @param {{ defaultValue: number|string, format?: (value: string) => string, onChange?: (value: string) => void }} opts
   */
  function bindSettingsRange(id, opts) {
    const row = host.querySelector(id)?.closest(".form-range-row");
    if (!(row instanceof HTMLElement)) return;
    rangeFields.push(bindFormRange(row, opts));
  }

  bindSettingsRange("#settings-list-cols", {
    defaultValue: listColsToSlider(DEFAULT_LIST_COLS_MAX),
    format: (v) => formatListColsLabel(listColsFromSlider(v)),
    onChange(value) {
      setListColsMax(listColsFromSlider(value));
    },
  });
  bindSettingsRange("#settings-face-border", {
    defaultValue: DEFAULT_FACE_BORDER_MM,
    format: (v) => `${v}\u00a0mm`,
    onChange(value) {
      setFaceBorderMm(value);
    },
  });
  bindSettingsRange("#settings-card-radius", {
    defaultValue: DEFAULT_CARD_RADIUS_MM,
    format: (v) => `${v}\u00a0mm`,
    onChange(value) {
      setCardRadiusMm(value);
    },
  });
  bindSettingsRange("#settings-card-image-radius", {
    defaultValue: DEFAULT_CARD_IMAGE_RADIUS_MM,
    format: (v) => `${v}\u00a0mm`,
    onChange(value) {
      setCardImageRadiusMm(value);
    },
  });

  const defaultColorRoot = /** @type {HTMLElement|null} */ (
    host.querySelector("#settings-default-color-hex")?.closest("[data-form-color]")
  );
  /** @type {ReturnType<typeof bindFormColor>|null} */
  let defaultColorField = null;
  if (defaultColorRoot) {
    defaultColorField = bindFormColor(defaultColorRoot, {
      fallbackColor: DEFAULT_THEME_COLOR,
      onChange(value) {
        const stored = setConfiguredCardColor(value);
        defaultColorField?.setValue(stored, DEFAULT_THEME_COLOR);
      },
    });
  }
  const close = () => onClose();

  function syncThemeButtons(mode) {
    themeBtns.forEach((btn) => {
      const on = btn.dataset.themeMode === mode;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("primary", on);
      btn.classList.toggle("secondary", !on);
    });
  }
  syncThemeButtons(currentTheme);

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = /** @type {"system"|"light"|"dark"} */ (btn.dataset.themeMode);
      if (!mode) return;
      setTheme(mode);
      syncThemeButtons(mode);
    });
  });

  let currentPrintSettings = printSettings;

  function syncPrintSidesButtons(cardSidesToPrint) {
    printSidesBtns.forEach((btn) => {
      const on = btn.getAttribute("data-card-sides") === cardSidesToPrint;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("primary", on);
      btn.classList.toggle("secondary", !on);
    });
  }

  function syncPrintDuplexButtons(sheetRectoVerso) {
    printDuplexBtns.forEach((btn) => {
      const on = btn.getAttribute("data-sheet-recto-verso") === sheetRectoVerso;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("primary", on);
      btn.classList.toggle("secondary", !on);
    });
  }

  function refreshPrintSettingsUi() {
    if (printDuplexField instanceof HTMLElement) {
      printDuplexField.hidden = currentPrintSettings.cardSidesToPrint !== "faceAndBack";
    }
    if (printDuplexHint instanceof HTMLElement) {
      printDuplexHint.textContent =
        currentPrintSettings.sheetRectoVerso === "grouped"
          ? "Tous les rectos d’abord, puis retourner la pile pour ensuite imprimer tous les versos."
          : "Une feuille à la fois (imprimante recto-verso).";
    }
    syncPrintSidesButtons(currentPrintSettings.cardSidesToPrint);
    syncPrintDuplexButtons(currentPrintSettings.sheetRectoVerso);
    syncPrintMenu();
  }

  /** @param {Partial<typeof currentPrintSettings>} partial */
  function persistPrintSettings(partial) {
    currentPrintSettings = setPrintSettings(partial);
    refreshPrintSettingsUi();
  }

  refreshPrintSettingsUi();

  bindSettingsRange("#settings-print-grid", {
    defaultValue: DEFAULT_PRINT_GRID,
    format: (v) => formatPrintGridSize(computePrintLayout(Number(v))),
    onChange(value) {
      persistPrintSettings({ printGrid: Number(value) });
    },
  });
  printSidesBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cardSidesToPrint = btn.getAttribute("data-card-sides");
      if (!cardSidesToPrint) return;
      persistPrintSettings({ cardSidesToPrint });
    });
  });
  printDuplexBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sheetRectoVerso = btn.getAttribute("data-sheet-recto-verso");
      if (!sheetRectoVerso) return;
      persistPrintSettings({ sheetRectoVerso });
    });
  });

  host.querySelector("#settings-import")?.addEventListener("click", () => {
    onImport();
  });

  host.querySelector("#settings-export")?.addEventListener("click", () => {
    onExport();
  });

  const clearCardsBtn = host.querySelector("#settings-clear-cards");
  if (clearCardsBtn && onClearCards) {
    clearCardsBtn.addEventListener("click", async () => {
      const ok = await confirmDialog(host, {
        title: "Supprimer toutes les cartes ?",
        icon: "delete-bin-2",
        message:
          "Toutes les cartes seront supprimées définitivement. Les thèmes et les réglages sont conservés.",
        okLabel: "Supprimer",
        danger: true,
      });
      if (!ok) return;
      clearCardsBtn.setAttribute("disabled", "true");
      try {
        await onClearCards();
      } finally {
        clearCardsBtn.removeAttribute("disabled");
      }
    });
  }

  const resetBtn = host.querySelector("#settings-dev-reset");
  if (resetBtn && onDevReset) {
    resetBtn.addEventListener("click", async () => {
      const ok = await confirmDialog(host, {
        title: "Réinitialiser toutes les données locales ?",
        icon: "close-circle",
        message:
          "Toutes les cartes, thèmes et réglages de la collection seront supprimés définitivement.",
        okLabel: "Réinitialiser",
        danger: true,
      });
      if (!ok) return;
      resetBtn.setAttribute("disabled", "true");
      try {
        await onDevReset();
      } finally {
        resetBtn.removeAttribute("disabled");
      }
    });
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
  document.addEventListener("keydown", onKey);

  function cleanup() {
    defaultColorField?.destroy();
    rangeFields.forEach((field) => field.destroy());
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
  }

  return cleanup;
}
