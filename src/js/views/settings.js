import { ICON_CLOSE } from "../icons.js";
import { bindFormColor, formColorMarkup } from "../form-color.js";
import { getTheme, setTheme } from "../theme.js";
import {
  CARD_RADIUS_MAX_MM,
  CARD_RADIUS_MIN_MM,
  FACE_BORDER_MAX_MM,
  FACE_BORDER_MIN_MM,
  getCardRadiusMm,
  getConfiguredCardColor,
  getConfiguredCardColorDisplay,
  getFaceBorderMm,
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
import { DEFAULT_THEME_COLOR, isLocalDevHost } from "../themes-data.js";
import { tileListMarkup } from "../tile.js";
import { confirmDialog } from "../confirm-dialog.js";

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
  const showDevReset = Boolean(onDevReset) && isLocalDevHost();
  const currentTheme = getTheme();
  const faceBorderMm = getFaceBorderMm();
  const cardRadiusMm = getCardRadiusMm();
  const configuredColor = getConfiguredCardColor();
  const configuredColorDisplay = getConfiguredCardColorDisplay();
  const listColsMax = getListColsMax();
  const listColsSlider = listColsToSlider(listColsMax);

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="settings-modal-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="settings-modal-title">Paramètres</h1>
            <p class="view-desc">Options et configuration de l'application</p>
          </div>
          <button type="button" class="btn ghost icon-only modal-close" id="btn-settings-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body">
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
                </div>
              </div>
            </section>

            <section class="settings-panel">
              <h2 class="section-title">Apparence des cartes</h2>
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
                </div>
              </div>
              <div class="form-field settings-color-field">
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
            </section>

            <section class="settings-panel">
              <h2 class="section-title">Gestion de la collection</h2>
              ${tileListMarkup([
                {
                  title: "Importer",
                  desc: "Ajouter, fusionner ou remplacer un lot de cartes à partir d’une sauvegarde JSON",
                  icon: "upload",
                  tag: "button",
                  id: "settings-import",
                },
                {
                  title: "Sauvegarder",
                  desc: "Télécharger une sauvegarde des cartes et des thèmes au format JSON",
                  icon: "download",
                  tag: "button",
                  id: "settings-export",
                },
                {
                  title: "Gérer les thèmes",
                  desc: "Thèmes par défaut et thèmes personnalisés",
                  href: "#/themes",
                  icon: "palette",
                },
                {
                  title: "Supprimer toutes les cartes",
                  desc: "Retirer définitivement les cartes, sans modifier les thèmes ni les réglages",
                  icon: "delete-bin",
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
                  desc: "Système de design, exemples et documentation",
                  href: "#/developer",
                  icon: "tools",
                },
                {
                  title: "Réinitialiser",
                  desc: "Supprimer toutes les données locales du navigateur (cartes, thèmes et réglages)",
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
  const faceBorderInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#settings-face-border")
  );
  const faceBorderOut = host.querySelector("#settings-face-border-out");
  const cardRadiusInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#settings-card-radius")
  );
  const cardRadiusOut = host.querySelector("#settings-card-radius-out");
  const listColsInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#settings-list-cols")
  );
  const listColsOut = host.querySelector("#settings-list-cols-out");

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

  if (listColsInput) {
    const syncListCols = () => {
      const value = setListColsMax(listColsFromSlider(listColsInput.value));
      const slider = listColsToSlider(value);
      listColsInput.value = String(slider);
      listColsInput.setAttribute("aria-valuenow", String(slider));
      listColsInput.setAttribute("aria-valuetext", formatListColsLabel(value));
      if (listColsOut) listColsOut.textContent = formatListColsLabel(value);
    };
    listColsInput.addEventListener("input", syncListCols);
    listColsInput.addEventListener("change", syncListCols);
  }

  if (faceBorderInput) {
    const syncFaceBorder = () => {
      const value = setFaceBorderMm(faceBorderInput.value);
      faceBorderInput.value = String(value);
      faceBorderInput.setAttribute("aria-valuenow", String(value));
      if (faceBorderOut) faceBorderOut.textContent = `${value}\u00a0mm`;
    };
    faceBorderInput.addEventListener("input", syncFaceBorder);
    faceBorderInput.addEventListener("change", syncFaceBorder);
  }

  if (cardRadiusInput) {
    const syncCardRadius = () => {
      const value = setCardRadiusMm(cardRadiusInput.value);
      cardRadiusInput.value = String(value);
      cardRadiusInput.setAttribute("aria-valuenow", String(value));
      if (cardRadiusOut) cardRadiusOut.textContent = `${value}\u00a0mm`;
    };
    cardRadiusInput.addEventListener("input", syncCardRadius);
    cardRadiusInput.addEventListener("change", syncCardRadius);
  }

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
        subtitle: "Vider la collection",
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
        title: "Réinitialiser ?",
        subtitle: "Supprimer toutes les données locales du navigateur",
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
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
  }

  return cleanup;
}
