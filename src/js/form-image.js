/**
 * Champ image design system : `form-image`.
 * Deux vues : vide (fichier / URL) et image (fond optionnel + aperçu de cadrage).
 */

import { applyImageTransform, applyThemeLogoTransform } from "./card-render.js";
import { downloadCardPhoto } from "./card-export.js";
import { confirmDialog } from "./confirm-dialog.js";
import { bindFormColor, formColorMarkup } from "./form-color.js";
import {
  ICON_ALIGN_ITEM_HORIZONTAL_CENTER,
  ICON_ALIGN_ITEM_VERTICAL_CENTER,
  ICON_CLOSE,
  ICON_CLOSE_CIRCLE,
  ICON_ZOOM_IN,
} from "./icons.js";
import {
  fetchImageAsFile,
  resolveImageBackground,
  IMAGE_LOAD_ERROR,
  IMAGE_LOAD_ERROR_FORMAT,
  IMAGE_URL_INVALID,
} from "./storage.js";

const ZOOM_MIN = 25;
const ZOOM_MAX = 400;
const ZOOM_MAX_LOGO = 250;
const ZOOM_STEP = 8;
const KEY_PAN = 0.05;
const CROP_EPS = 0.0005;

let urlDialogSeq = 0;

/**
 * @typedef {{
 *   dataUrl: string,
 *   backgroundColor: string,
 *   zoom: number,
 *   offsetX: number,
 *   offsetY: number,
 * }} FormImageValue
 */

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {string} s */
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

/** @param {number} zoom */
function formatZoomPercent(zoom) {
  const pct = Math.round((Number(zoom) || 1) * 100);
  return `${pct}%`;
}

