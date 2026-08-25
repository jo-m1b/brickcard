import { ICON_CLOSE, ICON_SEARCH_LINE, ICON_TOOLS, modalTitleMarkup } from "../icons.js";
import { bindFormColor, formColorMarkup } from "../form-color.js";
import { bindFormRange, formRangeResetMarkup } from "../form-range.js";
import { formCheckboxMarkup } from "../form-checkbox.js";
import { formRadioMarkup } from "../form-radio.js";
import { getOptimizeImages, setOptimizeImages } from "../image-optimize.js";
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
import { emptyViewMarkup } from "../empty-view.js";
import { confirmDialog } from "../confirm-dialog.js";
import { setAppDocumentTitle } from "../document-title.js";
import { syncPrintMenu } from "../print-menu.js";
import {
  DEFAULT_PRINT_GRID,
  PRINT_GRID_MAX,
  PRINT_GRID_MIN,
  computePrintLayout,
  formatPrintGridSize,
  getPrintSettings,
  normalizeCardSort,
  printCardSortRadiosMarkup,
  setPrintSettings,
} from "../print-settings.js";
import { includesCI } from "../includes-ci.js";

/**
 * Modale de configuration.
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{
 *   onClose: () => void,
 *   onClearCards?: () => void | Promise<void>,
 *   onDevReset?: () => void | Promise<void>,
 *   cardCount?: number,
 * }} opts
 * @returns {() => void} cleanup
 */
