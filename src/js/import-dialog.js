/**
 * Modale d’import de sauvegarde (`#import`).
 * Étape 1 : charger un `.brickcard` (fichier ou URL) sans toucher à la collection.
 * Étape 2 : choisir quoi fusionner. L’écriture n’a lieu qu’au clic Importer.
 * Fermeture (X, Échap, backdrop, Annuler, ou après un import réussi) → accueil.
 * Accueil vide : `openDemoBackupDialog` charge `data/backup-demo-jo.brickcard` et fusionne sans étape de choix.
 */

import {
  ICON_CLOSE,
  ICON_CLOUD,
  ICON_EMOTION,
  ICON_FILE_LINE,
  ICON_LINK,
  ICON_UPLOAD,
  modalTitleMarkup,
} from "./icons.js";
import { popModalDocumentTitle, pushModalDocumentTitle, setAppDocumentTitle } from "./document-title.js";
import { formCheckboxMarkup } from "./form-checkbox.js";
import { focusTopModal } from "./modal-focus.js";
import { getPresetThemes } from "./themes-data.js";
import { importBackup } from "./storage.js";
import { loadingViewMarkup } from "./empty-view.js";
import { linkMarkup } from "./link.js";
import { TOAST_DELAY_BACKUP } from "./toast.js";
import {
  BACKUP_INVALID,
  BACKUP_URL_INVALID,
  CARD_APPEARANCE_SETTING_COUNT,
  DEMO_BACKUP_SRC,
  UNTHEMED_BACKUP_THEME_ID,
  backupPayloadBytes,
  buildImportPayload,
  countBackupCardImages,
  countBackupThemeLogos,
  estimateThemeCardsBytes,
  fetchBackupAsText,
  formatBackupFooterRecap,
  formatBackupThemeChoiceHint,
  formatBackupToastRecap,
  groupCardsForBackup,
  isBrickcardBackupFilename,
  isImportPayloadEmpty,
  listImportThemeChoices,
  parseBrickcardBackup,
} from "./backup.js";

const UNTHEMED_VALUE = "none";

/**
 * Toast après un import réussi (même recap que le pied `#import-dialog-recap`).
 * @param {(msg: string | object, type?: string) => void} [toast]
 * @param {unknown} payload
 * @param {{ title?: string, icon?: string }} [opts]
 */
function toastImportedBackup(toast, payload, opts = {}) {
  const data = payload && typeof payload === "object" ? /** @type {Record<string, unknown>} */ (payload) : {};
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const themes = Array.isArray(data.themes) ? data.themes : [];
  const settings =
    data.settings && typeof data.settings === "object"
      ? /** @type {Record<string, unknown>} */ (data.settings)
      : null;
  const recap = formatBackupToastRecap({
    cardCount: cards.length,
    themeCount: themes.length,
    settingCount: settings?.cardAppearance ? CARD_APPEARANCE_SETTING_COUNT : 0,
    bytes: backupPayloadBytes(payload),
  });
  toast?.({
    type: "success",
    title: opts.title || "Sauvegarde importée",
    ...(opts.icon ? { icon: opts.icon } : {}),
    message: recap.message,
    messageHtml: recap.messageHtml,
    delay: TOAST_DELAY_BACKUP,
  });
}

let urlDialogSeq = 0;

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Modale « Charger depuis une URL » (enfant, sans route).
 * @param {HTMLElement} host
 * @returns {Promise<{ backup: import("./backup.js").BackupData, href: string }|null>}
 */
