/**
 * Liens du design system (`a.link`).
 * Couleur = texte (`--ink`) ; underline ; externe → `_blank` + icône Remix à droite.
 */

import { ICON_EXTERNAL_LINK, remixIconByName } from "./icons.js";

/**
 * @param {string} href
 * @returns {boolean}
 */
export function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href || ""));
}

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
 * @param {string|false|null|undefined} icon Clé Remix, markup SVG, ou `false` pour aucune icône
 * @returns {string}
 */
function resolveIcon(icon) {
  if (icon === false || icon == null || icon === "") return "";
  const s = String(icon);
  if (s.includes("<svg")) return s;
  return remixIconByName(s);
}

/**
 * Libellé HTML qui n’est qu’une image (badge Markdown `[![alt](src)](url)`).
 * @param {string} html
 */
function isImageOnlyHtml(html) {
  const t = String(html || "").trim();
  if (!/<img\b/i.test(t)) return false;
  return !t.replace(/<img\b[^>]*>/gi, "").trim();
}

/**
 * Markup `<a class="link">`.
 *
 * @param {string} text
 * @param {{
 *   href?: string,
 *   title?: string,
 *   sm?: boolean,
 *   disabled?: boolean,
 *   icon?: string | false,
 *   iconRight?: boolean,
 *   target?: string,
 *   external?: boolean,
 *   html?: boolean,
 * }} [opts]
 * @returns {string}
 */
export function linkMarkup(text, opts = {}) {
  const href = opts.href != null ? String(opts.href) : "";
  const external = opts.external ?? isExternalHref(href);
  const disabled = Boolean(opts.disabled);
  const classes = ["link"];
  if (opts.sm) classes.push("sm");
  if (disabled) classes.push("disabled");

  let iconHtml = "";
  if (opts.icon === false) {
    iconHtml = "";
  } else if (opts.icon != null && opts.icon !== "") {
    iconHtml = resolveIcon(opts.icon);
  } else if (external && !(opts.html && isImageOnlyHtml(text))) {
    iconHtml = ICON_EXTERNAL_LINK;
  }

  const iconRight =
    opts.iconRight != null ? Boolean(opts.iconRight) : Boolean(external && iconHtml);
  if (iconHtml && iconRight) classes.push("icon-right");

  const label = opts.html ? text : escapeHtml(text);
  const hrefOut = opts.html ? href : escapeAttr(href);
  const titleOut = opts.title
    ? opts.html
      ? String(opts.title)
      : escapeAttr(opts.title)
    : "";
  const inner = iconHtml ? `${iconHtml}<span>${label}</span>` : label;
  const title = titleOut ? ` title="${titleOut}"` : "";
  const classAttr = classes.join(" ");

  if (disabled) {
    const hrefAttr = href ? ` href="${hrefOut}"` : "";
    return `<a class="${classAttr}" aria-disabled="true" tabindex="-1" role="link"${hrefAttr}${title}>${inner}</a>`;
  }

  let target = opts.target;
  if (target === undefined) {
    target = external ? "_blank" : "";
  }
  const targetAttr = target ? ` target="${escapeAttr(target)}"` : "";
  const rel = target === "_blank" ? ' rel="noopener noreferrer"' : "";
  return `<a class="${classAttr}" href="${hrefOut}"${targetAttr}${rel}${title}>${inner}</a>`;
}
