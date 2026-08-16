/**
 * État vide / chargement : brique CSS + titre + texte optionnel + tuiles optionnelles.
 */

import { tileListMarkup } from "./tile.js";

/**
 * @param {string} s
 */
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

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
 * Markup `section.empty-view` (brique + titre + texte + tuiles).
 *
 * @param {{
 *   title: string,
 *   text?: string,
 *   tiles?: Parameters<typeof tileListMarkup>[0],
 *   titleTag?: "h1" | "h2" | "p",
 *   id?: string,
 *   hidden?: boolean,
 * }} opts
 * @returns {string}
 */
export function emptyViewMarkup(opts) {
  const tag = opts.titleTag === "h2" || opts.titleTag === "p" ? opts.titleTag : "h1";
  const idAttr = opts.id ? ` id="${escapeAttr(opts.id)}"` : "";
  const hidden = opts.hidden ? " hidden" : "";
  const text = opts.text ? `<p>${escapeHtml(opts.text)}</p>` : "";
  const tiles = opts.tiles?.length ? tileListMarkup(opts.tiles) : "";
  return `<section class="empty-view no-print"${idAttr}${hidden}><div class="brick" aria-hidden="true"></div><${tag} class="view-title">${escapeHtml(opts.title)}</${tag}>${text}${tiles}</section>`;
}
