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

/**
 * Modale de configuration.
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{
 *   onClose: () => void,
 *   onImport: () => void,
 *   onExport: () => void | Promise<void>,
 *   onThemes: () => void,
 *   onDevReset?: () => void | Promise<void>,
 * }} opts
 * @returns {() => void} cleanup
 */
export function renderSettingsModal(host, opts) {
  const { onClose, onImport, onExport, onThemes, onDevReset } = opts;
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
      <div class="modal modal-settings" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div class="modal-header">
          <div>
            <h2 class="view-title" id="settings-modal-title">Paramètres</h2>
            <p class="view-desc">Configuration de Brickcard Generator</p>
          </div>
          <button type="button" class="btn-icon modal-close" id="btn-settings-close" aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.586L16.95 5.63599L18.364 7.04999L13.414 12L18.364 16.95L16.95 18.364L12 13.414L7.04999 18.364L5.63599 16.95L10.586 12L5.63599 7.04999L7.04999 5.63599L12 10.586Z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="settings-sections">
            <section class="settings-panel">
              <h3 class="settings-panel-title">Affichage</h3>
              <p class="settings-panel-desc">Thème de l’interface et densité de la liste de cartes.</p>
              <div class="settings-subblock">
                <h4 class="settings-subblock-title">Mode d’affichage</h4>
                <p class="settings-panel-desc settings-panel-desc--tight">Clair, sombre, ou suivre le thème du système.</p>
                <div class="theme-mode-switch" role="radiogroup" aria-label="Mode d’affichage">
                  <button type="button" class="theme-mode-btn" data-theme-mode="system" aria-pressed="${currentTheme === "system"}">Système</button>
                  <button type="button" class="theme-mode-btn" data-theme-mode="light" aria-pressed="${currentTheme === "light"}">Clair</button>
                  <button type="button" class="theme-mode-btn" data-theme-mode="dark" aria-pressed="${currentTheme === "dark"}">Sombre</button>
                </div>
              </div>
              <div class="settings-subblock">
                <h4 class="settings-subblock-title">Liste des cartes</h4>
                <div class="settings-control-row">
                  <label for="settings-list-cols">Cartes par ligne (max)</label>
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
                    aria-describedby="settings-list-cols-out settings-list-cols-hint"
                  />
                  <output id="settings-list-cols-out" for="settings-list-cols">${formatListColsLabel(listColsMax)}</output>
                </div>
                <p class="settings-panel-hint" id="settings-list-cols-hint">De ${LIST_COLS_MIN} à ${LIST_COLS_MAX}, ou ∞ (pas de limite). Sur écran étroit, moins de cartes s’affichent par ligne. Défaut&nbsp;: ${DEFAULT_LIST_COLS_MAX}.</p>
              </div>
            </section>

            <section class="settings-panel">
              <h3 class="settings-panel-title">Design des cartes</h3>
              <p class="settings-panel-desc">Réglages d’apparence des cartes. Appliqués à l’aperçu et à l’impression. La couleur par défaut sert quand le thème n’a pas de couleur (ou qu’il n’y a pas de thème).</p>
              <div class="settings-control-row">
                <label for="settings-face-border">Bordure (face)</label>
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
              <div class="settings-control-row">
                <label for="settings-card-radius">Coins arrondis</label>
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
              <div class="settings-color-field">
                <label for="settings-default-color-hex">Couleur par défaut</label>
                <div class="color-row">
                  <input type="color" id="settings-default-color" value="${configuredColorDisplay}" title="Choisir une couleur" />
                  <input type="text" id="settings-default-color-hex" value="${configuredColor}" maxlength="7" placeholder="${DEFAULT_THEME_COLOR}" />
                  <button type="button" class="btn ghost sm" id="settings-default-color-clear" ${configuredColor ? "" : "hidden"}>Effacer</button>
                </div>
                <p class="settings-panel-hint">Sans couleur configurée → gris d’usine (${DEFAULT_THEME_COLOR}).</p>
              </div>
            </section>

            <section class="settings-panel">
              <h3 class="settings-panel-title">Importer</h3>
              <p class="settings-panel-desc">Charge un fichier JSON pour restaurer ou fusionner tes cartes et thèmes.</p>
              <button type="button" class="btn secondary" id="settings-import">Importer un fichier…</button>
            </section>

            <section class="settings-panel">
              <h3 class="settings-panel-title">Sauvegarder</h3>
              <p class="settings-panel-desc">Télécharge toutes tes cartes et thèmes dans un fichier JSON.</p>
              <button type="button" class="btn secondary" id="settings-export">Télécharger la sauvegarde</button>
            </section>

            <section class="settings-panel">
              <h3 class="settings-panel-title">Thèmes LEGO</h3>
              <p class="settings-panel-desc">Gère les thèmes (nom, couleur, logo) utilisés sur les cartes.</p>
              <button type="button" class="btn secondary" id="settings-themes">Gérer les thèmes</button>
            </section>

            ${
              showDevReset
                ? `<section class="settings-panel settings-panel-danger">
              <h3 class="settings-panel-title">Reset local (dev)</h3>
              <p class="settings-panel-desc">Vide IndexedDB, le localStorage et le cache, puis recharge l’app. Visible uniquement en local.</p>
              <button type="button" class="btn danger" id="settings-dev-reset">Réinitialiser les données locales</button>
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
  const defaultColorInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#settings-default-color")
  );
  const defaultColorHex = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#settings-default-color-hex")
  );
  const defaultColorClear = /** @type {HTMLButtonElement|null} */ (
    host.querySelector("#settings-default-color-clear")
  );
  const listColsInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#settings-list-cols")
  );
  const listColsOut = host.querySelector("#settings-list-cols-out");

  const close = () => {
    cleanup();
    onClose();
  };

  function syncThemeButtons(mode) {
    themeBtns.forEach((btn) => {
      const on = btn.dataset.themeMode === mode;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
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

  function syncDefaultColorUi(stored) {
    const display = stored || DEFAULT_THEME_COLOR;
    if (defaultColorInput) defaultColorInput.value = display;
    if (defaultColorHex) defaultColorHex.value = stored;
    if (defaultColorClear) defaultColorClear.hidden = !stored;
  }

  if (defaultColorInput && defaultColorHex) {
    defaultColorInput.addEventListener("input", () => {
      const value = setConfiguredCardColor(defaultColorInput.value);
      syncDefaultColorUi(value);
    });
    defaultColorHex.addEventListener("change", () => {
      let raw = defaultColorHex.value.trim();
      if (raw && !raw.startsWith("#")) raw = `#${raw}`;
      const value = setConfiguredCardColor(raw);
      syncDefaultColorUi(value);
    });
    defaultColorClear?.addEventListener("click", () => {
      const value = setConfiguredCardColor("");
      syncDefaultColorUi(value);
    });
  }

  host.querySelector("#settings-import")?.addEventListener("click", () => {
    onImport();
  });

  host.querySelector("#settings-export")?.addEventListener("click", () => {
    onExport();
  });

  host.querySelector("#settings-themes")?.addEventListener("click", () => {
    close();
    onThemes();
  });

  const resetBtn = host.querySelector("#settings-dev-reset");
  if (resetBtn && onDevReset) {
    resetBtn.addEventListener("click", async () => {
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
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
    host.innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  return cleanup;
}
