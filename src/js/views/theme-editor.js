import { ICON_ADD, ICON_CLOSE, ICON_DELETE_BIN_2, ICON_PENCIL, ICON_SAVE, modalTitleMarkup } from "../icons.js";
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

/**
 * Modale d’édition d’un thème personnalisé (`#themes/new`, `#themes/edit/:id`).
 * @param {HTMLElement} host
 * @param {{
 *   themeId?: string|null,
 *   onClose: () => void,
 *   onSaved: (name: string, meta: { isNew: boolean, theme: import("../themes-data.js").LegoTheme }) => void,
 *   onDeleted?: (name: string, themeId: string) => void,
 * }} opts
 * @returns {Promise<(() => void)|null>} cleanup, ou null si id invalide / thème par défaut
 */
export async function renderThemeEditor(host, opts) {
  const { onClose, onSaved, onDeleted } = opts;
  const isEdit = Boolean(opts.themeId);
  const existing = isEdit ? await getTheme(opts.themeId) : null;
  if (isEdit && (!existing || existing.isBuiltin)) return null;

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
  const dialogTitle = existing ? `Modifier « ${existing.name} »` : "Nouveau thème";

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
              existing ? ICON_PENCIL : ICON_ADD
            )}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="theme-modal-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="editor-layout">
            <aside class="preview-wrap">
              <div class="card-preview" id="theme-preview-back-host" aria-label="Aperçu du dos"></div>
            </aside>
            <div>
              <div class="form-field">
                <label class="form-label form-label--required" for="theme-name">Nom</label>
                <input class="form-control" type="text" id="theme-name" placeholder="CITY" autocomplete="off" />
                <p class="form-error" id="theme-name-error" role="alert" hidden></p>
              </div>
              <div class="form-field">
                <label class="form-label" for="theme-color-hex">Couleur</label>
                <p class="form-hint" id="theme-color-hint">Couleur principale des cartes du thème.</p>
                ${formColorMarkup({
                  id: "theme-color-hex",
                  value: draft.color,
                  fallback: DEFAULT_THEME_COLOR,
                  placeholder: DEFAULT_THEME_COLOR,
                  describedBy: "theme-color-hint",
                })}
              </div>
              <div class="form-field">
                <label class="form-label" for="theme-secondary-color-hex">Couleur secondaire</label>
                <p class="form-hint" id="theme-secondary-color-hint">Couleur utilisée pour les textes, icônes et le logo Brickcard. Par défaut cette couleur est déterminée automatiquement (noir ou blanc) en fonction de la couleur principale.</p>
                ${formColorMarkup({
                  id: "theme-secondary-color-hex",
                  value: draft.secondaryColor,
                  fallback: autoAccentFg(),
                  placeholder: autoAccentFg(),
                  describedBy: "theme-secondary-color-hint",
                })}
              </div>
              <div class="form-field" style="--form-image-aspect: 63 / 44">
                <label class="form-label" id="theme-logo-label">Logo</label>
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
                })}
              </div>
              <p class="form-error" id="theme-error" role="alert"></p>
            </div>
          </div>
        </div>
        <div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="theme-save">${ICON_SAVE}<span>Enregistrer</span></button>
            <button type="button" class="btn secondary sm" id="theme-cancel">Annuler</button>
          </div>
          ${
            existing
              ? `<div class="modal-footer-start">
            <button type="button" class="btn danger" id="theme-delete">${ICON_DELETE_BIN_2}<span>Supprimer</span></button>
          </div>`
              : ""
          }
        </div>
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

  nameInput.value = draft.name;

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
      isBuiltin: false,
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
      onChange(value) {
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
      onChange(value) {
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
      processFile: compressImage,
      dialogHost: host,
      previewBackground: colorDisplay,
      fit: "logo",
      downloadBasename: () =>
        formatThemeLogoBasename({
          name: nameInput.value,
          themeId: draft.id,
        }),
      onChange(value) {
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
    const msg = String(message || "");
    nameError.textContent = msg;
    nameError.hidden = !msg;
    nameInput.classList.toggle("is-invalid", Boolean(msg));
    nameInput.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) nameInput.setAttribute("aria-describedby", "theme-name-error");
    else nameInput.removeAttribute("aria-describedby");
  }

  nameInput.addEventListener("input", () => {
    if (nameError.textContent) setNameError("");
    syncPreview();
  });

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

  q("#theme-save").onclick = async () => {
    const name = nameInput.value.trim();
    if (!name) {
      errEl.textContent = "";
      setNameError("Le nom est obligatoire.");
      nameInput.focus();
      return;
    }
    setNameError("");
    errEl.textContent = "";
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
      errEl.textContent = ex.message || "Enregistrement impossible.";
    }
  };

  const deleteBtn = q("#theme-delete");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const ok = await confirmDialog(host, {
        title: `Supprimer le thème « ${existing.name} » ?`,
        icon: "delete-bin-2",
        message:
          "Attention, la suppression est définitive et ne pourra pas être annulée ! Souhaitez-vous continuer ?",
        okLabel: "Supprimer",
        danger: true,
      });
      if (!ok) return;
      try {
        await deleteTheme(existing.id);
        onDeleted?.(existing.name, existing.id);
      } catch (ex) {
        errEl.textContent = ex.message || "Suppression impossible.";
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
