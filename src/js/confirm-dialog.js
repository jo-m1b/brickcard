/**
 * Confirmation dialogs (`modal--sm`), instead of `alert()` / `confirm()` / `prompt()`.
 * Child of the host (`#modal-root`): second backdrop, no route.
 */

import { ICON_CLOSE, ICON_DELETE_BIN_2, ICON_SAVE, modalTitleMarkup, remixIconByName } from "./icons.js";
import { focusTopModal } from "./modal-focus.js";
import { popModalDocumentTitle, pushModalDocumentTitle } from "./document-title.js";
import { _t } from "./i18n.js";

let dialogSeq = 0;

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} s
 */
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   icon?: string,
 *   variant?: "primary" | "secondary" | "danger" | "ghost",
 *   size?: "sm",
 *   slot?: "start" | "end",
 * }} ConfirmAction
 */

/**
 * Opens a confirmation modal. Close (X, Escape, backdrop) → `null`.
 * “Cancel” (`id: "cancel"` or label) is `sm` if there are other actions;
 * normal size if it is the only button.
 *
 * @param {HTMLElement} host Container (`#modal-root`)
 * @param {{
 *   title: string,
 *   message: string,
 *   icon?: string,
 *   actions?: ConfirmAction[],
 * }} opts
 * @returns {Promise<string|null>} action `id`, or `null` if dismissed
 */
export function openConfirmDialog(host, opts) {
  const title = opts.title || _t("Confirm?");
  const message = opts.message ? String(opts.message) : "";
  const actions =
    opts.actions && opts.actions.length
      ? opts.actions
      : [
          { id: "cancel", label: _t("Cancel"), variant: "secondary", slot: "end" },
          { id: "ok", label: "OK", variant: "primary", slot: "end" },
        ];

  return new Promise((resolve) => {
    const uid = `confirm-dialog-${++dialogSeq}`;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = `${uid}-backdrop`;
    backdrop.setAttribute("role", "presentation");

    const startBtns = actions.filter((a) => (a.slot || "end") === "start");
    const endBtns = actions.filter((a) => (a.slot || "end") !== "start");
    const manyActions = actions.length > 1;

    /** @param {ConfirmAction} a */
    function isCancelAction(a) {
      return a.id === "cancel" || a.label === _t("Cancel") || a.label === "Cancel";
    }

    /** @param {ConfirmAction} a */
    function btnHtml(a) {
      const variant = a.variant || "secondary";
      const size =
        a.size === "sm" || (manyActions && isCancelAction(a)) ? " sm" : "";
      let icon = "";
      if (a.icon) icon = a.icon.includes("<svg") ? a.icon : remixIconByName(a.icon);
      else if (a.label === _t("Delete") || a.label === "Delete") icon = ICON_DELETE_BIN_2;
      else if (a.label === _t("Save") || a.label === "Save") icon = ICON_SAVE;
      const label = escapeHtml(a.label);
      const inner = icon ? `${icon}<span>${label}</span>` : label;
      return `<button type="button" class="btn ${variant}${size}" data-confirm-action="${escapeAttr(a.id)}">${inner}</button>`;
    }

    const startHtml = startBtns.length
      ? `<div class="modal-footer-start">${startBtns.map(btnHtml).join("")}</div>`
      : "";
    const endHtml = endBtns.length
      ? `<div class="modal-footer-end">${endBtns.map(btnHtml).join("")}</div>`
      : "";

    backdrop.innerHTML = `
      <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="${uid}-title" aria-describedby="${uid}-desc">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="${uid}-title">${modalTitleMarkup(title, opts.icon)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" data-confirm-dismiss>
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <p id="${uid}-desc" class="modal-confirm-msg">${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          ${startHtml}${endHtml}
        </div>
      </div>
    `;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    let settled = false;

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
      popModalDocumentTitle();
      previouslyFocused?.focus?.();
      resolve(value);
    }

    /** @param {KeyboardEvent} e */
    function onKey(e) {
      if (!backdrop.isConnected) {
        finish(null);
        return;
      }
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      finish(null);
    }

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) finish(null);
    });
    backdrop.querySelector("[data-confirm-dismiss]")?.addEventListener("click", () => {
      finish(null);
    });
    backdrop.querySelectorAll("[data-confirm-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        finish(btn.getAttribute("data-confirm-action"));
      });
    });

    document.addEventListener("keydown", onKey, true);
    host.appendChild(backdrop);
    pushModalDocumentTitle(title);
    mo.observe(host, { childList: true });
    queueMicrotask(() => focusTopModal());
  });
}

/**
 * OK / Cancel confirmation. `true` if OK.
 *
 * @param {HTMLElement} host
 * @param {{
 *   title: string,
 *   message: string,
 *   icon?: string,
 *   okLabel?: string,
 *   cancelLabel?: string,
 *   danger?: boolean,
 * }} opts
 * @returns {Promise<boolean>}
 */
export async function confirmDialog(host, opts) {
  const result = await openConfirmDialog(host, {
    title: opts.title,
    message: opts.message,
    icon: opts.icon,
    actions: [
      { id: "cancel", label: opts.cancelLabel || _t("Cancel"), variant: "secondary", slot: "end" },
      {
        id: "ok",
        label: opts.okLabel || "OK",
        variant: opts.danger ? "danger" : "primary",
        slot: "end",
      },
    ],
  });
  return result === "ok";
}

/**
 * Alert: one button (instead of `alert()`).
 *
 * @param {HTMLElement} host
 * @param {{
 *   title: string,
 *   message: string,
 *   icon?: string,
 *   okLabel?: string,
 * }} opts
 * @returns {Promise<void>}
 */
export async function alertDialog(host, opts) {
  await openConfirmDialog(host, {
    title: opts.title,
    message: opts.message,
    icon: opts.icon,
    actions: [{ id: "ok", label: opts.okLabel || "OK", variant: "primary", slot: "end" }],
  });
}
