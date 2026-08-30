import { ICON_ADD, ICON_CLOSE, ICON_DELETE_BIN_2, ICON_PALETTE, ICON_PENCIL, ICON_SAVE, modalTitleMarkup } from "../icons.js";
import { bindFormColor, formColorMarkup } from "../form-color.js";
import { bindFormImage, formImageMarkup } from "../form-image.js";
import { formatThemeLogoBasename } from "../card-export.js";
import {
  upsertTheme,
  deleteTheme,
  compressImage,
  createId,
  getTheme,
} from "../storage.js";
import { mountCardBackPreview, refreshCardBackPreview } from "../card-render.js";
import { contrastText, DEFAULT_THEME_COLOR } from "../themes-data.js";
import { resolveCardAccent } from "../card-design.js";
import { confirmDialog } from "../confirm-dialog.js";
import { setAppDocumentTitle } from "../document-title.js";
import { _t } from "../i18n.js";

/**
 * Modale d’édition d’un thème personnalisé (`#themes/new`, `#themes/edit/:id`)
 * ou lecture seule d’un thème par défaut (`#themes/view/:id`).
 * @param {HTMLElement} host
 * @param {{
 *   themeId?: string|null,
 *   readOnly?: boolean,
 *   onClose: () => void,
 *   onSaved: (name: string, meta: { isNew: boolean, theme: import("../themes-data.js").LegoTheme }) => void,
 *   onDeleted?: (name: string, themeId: string) => void,
 * }} opts
 * @returns {Promise<(() => void)|null>} cleanup, ou null si id invalide / mode incompatible
 */
