/**
 * Tuiles du design system (`a.tile` / `button.tile` dans `ul.tile-list`).
 * Titre, description, icône gauche optionnelle ; disabled non cliquable.
 * Variante `danger` : mêmes couleurs que `btn danger`.
 */

import { remixIconByName } from "./icons.js";

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
 * @param {string|false|null|undefined} icon Clé Remix ou markup SVG
 * @returns {string}
 */
function resolveIcon(icon) {
  if (icon === false || icon == null || icon === "") return "";
  const s = String(icon);
  if (s.includes("<svg")) return s;
  return remixIconByName(s);
}

/**
 * Markup `a.tile` (défaut) ou `button.tile`.
 *
 * @param {{
 *   title?: string,
 *   desc?: string,
 *   href?: string,
 *   icon?: string | false,
 *   disabled?: boolean,
 *   id?: string,
 *   tag?: "a" | "button",
 *   danger?: boolean,
 * }} [opts]
 * @returns {string}
 */
export function tileMarkup(opts = {}) {
  const href = opts.href != null ? String(opts.href) : "";
  const disabled = Boolean(opts.disabled);
  const isButton = opts.tag === "button";
  const classes = ["tile"];
  if (disabled) classes.push("disabled");
  if (opts.danger) classes.push("danger");

  const iconHtml = resolveIcon(opts.icon);
  const title = opts.title
    ? `<strong class="tile-title">${escapeHtml(opts.title)}</strong>`
    : "";
  const desc = opts.desc
    ? `<span class="tile-desc">${escapeHtml(opts.desc)}</span>`
    : "";
  const inner = `${iconHtml}<span class="tile-body">${title}${desc}</span>`;
  const classAttr = classes.join(" ");
  const idAttr = opts.id ? ` id="${escapeAttr(opts.id)}"` : "";

  if (isButton) {
    const dis = disabled ? " disabled" : "";
    return `<button type="button" class="${classAttr}"${idAttr}${dis}>${inner}</button>`;
  }

  if (disabled) {
    const hrefAttr = href ? ` href="${escapeAttr(href)}"` : "";
    return `<a class="${classAttr}" aria-disabled="true" tabindex="-1" role="link"${idAttr}${hrefAttr}>${inner}</a>`;
  }
  return `<a class="${classAttr}" href="${escapeAttr(href)}"${idAttr}>${inner}</a>`;
}

/**
 * Liste de tuiles (`ul.tile-list`).
 *
 * @param {Parameters<typeof tileMarkup>[0][]} items
 * @returns {string}
 */
export function tileListMarkup(items) {
  const lis = (items || []).map((item) => `<li>${tileMarkup(item)}</li>`).join("");
  return `<ul class="tile-list">${lis}</ul>`;
}