function openBackupUrlDialog(host) {
  if (!host) return Promise.resolve(null);

  return new Promise((resolve) => {
    const uid = `import-backup-url-${++urlDialogSeq}`;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = `${uid}-backdrop`;
    backdrop.setAttribute("role", "presentation");

    const addedModalOpen = !document.body.classList.contains("modal-open");
    if (addedModalOpen) document.body.classList.add("modal-open");

    const inputId = `${uid}-input`;
    const errorId = `${uid}-error`;

    backdrop.innerHTML = `
      <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="${uid}-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="${uid}-title">${modalTitleMarkup("Charger depuis une URL", ICON_LINK)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" data-url-dismiss>
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="form-field">
            <label class="form-label" for="${inputId}">URL</label>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_CLOUD}</span>
              <input
                class="form-control"
                type="text"
                id="${inputId}"
                inputmode="url"
                placeholder="https://…/sauvegarde.brickcard"
                autocomplete="off"
                spellcheck="false"
                aria-describedby="${errorId}"
              />
            </div>
            <p class="form-error" id="${errorId}" role="alert"></p>
          </div>
          <div class="url-dialog-loading" id="${uid}-loading" hidden>
            ${loadingViewMarkup({ titleTag: "p" })}
          </div>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-end">
            <button type="button" class="btn secondary sm" data-url-dismiss>Annuler</button>
            <button type="button" class="btn primary" data-url-load>${ICON_UPLOAD}<span>Charger</span></button>
          </div>
        </div>
      </div>
    `;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const input = /** @type {HTMLInputElement|null} */ (backdrop.querySelector(`#${inputId}`));
    const errorEl = backdrop.querySelector(`#${errorId}`);
    const loadBtn = /** @type {HTMLButtonElement|null} */ (backdrop.querySelector("[data-url-load]"));
    const loadingEl = backdrop.querySelector(`#${uid}-loading`);
    const dismissBtns = backdrop.querySelectorAll("[data-url-dismiss]");

    let settled = false;
    let loading = false;

    const mo = new MutationObserver(() => {
      if (!backdrop.isConnected) finish(null);
    });

    /** @param {{ backup: import("./backup.js").BackupData, href: string }|null} value */
    function finish(value) {
      if (settled) return;
      settled = true;
      mo.disconnect();
      document.removeEventListener("keydown", onKey, true);
      backdrop.remove();
      popModalDocumentTitle();
      if (addedModalOpen) document.body.classList.remove("modal-open");
      previouslyFocused?.focus?.();
      resolve(value);
    }

    function setError(message) {
      const msg = String(message || "");
      if (errorEl) errorEl.textContent = msg;
      if (input) {
        input.classList.toggle("is-invalid", Boolean(msg));
        input.setAttribute("aria-invalid", msg ? "true" : "false");
      }
    }

    function setLoading(on) {
      loading = on;
      if (loadBtn) loadBtn.disabled = on;
      if (input) input.disabled = on;
      backdrop.setAttribute("aria-busy", on ? "true" : "false");
      if (loadingEl instanceof HTMLElement) loadingEl.hidden = !on;
    }

    async function loadFromUrl() {
      if (loading) return;
      const url = String(input?.value || "").trim();
      if (!url) {
        setError(BACKUP_URL_INVALID);
        input?.focus();
        return;
      }
      setError("");
      setLoading(true);
      try {
        const text = await fetchBackupAsText(url);
        const backup = parseBrickcardBackup(text);
        finish({ backup, href: url });
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err && err.message
            ? String(err.message)
            : BACKUP_URL_INVALID;
        setError(message);
        setLoading(false);
        input?.focus();
      }
    }

    /** @param {KeyboardEvent} e */
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (!backdrop.isConnected) {
        finish(null);
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      finish(null);
    }

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) finish(null);
    });
    dismissBtns.forEach((btn) => {
      btn.addEventListener("click", () => finish(null));
    });
    loadBtn?.addEventListener("click", () => {
      loadFromUrl();
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      loadFromUrl();
    });
    input?.addEventListener("input", () => {
      if (errorEl && errorEl.textContent) setError("");
    });

    document.addEventListener("keydown", onKey, true);
    host.appendChild(backdrop);
    pushModalDocumentTitle("Charger depuis une URL");
    mo.observe(host, { childList: true });
    queueMicrotask(() => focusTopModal());
  });
}

const DEMO_BACKUP_TITLE = "Sauvegarde de démonstration";

