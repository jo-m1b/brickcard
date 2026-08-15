import { ICON_CLOSE } from "../icons.js";
import { bindFormColor, formColorMarkup } from "../form-color.js";
import {
  upsertTheme,
  deleteTheme,
  compressThemeImage,
  fetchImageAsFile,
  createId,
  getTheme,
} from "../storage.js";
import { DEFAULT_THEME_COLOR } from "../themes-data.js";
import { resolveCardAccent } from "../card-design.js";
import { confirmDialog } from "../confirm-dialog.js";

/**
 * Modale d’édition d’un thème personnalisé (`#/themes/new`, `#/themes/edit/:id`).
 * @param {HTMLElement} host
 * @param {{
 *   themeId?: string|null,
 *   onClose: () => void,
 *   onSaved: () => void,
 *   onDeleted?: () => void,
 * }} opts
 * @returns {Promise<(() => void)|null>} cleanup, ou null si id invalide / thème par défaut
 */
export async function renderThemeEditor(host, opts) {
  const { onClose, onSaved, onDeleted } = opts;
  const isEdit = Boolean(opts.themeId);
  const existing = isEdit ? await getTheme(opts.themeId) : null;
  if (isEdit && (!existing || existing.isBuiltin)) return null;

  document.body.classList.add("modal-open");

  /** @type {{ id: string|null, themeName: string, color: string, logoDataUrl: string }} */
  const draft = {
    id: existing?.id || null,
    themeName: existing?.themeName || "",
    color: existing?.color || "",
    logoDataUrl: existing?.logoDataUrl || "",
  };

  const colorDisplay = draft.color || resolveCardAccent(existing);

  host.innerHTML = `
    <div class="modal-backdrop" id="theme-editor-backdrop" role="presentation">
      <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="theme-editor-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="theme-editor-title">${
              existing
                ? `Modifier « ${escapeHtml(existing.themeName)} »`
                : "Nouveau thème"
            }</h1>
            <p class="view-desc">Nom, couleur et logo optionnel.</p>
          </div>
          <button type="button" class="btn ghost icon-only modal-close" id="theme-modal-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label form-label--required" for="theme-name">Nom</label>
            <input class="form-control" type="text" id="theme-name" placeholder="CITY" autocomplete="off" />
          </div>
          <div class="form-field">
            <label class="form-label" for="theme-color-hex">Couleur</label>
            <p class="form-hint" id="theme-color-hint">Optionnel — sinon couleur par défaut des cartes.</p>
            ${formColorMarkup({
              id: "theme-color-hex",
              value: draft.color,
              fallback: DEFAULT_THEME_COLOR,
              placeholder: DEFAULT_THEME_COLOR,
              describedBy: "theme-color-hint",
            })}
          </div>
          <div class="form-field">
            <label class="form-label" for="theme-logo">Logo</label>
            <p class="form-hint" id="theme-logo-hint">Optionnel — SVG, PNG ou WebP (fichier ou URL). L’URL n’est pas conservée.</p>
            <div class="file-row" role="group" aria-describedby="theme-logo-hint">
              <label class="btn primary file-btn">
                Parcourir…
                <input type="file" id="theme-logo" accept="image/svg+xml,image/png,image/webp,.svg,.png,.webp" />
              </label>
              <button type="button" class="btn ghost sm" id="theme-logo-clear" ${
                draft.logoDataUrl ? "" : "hidden"
              }>Retirer</button>
            </div>
            <div class="url-import">
              <span class="file-or">ou URL</span>
              <input type="text" id="theme-logo-url" inputmode="url" placeholder="https://…/logo.png" autocomplete="off" spellcheck="false" />
              <button type="button" class="btn secondary sm" id="theme-logo-url-btn">Charger</button>
            </div>
            <img id="theme-logo-preview" class="theme-preview-img" alt="" ${
              draft.logoDataUrl
                ? `src="${escapeAttr(draft.logoDataUrl)}"`
                : "hidden"
            } />
          </div>
          <p class="form-error" id="theme-error" role="alert"></p>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-start">
            <button type="button" class="btn primary" id="theme-save">Enregistrer</button>
            <button type="button" class="btn secondary sm" id="theme-cancel">Annuler</button>
          </div>
          ${
            existing
              ? `<div class="modal-footer-end">
            <button type="button" class="btn danger" id="theme-delete">Supprimer</button>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  const q = (sel) => host.querySelector(sel);
  const backdrop = q("#theme-editor-backdrop");
  const nameInput = q("#theme-name");
  const errEl = q("#theme-error");
  const preview = q("#theme-logo-preview");
  const clearBtn = q("#theme-logo-clear");
  const logoInput = q("#theme-logo");
  const logoUrlInput = q("#theme-logo-url");
  const logoUrlBtn = q("#theme-logo-url-btn");

  nameInput.value = draft.themeName;

  const colorRoot = /** @type {HTMLElement|null} */ (
    q("#theme-color-hex")?.closest("[data-form-color]")
  );
  /** @type {ReturnType<typeof bindFormColor>|null} */
  let themeColorField = null;
  if (colorRoot) {
    themeColorField = bindFormColor(colorRoot, {
      fallbackColor: DEFAULT_THEME_COLOR,
      onChange(value) {
        draft.color = value || "";
        if (!value) {
          themeColorField?.setValue("", resolveCardAccent(null));
        }
      },
    });
  }
  themeColorField?.setValue(draft.color, colorDisplay);

  async function applyThemeLogoFile(file) {
    draft.logoDataUrl = await compressThemeImage(file);
    preview.src = draft.logoDataUrl;
    preview.hidden = false;
    clearBtn.hidden = false;
    logoUrlInput.value = "";
    errEl.textContent = "";
  }

  logoInput.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      await applyThemeLogoFile(file);
    } catch {
      errEl.textContent = "Logo invalide — utilise un SVG, PNG ou WebP.";
    }
  };

  async function loadThemeLogoFromUrl() {
    const url = logoUrlInput.value.trim();
    if (!url) {
      errEl.textContent = "Indique une URL de logo.";
      return;
    }
    logoUrlBtn.disabled = true;
    errEl.textContent = "";
    try {
      const file = await fetchImageAsFile(url);
      await applyThemeLogoFile(file);
    } catch (ex) {
      errEl.textContent = ex.message || "Téléchargement du logo impossible.";
    } finally {
      logoUrlBtn.disabled = false;
    }
  }

  logoUrlBtn.onclick = () => loadThemeLogoFromUrl();
  logoUrlInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loadThemeLogoFromUrl();
    }
  };

  clearBtn.onclick = () => {
    draft.logoDataUrl = "";
    preview.hidden = true;
    preview.removeAttribute("src");
    clearBtn.hidden = true;
    logoInput.value = "";
    logoUrlInput.value = "";
  };

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

  q("#theme-save").onclick = async () => {
    const themeName = nameInput.value.trim();
    if (!themeName) {
      errEl.textContent = "Le nom est obligatoire.";
      return;
    }
    errEl.textContent = "";
    try {
      await upsertTheme({
        id: draft.id || createId(),
        themeName,
        color: draft.color,
        logoDataUrl: draft.logoDataUrl || "",
        isBuiltin: false,
      });
      onSaved();
    } catch (ex) {
      errEl.textContent = ex.message || "Enregistrement impossible.";
    }
  };

  const deleteBtn = q("#theme-delete");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const ok = await confirmDialog(host, {
        title: "Supprimer ?",
        subtitle: existing.themeName,
        message:
          "Attention, la suppression est définitive et ne pourra pas être annulée ! Souhaitez-vous continuer ?",
        okLabel: "Supprimer",
        danger: true,
      });
      if (!ok) return;
      try {
        await deleteTheme(existing.id);
        onDeleted?.();
      } catch (ex) {
        errEl.textContent = ex.message || "Suppression impossible.";
      }
    };
  }

  queueMicrotask(() => nameInput.focus());

  return () => {
    themeColorField?.destroy();
    window.removeEventListener("keydown", onKey);
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}
