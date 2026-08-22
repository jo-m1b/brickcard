import { ICON_ADD, ICON_CLOSE, ICON_DELETE_BIN_2, ICON_PENCIL, ICON_SAVE, modalTitleMarkup } from "../../icons.js";
import { bindFormColor, formColorMarkup } from "../../form-color.js";
import { bindFormImage, formImageMarkup } from "../../form-image.js";
import { compressThemeImage } from "../../storage.js";
import { mountCardBackPreview, refreshCardBackPreview } from "../../card-render.js";
import { DEFAULT_THEME_COLOR } from "../../themes-data.js";
import { resolveCardAccent } from "../../card-design.js";
import { confirmDialog } from "../../confirm-dialog.js";
import { focusTopModal } from "../../modal-focus.js";
import { popModalDocumentTitle, pushModalDocumentTitle } from "../../document-title.js";
import {
  deletePresetDraftTheme,
  draftToLegoTheme,
  getPresetDraftTheme,
  isValidPresetId,
  loadPresetDraftThemes,
  presetDraftLogoUrl,
  suggestPresetId,
  upsertPresetDraftTheme,
} from "../../preset-draft.js";

const THEME_LOGO_ACCEPT =
  "image/svg+xml,image/png,image/webp,.svg,.png,.webp";

/** Section d’index `#developer` pour l’outil thèmes par défaut. */
const PRESETS_SECTION = "Aide au développement";

/**
 * Éditeur d’un thème du brouillon presets (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`).
 * @param {HTMLElement} host `#developer-demo-root`
 * @param {{
 *   themeId?: string|null,
 *   onClose: () => void,
 *   onSaved: () => void,
 *   onDeleted?: () => void,
 * }} opts
 * @returns {Promise<(() => void)|null>}
 */