/** @param {number} offset */
function formatOffsetPercent(offset) {
  const pct = Math.round((Number(offset) || 0) * 100);
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * @param {number} zoom
 * @param {number} offsetX
 * @param {number} offsetY
 */
function isDefaultCrop(zoom, offsetX, offsetY) {
  return (
    Math.abs((Number(zoom) || 1) - 1) < CROP_EPS &&
    Math.abs(Number(offsetX) || 0) < CROP_EPS &&
    Math.abs(Number(offsetY) || 0) < CROP_EPS
  );
}

/** @param {number} percent @param {number} [max] */
function clampZoomPercent(percent, max = ZOOM_MAX) {
  return Math.min(max, Math.max(ZOOM_MIN, Math.round(Number(percent) || 100)));
}

/**
 * Markup d’un contrôle image.
 * @param {{
 *   id: string,
 *   dataUrl?: string,
 *   backgroundColor?: string,
 *   zoom?: number,
 *   offsetX?: number,
 *   offsetY?: number,
 *   accept?: string,
 *   labelledBy?: string,
 *   describedBy?: string,
 *   withBackgroundColor?: boolean,
 *   previewBackground?: string,
 *   fit?: "cover" | "logo",
 * }} opts
 * @returns {string}
 */
export function formImageMarkup(opts) {
  const id = opts.id;
  const accept = opts.accept || "image/*";
  const dataUrl = String(opts.dataUrl || "");
  const backgroundColor = String(opts.backgroundColor || "");
  const zoom = Number(opts.zoom) || 1;
  const offsetX = Number(opts.offsetX) || 0;
  const offsetY = Number(opts.offsetY) || 0;
  const hasImage = Boolean(dataUrl);
  const withBackgroundColor = opts.withBackgroundColor !== false;
  const previewBackground = String(opts.previewBackground || "");
  const bgDisplay = withBackgroundColor
    ? resolveImageBackground(backgroundColor)
    : previewBackground || backgroundColor || "#ffffff";
  const colorId = `${id}-bg`;
  const fileId = `${id}-file`;
  const cropId = `${id}-crop`;
  const errorId = `${id}-empty-error`;
  const dirty = hasImage && !isDefaultCrop(zoom, offsetX, offsetY);
  const cropClass =
    opts.fit === "logo" ? "form-image-crop form-image-crop--logo" : "form-image-crop";
  const labelledBy = opts.labelledBy
    ? ` aria-labelledby="${escapeAttr(opts.labelledBy)}"`
    : "";
  const describedBy = opts.describedBy
    ? ` aria-describedby="${escapeAttr(opts.describedBy)}"`
    : "";

  const colorFieldHtml = withBackgroundColor
    ? `<div class="form-field">
          <label class="form-label" for="${escapeAttr(colorId)}">Fond de l’image</label>
          ${formColorMarkup({
            id: colorId,
            value: backgroundColor,
            fallback: bgDisplay,
            placeholder: "#ffffff",
          })}
        </div>`
    : "";

  return `
    <div
      class="form-image"
      data-form-image
      id="${escapeAttr(id)}"
      role="group"${labelledBy}${describedBy}
      data-zoom="${escapeAttr(String(zoom))}"
      data-offset-x="${escapeAttr(String(offsetX))}"
      data-offset-y="${escapeAttr(String(offsetY))}"
      ${withBackgroundColor ? "" : 'data-form-image-bg="0"'}
    >
      <input type="file" id="${escapeAttr(fileId)}" class="form-image-file" accept="${escapeAttr(accept)}" hidden />

      <div class="form-image-empty" ${hasImage ? "hidden" : ""}>
        <p class="form-image-empty-text"><strong>Aucune image !</strong> Charger une nouvelle image :</p>
        <div class="form-image-empty-actions">
          <button type="button" class="btn primary" data-form-image-file>Depuis mes fichiers</button>
          <button type="button" class="btn secondary sm" data-form-image-url>Depuis une URL</button>
        </div>
        <p class="form-error" id="${escapeAttr(errorId)}" role="alert"></p>
      </div>

      <div class="form-image-filled" ${hasImage ? "" : "hidden"}>
        ${colorFieldHtml}
        <div
          class="${cropClass}"
          id="${escapeAttr(cropId)}"
          tabindex="0"
          role="application"
          aria-label="Aperçu de cadrage. Clic ou Tab pour activer, glisser ou flèches pour déplacer, molette ou plus/moins pour zoomer."
          style="background-color:${escapeAttr(bgDisplay)}"
        >
          <img class="form-image-crop-img" alt="" ${
            hasImage ? `src="${escapeAttr(dataUrl)}"` : "hidden"
          } />
          <div class="form-image-crop-badges" aria-hidden="true">
            <span class="btn primary sm form-image-crop-badge" data-form-image-badge="zoom">${ICON_ZOOM_IN}<span>${formatZoomPercent(zoom)}</span></span>
            <span class="btn primary sm form-image-crop-badge" data-form-image-badge="x">${ICON_ALIGN_ITEM_HORIZONTAL_CENTER}<span>${formatOffsetPercent(offsetX)}</span></span>
            <span class="btn primary sm form-image-crop-badge" data-form-image-badge="y">${ICON_ALIGN_ITEM_VERTICAL_CENTER}<span>${formatOffsetPercent(offsetY)}</span></span>
          </div>
          <button type="button" class="btn ghost sm icon-only form-image-crop-reset" ${
            dirty ? "" : "hidden"
          }>
            ${ICON_CLOSE_CIRCLE}
            <span class="visually-hidden">Réinitialiser le cadrage</span>
          </button>
          <div class="form-image-crop-bar">
            <button type="button" class="btn primary sm" data-form-image-download>Télécharger</button>
            <button type="button" class="btn primary sm" data-form-image-delete>Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Modale « Charger depuis une URL » (enfant, sans route).
 * @param {HTMLElement} host
 * @param {{ processFile: (file: File) => Promise<string> }} opts
 * @returns {Promise<string|null>} data URL, ou null si dismiss
 */
function openImageUrlDialog(host, opts) {
  const processFile = opts.processFile;
  if (!host) return Promise.resolve(null);

  return new Promise((resolve) => {
    const uid = `form-image-url-${++urlDialogSeq}`;
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
            <h1 class="view-title" id="${uid}-title">Charger depuis une URL</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" data-url-dismiss>
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="form-label" for="${inputId}">URL</label>
            <input
              class="form-control"
              type="text"
              id="${inputId}"
              inputmode="url"
              placeholder="https://…/image.png"
              autocomplete="off"
              spellcheck="false"
              aria-describedby="${errorId}"
            />
            <p class="form-error" id="${errorId}" role="alert"></p>
          </div>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-end">
            <button type="button" class="btn secondary sm" data-url-dismiss>Annuler</button>
            <button type="button" class="btn primary" data-url-load>Charger</button>
          </div>
        </div>
      </div>
    `;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const input = /** @type {HTMLInputElement|null} */ (backdrop.querySelector(`#${inputId}`));
    const errorEl = backdrop.querySelector(`#${errorId}`);
    const loadBtn = /** @type {HTMLButtonElement|null} */ (backdrop.querySelector("[data-url-load]"));
    const dismissBtns = backdrop.querySelectorAll("[data-url-dismiss]");

    let settled = false;
    let loading = false;

    const mo = new MutationObserver(() => {
      if (!backdrop.isConnected) finish(null);
    });

    /** @param {string|null} value */
    function finish(value) {
      if (settled) return;
      settled = true;
      mo.disconnect();
      document.removeEventListener("keydown", onKey, true);
      backdrop.remove();
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
    }

    async function loadFromUrl() {
      if (loading) return;
      const url = String(input?.value || "").trim();
      if (!url) {
        setError(IMAGE_URL_INVALID);
        input?.focus();
        return;
      }
      setError("");
      setLoading(true);
      try {
        const file = await fetchImageAsFile(url);
        const dataUrl = await processFile(file);
        if (!dataUrl) throw new Error(IMAGE_LOAD_ERROR);
        finish(dataUrl);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err && err.message
            ? String(err.message)
            : IMAGE_LOAD_ERROR;
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
    mo.observe(host, { childList: true });

    queueMicrotask(() => {
      input?.focus();
    });
  });
}

/**
 * Synchronise fichier / URL / cadrage dans un `.form-image`.
 * @param {HTMLElement} root
 * @param {{
 *   processFile: (file: File) => Promise<string>,
 *   dialogHost?: HTMLElement|null,
 *   downloadBasename?: string | (() => string),
 *   previewBackground?: string,
 *   fit?: "cover" | "logo",
 *   onChange?: (value: FormImageValue) => void,
 *   onDownload?: () => void,
 * }} opts
 * @returns {{
 *   destroy: () => void,
 *   setValue: (value: Partial<FormImageValue>) => void,
 *   setPreviewBackground: (hex: string) => void,
 *   getValue: () => FormImageValue,
 * }}
 */
export function bindFormImage(root, opts = {}) {
  const processFile = opts.processFile;
  const onChange = opts.onChange;
  const dialogHost =
    opts.dialogHost ||
    root.closest("#modal-root") ||
    document.getElementById("modal-root") ||
    document.body;

  function resolveDownloadBasename() {
    const raw =
      typeof opts.downloadBasename === "function"
        ? opts.downloadBasename()
        : opts.downloadBasename;
    return String(raw || "image");
  }

  const fileInput = /** @type {HTMLInputElement|null} */ (root.querySelector(".form-image-file"));
  const emptyEl = /** @type {HTMLElement|null} */ (root.querySelector(".form-image-empty"));
  const filledEl = /** @type {HTMLElement|null} */ (root.querySelector(".form-image-filled"));
  const emptyError = /** @type {HTMLElement|null} */ (root.querySelector(".form-image-empty .form-error"));
  const fileBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-form-image-file]"));
  const urlBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-form-image-url]"));
  const crop = /** @type {HTMLElement|null} */ (root.querySelector(".form-image-crop"));
  const cropImg = /** @type {HTMLImageElement|null} */ (root.querySelector(".form-image-crop-img"));
  const resetBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector(".form-image-crop-reset"));
  const deleteBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-form-image-delete]"));
  const downloadBtn = /** @type {HTMLButtonElement|null} */ (root.querySelector("[data-form-image-download]"));
  const badgeZoom = root.querySelector('[data-form-image-badge="zoom"] span:last-child');
  const badgeX = root.querySelector('[data-form-image-badge="x"] span:last-child');
  const badgeY = root.querySelector('[data-form-image-badge="y"] span:last-child');
  const colorRoot = /** @type {HTMLElement|null} */ (root.querySelector("[data-form-color]"));

  const withBackgroundColor = Boolean(colorRoot);
  let previewBackground = String(opts.previewBackground || "");
  if (opts.fit === "logo") crop?.classList.add("form-image-crop--logo");
  const zoomMax = opts.fit === "logo" ? ZOOM_MAX_LOGO : ZOOM_MAX;

  /** @type {FormImageValue & { imageNaturalWidth: number, imageNaturalHeight: number }} */
  const state = {
    dataUrl: cropImg?.getAttribute("src") || "",
    backgroundColor: "",
    zoom: clampZoomPercent((Number(root.getAttribute("data-zoom")) || 1) * 100, zoomMax) / 100,
    offsetX: Number(root.getAttribute("data-offset-x")) || 0,
    offsetY: Number(root.getAttribute("data-offset-y")) || 0,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
  };

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let destroyed = false;

  /** @type {ReturnType<typeof bindFormColor>|null} */
  let colorField = null;

  function emit() {
    onChange?.(getValue());
  }

  function getValue() {
    return {
      dataUrl: state.dataUrl,
      backgroundColor: state.backgroundColor,
      zoom: state.zoom,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
    };
  }

  function paintCropBackground() {
    if (!crop) return;
    crop.style.backgroundColor = withBackgroundColor
      ? resolveImageBackground(state.backgroundColor)
      : previewBackground || "#ffffff";
  }

  function setPreviewBackground(hex) {
    if (destroyed || withBackgroundColor) return;
    previewBackground = String(hex || "");
    paintCropBackground();
  }

  function syncBadges() {
    if (badgeZoom) badgeZoom.textContent = formatZoomPercent(state.zoom);
    if (badgeX) badgeX.textContent = formatOffsetPercent(state.offsetX);
    if (badgeY) badgeY.textContent = formatOffsetPercent(state.offsetY);
    if (resetBtn) {
      resetBtn.hidden = !state.dataUrl || isDefaultCrop(state.zoom, state.offsetX, state.offsetY);
    }
  }

  function applyCrop() {
    if (!crop || !cropImg || !state.dataUrl || !state.imageNaturalWidth) return;
    if (opts.fit === "logo") {
      applyThemeLogoTransform(cropImg, crop, {
        logoZoom: state.zoom,
        logoOffsetX: state.offsetX,
        logoOffsetY: state.offsetY,
      });
    } else {
      applyImageTransform(cropImg, crop, {
        imageNaturalWidth: state.imageNaturalWidth,
        imageNaturalHeight: state.imageNaturalHeight,
        imageZoom: state.zoom,
        imageOffsetX: state.offsetX,
        imageOffsetY: state.offsetY,
      });
    }
    syncBadges();
  }

  function showEmpty() {
    if (emptyEl) emptyEl.hidden = false;
    if (filledEl) filledEl.hidden = true;
    crop?.classList.remove("is-editing");
  }

  function showFilled() {
    if (emptyEl) emptyEl.hidden = true;
    if (filledEl) filledEl.hidden = false;
    if (emptyError) emptyError.textContent = "";
  }

  function setBusy(busy) {
    root.setAttribute("aria-busy", busy ? "true" : "false");
    if (fileBtn) fileBtn.disabled = busy;
    if (urlBtn) urlBtn.disabled = busy;
    if (fileInput) fileInput.disabled = busy;
  }

  function setEmptyError(message) {
    if (emptyError) emptyError.textContent = String(message || "");
  }

  /**
   * @param {string} dataUrl
   * @param {{ resetCrop?: boolean, emitChange?: boolean }} [flags]
   */
  function loadDataUrl(dataUrl, flags = {}) {
    const resetCrop = flags.resetCrop !== false;
    const emitChange = Boolean(flags.emitChange);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (destroyed) {
          resolve();
          return;
        }
        state.dataUrl = dataUrl;
        state.imageNaturalWidth = img.naturalWidth;
        state.imageNaturalHeight = img.naturalHeight;
        if (resetCrop) {
          state.zoom = 1;
          state.offsetX = 0;
          state.offsetY = 0;
        }
        if (cropImg) {
          cropImg.src = dataUrl;
          cropImg.hidden = false;
        }
        showFilled();
        requestAnimationFrame(() => {
          applyCrop();
          if (emitChange) emit();
          resolve();
        });
      };
      img.onerror = () => reject(new Error(IMAGE_LOAD_ERROR));
      img.src = dataUrl;
    });
  }

  function clearImage(emitChange) {
    state.dataUrl = "";
    state.imageNaturalWidth = 0;
    state.imageNaturalHeight = 0;
    state.zoom = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    if (cropImg) {
      cropImg.removeAttribute("src");
      cropImg.hidden = true;
    }
    if (fileInput) fileInput.value = "";
    syncBadges();
    showEmpty();
    if (emitChange) emit();
  }

  if (colorRoot) {
    colorField = bindFormColor(colorRoot, {
      fallbackColor: resolveImageBackground(""),
      onChange(value) {
        state.backgroundColor = value || "";
        paintCropBackground();
        emit();
      },
    });
    state.backgroundColor = colorField.getValue();
  }
  paintCropBackground();

  if (state.dataUrl) {
    loadDataUrl(state.dataUrl, { resetCrop: false }).catch(() => {
      clearImage(false);
    });
  } else {
    syncBadges();
  }

  async function applyFile(file) {
    if (!file) return;
    if (typeof processFile !== "function") {
      setEmptyError(IMAGE_LOAD_ERROR);
      return;
    }
    const type = file.type || "";
    if (type && !type.startsWith("image/")) {
      setEmptyError(IMAGE_LOAD_ERROR_FORMAT);
      return;
    }
    setEmptyError("");
    setBusy(true);
    try {
      const dataUrl = await processFile(file);
      if (!dataUrl) throw new Error(IMAGE_LOAD_ERROR);
      await loadDataUrl(dataUrl, { resetCrop: true, emitChange: true });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err && err.message
          ? String(err.message)
          : IMAGE_LOAD_ERROR;
      setEmptyError(message);
    } finally {
      setBusy(false);
      if (fileInput) fileInput.value = "";
    }
  }

  /** @param {MouseEvent} e */
  function onFileBtnClick(e) {
    e.preventDefault();
    fileInput?.click();
  }

  /** @param {Event} e */
  function onFileChange(e) {
    const input = /** @type {HTMLInputElement} */ (e.target);
    const file = input.files && input.files[0];
    if (!file) return;
    applyFile(file);
  }

  async function onUrlBtnClick() {
    if (typeof processFile !== "function") {
      setEmptyError(IMAGE_LOAD_ERROR);
      return;
    }
    setEmptyError("");
    const dataUrl = await openImageUrlDialog(dialogHost, { processFile });
    if (!dataUrl || destroyed) return;
    setBusy(true);
    try {
      await loadDataUrl(dataUrl, { resetCrop: true, emitChange: true });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err && err.message
          ? String(err.message)
          : IMAGE_LOAD_ERROR;
      setEmptyError(message);
    } finally {
      setBusy(false);
    }
  }

  function resetCrop() {
    state.zoom = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    applyCrop();
    emit();
  }

  async function onDeleteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirmDialog(dialogHost, {
      title: "Supprimer l’image ?",
      message:
        "Attention, la suppression est définitive et ne pourra pas être annulée ! Souhaitez-vous continuer ?",
      okLabel: "Supprimer",
      danger: true,
    });
    if (!ok || destroyed) return;
    clearImage(true);
  }

  function onDownloadClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!state.dataUrl) return;
    try {
      downloadCardPhoto(state.dataUrl, resolveDownloadBasename());
      opts.onDownload?.();
    } catch {
      /* data URL attendue ; échec silencieux */
    }
  }

  /** @param {PointerEvent} e */
  function onCropPointerDown(e) {
    if (!state.dataUrl || !crop) return;
    if (e.target instanceof Element && e.target.closest("button")) return;
    crop.focus();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    crop.setPointerCapture(e.pointerId);
  }

  /** @param {PointerEvent} e */
  function onCropPointerMove(e) {
    if (!dragging || !state.dataUrl || !crop) return;
    const rect = crop.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.offsetX += (e.clientX - lastX) / rect.width;
    state.offsetY += (e.clientY - lastY) / rect.height;
    lastX = e.clientX;
    lastY = e.clientY;
    applyCrop();
    emit();
  }

  /** @param {PointerEvent} e */
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try {
      crop?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  /** @param {number} deltaPercent */
  function nudgeZoom(deltaPercent) {
    const current = Math.round(state.zoom * 100);
    state.zoom = clampZoomPercent(current + deltaPercent, zoomMax) / 100;
    applyCrop();
    emit();
  }

  /** @param {number} dx @param {number} dy */
  function nudgeOffset(dx, dy) {
    state.offsetX += dx;
    state.offsetY += dy;
    applyCrop();
    emit();
  }

  /** @param {WheelEvent} e */
  function onCropWheel(e) {
    if (!state.dataUrl || !crop) return;
    if (document.activeElement !== crop) return;
    e.preventDefault();
    nudgeZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
  }

  /** @param {KeyboardEvent} e */
  function onCropKeyDown(e) {
    if (!state.dataUrl || document.activeElement !== crop) return;
    const key = e.key;
    if (key === "ArrowLeft") {
      e.preventDefault();
      nudgeOffset(-KEY_PAN, 0);
      return;
    }
    if (key === "ArrowRight") {
      e.preventDefault();
      nudgeOffset(KEY_PAN, 0);
      return;
    }
    if (key === "ArrowUp") {
      e.preventDefault();
      nudgeOffset(0, -KEY_PAN);
      return;
    }
    if (key === "ArrowDown") {
      e.preventDefault();
      nudgeOffset(0, KEY_PAN);
      return;
    }
    if (key === "+" || key === "=" || key === "Add") {
      e.preventDefault();
      nudgeZoom(ZOOM_STEP);
      return;
    }
    if (key === "-" || key === "_" || key === "Subtract") {
      e.preventDefault();
      nudgeZoom(-ZOOM_STEP);
    }
  }

  function onCropFocus() {
    crop?.classList.add("is-editing");
  }

  function onCropBlur() {
    crop?.classList.remove("is-editing");
  }

  function onResetClick(e) {
    e.preventDefault();
    e.stopPropagation();
    resetCrop();
  }

  function onResize() {
    applyCrop();
  }

  /** @param {Event} e */
  function stopOverlayPointer(e) {
    e.stopPropagation();
  }

  fileBtn?.addEventListener("click", onFileBtnClick);
  fileInput?.addEventListener("change", onFileChange);
  urlBtn?.addEventListener("click", onUrlBtnClick);
  deleteBtn?.addEventListener("click", onDeleteClick);
  downloadBtn?.addEventListener("click", onDownloadClick);
  resetBtn?.addEventListener("click", onResetClick);
  resetBtn?.addEventListener("pointerdown", stopOverlayPointer);
  deleteBtn?.addEventListener("pointerdown", stopOverlayPointer);
  downloadBtn?.addEventListener("pointerdown", stopOverlayPointer);
  crop?.addEventListener("pointerdown", onCropPointerDown);
  crop?.addEventListener("pointermove", onCropPointerMove);
  crop?.addEventListener("pointerup", endDrag);
  crop?.addEventListener("pointercancel", endDrag);
  crop?.addEventListener("wheel", onCropWheel, { passive: false });
  crop?.addEventListener("keydown", onCropKeyDown);
  crop?.addEventListener("focus", onCropFocus);
  crop?.addEventListener("blur", onCropBlur);
  window.addEventListener("resize", onResize);

  const ro =
    crop && typeof ResizeObserver === "function"
      ? new ResizeObserver(() => applyCrop())
      : null;
  if (crop && ro) ro.observe(crop);

  return {
    destroy() {
      destroyed = true;
      colorField?.destroy();
      fileBtn?.removeEventListener("click", onFileBtnClick);
      fileInput?.removeEventListener("change", onFileChange);
      urlBtn?.removeEventListener("click", onUrlBtnClick);
      deleteBtn?.removeEventListener("click", onDeleteClick);
      downloadBtn?.removeEventListener("click", onDownloadClick);
      resetBtn?.removeEventListener("click", onResetClick);
      resetBtn?.removeEventListener("pointerdown", stopOverlayPointer);
      deleteBtn?.removeEventListener("pointerdown", stopOverlayPointer);
      downloadBtn?.removeEventListener("pointerdown", stopOverlayPointer);
      crop?.removeEventListener("pointerdown", onCropPointerDown);
      crop?.removeEventListener("pointermove", onCropPointerMove);
      crop?.removeEventListener("pointerup", endDrag);
      crop?.removeEventListener("pointercancel", endDrag);
      crop?.removeEventListener("wheel", onCropWheel);
      crop?.removeEventListener("keydown", onCropKeyDown);
      crop?.removeEventListener("focus", onCropFocus);
      crop?.removeEventListener("blur", onCropBlur);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    },
    setPreviewBackground,
    setValue(value) {
      if (destroyed || !value) return;
      if (value.backgroundColor !== undefined) {
        if (withBackgroundColor) {
          state.backgroundColor = String(value.backgroundColor || "");
          colorField?.setValue(
            state.backgroundColor,
            resolveImageBackground(state.backgroundColor)
          );
        } else {
          previewBackground = String(value.backgroundColor || "");
        }
        paintCropBackground();
      }
      if (value.zoom !== undefined) {
        state.zoom = clampZoomPercent((Number(value.zoom) || 1) * 100, zoomMax) / 100;
      }
      if (value.offsetX !== undefined) state.offsetX = Number(value.offsetX) || 0;
      if (value.offsetY !== undefined) state.offsetY = Number(value.offsetY) || 0;
      if (value.dataUrl !== undefined) {
        const next = String(value.dataUrl || "");
        if (!next) {
          clearImage(false);
          return;
        }
        loadDataUrl(next, { resetCrop: false }).catch(() => {
          clearImage(false);
        });
        return;
      }
      applyCrop();
    },
    getValue,
  };
}
