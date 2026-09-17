/**
 * Compact Rebrickable origin (hint + clickable logo) for theme and
 * card editors.
 */

import { _t } from "./i18n.js";
import { linkMarkup } from "./link.js";

export const REBRICKABLE_HOME_HREF = "https://rebrickable.com/";
export const REBRICKABLE_SITE = "rebrickable.com";

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
 * Put `rebrickable.com` in `text` through `linkMarkup` (same URL as the logo).
 * @param {string} text Already translated msgid
 * @param {string} href
 */
export function rebrickableLinkedText(text, href) {
  const src = String(text || "");
  const siteLink = linkMarkup(REBRICKABLE_SITE, { href });
  const i = src.indexOf(REBRICKABLE_SITE);
  if (i < 0) return `${escapeHtml(src)} ${siteLink}`;
  return `${escapeHtml(src.slice(0, i))}${siteLink}${escapeHtml(src.slice(i + REBRICKABLE_SITE.length))}`;
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
              </div>`;
}

/** @param {string} str */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