export async function renderPresetDraftEditor(host, opts) {
  const { onClose, onSaved, onDeleted } = opts;
  const isEdit = Boolean(opts.themeId);
  const existing = isEdit ? await getPresetDraftTheme(opts.themeId) : null;
  if (isEdit && !existing) return null;

  /** @type {{
   *   id: string,
   *   previousId: string,
   *   name: string,
   *   color: string,
   *   logoSrc: string,
   *   logoDataUrl: string,
   *   logoZoom: number,
   *   logoOffsetX: number,
   *   logoOffsetY: number,
   *   idTouched: boolean,
   * }} */
  const draft = {
    id: existing?.id || "",
    previousId: existing?.id || "",
    name: existing?.name || "",
    color: existing?.color || "",
    logoSrc: existing?.logoSrc || "",
    logoDataUrl: existing?.logoDataUrl || "",
    logoZoom: existing?.logoZoom || 1,
    logoOffsetX: existing?.logoOffsetX || 0,
    logoOffsetY: existing?.logoOffsetY || 0,
    idTouched: isEdit,
  };

  const displayLogo = existing ? presetDraftLogoUrl(existing) : "";
  const colorDisplay = draft.color || resolveCardAccent(null);
  const dialogTitle = existing ? `Modifier « ${existing.name} »` : "Nouveau thème";

  function themeCropBackground() {
    return resolveCardAccent({ color: draft.color });
  }

  host.innerHTML = `
    <div class="modal-backdrop" id="preset-editor-backdrop" role="presentation">
      <div class="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="preset-editor-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="preset-editor-title">${modalTitleMarkup(
              dialogTitle,
              existing ? ICON_PENCIL : ICON_ADD
            )}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="preset-editor-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="editor-layout">
            <aside class="preview-wrap">
              <div class="card-preview" id="preset-preview-back-host" aria-label="Aperçu du dos"></div>
            </aside>
            <div>
              <div class="form-field">
                <label class="form-label form-label--required" for="preset-theme-name">Nom</label>
                <input class="form-control" type="text" id="preset-theme-name" placeholder="CITY" autocomplete="off" />
                <p class="form-error" id="preset-theme-name-error" role="alert" hidden></p>
              </div>
              <div class="form-field">
                <label class="form-label form-label--required" for="preset-theme-id">Identifiant</label>
                <p class="form-hint" id="preset-theme-id-hint">Slug kebab-case, unique. Sert au fichier logo (<code>data/theme-logo-{id}.{ext}</code>).</p>
                <input class="form-control" type="text" id="preset-theme-id" placeholder="city" autocomplete="off" spellcheck="false" aria-describedby="preset-theme-id-hint" />
                <p class="form-error" id="preset-theme-id-error" role="alert" hidden></p>
              </div>
              <div class="form-field">
                <label class="form-label" for="preset-theme-color-hex">Couleur par défaut</label>
                <p class="form-hint" id="preset-theme-color-hint">Couleur appliquée par défaut aux cartes de ce thème</p>
                ${formColorMarkup({
                  id: "preset-theme-color-hex",
                  value: draft.color,
                  fallback: DEFAULT_THEME_COLOR,
                  placeholder: DEFAULT_THEME_COLOR,
                  describedBy: "preset-theme-color-hint",
                })}
              </div>
              <div class="form-field" style="--form-image-aspect: 63 / 44">
                <label class="form-label" id="preset-theme-logo-label">Logo</label>
                ${formImageMarkup({
                  id: "preset-theme-logo",
                  labelledBy: "preset-theme-logo-label",
                  accept: THEME_LOGO_ACCEPT,
                  dataUrl: displayLogo,
                  zoom: draft.logoZoom,
                  offsetX: draft.logoOffsetX,
                  offsetY: draft.logoOffsetY,
                  withBackgroundColor: false,
                  previewBackground: colorDisplay,
                  fit: "logo",
                })}
              </div>
              <p class="form-error" id="preset-theme-error" role="alert"></p>
            </div>
          </div>
        </div>
        <div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="preset-theme-save">${ICON_SAVE}<span>Enregistrer</span></button>
            <button type="button" class="btn secondary sm" id="preset-theme-cancel">Annuler</button>
          </div>
          ${
            existing
              ? `<div class="modal-footer-start">
            <button type="button" class="btn danger" id="preset-theme-delete">${ICON_DELETE_BIN_2}<span>Supprimer</span></button>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  pushModalDocumentTitle(dialogTitle, PRESETS_SECTION);

  const q = (sel) => host.querySelector(sel);
  const backdrop = q("#preset-editor-backdrop");
  const nameInput = /** @type {HTMLInputElement} */ (q("#preset-theme-name"));
  const idInput = /** @type {HTMLInputElement} */ (q("#preset-theme-id"));
  const nameError = q("#preset-theme-name-error");
  const idError = q("#preset-theme-id-error");
  const errEl = q("#preset-theme-error");
  const logoRoot = /** @type {HTMLElement|null} */ (q("#preset-theme-logo"));
  const previewHost = /** @type {HTMLElement} */ (q("#preset-preview-back-host"));

  nameInput.value = draft.name;
  idInput.value = draft.id;

  function currentLogoUrl() {
    if (draft.logoDataUrl) return draft.logoDataUrl;
    return draft.logoSrc;
  }

  /** @returns {import("../../themes-data.js").LegoTheme} */
  function previewTheme() {
    return draftToLegoTheme({
      id: idInput.value.trim() || draft.id,
      name: nameInput.value.trim(),
      color: draft.color,
      logoSrc: draft.logoSrc,
      logoDataUrl: draft.logoDataUrl,
      logoZoom: draft.logoZoom,
      logoOffsetX: draft.logoOffsetX,
      logoOffsetY: draft.logoOffsetY,
      updatedAt: "",
    });
  }

  /** @type {HTMLElement} */
  let previewBack = mountCardBackPreview(previewHost, {}, {
    legoTheme: previewTheme(),
  });

  function syncPreview() {
    refreshCardBackPreview(previewBack, {}, { legoTheme: previewTheme() });
  }

  const colorRoot = /** @type {HTMLElement|null} */ (
    q("#preset-theme-color-hex")?.closest("[data-form-color]")
  );
  /** @type {ReturnType<typeof bindFormColor>|null} */
  let themeColorField = null;
  /** @type {ReturnType<typeof bindFormImage>|null} */
  let logoField = null;

  if (colorRoot) {
    themeColorField = bindFormColor(colorRoot, {
      fallbackColor: DEFAULT_THEME_COLOR,
      onChange(value) {
        draft.color = value || "";
        if (!value) {
          themeColorField?.setValue("", resolveCardAccent(null));
        }
        logoField?.setPreviewBackground(themeCropBackground());
        syncPreview();
      },
    });
  }
  themeColorField?.setValue(draft.color, colorDisplay);

  if (logoRoot) {
    logoField = bindFormImage(logoRoot, {
      processFile: compressThemeImage,
      dialogHost: host,
      previewBackground: colorDisplay,
      fit: "logo",
      downloadBasename: () => {
        const id = idInput.value.trim();
        return id && isValidPresetId(id) ? `theme-logo-${id}` : "theme-logo";
      },
      onChange(value) {
        const src = String(value.dataUrl || "").trim();
        if (!src) {
          draft.logoDataUrl = "";
          draft.logoSrc = "";
          draft.logoZoom = 1;
          draft.logoOffsetX = 0;
          draft.logoOffsetY = 0;
        } else if (src.startsWith("data:")) {
          draft.logoDataUrl = src;
          draft.logoSrc = "";
          draft.logoZoom = value.zoom;
          draft.logoOffsetX = value.offsetX;
          draft.logoOffsetY = value.offsetY;
        } else {
          draft.logoDataUrl = "";
          draft.logoSrc = src.split("?")[0];
          draft.logoZoom = value.zoom;
          draft.logoOffsetX = value.offsetX;
          draft.logoOffsetY = value.offsetY;
        }
        syncPreview();
      },
    });
  }

  /**
   * @param {HTMLElement|null} el
   * @param {HTMLInputElement} input
   * @param {string} message
   * @param {string} describedBy
   */
  function setFieldError(el, input, message, describedBy) {
    const msg = String(message || "");
    if (el) {
      el.textContent = msg;
      el.hidden = !msg;
    }
    input.classList.toggle("is-invalid", Boolean(msg));
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) input.setAttribute("aria-describedby", describedBy);
    else if (input === idInput) input.setAttribute("aria-describedby", "preset-theme-id-hint");
    else input.removeAttribute("aria-describedby");
  }

  nameInput.addEventListener("input", () => {
    if (nameError?.textContent) {
      setFieldError(nameError, nameInput, "", "preset-theme-name-error");
    }
    if (!draft.idTouched) {
      idInput.value = suggestPresetId(nameInput.value);
    }
    syncPreview();
  });

  idInput.addEventListener("input", () => {
    draft.idTouched = true;
    if (idError?.textContent) {
      setFieldError(idError, idInput, "", "preset-theme-id-error");
    }
  });

  function requestClose() {
    onClose();
  }

  q("#preset-theme-cancel").onclick = requestClose;
  q("#preset-editor-close").onclick = requestClose;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) requestClose();
  };

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key !== "Escape") return;
    if (host.querySelectorAll(".modal-backdrop").length > 1) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    requestClose();
  }
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", syncPreview);

  q("#preset-theme-save").onclick = async () => {
    const name = nameInput.value.trim();
    const id = idInput.value.trim();
    errEl.textContent = "";
    setFieldError(nameError, nameInput, "", "preset-theme-name-error");
    setFieldError(idError, idInput, "", "preset-theme-id-error");

    if (!name) {
      setFieldError(nameError, nameInput, "Le nom est obligatoire.", "preset-theme-name-error");
      nameInput.focus();
      return;
    }
    if (!isValidPresetId(id)) {
      setFieldError(
        idError,
        idInput,
        "Identifiant obligatoire : kebab-case (ex. city, harry-potter).",
        "preset-theme-id-error"
      );
      idInput.focus();
      return;
    }

    const others = await loadPresetDraftThemes();
    if (others.some((t) => t.id === id && t.id !== draft.previousId)) {
      setFieldError(
        idError,
        idInput,
        `L’identifiant « ${id} » existe déjà.`,
        "preset-theme-id-error"
      );
      idInput.focus();
      return;
    }

    try {
      await upsertPresetDraftTheme(
        {
          id,
          name,
          color: draft.color,
          logoSrc: draft.logoSrc,
          logoDataUrl: draft.logoDataUrl,
          logoZoom: currentLogoUrl() ? draft.logoZoom : 1,
          logoOffsetX: currentLogoUrl() ? draft.logoOffsetX : 0,
          logoOffsetY: currentLogoUrl() ? draft.logoOffsetY : 0,
          updatedAt: "",
        },
        { previousId: draft.previousId }
      );
      onSaved();
    } catch (ex) {
      errEl.textContent = ex.message || "Enregistrement impossible.";
    }
  };

  const deleteBtn = q("#preset-theme-delete");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const ok = await confirmDialog(host, {
        title: `Supprimer le thème « ${existing.name} » (${existing.id}) ?`,
        icon: "delete-bin-2",
        message:
          "Ce thème sera retiré du brouillon local uniquement (pas de la collection). Souhaitez-vous continuer ?",
        okLabel: "Supprimer",
        danger: true,
      });
      if (!ok) return;
      try {
        await deletePresetDraftTheme(existing.id);
        onDeleted?.();
      } catch (ex) {
        errEl.textContent = ex.message || "Suppression impossible.";
      }
    };
  }

  queueMicrotask(() => focusTopModal());

  return () => {
    themeColorField?.destroy();
    logoField?.destroy();
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", syncPreview);
    popModalDocumentTitle();
  };
}
