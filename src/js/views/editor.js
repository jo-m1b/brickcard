import {
  ICON_ADD,
  ICON_APPS_2,
  ICON_CALENDAR_TODO,
  ICON_CLOSE,
  ICON_DELETE_BIN_2,
  ICON_HASHTAG,
  ICON_PALETTE,
  ICON_PENCIL,
  ICON_SAVE,
  ICON_USER_3,
  modalTitleMarkup,
} from "../icons.js";
import { enhanceFormSelect } from "../form-select.js";
import { bindFormImage, formImageMarkup } from "../form-image.js";
import {
  compressImage,
  upsertCard,
  deleteCard,
  getCard,
  loadThemes,
  getTheme,
} from "../storage.js";
import { mountCardPreview, refreshCardPreview, mountCardBackPreview, refreshCardBackPreview } from "../card-render.js";
import { slugifyFilename } from "../card-export.js";
import { confirmDialog } from "../confirm-dialog.js";
import { partitionThemes } from "../themes-data.js";
import { setAppDocumentTitle } from "../document-title.js";

/**
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{ cardId?: string|null, onSaved: () => void, onCancel: () => void, onDeleted?: () => void, toast?: (msg: string, type?: string) => void }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderEditor(host, opts) {
  const existing = opts.cardId ? await getCard(opts.cardId) : null;
  const isEdit = Boolean(existing);
  const themes = await loadThemes();
  const storedImageBg = existing?.imageBackgroundColor || "";

  /** @type {{
   *   imageDataUrl: string|null,
   *   imageBackgroundColor: string,
   *   imageZoom: number,
   *   imageOffsetX: number,
   *   imageOffsetY: number,
   *   legoTheme: import("../themes-data.js").LegoTheme|null
   * }} */
  const state = {
    imageDataUrl: existing?.imageDataUrl || null,
    imageBackgroundColor: storedImageBg,
    imageZoom: existing?.imageZoom || 1,
    imageOffsetX: existing?.imageOffsetX || 0,
    imageOffsetY: existing?.imageOffsetY || 0,
    legoTheme: null,
  };

  if (existing?.brickcardThemeId) {
    state.legoTheme =
      themes.find((t) => t.id === existing.brickcardThemeId) ||
      (await getTheme(existing.brickcardThemeId));
  }

  const selectedId = existing?.brickcardThemeId || "";
  /** @param {import("../themes-data.js").LegoTheme} t */
  function themeOption(t) {
    return `<option value="${escapeAttr(t.id)}" ${
      selectedId === t.id ? "selected" : ""
    }>${escapeHtml(t.name)}</option>`;
  }
  const { custom: customThemes, builtin: builtinThemes } =
    partitionThemes(themes);
  const themeOptions = customThemes.length
    ? `<optgroup label="Thèmes personnalisés">${customThemes.map(themeOption).join("")}</optgroup>
                  <optgroup label="Thèmes par défaut">${builtinThemes.map(themeOption).join("")}</optgroup>`
    : builtinThemes.map(themeOption).join("");

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="card-editor-backdrop" role="presentation">
      <div class="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="editor-title">${modalTitleMarkup(
              editorDialogTitle(existing),
              isEdit ? ICON_PENCIL : ICON_ADD
            )}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-modal-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <div class="editor-layout">
            <aside class="preview-wrap preview-wrap--pair">
              <div class="card-preview" id="preview-host" aria-label="Aperçu de la face"></div>
              <div class="card-preview" id="preview-back-host" aria-label="Aperçu du dos"></div>
            </aside>

            <div>
              <div class="form-field">
                <label class="form-label" for="lego-set-ref">Numéro de l'ensemble</label>
                <div class="form-control-wrap">
                  <span class="form-control-icon" aria-hidden="true">${ICON_HASHTAG}</span>
                  <input class="form-control" type="text" id="lego-set-ref" autocomplete="off" />
                </div>
              </div>

              <div class="form-field">
                <label class="form-label" for="card-title">Titre</label>
                <p class="form-hint" id="card-title-hint">Maximum 3 lignes affichées sur la carte (Entrée pour un saut de ligne)</p>
                <textarea class="form-control" id="card-title" rows="3" autocomplete="off" aria-describedby="card-title-hint"></textarea>
              </div>

              <div class="field-row field-row-3">
                <div class="form-field">
                  <label class="form-label" for="release-year">Année de sortie</label>
                  <div class="form-control-wrap">
                    <span class="form-control-icon" aria-hidden="true">${ICON_CALENDAR_TODO}</span>
                    <input class="form-control" type="number" id="release-year" min="1900" max="2100" step="1" inputmode="numeric" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label" for="piece-count">Nombre de pièces</label>
                  <div class="form-control-wrap">
                    <span class="form-control-icon" aria-hidden="true">${ICON_APPS_2}</span>
                    <input class="form-control" type="number" id="piece-count" min="0" step="1" inputmode="numeric" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label" for="figurine-count">Nombre de figurines</label>
                  <div class="form-control-wrap">
                    <span class="form-control-icon" aria-hidden="true">${ICON_USER_3}</span>
                    <input class="form-control" type="number" id="figurine-count" min="0" step="1" inputmode="numeric" />
                  </div>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label" for="brickcard-theme-id">Thème</label>
                <div class="form-control-wrap">
                  <span class="form-control-icon" aria-hidden="true">${ICON_PALETTE}</span>
                  <select id="brickcard-theme-id" class="form-control">
                    <option value="">Aucun thème</option>
                    ${themeOptions}
                  </select>
                </div>
              </div>

              <div class="form-field">
                <label class="form-label" id="card-photo-label">Image</label>
                ${formImageMarkup({
                  id: "card-image",
                  labelledBy: "card-photo-label",
                  accept: "image/*,image/svg+xml,.svg",
                  dataUrl: existing?.imageDataUrl || "",
                  backgroundColor: storedImageBg,
                  zoom: existing?.imageZoom || 1,
                  offsetX: existing?.imageOffsetX || 0,
                  offsetY: existing?.imageOffsetY || 0,
                })}
              </div>

              <p class="form-error" id="error" role="alert"></p>
            </div>
          </div>
        </div>
        <div class="modal-footer modal-footer--primary-first">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-card-save">${ICON_SAVE}<span>Enregistrer</span></button>
            <button type="button" class="btn secondary sm" id="btn-card-cancel">Annuler</button>
          </div>
          ${
            isEdit
              ? `<div class="modal-footer-start">
            <button type="button" class="btn danger" id="btn-card-delete">${ICON_DELETE_BIN_2}<span>Supprimer</span></button>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  setAppDocumentTitle(editorDialogTitle(existing));

  const refs = {
    backdrop: host.querySelector("#card-editor-backdrop"),
    legoSetRef: host.querySelector("#lego-set-ref"),
    title: host.querySelector("#card-title"),
    releaseYear: host.querySelector("#release-year"),
    pieceCount: host.querySelector("#piece-count"),
    figurineCount: host.querySelector("#figurine-count"),
    brickcardThemeId: host.querySelector("#brickcard-theme-id"),
    error: host.querySelector("#error"),
    previewHost: host.querySelector("#preview-host"),
    previewBackHost: host.querySelector("#preview-back-host"),
    save: host.querySelector("#btn-card-save"),
    cancel: host.querySelector("#btn-card-cancel"),
    deleteBtn: host.querySelector("#btn-card-delete"),
    close: host.querySelector("#btn-modal-close"),
  };

  const imageRoot = /** @type {HTMLElement|null} */ (host.querySelector("#card-image"));
  /** @type {ReturnType<typeof bindFormImage>|null} */
  let imageField = null;
  const destroyThemeSelect = enhanceFormSelect(
    /** @type {HTMLSelectElement} */ (refs.brickcardThemeId)
  );

  const previewDraft = {
    legoSetRef: existing?.legoSetRef || "",
    title: existing?.title || "",
    releaseYear: existing?.releaseYear ?? null,
    pieceCount: existing?.pieceCount ?? null,
    figurineCount: existing?.figurineCount ?? null,
    imageDataUrl: state.imageDataUrl || "",
    imageBackgroundColor: state.imageBackgroundColor,
    imageZoom: state.imageZoom,
    imageOffsetX: state.imageOffsetX,
    imageOffsetY: state.imageOffsetY,
  };

  /** @type {HTMLElement} */
  let previewCard = mountCardPreview(refs.previewHost, previewDraft, {
    legoTheme: state.legoTheme,
  });

  /** @type {HTMLElement} */
  let previewBack = mountCardBackPreview(refs.previewBackHost, previewDraft, {
    legoTheme: state.legoTheme,
  });

  if (existing) {
    refs.legoSetRef.value = existing.legoSetRef;
    refs.title.value = existing.title;
    refs.releaseYear.value =
      existing.releaseYear != null ? String(existing.releaseYear) : "";
    refs.pieceCount.value =
      existing.pieceCount != null ? String(existing.pieceCount) : "";
    refs.figurineCount.value =
      existing.figurineCount != null ? String(existing.figurineCount) : "";
  }

  function draft() {
    const pieceCountVal = refs.pieceCount.value.trim();
    const figurineCountVal = refs.figurineCount.value.trim();
    const releaseYearVal = refs.releaseYear.value.trim();
    return {
      legoSetRef: refs.legoSetRef.value.trim(),
      title: refs.title.value.trim(),
      brickcardThemeId: refs.brickcardThemeId.value,
      pieceCount: pieceCountVal === "" ? null : Number(pieceCountVal),
      figurineCount: figurineCountVal === "" ? null : Number(figurineCountVal),
      releaseYear: releaseYearVal === "" ? null : Number(releaseYearVal),
      imageDataUrl: state.imageDataUrl || "",
      imageBackgroundColor: state.imageBackgroundColor || "",
      imageZoom: state.imageZoom,
      imageOffsetX: state.imageOffsetX,
      imageOffsetY: state.imageOffsetY,
    };
  }

  function syncPreview() {
    const data = draft();
    refreshCardPreview(previewCard, data, {
      legoTheme: state.legoTheme,
    });
    refreshCardBackPreview(previewBack, data, {
      legoTheme: state.legoTheme,
    });
  }

  function cardImageBasename() {
    const ref = slugifyFilename(refs.legoSetRef.value);
    const base =
      ref !== "brickcard"
        ? ref
        : slugifyFilename(refs.title.value.split("\n")[0]);
    return `brickcard-${base}`;
  }

  if (imageRoot) {
    imageField = bindFormImage(imageRoot, {
      processFile: compressImage,
      dialogHost: host,
      downloadBasename: cardImageBasename,
      onChange(value) {
        state.imageDataUrl = value.dataUrl || null;
        state.imageBackgroundColor = value.backgroundColor || "";
        state.imageZoom = value.zoom;
        state.imageOffsetX = value.offsetX;
        state.imageOffsetY = value.offsetY;
        syncPreview();
      },
      onDownload() {
        opts.toast?.("Photo téléchargée");
      },
    });
  }

  syncPreview();

  ["input", "change"].forEach((evt) => {
    refs.legoSetRef.addEventListener(evt, syncPreview);
    refs.title.addEventListener(evt, syncPreview);
    refs.releaseYear.addEventListener(evt, syncPreview);
    refs.pieceCount.addEventListener(evt, syncPreview);
    refs.figurineCount.addEventListener(evt, syncPreview);
  });

  refs.brickcardThemeId.addEventListener("change", () => {
    const id = refs.brickcardThemeId.value;
    state.legoTheme = id ? themes.find((t) => t.id === id) || null : null;
    syncPreview();
  });

  window.addEventListener("resize", syncPreview);

  function requestClose() {
    opts.onCancel();
  }

  refs.cancel.addEventListener("click", requestClose);
  refs.close.addEventListener("click", requestClose);

  refs.backdrop.addEventListener("click", (e) => {
    if (e.target === refs.backdrop) requestClose();
  });

  function cardDeleteTitle() {
    const data = draft();
    const refRaw = data.legoSetRef.replace(/^#+\s*/, "").trim();
    const title = data.title.replace(/\s*\n\s*/g, " ").trim();
    if (title && refRaw) return `Supprimer la carte "${title}" (#${refRaw}) ?`;
    if (title) return `Supprimer la carte "${title}" ?`;
    if (refRaw) return `Supprimer la carte (#${refRaw}) ?`;
    return "Supprimer cette carte ?";
  }

  function onKeydown(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    requestClose();
  }
  window.addEventListener("keydown", onKeydown);

  refs.save.addEventListener("click", async () => {
    const data = draft();
    refs.error.textContent = "";
    refs.save.disabled = true;
    try {
      await upsertCard({
        ...data,
        id: existing?.id,
      });
      opts.onSaved();
    } catch (err) {
      refs.error.textContent = err.message || "Enregistrement impossible.";
      refs.save.disabled = false;
    }
  });

  if (refs.deleteBtn && existing) {
    refs.deleteBtn.addEventListener("click", async () => {
      const ok = await confirmDialog(host, {
        title: cardDeleteTitle(),
        icon: "delete-bin-2",
        message:
          "Attention, la suppression est définitive et ne pourra pas être annulée ! Souhaitez-vous continuer ?",
        okLabel: "Supprimer",
        danger: true,
      });
      if (!ok) return;
      refs.deleteBtn.disabled = true;
      refs.save.disabled = true;
      try {
        await deleteCard(existing.id);
        if (opts.onDeleted) opts.onDeleted();
        else opts.onCancel();
      } catch (err) {
        refs.error.textContent = err.message || "Suppression impossible.";
        refs.deleteBtn.disabled = false;
        refs.save.disabled = false;
      }
    });
  }

  return () => {
    destroyThemeSelect();
    imageField?.destroy();
    window.removeEventListener("resize", syncPreview);
    window.removeEventListener("keydown", onKeydown);
  };
}

/**
 * Titre du dialog d’édition (valeurs à l’ouverture).
 * @param {{ title?: string, legoSetRef?: string }|null} existing
 */
function editorDialogTitle(existing) {
  if (!existing) return "Nouvelle carte";
  const title = String(existing.title || "").replace(/\s*\n\s*/g, " ").trim();
  const refRaw = String(existing.legoSetRef || "").replace(/^#+\s*/, "").trim();
  if (title && refRaw) return `Modifier « ${title} (#${refRaw}) »`;
  if (title) return `Modifier « ${title} »`;
  if (refRaw) return `Modifier « #${refRaw} »`;
  return "Modifier la carte";
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