/**
 * Charge `data/backup-demo-jo.brickcard` et fusionne toute la sauvegarde (sans étape de choix).
 * Modale enfant `modal--sm`, sans route : brique + « Chargement... » jusqu’à la fin.
 * @param {HTMLElement} host `#modal-root`
 * @param {{
 *   toast?: (msg: string, type?: string) => void,
 *   onImported?: () => void | Promise<void>,
 * }} [opts]
 * @returns {Promise<boolean>} `true` si l’import a réussi
 */
export function openDemoBackupDialog(host, opts = {}) {
  const { toast, onImported } = opts;
  if (!host) {
    toast?.("Modale indisponible", "error");
    return Promise.resolve(false);
  }
  if (host.querySelector("#demo-backup-dialog-backdrop")) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = "demo-backup-dialog-backdrop";
    backdrop.setAttribute("role", "presentation");

    const addedModalOpen = !document.body.classList.contains("modal-open");
    if (addedModalOpen) document.body.classList.add("modal-open");

    backdrop.innerHTML = `
      <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="demo-backup-dialog-title" aria-busy="true" tabindex="-1">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="demo-backup-dialog-title">${modalTitleMarkup(DEMO_BACKUP_TITLE, ICON_EMOTION)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" data-demo-dismiss>
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          ${loadingViewMarkup({ titleTag: "p", errorId: "demo-backup-error" })}
        </div>
      </div>
    `;

    const ac = new AbortController();
    let settled = false;
    let importing = false;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const mo = new MutationObserver(() => {
      if (!backdrop.isConnected) finish(false);
    });

    /** @param {boolean} ok */
    function finish(ok) {
      if (settled) return;
      settled = true;
      ac.abort();
      mo.disconnect();
      document.removeEventListener("keydown", onKey, true);
      backdrop.remove();
      popModalDocumentTitle();
      if (addedModalOpen) document.body.classList.remove("modal-open");
      previouslyFocused?.focus?.();
      resolve(ok);
    }

    function requestClose() {
      if (importing) return;
      finish(false);
    }

    /** @param {string} message */
    function showError(message) {
      importing = false;
      const closeBtn = backdrop.querySelector("[data-demo-dismiss]");
      if (closeBtn instanceof HTMLButtonElement) closeBtn.disabled = false;
      const modal = backdrop.querySelector(".modal");
      const view = backdrop.querySelector(".empty-view");
      const errorEl = backdrop.querySelector("#demo-backup-error");
      modal?.setAttribute("aria-busy", "false");
      view?.removeAttribute("aria-busy");
      if (errorEl instanceof HTMLElement) {
        errorEl.hidden = false;
        errorEl.textContent = message;
      }
    }

    async function run() {
      try {
        const href = new URL(DEMO_BACKUP_SRC, document.baseURI).href;
        const text = await fetchBackupAsText(href, { signal: ac.signal });
        if (settled) return;
        const backup = parseBrickcardBackup(text);
        importing = true;
        const closeBtn = backdrop.querySelector("[data-demo-dismiss]");
        if (closeBtn instanceof HTMLButtonElement) closeBtn.disabled = true;
        await importBackup(backup, { mode: "merge" });
        if (settled) return;
        toastImportedBackup(toast, backup, {
          title: "Démonstration importée",
          icon: "emotion",
        });
        await onImported?.();
        finish(true);
      } catch (err) {
        if (settled) return;
        if (err && typeof err === "object" && "name" in err && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error && err.message ? err.message : "Import impossible";
        showError(message);
        toast?.(message, "error");
      }
    }

    /** @param {KeyboardEvent} e */
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (!backdrop.isConnected) {
        finish(false);
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      requestClose();
    }

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) requestClose();
    });
    backdrop.querySelector("[data-demo-dismiss]")?.addEventListener("click", () => {
      requestClose();
    });

    document.addEventListener("keydown", onKey, true);
    host.appendChild(backdrop);
    pushModalDocumentTitle(DEMO_BACKUP_TITLE);
    mo.observe(host, { childList: true });
    queueMicrotask(() => focusTopModal());
    run();
  });
}