export function renderSettingsModal(host, opts) {
  const { onClose, onClearCards, onDevReset, cardCount = 0 } = opts;
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
        <div class="themes-toolbar">
          <div class="search-bar search-bar--input-only" id="settings-search-bar">
            <span class="form-control-icon" aria-hidden="true">${ICON_SEARCH_LINE}</span>
            <input
              class="form-control"
              type="search"
              id="settings-search"
              placeholder="Rechercher…"
              autocomplete="off"
              aria-label="Rechercher un paramètre"
            />
          </div>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="settings-sections">
            <section class="settings-panel">
              <h2 class="section-title">Interface</h2>
              <fieldset class="form-check-group">
                <legend class="form-label">Mode d’affichage</legend>
                <div class="form-check-list">
                  ${formRadioMarkup({
                    id: "settings-theme-light",
                    name: "settings-theme",
                    value: "light",
                    label: "Thème clair",
                    checked: currentTheme === "light",
                  })}
                  ${formRadioMarkup({
                    id: "settings-theme-dark",
                    name: "settings-theme",
                    value: "dark",
                    label: "Thème sombre",
                    checked: currentTheme === "dark",
                  })}
                  ${formRadioMarkup({
                    id: "settings-theme-system",
                    name: "settings-theme",
                    value: "system",
                    label: "Système",
                    hint: "Utilise les paramètres système",
                    checked: currentTheme === "system",
                  })}
                </div>
              </fieldset>
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
              <div class="form-field">
                ${formCheckboxMarkup({
                  id: "settings-optimize-images",
                  label: "Optimiser les images",
                  hint: "Convertir automatiquement les nouvelles images ajoutées à la collection dans un format optimisé",
                  checked: getOptimizeImages(),
                })}
              </div>
            </section>

            <section class="settings-panel">
              <h2 class="section-title">Apparence des cartes</h2>
              <div class="form-field">
                <label class="form-label" for="settings-default-color-hex">Couleur par défaut</label>
                <p class="form-hint" id="settings-default-color-hint">Couleur appliquée par défaut aux cartes sans thème ou sans couleur personnalisée</p>
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
              <fieldset class="form-check-group">
                <legend class="form-label">Tri des cartes</legend>
                <div class="form-check-list form-check-list--row">
                  ${printCardSortRadiosMarkup({
                    idPrefix: "settings-card-sort",
                    name: "settings-card-sort",
                    selected: printSettings.cardSort,
                  })}
                </div>
              </fieldset>
              <fieldset class="form-check-group">
                <legend class="form-label">Côtés des cartes à imprimer</legend>
                <div class="form-check-list form-check-list--row">
                  ${formRadioMarkup({
                    id: "settings-card-sides-face-and-back",
                    name: "settings-card-sides",
                    value: "faceAndBack",
                    label: "Face et dos",
                    checked: printSettings.cardSidesToPrint === "faceAndBack",
                  })}
                  ${formRadioMarkup({
                    id: "settings-card-sides-face-only",
                    name: "settings-card-sides",
                    value: "faceOnly",
                    label: "Face seulement",
                    checked: printSettings.cardSidesToPrint === "faceOnly",
                  })}
                  ${formRadioMarkup({
                    id: "settings-card-sides-back-only",
                    name: "settings-card-sides",
                    value: "backOnly",
                    label: "Dos seulement",
                    checked: printSettings.cardSidesToPrint === "backOnly",
                  })}
                </div>
              </fieldset>
              <fieldset class="form-check-group" id="settings-recto-verso-field">
                <legend class="form-label">Impression recto-verso des feuilles</legend>
                <div class="form-check-list">
                  ${formRadioMarkup({
                    id: "settings-recto-verso-alternate",
                    name: "settings-recto-verso",
                    value: "alternate",
                    label: "Alterner",
                    hint: "Une feuille à la fois (imprimante recto-verso)",
                    checked: printSettings.sheetRectoVerso === "alternate",
                  })}
                  ${formRadioMarkup({
                    id: "settings-recto-verso-grouped",
                    name: "settings-recto-verso",
                    value: "grouped",
                    label: "Regrouper",
                    hint: "Tous les rectos d’abord, puis retourner la pile pour ensuite imprimer tous les versos",
                    checked: printSettings.sheetRectoVerso === "grouped",
                  })}
                </div>
              </fieldset>
            </section>

            <section class="settings-panel">
              <h2 class="section-title">Gestion de votre collection</h2>
              ${tileListMarkup([
                {
                  title: "Importer",
                  desc: "Charger une sauvegarde pour ajouter ou fusionner un lot de cartes, thèmes ou paramètres à votre collection",
                  icon: "upload",
                  href: "#import",
                },
                {
                  title: "Sauvegarder",
                  desc: "Enregistrer une sauvegarde de votre collection de cartes, thèmes et paramètres",
                  icon: "download",
                  href: "#backup",
                },
                {
                  title: "Thèmes",
                  desc: "Gérer les thèmes disponibles pour votre collection",
                  href: "#themes",
                  icon: "palette",
                },
                {
                  title: "Supprimer toutes les cartes",
                  desc: "Retirer toutes les cartes de votre collection (conserve les thèmes et les paramètres enregistrés)",
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
          ${emptyViewMarkup({
            id: "settings-empty-filter",
            hidden: true,
            titleTag: "p",
            title: "Oups !",
            text: "Aucun paramètre ne correspond à la recherche.",
          })}
        </div>
      </div>
    </div>
  `;

  setAppDocumentTitle("Paramètres");

  const backdrop = host.querySelector("#settings-modal-backdrop");
  const btnClose = host.querySelector("#btn-settings-close");
  const searchInput = /** @type {HTMLInputElement|null} */ (host.querySelector("#settings-search"));
  const settingsSections = host.querySelector(".settings-sections");
  const emptyFilter = host.querySelector("#settings-empty-filter");
  const themeInputs = host.querySelectorAll('input[name="settings-theme"]');
  const printSortInputs = host.querySelectorAll('input[name="settings-card-sort"]');
  const printSidesInputs = host.querySelectorAll('input[name="settings-card-sides"]');
  const printDuplexInputs = host.querySelectorAll('input[name="settings-recto-verso"]');
  const printDuplexField = host.querySelector("#settings-recto-verso-field");

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

  const optimizeInput = host.querySelector("#settings-optimize-images");
  /** @param {Event} e */
  const onOptimizeChange = (e) => {
    const input = e.currentTarget;
    if (input instanceof HTMLInputElement) setOptimizeImages(input.checked);
  };
  optimizeInput?.addEventListener("change", onOptimizeChange);
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

  /** @param {Event} e */
  const onThemeChange = (e) => {
    const input = e.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.checked) return;
    if (input.value !== "light" && input.value !== "dark" && input.value !== "system") {
      return;
    }
    setTheme(input.value);
  };
  themeInputs.forEach((input) => input.addEventListener("change", onThemeChange));

  let currentPrintSettings = printSettings;

  /** @param {ParentNode} root @param {string} needle */
  function matchesLabels(root, needle) {
    if (!needle) return true;
    for (const el of root.querySelectorAll(".form-label, .form-hint")) {
      if (includesCI(el.textContent || "", needle)) return true;
    }
    return false;
  }

  function applyFilter() {
    const needle = (searchInput?.value || "").trim();
    const duplexAllowed = currentPrintSettings.cardSidesToPrint === "faceAndBack";
    let anyPanel = false;
    settingsSections?.querySelectorAll(":scope > .settings-panel").forEach((panel) => {
      const titleMatch =
        !needle || includesCI(panel.querySelector(":scope > .section-title")?.textContent || "", needle);
      let anyChild = false;
      panel.querySelectorAll(":scope > .form-field").forEach((field) => {
        const show = titleMatch || matchesLabels(field, needle);
        field.hidden = !show;
        if (show) anyChild = true;
      });
      panel.querySelectorAll(":scope > .form-check-group").forEach((group) => {
        const duplexBlocked = group === printDuplexField && !duplexAllowed;
        const show = !duplexBlocked && (titleMatch || matchesLabels(group, needle));
        group.hidden = !show;
        if (show) anyChild = true;
      });
      panel.querySelectorAll(":scope > .tile-list").forEach((list) => {
        let anyTile = false;
        list.querySelectorAll(":scope > li").forEach((li) => {
          const href = li.querySelector("a.tile")?.getAttribute("href") || "";
          const show =
            titleMatch ||
            includesCI(li.querySelector(".tile-title")?.textContent || "", needle) ||
            includesCI(li.querySelector(".tile-desc")?.textContent || "", needle) ||
            includesCI(href, needle);
          li.hidden = !show;
          if (show) anyTile = true;
        });
        list.hidden = !anyTile;
        if (anyTile) anyChild = true;
      });
      panel.hidden = !anyChild;
      if (anyChild) anyPanel = true;
    });
    if (settingsSections) settingsSections.hidden = !anyPanel;
    if (emptyFilter) emptyFilter.hidden = anyPanel;
  }

  function refreshPrintSettingsUi() {
    applyFilter();
    syncPrintMenu();
  }

  function onSearchInput() {
    applyFilter();
  }

  /** @param {Partial<typeof currentPrintSettings>} partial */
  function persistPrintSettings(partial) {
    currentPrintSettings = setPrintSettings(partial);
    refreshPrintSettingsUi();
  }

  refreshPrintSettingsUi();
  searchInput?.addEventListener("input", onSearchInput);

  bindSettingsRange("#settings-print-grid", {
    defaultValue: DEFAULT_PRINT_GRID,
    format: (v) => formatPrintGridSize(computePrintLayout(Number(v))),
    onChange(value) {
      persistPrintSettings({ printGrid: Number(value) });
    },
  });
  /** @param {Event} e */
  const onPrintSortChange = (e) => {
    const input = e.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.checked) return;
    persistPrintSettings({ cardSort: normalizeCardSort(input.value) });
  };
  /** @param {Event} e */
  const onPrintSidesChange = (e) => {
    const input = e.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.checked) return;
    if (input.value !== "faceAndBack" && input.value !== "faceOnly" && input.value !== "backOnly") {
      return;
    }
    persistPrintSettings({ cardSidesToPrint: input.value });
  };
  /** @param {Event} e */
  const onPrintDuplexChange = (e) => {
    const input = e.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.checked) return;
    if (input.value !== "alternate" && input.value !== "grouped") return;
    persistPrintSettings({ sheetRectoVerso: input.value });
  };
  printSortInputs.forEach((input) => input.addEventListener("change", onPrintSortChange));
  printSidesInputs.forEach((input) => input.addEventListener("change", onPrintSidesChange));
  printDuplexInputs.forEach((input) => input.addEventListener("change", onPrintDuplexChange));

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
    themeInputs.forEach((input) => input.removeEventListener("change", onThemeChange));
    printSortInputs.forEach((input) => input.removeEventListener("change", onPrintSortChange));
    printSidesInputs.forEach((input) => input.removeEventListener("change", onPrintSidesChange));
    printDuplexInputs.forEach((input) => input.removeEventListener("change", onPrintDuplexChange));
    optimizeInput?.removeEventListener("change", onOptimizeChange);
    searchInput?.removeEventListener("input", onSearchInput);
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
  }

  return cleanup;
}
