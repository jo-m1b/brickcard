/**
 * Modale de sauvegarde de la collection (`#backup`).
 * Fermeture (X, Échap, backdrop, Annuler, ou après un export réussi) → accueil.
 */

import { ICON_CLOSE, ICON_DOWNLOAD, modalTitleMarkup } from "./icons.js";
import { _t } from "./i18n.js";
import { isCollectionSaveShortcut } from "./hotkeys.js";
import { TOAST_DELAY_BACKUP } from "./toast.js";
import { setAppDocumentTitle } from "./document-title.js";
import { formRadioMarkup } from "./form-radio.js";
import { formCheckboxMarkup } from "./form-checkbox.js";
import { loadCards, loadCustomThemes, loadThemes } from "./storage.js";
import {
  CARD_APPEARANCE_SETTING_COUNT,
  UNTHEMED_BACKUP_THEME_ID,
  backupPayloadBytes,
  buildBackupPayload,
  estimateThemeCardsBytes,
  exportBackup,
  formatBackupFooterRecap,
  formatBackupThemeChoiceHint,
  formatBackupToastRecap,
  groupCardsForBackup,
  isBackupPayloadEmpty,
  listBackupThemeChoices,
} from "./backup.js";

const UNTHEMED_VALUE = "none";

/**
 * @param {HTMLElement} host `#modal-root`
 * @param {{
 *   onClose: () => void,
 *   toast?: (msg: string, type?: string) => void,
 * }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderBackupDialog(host, opts) {
  const { onClose, toast } = opts;
  const [cards, themes, customThemes] = await Promise.all([
    loadCards(),
    loadThemes(),
    loadCustomThemes(),
  ]);
  const themeChoices = listBackupThemeChoices(cards, themes);
  const cardsByTheme = groupCardsForBackup(cards, themes);

  /** @type {"full"|"custom"} */
  let kind = "full";
  const selectedThemeIds = new Set(themeChoices.map((c) => c.id));
  let includeSettings = true;
  let includeImages = true;
  let includeThemeLogos = true;

  document.body.classList.add("modal-open");

  function themeChoiceHint(choice) {
    const group = cardsByTheme.get(choice.id) || [];
    return formatBackupThemeChoiceHint(
      choice.cardCount,
      estimateThemeCardsBytes(group, includeImages)
    );
  }

  const themeChecksHtml = themeChoices
    .map((choice) =>
      formCheckboxMarkup({
        id: `backup-theme-${choice.id || "none"}`,
        name: "backup-theme",
        value: choice.id || UNTHEMED_VALUE,
        label: choice.name,
        hint: themeChoiceHint(choice),
        checked: true,
      })
    )
    .join("");

  host.innerHTML = `
    <div class="modal-backdrop collection-xfer-dialog" id="backup-dialog-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="backup-dialog-title" aria-describedby="backup-dialog-recap">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="backup-dialog-title">${modalTitleMarkup(_t("Save"), ICON_DOWNLOAD)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-backup-dialog-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="settings-sections">
            <section class="settings-panel">
              <h2 class="section-title" id="backup-type-title">${_t("Backup type")}</h2>
              <fieldset class="form-check-group" aria-labelledby="backup-type-title">
                <div class="form-check-list">
                  ${formRadioMarkup({
                    id: "backup-kind-full",
                    name: "backup-kind",
                    value: "full",
                    label: _t("Full backup"),
                    hint: _t("All cards, custom themes, and settings of your collection"),
                    checked: true,
                  })}
                  ${formRadioMarkup({
                    id: "backup-kind-custom",
                    name: "backup-kind",
                    value: "custom",
                    label: _t("Custom backup"),
                    hint: _t("Save only the selected data"),
                  })}
                </div>
              </fieldset>
            </section>
            <section class="settings-panel backup-custom-panel" hidden>
              <h2 class="section-title" id="backup-images-title">${_t("Images & logos")}</h2>
              <fieldset class="form-check-group" aria-labelledby="backup-images-title">
                <div class="form-check-list">
                  ${formCheckboxMarkup({
                    id: "backup-include-images",
                    name: "backup-include-images",
                    label: _t("Card images"),
                    hint: _t("Save the card images of the collection"),
                    checked: true,
                  })}
                  ${formCheckboxMarkup({
                    id: "backup-include-theme-logos",
                    name: "backup-include-theme-logos",
                    label: _t("Custom theme logos"),
                    hint: _t("Save the custom theme logos"),
                    checked: true,
                  })}
                </div>
              </fieldset>
            </section>
            <section class="settings-panel backup-custom-panel" hidden>
              <h2 class="section-title" id="backup-settings-title">${_t("Settings")}</h2>
              <fieldset class="form-check-group" aria-labelledby="backup-settings-title">
                <div class="form-check-list">
                  ${formCheckboxMarkup({
                    id: "backup-include-settings",
                    name: "backup-include-settings",
                    label: _t("Card appearance"),
                    hint: _t("Save the border, corner radius, and default card color settings"),
                    checked: true,
                  })}
                </div>
              </fieldset>
            </section>
            ${
              themeChoices.length
                ? `<section class="settings-panel backup-custom-panel" hidden>
              <h2 class="section-title" id="backup-cards-title">${_t("Cards")}</h2>
              <fieldset class="form-check-group" aria-labelledby="backup-cards-title">
                <p class="form-hint">${_t("Save only the cards of the selected themes")}</p>
                <div class="form-check-list form-check-list--row">
                  ${themeChecksHtml}
                </div>
              </fieldset>
            </section>`
                : ""
            }
          </div>
        </div>
        <div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-start">
            <p class="view-desc" id="backup-dialog-recap"></p>
          </div>
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-backup-dialog-run">
              ${ICON_DOWNLOAD}
              <span>${_t("Save")}</span>
            </button>
            <button type="button" class="btn secondary sm" id="btn-backup-dialog-cancel">
              ${_t("Cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  setAppDocumentTitle(_t("Save"));

  const backdrop = host.querySelector("#backup-dialog-backdrop");
  const btnClose = host.querySelector("#btn-backup-dialog-close");
  const btnCancel = host.querySelector("#btn-backup-dialog-cancel");
  const customPanels = host.querySelectorAll(".backup-custom-panel");
  const recapEl = host.querySelector("#backup-dialog-recap");
  const runBtn = host.querySelector("#btn-backup-dialog-run");
  const close = () => onClose();

  function currentPayload() {
    return buildBackupPayload({
      kind,
      cards,
      themes,
      customThemes,
      selectedThemeIds: [...selectedThemeIds],
      includeSettings,
      includeImages,
      includeThemeLogos,
    });
  }

  function refresh() {
    customPanels.forEach((panel) => {
      if (panel instanceof HTMLElement) panel.hidden = kind !== "custom";
    });
    host.querySelectorAll('input[name="backup-theme"]').forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      const themeId =
        input.value === UNTHEMED_VALUE ? UNTHEMED_BACKUP_THEME_ID : input.value;
      const choice = themeChoices.find((c) => c.id === themeId);
      const hint = input.closest(".form-check")?.querySelector(".form-hint");
      if (choice && hint) hint.textContent = themeChoiceHint(choice);
    });
    const payload = currentPayload();
    const settingCount = payload.settings?.cardAppearance
      ? CARD_APPEARANCE_SETTING_COUNT
      : 0;
    const empty = isBackupPayloadEmpty(payload);
    if (recapEl instanceof HTMLElement) {
      if (empty) {
        const strong = document.createElement("strong");
        strong.textContent = _t("No cards to save!");
        recapEl.replaceChildren(strong);
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
      runBtn.disabled = empty;
    }
  }

  host.querySelectorAll('input[name="backup-kind"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (!(input instanceof HTMLInputElement) || !input.checked) return;
      kind = input.value === "custom" ? "custom" : "full";
      refresh();
    });
  });

  host.querySelectorAll('input[name="backup-theme"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (!(input instanceof HTMLInputElement)) return;
      const themeId =
        input.value === UNTHEMED_VALUE ? UNTHEMED_BACKUP_THEME_ID : input.value;
      if (input.checked) selectedThemeIds.add(themeId);
      else selectedThemeIds.delete(themeId);
      refresh();
    });
  });

  host.querySelector("#backup-include-settings")?.addEventListener("change", (e) => {
    const input = e.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    includeSettings = input.checked;
    refresh();
  });

  host.querySelector("#backup-include-images")?.addEventListener("change", (e) => {
    const input = e.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    includeImages = input.checked;
    refresh();
  });

  host.querySelector("#backup-include-theme-logos")?.addEventListener("change", (e) => {
    const input = e.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    includeThemeLogos = input.checked;
    refresh();
  });

  runBtn?.addEventListener("click", async () => {
    if (runBtn instanceof HTMLButtonElement) runBtn.disabled = true;
    try {
      const payload = currentPayload();
      if (isBackupPayloadEmpty(payload)) {
        toast?.(_t("Nothing to save"), "error");
        return;
      }
      const result = await exportBackup({
        kind,
        cards,
        themes,
        customThemes,
        selectedThemeIds: [...selectedThemeIds],
        includeSettings,
        includeImages,
        includeThemeLogos,
      });
      const recap = formatBackupToastRecap(
        {
          cardCount: result.cards,
          themeCount: result.themes,
          settingCount: result.settings ? CARD_APPEARANCE_SETTING_COUNT : 0,
          bytes: result.bytes,
        },
        { filename: result.filename }
      );
      toast?.({
        type: "success",
        title:
          kind === "full"
            ? _t("Full backup saved")
            : _t("Custom backup saved"),
        message: recap.message,
        messageHtml: recap.messageHtml,
        icon: "save",
        delay: TOAST_DELAY_BACKUP,
      });
      close();
    } catch (err) {
      toast?.(err.message || _t("Unable to save the backup"), "error");
    } finally {
      if (runBtn instanceof HTMLButtonElement && runBtn.isConnected) {
        runBtn.disabled = isBackupPayloadEmpty(currentPayload());
      }
    }
  });

  refresh();

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
    if (isCollectionSaveShortcut(e)) {
      e.preventDefault();
      if (runBtn instanceof HTMLButtonElement && !runBtn.disabled) runBtn.click();
    }
  };

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", close);
  btnCancel?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  return () => {
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
    btnCancel?.removeEventListener("click", close);
  };
}