/**
 * @param {HTMLElement} host `#modal-root`
 * @param {{
 *   onClose: () => void,
 *   onImported?: () => void,
 *   toast?: (msg: string, type?: string) => void,
 * }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderImportDialog(host, opts) {
  const { onClose, onImported, toast } = opts;
  const presets = await getPresetThemes();

  /** @type {import("./backup.js").BackupData|null} */
  let backup = null;
  let sourceLabel = "";
  let sourceHref = "";
  /** @type {import("./themes-data.js").LegoTheme[]} */
  let themesForGrouping = [];
  /** @type {{ id: string, name: string, cardCount: number, isCustom: boolean }[]} */
  let themeChoices = [];
  const selectedThemeIds = new Set();
  let includeSettings = true;
  let includeImages = true;
  let includeThemeLogos = true;
  let hasCardImages = false;
  let hasThemeLogos = false;
  let hasSettings = false;
  let importing = false;
  let loading = false;
  /** @type {(() => void)|null} */
  let unbindChoose = null;

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop collection-xfer-dialog" id="import-dialog-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title" aria-describedby="import-dialog-recap">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="import-dialog-title">${modalTitleMarkup("Importer une sauvegarde", ICON_UPLOAD)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-import-dialog-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1" id="import-dialog-body"></div>
        <div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-start">
            <p class="view-desc" id="import-dialog-recap"></p>
          </div>
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-import-dialog-run" disabled>
              ${ICON_UPLOAD}
              <span>Importer</span>
            </button>
            <button type="button" class="btn secondary sm" id="btn-import-dialog-cancel">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  setAppDocumentTitle("Importer une sauvegarde");

  const backdrop = host.querySelector("#import-dialog-backdrop");
  const modalEl = backdrop?.querySelector(".modal");
  const bodyEl = host.querySelector("#import-dialog-body");
  const recapEl = host.querySelector("#import-dialog-recap");
  const runBtn = host.querySelector("#btn-import-dialog-run");
  const btnClose = host.querySelector("#btn-import-dialog-close");
  const btnCancel = host.querySelector("#btn-import-dialog-cancel");
  const close = () => {
    if (importing) return;
    onClose();
  };

  function themeChoiceHint(choice) {
    const group = groupCardsForBackup(backup?.cards || [], themesForGrouping).get(choice.id) || [];
    return formatBackupThemeChoiceHint(
      choice.cardCount,
      estimateThemeCardsBytes(group, includeImages)
    );
  }

  function currentPayload() {
    if (!backup) {
      return { version: "", app: "", cards: [], themes: [] };
    }
    return buildImportPayload(backup, {
      themes: themesForGrouping,
      selectedThemeIds: [...selectedThemeIds],
      includeSettings: hasSettings && includeSettings,
      includeImages: !hasCardImages || includeImages,
      includeThemeLogos: !hasThemeLogos || includeThemeLogos,
    });
  }

  function setRecapEmpty(message) {
    if (!(recapEl instanceof HTMLElement)) return;
    const strong = document.createElement("strong");
    strong.textContent = message;
    recapEl.replaceChildren(strong);
  }

  function refreshRecap() {
    if (importing) {
      setRecapEmpty("Importation en cours…");
      return;
    }
    if (!backup) {
      if (recapEl instanceof HTMLElement) recapEl.replaceChildren();
      if (runBtn instanceof HTMLButtonElement) runBtn.disabled = true;
      return;
    }
    const payload = currentPayload();
    const settingCount = payload.settings?.cardAppearance
      ? CARD_APPEARANCE_SETTING_COUNT
      : 0;
    const empty = isImportPayloadEmpty(payload);
    if (recapEl instanceof HTMLElement) {
      if (empty) {
        setRecapEmpty("Rien à importer !");
      } else {
        const recap = formatBackupFooterRecap({
          cardCount: payload.cards.length,
          themeCount: payload.themes.length,
          settingCount,
          bytes: backupPayloadBytes(payload),
        });
        /** @type {Array<Text|HTMLElement>} */
        const nodes = [];
        recap.items.forEach((item, i) => {
          if (i > 0) nodes.push(document.createTextNode(" · "));
          nodes.push(document.createTextNode(item));
        });
        if (recap.size) {
          if (nodes.length) nodes.push(document.createTextNode(" · "));
          const strong = document.createElement("strong");
          strong.textContent = recap.size;
          nodes.push(strong);
        }
        recapEl.replaceChildren(...nodes);
      }
    }
    if (runBtn instanceof HTMLButtonElement) {
      runBtn.disabled = empty || loading;
    }
  }

  function setDialogBusy(on) {
    if (modalEl instanceof HTMLElement) {
      modalEl.setAttribute("aria-busy", on ? "true" : "false");
    }
  }

  function setLoadError(message) {
    const errorEl = host.querySelector("#import-load-error");
    if (errorEl instanceof HTMLElement) errorEl.textContent = String(message || "");
  }

  function setLoading(on) {
    loading = on;
    setDialogBusy(on);
    host.querySelectorAll("#btn-import-from-file, #btn-import-from-url").forEach((btn) => {
      if (btn instanceof HTMLButtonElement) btn.disabled = on;
    });
    if (runBtn instanceof HTMLButtonElement && !importing) {
      runBtn.disabled = on || !backup || isImportPayloadEmpty(currentPayload());
    }
  }

  function resetLoadedBackup() {
    backup = null;
    sourceLabel = "";
    sourceHref = "";
    themesForGrouping = [];
    themeChoices = [];
    selectedThemeIds.clear();
    includeSettings = true;
    includeImages = true;
    includeThemeLogos = true;
    hasCardImages = false;
    hasThemeLogos = false;
    hasSettings = false;
  }

  /**
   * @param {import("./backup.js").BackupData} data
   * @param {{ label: string, href?: string }} source
   */
  function acceptBackup(data, source) {
    const customThemes = /** @type {import("./themes-data.js").LegoTheme[]} */ (
      (data.themes || []).map((t) => {
        const theme = /** @type {Record<string, unknown>} */ (t || {});
        return {
          ...theme,
          id: String(theme.id || ""),
          name: String(theme.name ?? theme.themeName ?? "").trim() || "THÈME",
        };
      })
    );
    backup = {
      ...data,
      themes: customThemes,
    };
    sourceLabel = source.label;
    sourceHref = String(source.href || "").trim();
    themesForGrouping = [...presets, ...customThemes];
    themeChoices = listImportThemeChoices(
      /** @type {import("./storage.js").Card[]} */ (backup.cards || []),
      themesForGrouping,
      customThemes
    );
    selectedThemeIds.clear();
    themeChoices.forEach((choice) => selectedThemeIds.add(choice.id));
    hasCardImages = countBackupCardImages(backup.cards) > 0;
    hasThemeLogos = countBackupThemeLogos(backup.themes) > 0;
    hasSettings = Boolean(backup.settings?.cardAppearance);
    includeSettings = hasSettings;
    includeImages = hasCardImages;
    includeThemeLogos = hasThemeLogos;
    renderChooseStep();
    refreshRecap();
    focusTopModal();
  }

  function renderLoadStep() {
    unbindChoose?.();
    unbindChoose = null;
    resetLoadedBackup();
    if (!(bodyEl instanceof HTMLElement)) return;
    bodyEl.innerHTML = `
      <div class="settings-sections">
        <section class="settings-panel">
          <div class="form-image-empty">
            <p class="import-load-lead">Charger une sauvegarde pour ajouter ou fusionner un lot de cartes, des thèmes ou des paramètres à votre collection.</p>
            <div class="form-image-empty-actions import-load-actions">
              <input type="file" id="import-dialog-file" accept=".brickcard" hidden />
              <button type="button" class="btn primary" id="btn-import-from-file">
                ${ICON_FILE_LINE}<span>Depuis mes fichiers</span>
              </button>
              <button type="button" class="btn secondary sm" id="btn-import-from-url">
                ${ICON_LINK}<span>Depuis une URL</span>
              </button>
            </div>
            <p class="form-error" id="import-load-error" role="alert"></p>
          </div>
        </section>
      </div>
    `;
    const fileInput = /** @type {HTMLInputElement|null} */ (host.querySelector("#import-dialog-file"));
    host.querySelector("#btn-import-from-file")?.addEventListener("click", () => {
      if (loading || importing) return;
      fileInput?.click();
    });
    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (!file || loading || importing) return;
      if (!isBrickcardBackupFilename(file.name)) {
        setLoadError(BACKUP_INVALID);
        return;
      }
      setLoadError("");
      setLoading(true);
      try {
        const data = parseBrickcardBackup(await file.text());
        acceptBackup(data, { label: file.name });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Import impossible");
      } finally {
        setLoading(false);
      }
    });
    host.querySelector("#btn-import-from-url")?.addEventListener("click", async () => {
      if (loading || importing) return;
      setLoadError("");
      const result = await openBackupUrlDialog(host);
      if (!result) return;
      acceptBackup(result.backup, { label: result.href, href: result.href });
    });
    refreshRecap();
  }

  function renderChooseStep() {
    unbindChoose?.();
    unbindChoose = null;
    if (!(bodyEl instanceof HTMLElement) || !backup) return;

    const imagesSection =
      hasCardImages || hasThemeLogos
        ? `<section class="settings-panel">
              <h2 class="section-title" id="import-images-title">Images &amp; logos</h2>
              <fieldset class="form-check-group" aria-labelledby="import-images-title">
                <div class="form-check-list">
                  ${
                    hasCardImages
                      ? formCheckboxMarkup({
                          id: "import-include-images",
                          name: "import-include-images",
                          label: "Images des cartes",
                          hint: "Importer les images des cartes de la sauvegarde.",
                          checked: includeImages,
                        })
                      : ""
                  }
                  ${
                    hasThemeLogos
                      ? formCheckboxMarkup({
                          id: "import-include-theme-logos",
                          name: "import-include-theme-logos",
                          label: "Logos des thèmes personnalisés",
                          hint: "Importer les logos des thèmes personnalisés.",
                          checked: includeThemeLogos,
                        })
                      : ""
                  }
                </div>
              </fieldset>
            </section>`
        : "";

    const settingsSection = hasSettings
      ? `<section class="settings-panel">
              <h2 class="section-title" id="import-settings-title">Paramètres</h2>
              <fieldset class="form-check-group" aria-labelledby="import-settings-title">
                <div class="form-check-list">
                  ${formCheckboxMarkup({
                    id: "import-include-settings",
                    name: "import-include-settings",
                    label: "Apparence des cartes",
                    hint: "Importer les paramètres de bordure, arrondis et couleur par défaut des cartes.",
                    checked: includeSettings,
                  })}
                </div>
              </fieldset>
            </section>`
      : "";

    const themeChecksHtml = themeChoices
      .map((choice) =>
        formCheckboxMarkup({
          id: `import-theme-${choice.id || "none"}`,
          name: "import-theme",
          value: choice.id || UNTHEMED_VALUE,
          label: choice.name,
          hint: themeChoiceHint(choice),
          checked: selectedThemeIds.has(choice.id),
        })
      )
      .join("");

    const cardsSection = themeChoices.length
      ? `<section class="settings-panel">
              <h2 class="section-title" id="import-cards-title">Cartes</h2>
              <fieldset class="form-check-group" aria-labelledby="import-cards-title">
                <p class="form-hint">Importer uniquement les cartes des thèmes sélectionnés.</p>
                <div class="form-check-list form-check-list--row">
                  ${themeChecksHtml}
                </div>
              </fieldset>
            </section>`
      : "";

    bodyEl.innerHTML = `
      <div class="settings-sections">
        <section class="settings-panel import-source-panel">
          <p class="import-source-name">${
            sourceHref
              ? linkMarkup(sourceLabel || sourceHref, { href: sourceHref, target: "_blank" })
              : escapeHtml(sourceLabel || "sauvegarde.brickcard")
          }</p>
          <button type="button" class="btn secondary sm" id="btn-import-change-source">Charger une autre sauvegarde</button>
        </section>
        ${imagesSection}
        ${settingsSection}
        ${cardsSection}
      </div>
    `;

    const onThemeChange = (e) => {
      const input = e.currentTarget;
      if (!(input instanceof HTMLInputElement)) return;
      const themeId =
        input.value === UNTHEMED_VALUE ? UNTHEMED_BACKUP_THEME_ID : input.value;
      if (input.checked) selectedThemeIds.add(themeId);
      else selectedThemeIds.delete(themeId);
      refreshChooseHints();
      refreshRecap();
    };

    host.querySelectorAll('input[name="import-theme"]').forEach((input) => {
      input.addEventListener("change", onThemeChange);
    });

    const onImages = (e) => {
      const input = e.currentTarget;
      if (!(input instanceof HTMLInputElement)) return;
      includeImages = input.checked;
      refreshChooseHints();
      refreshRecap();
    };
    const onLogos = (e) => {
      const input = e.currentTarget;
      if (!(input instanceof HTMLInputElement)) return;
      includeThemeLogos = input.checked;
      refreshRecap();
    };
    const onSettings = (e) => {
      const input = e.currentTarget;
      if (!(input instanceof HTMLInputElement)) return;
      includeSettings = input.checked;
      refreshRecap();
    };

    host.querySelector("#import-include-images")?.addEventListener("change", onImages);
    host.querySelector("#import-include-theme-logos")?.addEventListener("change", onLogos);
    host.querySelector("#import-include-settings")?.addEventListener("change", onSettings);
    host.querySelector("#btn-import-change-source")?.addEventListener("click", () => {
      if (importing) return;
      renderLoadStep();
      focusTopModal();
    });

    unbindChoose = () => {
      host.querySelectorAll('input[name="import-theme"]').forEach((input) => {
        input.removeEventListener("change", onThemeChange);
      });
      host.querySelector("#import-include-images")?.removeEventListener("change", onImages);
      host.querySelector("#import-include-theme-logos")?.removeEventListener("change", onLogos);
      host.querySelector("#import-include-settings")?.removeEventListener("change", onSettings);
    };
  }

  function refreshChooseHints() {
    host.querySelectorAll('input[name="import-theme"]').forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      const themeId =
        input.value === UNTHEMED_VALUE ? UNTHEMED_BACKUP_THEME_ID : input.value;
      const choice = themeChoices.find((c) => c.id === themeId);
      const hint = input.closest(".form-check")?.querySelector(".form-hint");
      if (choice && hint) hint.textContent = themeChoiceHint(choice);
    });
  }

  function setImporting(on) {
    importing = on;
    setDialogBusy(on);
    if (runBtn instanceof HTMLButtonElement) {
      runBtn.disabled = on || !backup || isImportPayloadEmpty(currentPayload());
    }
    if (btnCancel instanceof HTMLButtonElement) btnCancel.disabled = on;
    if (btnClose instanceof HTMLButtonElement) btnClose.disabled = on;
    host.querySelectorAll(
      "#btn-import-change-source, #import-include-images, #import-include-theme-logos, #import-include-settings, input[name='import-theme']"
    ).forEach((el) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement) {
        el.disabled = on;
      }
    });
    refreshRecap();
  }

  runBtn?.addEventListener("click", async () => {
    if (importing || !backup) return;
    const payload = currentPayload();
    if (isImportPayloadEmpty(payload)) {
      toast?.("Rien à importer", "error");
      return;
    }
    setImporting(true);
    try {
      await importBackup(payload, {
        mode: "merge",
        includeImages: !hasCardImages || includeImages,
        includeThemeLogos: !hasThemeLogos || includeThemeLogos,
      });
      toastImportedBackup(toast, payload);
      onImported?.();
      onClose();
    } catch (err) {
      toast?.(err instanceof Error ? err.message : "Import impossible", "error");
      setImporting(false);
    }
  });

  /** @param {MouseEvent} e */
  const onBackdropClick = (e) => {
    if (e.target === backdrop) close();
  };

  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    if (importing) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    close();
  };

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", close);
  btnCancel?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  renderLoadStep();

  return () => {
    unbindChoose?.();
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
    btnCancel?.removeEventListener("click", close);
  };
}
