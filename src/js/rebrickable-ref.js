/**
 * Compact Rebrickable origin (hint + clickable logo, optional catalog
 * path) for theme and card editors.
 */

import { ICON_PALETTE } from "./icons.js";
import { _t } from "./i18n.js";
import { linkMarkup } from "./link.js";

export const REBRICKABLE_HOME_HREF = "https://rebrickable.com/";

/**
 * @param {unknown} setId Catalog `set_num`
 * @returns {string}
 */
export function rebrickableSetHref(setId) {
  const id = String(setId || "").trim();
  return id
    ? `https://rebrickable.com/sets/${encodeURIComponent(id)}/`
    : REBRICKABLE_HOME_HREF;
}

/**
 * @param {unknown} themeId Catalog theme id
 * @returns {string}
 */
export function rebrickableThemeHref(themeId) {
  const id = String(themeId ?? "").trim();
  return id
    ? `https://rebrickable.com/sets/?theme=${encodeURIComponent(id)}`
    : REBRICKABLE_HOME_HREF;
}

/** Clickable Rebrickable wordmark (`data/rebrickable-logo.png`). */
export function rebrickableLogoImgMarkup() {
  return `<img class="theme-rebrickable-logo" src="data/rebrickable-logo.png" alt="Rebrickable" />`;
}

/**
 * @param {string} href
 * @returns {string}
 */
export function rebrickableLogoLinkMarkup(href) {
  return linkMarkup(rebrickableLogoImgMarkup(), { href, html: true });
}

/**
 * Centered origin block (hint, then clickable logo) above a card / back preview.
 * @param {{ href?: string, hintMsgid?: string }} [opts]
 */
export function rebrickableOriginMarkup(opts = {}) {
  const href = String(opts.href || "").trim();
  if (!href) return "";
  const hint = opts.hintMsgid
    ? _t(opts.hintMsgid)
    : _t("This theme is referenced on");
  return `<div class="theme-rebrickable-ref">
                <p class="form-hint">${escapeHtml(hint)}</p>
                ${rebrickableLogoLinkMarkup(href)}
                <p class="form-hint theme-rebrickable-path" hidden><span class="theme-rebrickable-path-icon" aria-hidden="true"><!-- ri-palette-fill -->${ICON_PALETTE}</span><span class="theme-rebrickable-path-text"></span></p>
                <p class="form-hint theme-rebrickable-set" hidden></p>
              </div>`;
}

/**
 * Fill one muted catalog line under a Rebrickable origin block.
 * @param {ParentNode|null|undefined} root
 * @param {string} selector
 * @param {string} text
 */
function setOriginLine(root, selector, text) {
  const el = root instanceof Element ? root.querySelector(selector) : null;
  if (!(el instanceof HTMLElement)) return;
  const value = String(text || "").trim();
  const textEl = el.querySelector(".theme-rebrickable-path-text");
  if (textEl) textEl.textContent = value;
  else el.textContent = value;
  el.hidden = !value;
}

/**
 * Fill catalog lines under a Rebrickable origin block
 * (`Parent > Theme`, optional set name).
 * @param {ParentNode|null|undefined} root
 * @param {{ path?: string, setName?: string }} [details]
 */
export function setRebrickableOriginCatalog(root, details = {}) {
  setOriginLine(root, ".theme-rebrickable-path", details.path || "");
  setOriginLine(root, ".theme-rebrickable-set", details.setName || "");
}

/**
 * Fill the catalog path under a Rebrickable origin block (`Parent > Theme`).
 * @param {ParentNode|null|undefined} root
 * @param {string} path
 */
export function setRebrickableOriginPath(root, path) {
  setRebrickableOriginCatalog(root, { path });
}

/** @param {string} str */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
