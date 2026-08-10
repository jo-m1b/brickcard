import {
  loadThemes,
  upsertTheme,
  deleteTheme,
  resetThemeToPreset,
  compressThemeImage,
  fetchImageAsFile,
  createId,
} from "../storage.js";
import { DEFAULT_THEME_COLOR } from "../themes-data.js";
import { resolveCardAccent } from "../card-design.js";

/**
 * Modale de gestion des thèmes LEGO.
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{
 *   onClose: () => void,
 *   toast: (msg: string, type?: string) => void,
 * }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderThemesModal(host, opts) {
  const { onClose, toast } = opts;
  let themes = await loadThemes();

  document.body.classList.add("modal-open");

  /** @type {{ id: string|null, themeName: string, color: string, logoDataUrl: string, isBuiltin: boolean }} */
  let draft = {
    id: null,
    themeName: "",
    color: "",
    logoDataUrl: "",
    isBuiltin: false,
  };

  /** @type {((e: KeyboardEvent) => void)|null} */
  let onThemeEscape = null;

  function q(sel) {
    return host.querySelector(sel);
  }

  function isEditorOpen() {
    const backdrop = q("#theme-editor-backdrop");
    return Boolean(backdrop && !backdrop.hidden);
  }

  function closeEditor() {
    const backdrop = q("#theme-editor-backdrop");
    if (backdrop) backdrop.hidden = true;
    if (onThemeEscape) {
      window.removeEventListener("keydown", onThemeEscape);
      onThemeEscape = null;
    }
  }

  function openEditor(theme) {
    draft = {
      id: theme?.id || null,
      themeName: theme?.themeName || "",
      color: theme?.color || "",
      logoDataUrl: theme?.logoDataUrl || "",
      isBuiltin: Boolean(theme?.isBuiltin),
    };

    const colorDisplay = draft.color || resolveCardAccent(theme);
    const backdrop = q("#theme-editor-backdrop");
    if (!backdrop) return;
    backdrop.hidden = false;

    q("#theme-editor-title").textContent = theme
      ? `Modifier « ${theme.themeName} »`
      : "Nouveau thème";
    q("#theme-name").value = draft.themeName;
    q("#theme-color").value = colorDisplay;
    q("#theme-color-hex").value = draft.color;
    q("#theme-error").textContent = "";
    q("#theme-logo-url").value = "";
    q("#theme-logo").value = "";

    const preview = q("#theme-logo-preview");
    const clearBtn = q("#theme-logo-clear");
    if (draft.logoDataUrl) {
      preview.src = draft.logoDataUrl;
      preview.hidden = false;
      clearBtn.hidden = false;
    } else {
      preview.hidden = true;
      preview.removeAttribute("src");
      clearBtn.hidden = true;
    }

    if (onThemeEscape) window.removeEventListener("keydown", onThemeEscape);
    onThemeEscape = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeEditor();
      }
    };
    window.addEventListener("keydown", onThemeEscape);

    queueMicrotask(() => q("#theme-name")?.focus());
  }

  function paintGrid() {
    const grid = q("#themes-grid");
    if (!grid) return;
    grid.innerHTML = themes
      .map((t) => {
        const accent = resolveCardAccent(t);
        return `
      <article class="theme-card" data-id="${escapeAttr(t.id)}" style="--swatch:${escapeAttr(accent)}">
        <div class="theme-card-swatch" style="background:${escapeAttr(accent)}"></div>
        ${
          t.logoDataUrl
            ? `<img class="theme-card-logo" src="${escapeAttr(t.logoDataUrl)}" alt="" />`
            : `<div class="theme-card-logo is-empty" aria-hidden="true"></div>`
        }
        <div class="theme-card-body">
          <h3>${escapeHtml(t.themeName)}</h3>
          <p class="list-meta">${t.isBuiltin ? "Prédéfini" : "Personnalisé"} · ${escapeHtml(t.color || "couleur par défaut")}${t.logoDataUrl ? "" : " · sans logo"}</p>
          <div class="row-actions">
            <button type="button" class="btn ghost sm" data-edit="${escapeAttr(t.id)}">Modifier</button>
            ${
              t.isBuiltin
                ? `<button type="button" class="btn ghost sm" data-reset="${escapeAttr(t.id)}">Réinitialiser</button>`
                : `<button type="button" class="btn danger sm" data-delete="${escapeAttr(t.id)}">Supprimer</button>`
            }
          </div>
        </div>
      </article>`;
      })
      .join("");

    grid.querySelectorAll("img.theme-card-logo").forEach((img) => {
      img.onerror = () => {
        const empty = document.createElement("div");
        empty.className = "theme-card-logo is-empty";
        empty.setAttribute("aria-hidden", "true");
        img.replaceWith(empty);
      };
    });
  }

  function bindEditor() {
    const colorInput = q("#theme-color");
    const hex = q("#theme-color-hex");
    colorInput.oninput = () => {
      draft.color = colorInput.value;
      hex.value = colorInput.value;
    };
    hex.onchange = () => {
      let v = hex.value.trim();
      if (!v) {
        draft.color = "";
        colorInput.value = resolveCardAccent(null);
        hex.value = "";
        return;
      }
      if (!v.startsWith("#")) v = `#${v}`;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        draft.color = v.toLowerCase();
        colorInput.value = draft.color;
        hex.value = draft.color;
      }
    };

    async function applyThemeLogoFile(file) {
      draft.logoDataUrl = await compressThemeImage(file);
      const preview = q("#theme-logo-preview");
      preview.src = draft.logoDataUrl;
      preview.hidden = false;
      q("#theme-logo-clear").hidden = false;
      q("#theme-logo-url").value = "";
      q("#theme-error").textContent = "";
    }

    q("#theme-logo").onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        await applyThemeLogoFile(file);
      } catch {
        q("#theme-error").textContent =
          "Logo invalide — utilise un SVG, PNG ou WebP.";
      }
    };

    const logoUrlInput = q("#theme-logo-url");
    const logoUrlBtn = q("#theme-logo-url-btn");

    async function loadThemeLogoFromUrl() {
      const url = logoUrlInput.value.trim();
      const err = q("#theme-error");
      if (!url) {
        err.textContent = "Indique une URL de logo.";
        return;
      }
      logoUrlBtn.disabled = true;
      err.textContent = "";
      try {
        const file = await fetchImageAsFile(url);
        await applyThemeLogoFile(file);
      } catch (ex) {
        err.textContent = ex.message || "Téléchargement du logo impossible.";
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

    q("#theme-logo-clear").onclick = () => {
      draft.logoDataUrl = "";
      const preview = q("#theme-logo-preview");
      preview.hidden = true;
      preview.removeAttribute("src");
      q("#theme-logo-clear").hidden = true;
      q("#theme-logo").value = "";
      logoUrlInput.value = "";
    };

    q("#theme-cancel").onclick = closeEditor;
    q("#theme-modal-close").onclick = closeEditor;

    const themeBackdrop = q("#theme-editor-backdrop");
    themeBackdrop.onclick = (e) => {
      if (e.target === themeBackdrop) closeEditor();
    };

    q("#theme-save").onclick = async () => {
      const themeName = q("#theme-name").value.trim();
      const err = q("#theme-error");
      if (!themeName) {
        err.textContent = "Le nom est obligatoire.";
        return;
      }
      err.textContent = "";
      try {
        await upsertTheme({
          id: draft.id || createId(),
          themeName,
          color: draft.color,
          logoDataUrl: draft.logoDataUrl || "",
          isBuiltin: draft.isBuiltin,
        });
        toast("Thème enregistré");
        themes = await loadThemes();
        closeEditor();
        paintGrid();
      } catch (ex) {
        err.textContent = ex.message || "Enregistrement impossible.";
      }
    };
  }

  function bindList() {
    q("#btn-add-theme").onclick = () => openEditor(null);

    q("#themes-grid").onclick = async (e) => {
      const t = /** @type {HTMLElement} */ (e.target);
      const edit = t.closest("[data-edit]");
      const reset = t.closest("[data-reset]");
      const del = t.closest("[data-delete]");

      if (edit) {
        const theme = themes.find((x) => x.id === edit.getAttribute("data-edit"));
        if (theme) openEditor(theme);
        return;
      }
      if (reset) {
        const id = reset.getAttribute("data-reset");
        if (!confirm("Réinitialiser ce thème aux valeurs d'origine ?")) return;
        try {
          await resetThemeToPreset(id);
          toast("Thème réinitialisé");
          themes = await loadThemes();
          paintGrid();
        } catch (err) {
          toast(err.message || "Erreur", "error");
        }
        return;
      }
      if (del) {
        const id = del.getAttribute("data-delete");
        const theme = themes.find((x) => x.id === id);
        if (!theme) return;
        if (!confirm(`Supprimer le thème « ${theme.themeName} » ?`)) return;
        try {
          await deleteTheme(id);
          toast("Thème supprimé");
          themes = await loadThemes();
          paintGrid();
        } catch (err) {
          toast(err.message || "Erreur", "error");
        }
      }
    };
  }

  host.innerHTML = `
    <div class="modal-backdrop" id="themes-modal-backdrop" role="presentation">
      <div class="modal modal-themes" role="dialog" aria-modal="true" aria-labelledby="themes-modal-title">
        <div class="modal-header">
          <div>
            <h2 class="view-title" id="themes-modal-title">Thèmes LEGO</h2>
            <p class="view-desc">Nom, couleur et logo optionnel. Les préréglages sont modifiables et réinitialisables.</p>
          </div>
          <button type="button" class="btn-icon modal-close" id="btn-themes-close" aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.586L16.95 5.63599L18.364 7.04999L13.414 12L18.364 16.95L16.95 18.364L12 13.414L7.04999 18.364L5.63599 16.95L10.586 12L5.63599 7.04999L7.04999 5.63599L12 10.586Z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="themes-toolbar">
            <button type="button" class="btn primary" id="btn-add-theme">Nouveau thème</button>
          </div>
          <div class="themes-grid" id="themes-grid"></div>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" id="theme-editor-backdrop" hidden>
      <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="theme-editor-title">
        <div class="modal-header">
          <div>
            <h2 class="view-title" id="theme-editor-title">Modifier le thème</h2>
            <p class="view-desc">Nom, couleur et logo optionnel.</p>
          </div>
          <button type="button" class="btn-icon modal-close" id="theme-modal-close" aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.586L16.95 5.63599L18.364 7.04999L13.414 12L18.364 16.95L16.95 18.364L12 13.414L7.04999 18.364L5.63599 16.95L10.586 12L5.63599 7.04999L7.04999 5.63599L12 10.586Z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label for="theme-name" class="required">Nom</label>
            <input type="text" id="theme-name" placeholder="CITY" />
          </div>
          <div class="field">
            <label for="theme-color">Couleur</label>
            <div class="color-row">
              <input type="color" id="theme-color" value="${DEFAULT_THEME_COLOR}" />
              <input type="text" id="theme-color-hex" value="" maxlength="7" placeholder="${DEFAULT_THEME_COLOR}" />
            </div>
          </div>
          <div class="field">
            <label for="theme-logo">Logo</label>
            <span class="hint">Optionnel — SVG, PNG ou WebP (fichier ou URL). L’URL n’est pas conservée.</span>
            <div class="file-row">
              <label class="file-btn">
                Parcourir…
                <input type="file" id="theme-logo" accept="image/svg+xml,image/png,image/webp,.svg,.png,.webp" />
              </label>
              <button type="button" class="btn ghost sm" id="theme-logo-clear" hidden>Retirer</button>
            </div>
            <div class="url-import">
              <span class="file-or">ou URL</span>
              <input type="text" id="theme-logo-url" inputmode="url" placeholder="https://…/logo.png" autocomplete="off" spellcheck="false" />
              <button type="button" class="btn secondary sm" id="theme-logo-url-btn">Charger</button>
            </div>
            <img id="theme-logo-preview" class="theme-preview-img" alt="" hidden />
          </div>
          <p class="error" id="theme-error" role="alert"></p>
          <div class="editor-actions">
            <button type="button" class="btn primary" id="theme-save">Enregistrer</button>
            <button type="button" class="btn secondary" id="theme-cancel">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const backdrop = q("#themes-modal-backdrop");
  const btnClose = q("#btn-themes-close");

  const close = () => {
    cleanup();
    onClose();
  };

  /** @param {MouseEvent} e */
  const onBackdropClick = (e) => {
    if (e.target === backdrop) close();
  };

  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    if (isEditorOpen()) return; /* géré par onThemeEscape */
    e.preventDefault();
    close();
  };

  paintGrid();
  bindList();
  bindEditor();

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  function cleanup() {
    closeEditor();
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
    host.innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  return cleanup;
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
