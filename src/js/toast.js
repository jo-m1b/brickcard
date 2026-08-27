/**
 * Notifications empilables (toast) in-app.
 * Pas d’animation : affichage / suppression seulement.
 */

import { ICON_CLOSE, remixIconByName } from "./icons.js";

export const TOAST_DELAY_DEFAULT = 7000;
/** Recap import / sauvegarde de collection (plus long à lire). */
export const TOAST_DELAY_BACKUP = 15000;

/** @typedef {"normal" | "success" | "error"} ToastType */

/**
 * @typedef {object} ToastOptions
 * @property {string} message
 * @property {string} [messageHtml] HTML de confiance pour le corps (`message` reste le texte brut)
 * @property {ToastType | "info"} [type]
 * @property {string | false} [title]
 * @property {string | false} [icon]
 * @property {string} [secondary]
 * @property {number | false} [delay]
 * @property {boolean} [closeButton]
 */

/**
 * @typedef {object} ToastHandle
 * @property {number} id
 * @property {() => void} dismiss
 */

/**
 * @typedef {object} NormalizedToast
 * @property {string} message
 * @property {string} messageHtml
 * @property {ToastType} type
 * @property {string} title
 * @property {string} icon
 * @property {string} secondary
 * @property {number} delay
 * @property {boolean} closeButton
 */

const TYPE_DEFAULTS = {
  normal: { title: "", icon: "" },
  success: { title: "Succès", icon: "checkbox-circle-fill" },
  error: { title: "Erreur", icon: "error-warning-fill" },
};

let nextId = 1;

/** @type {Map<number, { el: HTMLElement, timer: ReturnType<typeof setTimeout> | null }>} */
const active = new Map();

/**
 * @param {string | ToastOptions} messageOrOpts
 * @param {ToastType | "info" | ToastOptions} [typeOrOpts]
 * @returns {ToastHandle | null}
 */
export function toast(messageOrOpts, typeOrOpts) {
  const raw = parseArgs(messageOrOpts, typeOrOpts);
  const opts = normalizeToast(raw);
  if (!opts) return null;

  const id = nextId++;
  const root = getToastRoot();
  const el = document.createElement("div");
  el.className = toastClassName(opts.type);
  el.setAttribute("role", opts.type === "error" ? "alert" : "status");
  el.dataset.toastId = String(id);
  el.innerHTML = toastMarkup(opts);

  const dismiss = () => dismissToast(id);
  el.querySelector("[data-toast-dismiss]")?.addEventListener("click", dismiss);

  root.appendChild(el);

  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  if (opts.delay > 0) {
    timer = setTimeout(dismiss, opts.delay);
  }

  active.set(id, { el, timer });

  return { id, dismiss };
}

/** Téléchargement réussi d’une photo de carte ou d’un logo de thème. */
export function toastImageSaved() {
  return toast({
    type: "success",
    title: "Image sauvegardée",
    message: "L'image a été enregistrée dans vos fichiers",
    icon: "save",
  });
}

/**
 * @param {number} id
 */
export function dismissToast(id) {
  const entry = active.get(id);
  if (!entry) return;
  active.delete(id);
  if (entry.timer != null) clearTimeout(entry.timer);
  entry.el.remove();
}

/**
 * @param {string | ToastOptions} messageOrOpts
 * @param {ToastType | "info" | ToastOptions} [typeOrOpts]
 * @returns {Partial<ToastOptions>}
 */
function parseArgs(messageOrOpts, typeOrOpts) {
  if (typeof messageOrOpts === "string") {
    /** @type {Partial<ToastOptions>} */
    const raw = { message: messageOrOpts };
    if (typeof typeOrOpts === "string") raw.type = typeOrOpts;
    else if (typeOrOpts && typeof typeOrOpts === "object") Object.assign(raw, typeOrOpts);
    return raw;
  }
  if (messageOrOpts && typeof messageOrOpts === "object") return { ...messageOrOpts };
  return {};
}

/**
 * @param {Partial<ToastOptions>} raw
 * @returns {NormalizedToast | null}
 */
function normalizeToast(raw) {
  const message = String(raw.message || "").trim();
  if (!message) return null;

  const type = normalizeType(raw.type);
  const defaults = TYPE_DEFAULTS[type];

  let title = "";
  if (raw.title === false || raw.title === "") title = "";
  else if (raw.title == null) title = defaults.title;
  else title = String(raw.title).trim();

  let icon = "";
  if (raw.icon === false || raw.icon === "") icon = "";
  else if (raw.icon == null) icon = defaults.icon;
  else icon = String(raw.icon).trim();

  const secondary = raw.secondary ? String(raw.secondary).trim() : "";

  let delay = TOAST_DELAY_DEFAULT;
  if (raw.delay === false || raw.delay === 0) delay = 0;
  else if (raw.delay != null) {
    const n = Number(raw.delay);
    delay = Number.isFinite(n) && n > 0 ? n : 0;
  }

  const closeButton = delay === 0 ? true : raw.closeButton !== false;
  const messageHtml = raw.messageHtml ? String(raw.messageHtml) : "";

  return { message, messageHtml, type, title, icon, secondary, delay, closeButton };
}

/**
 * @param {string | undefined} type
 * @returns {ToastType}
 */
function normalizeType(type) {
  if (type === "success" || type === "error") return type;
  return "normal";
}

/**
 * @param {ToastType} type
 */
function toastClassName(type) {
  if (type === "success") return "toast toast--success";
  if (type === "error") return "toast toast--error";
  return "toast";
}

/**
 * @param {NormalizedToast} opts
 */
function toastMarkup(opts) {
  const hasHeader = Boolean(opts.title || opts.secondary);
  const iconHtml = iconMarkup(opts.icon);
  const closeHtml = opts.closeButton ? closeButtonMarkup() : "";
  const bodyHtml = opts.messageHtml || escapeHtml(opts.message);

  if (hasHeader) {
    const titleHtml = opts.title
      ? `<strong class="toast-title">${escapeHtml(opts.title)}</strong>`
      : "";
    const secondaryHtml = opts.secondary
      ? `<small class="toast-secondary">${escapeHtml(opts.secondary)}</small>`
      : "";
    return `<div class="toast-header">${iconHtml}${titleHtml}<span class="toast-header-end">${secondaryHtml}${closeHtml}</span></div><div class="toast-body"><p class="toast-message">${bodyHtml}</p></div>`;
  }

  return `<div class="toast-body toast-body--bare">${iconHtml}<p class="toast-message">${bodyHtml}</p>${closeHtml}</div>`;
}

/** @param {string} name */
function iconMarkup(name) {
  if (!name) return "";
  const svg = remixIconByName(name);
  return svg ? `<span class="toast-icon" aria-hidden="true">${svg}</span>` : "";
}

function closeButtonMarkup() {
  return `<button type="button" class="btn primary icon-only sm toast-close" data-toast-dismiss>${ICON_CLOSE}<span class="visually-hidden">Fermer</span></button>`;
}

function getToastRoot() {
  const existing = document.getElementById("toast-root");
  if (existing instanceof HTMLElement) return existing;
  const root = document.createElement("div");
  root.id = "toast-root";
  root.className = "toast-root no-print";
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot?.parentNode) {
    modalRoot.parentNode.insertBefore(root, modalRoot.nextSibling);
  } else {
    document.body.appendChild(root);
  }
  return root;
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
