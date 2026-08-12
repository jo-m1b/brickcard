import { ICON_CLOSE } from "../icons.js";
import { bindFormColor, formColorMarkup } from "../form-color.js";
import { enhanceFormSelect } from "../form-select.js";
import {
  compressImage,
  fetchImageAsFile,
  upsertCard,
  deleteCard,
  getCard,
  loadThemes,
  getTheme,
  resolveImageBackground,
} from "../storage.js";
import { applyImageTransform, mountCardPreview, refreshCardPreview, mountCardBackPreview, refreshCardBackPreview } from "../card-render.js";
import { downloadCardPhoto, slugifyFilename } from "../card-export.js";

/**
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{ cardId?: string|null, onSaved: () => void, onCancel: () => void, onDeleted?: () => void, toast?: (msg: string, type?: string) => void }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderEditor(host, opts) {
  const ZOOM_MIN = 25;
  const ZOOM_MAX = 400;
  const existing = opts.cardId ? await getCard(opts.cardId) : null;
  const isEdit = Boolean(existing);
  const themes = await loadThemes();
  const storedImageBg = existing?.imageBackgroundColor || "";
  const imageBgDisplay = resolveImageBackground(storedImageBg);
  const zoomPercent = Math.min(
    ZOOM_MAX,
    Math.max(ZOOM_MIN, Math.round((existing?.imageZoom || 1) * 100))
  );

  /** @type {{
   *   imageDataUrl: string|null,
   *   imageBackgroundColor: string,
   *   imageNaturalWidth: number,
   *   imageNaturalHeight: number,
   *   imageZoom: number,
   *   imageOffsetX: number,
   *   imageOffsetY: number,
   *   dragging: boolean,
   *   lastX: number,
   *   lastY: number,
   *   legoTheme: import("../themes-data.js").LegoTheme|null
   * }} */
  const state = {
    imageDataUrl: existing?.imageDataUrl || null,
    imageBackgroundColor: storedImageBg,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    imageZoom: existing?.imageZoom || 1,
    imageOffsetX: existing?.imageOffsetX || 0,
    imageOffsetY: existing?.imageOffsetY || 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    legoTheme: null,
  };

  if (existing?.brickcardThemeId) {
    state.legoTheme =
      themes.find((t) => t.id === existing.brickcardThemeId) ||
      (await getTheme(existing.brickcardThemeId));
  }

  const themeOptions = themes
    .map(
      (t) =>
        `<option value="${escapeAttr(t.id)}" ${existing?.brickcardThemeId === t.id ? "selected" : ""}>${escapeHtml(t.themeName)}</option>`
    )
    .join("");

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="card-editor-backdrop" role="presentation">
      <div class="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div class="modal-header">
          <div>
            <h2 class="view-title" id="editor-title">${isEdit ? "Modifier la carte" : "Nouvelle carte"}</h2>
            <p class="view-desc">Tu peux enregistrer une carte totalement vierge et compléter les infos plus tard.</p>
          </div>
          <button type="button" class="btn ghost icon-only modal-close" id="btn-modal-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="editor-layout">
            <div>
              <div class="form-field">
                <label class="form-label" for="lego-set-ref">Référence du set</label>
                <input class="form-control" type="text" id="lego-set-ref" autocomplete="off" />
              </div>

              <div class="form-field">
                <label class="form-label" for="card-title">Titre</label>
                <p class="form-hint" id="card-title-hint">Entrée pour un saut de ligne (3 lignes max sur la carte)</p>
                <textarea class="form-control" id="card-title" rows="3" autocomplete="off" aria-describedby="card-title-hint"></textarea>
              </div>

              <div class="field-row field-row-3">
                <div class="form-field">
                  <label class="form-label" for="release-year">Année de sortie</label>
                  <input class="form-control" type="number" id="release-year" min="1900" max="2100" step="1" inputmode="numeric" />
                </div>
                <div class="form-field">
                  <label class="form-label" for="piece-count">Nombre de pièces</label>
                  <input class="form-control" type="number" id="piece-count" min="0" step="1" inputmode="numeric" />
                </div>
                <div class="form-field">
                  <label class="form-label" for="figurine-count">Nombre de figurines</label>
                  <input class="form-control" type="number" id="figurine-count" min="0" step="1" inputmode="numeric" />
                </div>
              </div>

              <div class="form-field">
                <label class="form-label" for="brickcard-theme-id">Thème</label>
                <p class="form-hint" id="brickcard-theme-hint">Couleur + logo sur la carte — <a href="#/themes">gérer les thèmes</a></p>
                <select id="brickcard-theme-id" class="form-control" aria-describedby="brickcard-theme-hint">
                  <option value="">Aucun thème</option>
                  ${themeOptions}
                </select>
              </div>

              <div class="form-field">
                <label class="form-label" id="card-photo-label">Photo</label>
                <p class="form-hint" id="card-photo-hint">Fichier ou URL.</p>
                <div class="photo-zone" id="photo-zone" role="group" aria-labelledby="card-photo-label" aria-describedby="card-photo-hint">
                  <div class="file-row">
                    <label class="btn primary file-btn">
                      ${isEdit && existing?.imageDataUrl ? "Changer l'image" : "Parcourir…"}
                      <input type="file" id="card-image" accept="image/*" />
                    </label>
                    <button type="button" class="btn ghost sm" id="card-image-clear" ${existing?.imageDataUrl ? "" : "hidden"}>Retirer</button>
                    <span class="file-name" id="file-name">${existing?.imageDataUrl ? "Image enregistrée" : "Aucune image"}</span>
                  </div>
                  <div class="url-import">
                    <span class="file-or">ou URL</span>
                    <input type="text" id="card-image-url" inputmode="url" placeholder="https://…/image.png" autocomplete="off" spellcheck="false" />
                    <button type="button" class="btn secondary sm" id="card-image-url-btn">Charger</button>
                  </div>

                  <div class="form-field image-bg-field">
                    <label class="form-label" for="image-background-color-hex">Fond de l’image</label>
                    <p class="form-hint" id="image-bg-hint">Vide = blanc à l’affichage (utile pour PNG/SVG transparents)</p>
                    ${formColorMarkup({
                      id: "image-background-color-hex",
                      value: storedImageBg,
                      fallback: imageBgDisplay,
                      placeholder: "#ffffff",
                      describedBy: "image-bg-hint",
                    })}
                  </div>

                  <div class="cropper" id="cropper" title="Glisser pour déplacer · molette pour zoomer" style="background-color:${escapeAttr(imageBgDisplay)}">
                    <div class="placeholder" id="cropper-placeholder">Aperçu de cadrage<br />Glisser pour déplacer</div>
                    <img id="cropper-img" alt="" hidden />
                  </div>

                  <div class="controls ${existing?.imageDataUrl ? "" : "disabled"}" id="image-controls">
                    <div class="form-field">
                      <label class="form-label" for="image-zoom">Zoom</label>
                      <div class="form-range-row">
                        <input type="range" id="image-zoom" min="${ZOOM_MIN}" max="${ZOOM_MAX}" value="${zoomPercent}" aria-valuemin="${ZOOM_MIN}" aria-valuemax="${ZOOM_MAX}" aria-valuenow="${zoomPercent}" aria-describedby="image-zoom-out" />
                        <output id="image-zoom-out" for="image-zoom">${zoomPercent}%</output>
                      </div>
                    </div>
                    <div class="editor-actions">
                      <button type="button" class="btn secondary sm" id="reset-image-crop">Recentrer</button>
                      <button type="button" class="btn secondary sm" id="btn-card-download" ${existing?.imageDataUrl ? "" : "hidden"}>Télécharger la photo</button>
                    </div>
                  </div>
                </div>
              </div>

              <p class="form-error" id="error" role="alert"></p>
            </div>

            <aside class="preview-wrap">
              <div class="preview-label">Face</div>
              <div class="card-preview" id="preview-host" aria-label="Aperçu de la face"></div>
              <div class="preview-label">Dos</div>
              <div class="card-preview" id="preview-back-host" aria-label="Aperçu du dos"></div>
              <p class="preview-hint">Format poker 63 × 88 mm</p>
            </aside>
          </div>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-start">
            <button type="button" class="btn primary" id="btn-card-save">Enregistrer</button>
            <button type="button" class="btn secondary sm" id="btn-card-cancel">Annuler</button>
          </div>
          ${
            isEdit
              ? `<div class="modal-footer-end">
            <button type="button" class="btn danger" id="btn-card-delete">Supprimer</button>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  const refs = {
    backdrop: host.querySelector("#card-editor-backdrop"),
    legoSetRef: host.querySelector("#lego-set-ref"),
    title: host.querySelector("#card-title"),
    releaseYear: host.querySelector("#release-year"),
    pieceCount: host.querySelector("#piece-count"),
    figurineCount: host.querySelector("#figurine-count"),
    brickcardThemeId: host.querySelector("#brickcard-theme-id"),
    cardImage: host.querySelector("#card-image"),
    cardImageUrl: host.querySelector("#card-image-url"),
    cardImageUrlBtn: host.querySelector("#card-image-url-btn"),
    cardImageClear: host.querySelector("#card-image-clear"),
    fileName: host.querySelector("#file-name"),
    photoZone: host.querySelector("#photo-zone"),
    cropper: host.querySelector("#cropper"),
    cropperImg: host.querySelector("#cropper-img"),
    cropperPlaceholder: host.querySelector("#cropper-placeholder"),
    controls: host.querySelector("#image-controls"),
    imageZoom: host.querySelector("#image-zoom"),
    imageZoomOut: host.querySelector("#image-zoom-out"),
    resetImageCrop: host.querySelector("#reset-image-crop"),
    error: host.querySelector("#error"),
    previewHost: host.querySelector("#preview-host"),
    previewBackHost: host.querySelector("#preview-back-host"),
    save: host.querySelector("#btn-card-save"),
    download: host.querySelector("#btn-card-download"),
    cancel: host.querySelector("#btn-card-cancel"),
    deleteBtn: host.querySelector("#btn-card-delete"),
    close: host.querySelector("#btn-modal-close"),
  };

  const imageBgColorRoot = /** @type {HTMLElement|null} */ (
    host.querySelector("#image-background-color-hex")?.closest("[data-form-color]")
  );
  /** @type {ReturnType<typeof bindFormColor>|null} */
  let imageBgColorField = null;
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
      description: "",
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
      imageNaturalWidth: state.imageNaturalWidth,
      imageNaturalHeight: state.imageNaturalHeight,
      legoTheme: state.legoTheme,
    });
    refreshCardBackPreview(previewBack, data, {
      legoTheme: state.legoTheme,
    });
    if (state.imageDataUrl && state.imageNaturalWidth) {
      applyImageTransform(refs.cropperImg, refs.cropper, {
        imageNaturalWidth: state.imageNaturalWidth,
        imageNaturalHeight: state.imageNaturalHeight,
        imageZoom: state.imageZoom,
        imageOffsetX: state.imageOffsetX,
        imageOffsetY: state.imageOffsetY,
      });
    }
  }

  function setImageZoomPercent(percent) {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(Number(percent) || 100)));
    state.imageZoom = clamped / 100;
    refs.imageZoom.value = String(clamped);
    refs.imageZoom.setAttribute("aria-valuenow", String(clamped));
    refs.imageZoomOut.textContent = `${clamped}%`;
    syncPreview();
  }

  function showImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        state.imageDataUrl = dataUrl;
        state.imageNaturalWidth = img.naturalWidth;
        state.imageNaturalHeight = img.naturalHeight;

        refs.cropperImg.src = dataUrl;
        refs.cropperImg.hidden = false;
        refs.cropperPlaceholder.hidden = true;
        refs.controls.classList.remove("disabled");
        refs.photoZone.classList.add("has-image");
        refs.cardImageClear.hidden = false;
        if (refs.download) refs.download.hidden = false;

        requestAnimationFrame(() => {
          syncPreview();
          resolve();
        });
      };
      img.onerror = () => reject(new Error("Aperçu impossible à afficher."));
      img.src = dataUrl;
    });
  }

  function clearImage() {
    state.imageDataUrl = null;
    state.imageNaturalWidth = 0;
    state.imageNaturalHeight = 0;
    state.imageOffsetX = 0;
    state.imageOffsetY = 0;
    state.imageZoom = 1;

    refs.cropperImg.removeAttribute("src");
    refs.cropperImg.hidden = true;
    refs.cropperPlaceholder.hidden = false;
    refs.controls.classList.add("disabled");
    refs.photoZone.classList.remove("has-image");
    refs.cardImageClear.hidden = true;
    if (refs.download) refs.download.hidden = true;
    refs.cardImage.value = "";
    refs.cardImageUrl.value = "";
    refs.fileName.textContent = "Aucune image";
    refs.imageZoom.value = "100";
    refs.imageZoomOut.textContent = "100%";

    syncPreview();
  }

  if (state.imageDataUrl) {
    showImage(state.imageDataUrl).catch(() => {
      refs.error.textContent = "Image enregistrée illisible — choisis-en une autre.";
      clearImage();
    });
  } else {
    syncPreview();
  }

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

  async function applySetImageFile(file, label) {
    refs.error.textContent = "";
    refs.fileName.textContent = "Compression…";
    refs.save.disabled = true;
    refs.cardImageUrlBtn.disabled = true;
    try {
      const type = file.type || "";
      if (type && !type.startsWith("image/")) {
        throw new Error("Choisis une image valide (JPG, PNG, WebP…).");
      }
      const dataUrl = await compressImage(file);
      state.imageOffsetX = 0;
      state.imageOffsetY = 0;
      setImageZoomPercent(100);
      await showImage(dataUrl);
      refs.fileName.textContent = label || file.name || "Image importée";
      refs.cardImageUrl.value = "";
    } catch (err) {
      refs.error.textContent =
        err.message || "Impossible de traiter cette image.";
      if (!state.imageDataUrl) {
        refs.fileName.textContent = "Aucune image";
      } else {
        refs.fileName.textContent = "Image enregistrée";
      }
    } finally {
      refs.save.disabled = false;
      refs.cardImageUrlBtn.disabled = false;
    }
  }

  refs.cardImage.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await applySetImageFile(file, file.name);
  });

  async function loadSetImageFromUrl() {
    const url = refs.cardImageUrl.value.trim();
    if (!url) {
      refs.error.textContent = "Indique une URL d’image.";
      return;
    }
    refs.error.textContent = "";
    refs.fileName.textContent = "Téléchargement…";
    refs.save.disabled = true;
    refs.cardImageUrlBtn.disabled = true;
    try {
      const file = await fetchImageAsFile(url);
      await applySetImageFile(file, file.name || "Image depuis URL");
    } catch (err) {
      refs.error.textContent = err.message || "Téléchargement impossible.";
      refs.fileName.textContent = state.imageDataUrl
        ? "Image enregistrée"
        : "Aucune image";
      refs.save.disabled = false;
      refs.cardImageUrlBtn.disabled = false;
    }
  }

  refs.cardImageUrlBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    loadSetImageFromUrl();
  });
  refs.cardImageUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      loadSetImageFromUrl();
    }
  });

  refs.cardImageClear.addEventListener("click", () => {
    refs.error.textContent = "";
    clearImage();
  });

  if (imageBgColorRoot) {
    imageBgColorField = bindFormColor(imageBgColorRoot, {
      fallbackColor: resolveImageBackground(""),
      onChange(value) {
        state.imageBackgroundColor = value || "";
        if (refs.cropper) {
          refs.cropper.style.backgroundColor = resolveImageBackground(value);
        }
        syncPreview();
      },
    });
  }

  refs.imageZoom.addEventListener("input", () =>
    setImageZoomPercent(Number(refs.imageZoom.value))
  );

  refs.resetImageCrop.addEventListener("click", () => {
    state.imageOffsetX = 0;
    state.imageOffsetY = 0;
    setImageZoomPercent(100);
  });

  refs.cropper.addEventListener("pointerdown", (e) => {
    if (!state.imageDataUrl) return;
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    refs.cropper.setPointerCapture(e.pointerId);
  });

  refs.cropper.addEventListener("pointermove", (e) => {
    if (!state.dragging || !state.imageDataUrl) return;
    const rect = refs.cropper.getBoundingClientRect();
    state.imageOffsetX += (e.clientX - state.lastX) / rect.width;
    state.imageOffsetY += (e.clientY - state.lastY) / rect.height;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    syncPreview();
  });

  const endDrag = (e) => {
    if (!state.dragging) return;
    state.dragging = false;
    try {
      refs.cropper.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  refs.cropper.addEventListener("pointerup", endDrag);
  refs.cropper.addEventListener("pointercancel", endDrag);

  refs.cropper.addEventListener(
    "wheel",
    (e) => {
      if (!state.imageDataUrl) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -8 : 8;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(refs.imageZoom.value) + delta));
      setImageZoomPercent(next);
    },
    { passive: false }
  );

  window.addEventListener("resize", syncPreview);

  function requestClose() {
    opts.onCancel();
  }

  refs.cancel.addEventListener("click", requestClose);
  refs.close.addEventListener("click", requestClose);

  refs.backdrop.addEventListener("click", (e) => {
    if (e.target === refs.backdrop) requestClose();
  });

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      requestClose();
    }
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

  refs.download.addEventListener("click", () => {
    refs.error.textContent = "";
    try {
      const data = draft();
      if (!data.imageDataUrl) {
        throw new Error("Aucune photo à télécharger.");
      }
      const base =
        slugifyFilename(data.legoSetRef) !== "brickcard"
          ? slugifyFilename(data.legoSetRef)
          : slugifyFilename(data.title.split("\n")[0]);
      downloadCardPhoto(data.imageDataUrl, `brickcard-${base}`);
      opts.toast?.("Photo téléchargée");
    } catch (err) {
      refs.error.textContent = err.message || "Téléchargement impossible.";
      opts.toast?.(err.message || "Téléchargement impossible.", "error");
    }
  });

  if (refs.deleteBtn && existing) {
    refs.deleteBtn.addEventListener("click", async () => {
      if (
        !confirm(
          `Supprimer cette carte${existing.title ? ` « ${existing.title} »` : ""}${existing.legoSetRef ? ` (${existing.legoSetRef})` : ""} ?\nCette action est irréversible.`
        )
      ) {
        return;
      }
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

  // Focus premier champ
  queueMicrotask(() => refs.legoSetRef?.focus());

  return () => {
    destroyThemeSelect();
    imageBgColorField?.destroy();
    window.removeEventListener("resize", syncPreview);
    window.removeEventListener("keydown", onKeydown);
    document.body.classList.remove("modal-open");
    host.innerHTML = "";
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
