/**
 * Empty / loading state: CSS brick + title + optional text + optional tiles.
 * Empty home: `welcomeViewMarkup()`. Boot page: `loadingViewMarkup()`
 * (inline copy in `index.html` for boot).
 */

import { tileListMarkup } from "./tile.js";
import { ICON_ERROR_WARNING_LINE, ICON_REFRESH } from "./icons.js";
import { _t } from "./i18n.js";

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
 * Markup for `section.empty-view` (brick + title + text + tiles).
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
  return `<section class="empty-view no-print"${idAttr}${hidden}><div class="empty-view-body"><div class="brick" aria-hidden="true"></div><${tag} class="view-title">${escapeHtml(opts.title)}</${tag}>${text}${tiles}</div></section>`;
}

/**
 * Markup for the empty home page (collection with no cards).
 *
 * @param {{
 *   titleTag?: "h1" | "h2" | "p",
 *   importId?: string | false,
 *   demoId?: string | false,
 * }} [opts]
 * @returns {string}
 */
export function welcomeViewMarkup(opts = {}) {
  const importId = opts.importId === false ? "" : opts.importId || "empty-import";
  const demoId = opts.demoId === false ? "" : opts.demoId || "empty-import-demo";
  const importTile = {
    title: _t("Import a backup"),
    desc: _t("Add a batch of cards to your collection from a backup"),
    icon: "upload",
    ...(importId
      ? { href: "#import", id: importId }
      : { tag: /** @type {"button"} */ ("button") }),
  };
  const demoTile = {
    title: _t("Load a demo"),
    desc: _t("Import a backup of Jo’s brick card collection"),
    icon: "emotion",
    tag: /** @type {"button"} */ ("button"),
    ...(demoId ? { id: demoId } : {}),
  };
  return emptyViewMarkup({
    titleTag: opts.titleTag,
    title: _t("Welcome ;)"),
    text: _t("No cards in your collection yet!"),
    tiles: [
      {
        title: _t("New card"),
        desc: _t("Create a card to start your collection"),
        href: "#new-card",
        icon: "add",
      },
      importTile,
      demoTile,
    ],
  });
}

/**
 * Markup for the loading page (animated brick + “Loading”).
 * Real boot stays inline in `index.html` (modules not loaded yet); keep both aligned.
 * `retry`: **Retry** button (home / boot only; not image loads).
 *
 * @param {{
 *   titleTag?: "h1" | "h2" | "p",
 *   error?: string,
 *   errorId?: string,
 *   busy?: boolean,
 *   retry?: boolean,
 *   retryId?: string | false,
 * }} [opts]
 * @returns {string}
 */
export function loadingViewMarkup(opts = {}) {
  const tag = opts.titleTag === "h2" || opts.titleTag === "p" ? opts.titleTag : "h1";
  const busy = opts.busy === false ? "" : ' aria-busy="true"';
  let error = "";
  if (opts.error) {
    error = `<p class="empty-view-error" role="alert">${escapeHtml(opts.error)}</p>`;
  } else {
    const idAttr = opts.errorId ? ` id="${escapeAttr(opts.errorId)}"` : "";
    error = `<p class="empty-view-error"${idAttr} role="alert" hidden></p>`;
  }
  let retry = "";
  if (opts.retry) {
    const retryId = opts.retryId === false ? "" : opts.retryId || "boot-retry";
    const idAttr = retryId ? ` id="${escapeAttr(retryId)}"` : "";
    const hidden = opts.error ? "" : " hidden";
    const hiddenClass = opts.error ? "" : " is-hidden";
    retry = `<button type="button" class="btn primary${hiddenClass}"${idAttr}${hidden}>${ICON_REFRESH}<span>${_t("Retry")}</span></button>`;
  }
  return `<section class="empty-view no-print"${busy}><div class="empty-view-body"><div class="brick" aria-hidden="true"><span class="brick-error-icon">${ICON_ERROR_WARNING_LINE}</span></div><${tag} class="view-title">${escapeHtml(_t("Loading"))}<span class="visually-hidden">...</span><span class="loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></${tag}>${error}${retry}</div></section>`;
}