export async function renderThemeEditor(host, opts) {
  const { onClose, onSaved, onDeleted } = opts;
  const readOnly = Boolean(opts.readOnly);
  const isEdit = Boolean(opts.themeId);
  const existing = isEdit ? await getTheme(opts.themeId) : null;
  if (readOnly) {
    if (!existing || !existing.isBuiltin) return null;
  } else if (isEdit && (!existing || existing.isBuiltin)) {
    return null;
  }

  document.body.classList.add("modal-open");

  /** @type {{
   *   id: string,
   *   name: string,
   *   color: string,
   *   secondaryColor: string,
   *   logoDataUrl: string,
   *   logoZoom: number,
   *   logoOffsetX: number,
   *   logoOffsetY: number,
   * }} */
  const draft = {
    id: existing?.id || createId(),
    name: existing?.name || "",
    color: existing?.color || "",
    secondaryColor: existing?.secondaryColor || "",
    logoDataUrl: existing?.logoDataUrl || "",
    logoZoom: existing?.logoZoom || 1,
    logoOffsetX: existing?.logoOffsetX || 0,
    logoOffsetY: existing?.logoOffsetY || 0,
  };

  const colorDisplay = draft.color || resolveCardAccent(existing);
  const dialogTitle = readOnly
    ? _t("Theme “%(name)s”", { name: existing.name })
    : existing
      ? _t("Edit “%(name)s”", { name: existing.name })
      : _t("New theme");
  const dialogIcon = readOnly ? ICON_PALETTE : existing ? ICON_PENCIL : ICON_ADD;

  function themeCropBackground() {
    return resolveCardAccent({ color: draft.color });
  }

  function autoAccentFg() {
    return contrastText(themeCropBackground());
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal-backdrop" id="theme-editor-backdrop" role="presentation">
      <div class="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="theme-editor-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="theme-editor-title">${modalTitleMarkup(
              dialogTitle,
              dialogIcon
            )}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="theme-modal-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="editor-layout">
            <aside class="preview-wrap">
              <div class="card-preview" id="theme-preview-back-host" aria-label="${_t("Back preview")}"></div>
            </aside>
            <div>
              ${
                readOnly
                  ? `<div class="form-field">
                <label class="form-label" for="theme-id">${_t("Identifier")}</label>
                <input class="form-control" type="text" id="theme-id" autocomplete="off" spellcheck="false" readonly />
              </div>`
                  : ""
              }
              <div class="form-field">
                <label class="form-label${readOnly ? "" : " form-label--required"}" for="theme-name">${_t("Name")}</label>
                <input class="form-control" type="text" id="theme-name" placeholder="CITY" autocomplete="off"${
                  readOnly ? " readonly" : ""
                } />
                ${
                  readOnly
                    ? ""
                    : `<p class="form-error" id="theme-name-error" role="alert" hidden></p>`
                }
              </div>
              <div class="form-field">
                <label class="form-label" for="theme-color-hex">${_t("Color")}</label>
                <p class="form-hint" id="theme-color-hint">${_t("Main color of the theme’s cards")}</p>
                ${formColorMarkup({
                  id: "theme-color-hex",
                  value: draft.color,
                  fallback: DEFAULT_THEME_COLOR,
                  placeholder: DEFAULT_THEME_COLOR,
                  describedBy: "theme-color-hint",
                  disabled: readOnly,
                })}
              </div>
              <div class="form-field">
                <label class="form-label" for="theme-secondary-color-hex">${_t("Secondary color")}</label>
                <p class="form-hint" id="theme-secondary-color-hint">${_t("Color used for the texts, icons, and the Brickcard logo. By default this color is determined automatically (black or white) from the main color.")}</p>
                ${formColorMarkup({
                  id: "theme-secondary-color-hex",
                  value: draft.secondaryColor,
                  fallback: autoAccentFg(),
                  placeholder: autoAccentFg(),
                  describedBy: "theme-secondary-color-hint",
                  disabled: readOnly,
                })}
              </div>
              <div class="form-field" style="--form-image-aspect: 63 / 44">
                <label class="form-label" id="theme-logo-label">${_t("Logo")}</label>
                ${formImageMarkup({
                  id: "theme-logo",
                  labelledBy: "theme-logo-label",
                  dataUrl: draft.logoDataUrl,
                  zoom: draft.logoZoom,
                  offsetX: draft.logoOffsetX,
                  offsetY: draft.logoOffsetY,
                  withBackgroundColor: false,
                  previewBackground: colorDisplay,
                  fit: "logo",
                  readOnly,
                })}
              </div>
              ${readOnly ? "" : `<p class="form-error" id="theme-error" role="alert"></p>`}
            </div>
          </div>
        </div>
        ${
          readOnly
            ? `<div class="modal-footer">
          <div class="modal-footer-end">
            <button type="button" class="btn secondary" id="theme-cancel">${_t("Close")}</button>
          </div>
        </div>`
            : `<div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="theme-save">${ICON_SAVE}<span>${_t("Save")}</span></button>
            <button type="button" class="btn secondary sm" id="theme-cancel">${_t("Cancel")}</button>
          </div>
          ${
            existing
              ? `<div class="modal-footer-start">
            <button type="button" class="btn danger" id="theme-delete">${ICON_DELETE_BIN_2}<span>${_t("Delete")}</span></button>
          </div>`
              : ""
          }
        </div>`
        }
      </div>
    </div>
  `.trim();
  const backdrop = /** @type {HTMLElement} */ (wrap.firstElementChild);
  host.appendChild(backdrop);

  setAppDocumentTitle(dialogTitle);

  const q = (sel) => backdrop.querySelector(sel);
  const nameInput = q("#theme-name");
  const nameError = q("#theme-name-error");
  const errEl = q("#theme-error");
  const logoRoot = /** @type {HTMLElement|null} */ (q("#theme-logo"));
  const previewHost = /** @type {HTMLElement} */ (q("#theme-preview-back-host"));
  const idInput = q("#theme-id");

  nameInput.value = draft.name;
  if (idInput) idInput.value = draft.id;

  /** @returns {import("../themes-data.js").LegoTheme} */
  function previewTheme() {
    return {
      id: draft.id || "",
      name: nameInput.value.trim(),
      color: draft.color,
      secondaryColor: draft.secondaryColor,
      logoDataUrl: draft.logoDataUrl,
      logoZoom: draft.logoZoom,
      logoOffsetX: draft.logoOffsetX,
      logoOffsetY: draft.logoOffsetY,
      isBuiltin: Boolean(existing?.isBuiltin),
      updatedAt: "",
    };
  }

  /** @type {HTMLElement} */
  let previewBack = mountCardBackPreview(previewHost, {}, {
    legoTheme: previewTheme(),
  });

  function syncPreview() {
    refreshCardBackPreview(previewBack, {}, { legoTheme: previewTheme() });
  }

  const colorRoot = /** @type {HTMLElement|null} */ (
    q("#theme-color-hex")?.closest("[data-form-color]")
  );
  /** @type {ReturnType<typeof bindFormColor>|null} */
  let themeColorField = null;
  /** @type {ReturnType<typeof bindFormColor>|null} */
  let secondaryColorField = null;
  /** @type {ReturnType<typeof bindFormImage>|null} */
  let logoField = null;

  if (colorRoot) {
    themeColorField = bindFormColor(colorRoot, {
      fallbackColor: DEFAULT_THEME_COLOR,
      onChange: readOnly
        ? undefined
        : (value) => {
            draft.color = value || "";
            if (!value) {
              themeColorField?.setValue("", resolveCardAccent(null));
            }
            logoField?.setPreviewBackground(themeCropBackground());
            secondaryColorField?.setValue(draft.secondaryColor, autoAccentFg());
            syncPreview();
          },
    });
  }
  themeColorField?.setValue(draft.color, colorDisplay);

  const secondaryRoot = /** @type {HTMLElement|null} */ (
    q("#theme-secondary-color-hex")?.closest("[data-form-color]")
  );
  if (secondaryRoot) {
    secondaryColorField = bindFormColor(secondaryRoot, {
      fallbackColor: autoAccentFg(),
      onChange: readOnly
        ? undefined
        : (value) => {
            draft.secondaryColor = value || "";
            if (!value) {
              secondaryColorField?.setValue("", autoAccentFg());
            }
            syncPreview();
          },
    });
  }
  secondaryColorField?.setValue(draft.secondaryColor, autoAccentFg());

  if (logoRoot) {
    logoField = bindFormImage(logoRoot, {
      processFile: readOnly ? undefined : compressImage,
      dialogHost: host,
      previewBackground: colorDisplay,
      fit: "logo",
      readOnly,
      downloadBasename: () =>
        formatThemeLogoBasename({
          name: nameInput.value,
          themeId: draft.id,
        }),
      onChange: readOnly
        ? undefined
        : (value) => {
            draft.logoDataUrl = value.dataUrl || "";
            if (draft.logoDataUrl) {
              draft.logoZoom = value.zoom;
              draft.logoOffsetX = value.offsetX;
              draft.logoOffsetY = value.offsetY;
            } else {
              draft.logoZoom = 1;
              draft.logoOffsetX = 0;
              draft.logoOffsetY = 0;
            }
            syncPreview();
          },
    });
  }

  function setNameError(message) {
    if (!nameError) return;
    const msg = String(message || "");
    nameError.textContent = msg;
    nameError.hidden = !msg;
    nameInput.classList.toggle("is-invalid", Boolean(msg));
    nameInput.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) nameInput.setAttribute("aria-describedby", "theme-name-error");
    else nameInput.removeAttribute("aria-describedby");
  }

  if (!readOnly) {
    nameInput.addEventListener("input", () => {
      if (nameError?.textContent) setNameError("");
      syncPreview();
    });
  }

  function requestClose() {
    onClose();
  }

  q("#theme-cancel").onclick = requestClose;
  q("#theme-modal-close").onclick = requestClose;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) requestClose();
  };

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    requestClose();
  }
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", syncPreview);

  const saveBtn = q("#theme-save");
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const name = nameInput.value.trim();
      if (!name) {
        if (errEl) errEl.textContent = "";
        setNameError(_t("The name is required."));
        nameInput.focus();
        return;
      }
      setNameError("");
      if (errEl) errEl.textContent = "";
      try {
        const saved = await upsertTheme({
          id: draft.id,
          name,
          color: draft.color,
          secondaryColor: draft.secondaryColor,
          logoDataUrl: draft.logoDataUrl || "",
          logoZoom: draft.logoZoom,
          logoOffsetX: draft.logoOffsetX,
          logoOffsetY: draft.logoOffsetY,
          isBuiltin: false,
        });
        onSaved(name, { isNew: !isEdit, theme: saved });
      } catch (ex) {
        if (errEl) errEl.textContent = ex.message || _t("Unable to save.");
      }
    };
  }

  const deleteBtn = q("#theme-delete");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const ok = await confirmDialog(host, {
        title: _t("Delete the theme “%(name)s”?", { name: existing.name }),
        icon: "delete-bin-2",
        message: _t(
          "Warning, deletion is permanent and cannot be undone! Do you want to continue?"
        ),
        okLabel: _t("Delete"),
        danger: true,
      });
      if (!ok) return;
      try {
        await deleteTheme(existing.id);
        onDeleted?.(existing.name, existing.id);
      } catch (ex) {
        if (errEl) errEl.textContent = ex.message || _t("Unable to delete.");
      }
    };
  }

  return () => {
    themeColorField?.destroy();
    secondaryColorField?.destroy();
    logoField?.destroy();
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", syncPreview);
    backdrop.remove();
  };
}
