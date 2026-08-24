/**
 * État vide / chargement : brique CSS + titre + texte optionnel + tuiles optionnelles.
 * Accueil vide : `welcomeViewMarkup()`. Page de démarrage : `loadingViewMarkup()`
 * (copie inline dans `index.html` pour le boot).
 */

import { tileListMarkup } from "./tile.js";
import { ICON_ERROR_WARNING_LINE } from "./icons.js";

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
  return `<section class="empty-view no-print"${idAttr}${hidden}><div class="empty-view-body"><div class="brick" aria-hidden="true"></div><${tag} class="view-title">${escapeHtml(opts.title)}</${tag}>${text}${tiles}</div></section>`;
}

/**
 * Markup de la page d’accueil vide (collection sans cartes).
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
    title: "Importer une sauvegarde",
    desc: "Ajouter un lot de cartes à votre collection depuis une sauvegarde",
    icon: "upload",
    ...(importId
      ? { href: "#import", id: importId }
      : { tag: /** @type {"button"} */ ("button") }),
  };
  const demoTile = {
    title: "Charger une démonstration",
    desc: "Importer une sauvegarde de la collection de cartes des briques de Jo",
    icon: "emotion",
    tag: /** @type {"button"} */ ("button"),
    ...(demoId ? { id: demoId } : {}),
  };
  return emptyViewMarkup({
    titleTag: opts.titleTag,
    title: "Bienvenue ;)",
    text: "Aucune carte pour l'instant dans votre collection !",
    tiles: [
      {
        title: "Nouvelle carte",
        desc: "Créer une carte pour commencer votre collection",
        href: "#new-card",
        icon: "add",
      },
      importTile,
      demoTile,
    ],
  });
}

/**
 * Markup de la page de chargement (brique animée + « Chargement... »).
 * Le boot réel reste inline dans `index.html` (modules pas encore chargés) ; garder les deux alignés.
 *
 * @param {{
 *   titleTag?: "h1" | "h2" | "p",
 *   error?: string,
 *   errorId?: string,
 *   busy?: boolean,
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
  return `<section class="empty-view no-print"${busy}><div class="empty-view-body"><div class="brick" aria-hidden="true"><span class="brick-error-icon">${ICON_ERROR_WARNING_LINE}</span></div><${tag} class="view-title">Chargement<span class="visually-hidden">...</span><span class="loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></${tag}>${error}</div></section>`;
}
