/** Rendu d'une carte (face / dos) + transform image */

import { parseHexColor } from "./themes-data.js";
import { resolveCardAccent, resolveCardAccentFg } from "./card-design.js";
import { resolveImageBackground } from "./storage.js";
import { ICON_APPS_2, ICON_CALENDAR_TODO, ICON_USER_3 } from "./icons.js";
import { _t } from "./i18n.js";

/** Path du logo Brickcard (`brickcard-logo.svg`, viewBox 2000²). */
const BRAND_LOGO_PATH =
  "M516.155 336.233c17.915 0 35.375 1.152 52.13 3.32l202.386-110.36c2.45-37.57 30.027-70.243 73.38-93.07 40.647-21.41 96.21-34.66 157.04-34.66s116.39 13.25 157.037 34.66c43.82 23.078 71.524 56.2 73.442 94.29l200.16 109.14c16.75-2.168 34.21-3.32 52.12-3.32 60.84 0 116.4 13.25 157.052 34.66 45.437 23.93 73.546 58.68 73.546 98.55 0 1.48-.046 2.96-.117 4.43l.01 19.78 236.402 128.9c8.77 3.832 14.887 12.57 14.887 22.75v715.43h-.078c-.012 8.76-4.68 17.23-12.898 21.71l-938.942 511.98-.18.122-.02.012-.17.11-.18.116-.188.117-.383.226-.379.224h-.012l-.187.105-.02.012-.17.097-.2.105-.2.102-.02.016-.17.086-.2.102-.2.097-.203.094-.2.098-.058.023-.3.137-.05.023-.208.09-.203.085-.207.086-.21.082-.2.083-.21.082-.212.078-.2.07-.02.01-.21.075-.18.062-.03.012-.208.066-.223.07-.12.04h-.02l-.29.09-.218.061-.05.016-.172.046-.207.06-.043.011-.297.078-.36.086-.633.14-.078.02-.152.027-.45.082h-.01l-.442.075-.18.028-.05.01-.55.078h-.027l-.57.062-.045.01-.187.016-.43.039h-.03l-.602.035h-.1l-.468.02h-.121l-.59.01-.59-.01h-.122l-.469-.02h-.11l-.603-.035h-.02l-.44-.04-.188-.015-.043-.01-.57-.062h-.028l-.55-.078-.05-.01-.18-.028-.442-.074h-.01l-.45-.082-.14-.028-.09-.02-.422-.093-.199-.047-.37-.086-.3-.078-.029-.012-.223-.059-.168-.046-.05-.016-.22-.063-.21-.062-.102-.03-.328-.11-.219-.067-.03-.012-.18-.061-.21-.075-.02-.01-.193-.07-.207-.08-.632-.245-.207-.086-.204-.086-.207-.09-.05-.023-.3-.137-.05-.023-.2-.098-.211-.094-.188-.097-.203-.102-.168-.086-.03-.015-.2-.102-.192-.105-.18-.098-.02-.012-.186-.105-.383-.223-.2-.113-.18-.113-.19-.118-.188-.117-.172-.11-.01-.011-.191-.121-938.935-511.98c-8.226-4.481-12.894-12.95-12.902-21.711h-.086v-715.43c0-10.18 6.13-18.918 14.895-22.75l236.402-128.9.012-19.761a84 84 0 0 1-.125-4.45c0-39.87 28.11-74.62 73.55-98.55 40.653-21.41 96.211-34.66 157.043-34.66m1399.856 350.76-891.19 485.94v659.118l891.19-485.945zm-916 443.15 889.169-484.84-174.81-95.32.033 60.73h.09c0 39.879-28.114 74.62-73.563 98.559-40.66 21.41-96.23 34.652-157.079 34.652-60.84 0-116.422-13.242-157.07-34.66-45.45-23.93-73.57-58.68-73.57-98.551h.1l.068-136.82a84 84 0 0 1-.117-4.45c0-39.87 28.11-74.62 73.55-98.55 10.066-5.31 21.06-10.11 32.816-14.34l-128.038-69.82.04 89.21h.1c0 39.88-28.11 74.622-73.559 98.56-40.66 21.41-96.242 34.65-157.082 34.65-60.848 0-116.418-13.241-157.078-34.651-45.45-23.937-73.563-58.68-73.563-98.56h.102l.04-90.39-130.212 71c11.762 4.23 22.75 9.032 32.82 14.34 45.442 23.93 73.551 58.68 73.551 98.55 0 1.48-.039 2.962-.12 4.43l.07 136.84h.11c0 39.88-28.12 74.622-73.57 98.56-40.66 21.41-96.23 34.652-157.074 34.652-60.84 0-116.418-13.242-157.074-34.66-45.453-23.93-73.566-58.68-73.566-98.551h.097l.032-60.73-174.81 95.32zm-24.82 42.789L83.996 686.988v659.11l891.188 485.945zm256.37-426.73.068 136.84h.102c0 39.87-28.11 74.612-73.56 98.55-40.66 21.41-96.241 34.66-157.081 34.66-60.848 0-116.418-13.25-157.078-34.66-45.45-23.938-73.563-58.68-73.563-98.55h.102l.07-136.817a81 81 0 0 1-.13-4.461c0-39.871 28.11-74.61 73.56-98.551 40.64-21.41 96.21-34.66 157.04-34.66s116.39 13.25 157.038 34.66c45.453 23.94 73.55 58.68 73.55 98.55q0 2.236-.116 4.438m-411.55 79.272-.031 57.566h.1c0 19.992 17.958 39.453 47 54.742 33.84 17.82 81.18 28.84 134.009 28.84 52.832 0 100.172-11.02 134.012-28.84 29.039-15.289 47-34.75 47-54.742h.097l-.027-57.566c-7.332 5.316-15.371 10.277-24.043 14.847-40.648 21.41-96.207 34.653-157.04 34.653-60.827 0-116.39-13.242-157.038-34.653-8.672-4.57-16.71-9.53-24.04-14.847m315.059-138.453c-33.83-17.82-81.16-28.84-133.98-28.84-52.821 0-100.15 11.02-133.981 28.84-29.028 15.293-46.99 34.75-46.99 54.742 0 20 17.962 39.45 46.99 54.75 33.832 17.82 81.16 28.84 133.98 28.84s100.152-11.02 133.973-28.84c29.039-15.3 47-34.75 47-54.75 0-19.992-17.961-39.45-46.992-54.742m-315.06-368.636-.03 57.558h.1c0 20 17.958 39.45 47 54.75 33.84 17.82 81.18 28.84 134.009 28.84 52.832 0 100.172-11.03 134.012-28.84 29.039-15.3 47-34.75 47-54.75h.097l-.027-57.558c-7.332 5.316-15.371 10.277-24.043 14.84-40.648 21.417-96.207 34.66-157.04 34.66-60.827 0-116.397-13.243-157.038-34.66-8.672-4.564-16.71-9.525-24.04-14.84m315.052-138.453c-33.82-17.82-81.153-28.84-133.973-28.84s-100.148 11.02-133.98 28.84c-29.028 15.292-46.99 34.75-46.99 54.741 0 19.988 17.962 39.45 46.99 54.738 33.832 17.82 81.16 28.84 133.98 28.84s100.152-11.02 133.98-28.828c29.032-15.3 46.993-34.762 46.993-54.75 0-19.992-17.961-39.45-47-54.742m167.707 373.222-.028 57.56h.098c0 19.987 17.96 39.45 47 54.737 33.84 17.82 81.18 28.852 134.012 28.852 52.828 0 100.18-11.03 134.008-28.84 29.043-15.3 47.01-34.762 47.01-54.75h.103l-.031-57.559c-7.34 5.32-15.371 10.278-24.04 14.84-40.652 21.41-96.21 34.66-157.05 34.66-60.832 0-116.39-13.25-157.04-34.66-8.671-4.562-16.71-9.53-24.042-14.84m315.062-138.453c-33.832-17.816-81.16-28.84-133.98-28.84-52.813 0-100.14 11.024-133.973 28.84-29.04 15.293-46.988 34.75-46.988 54.742 0 19.99 17.95 39.45 46.988 54.74 33.82 17.82 81.16 28.84 133.973 28.84 52.82 0 100.148-11.02 133.98-28.84 29.028-15.29 46.989-34.75 46.989-54.74 0-19.992-17.961-39.449-46.99-54.742m-920.59 138.453c-7.331 5.32-15.37 10.278-24.042 14.84-40.648 21.41-96.207 34.66-157.043 34.66-60.832 0-116.39-13.25-157.043-34.66-8.667-4.562-16.703-9.53-24.035-14.84l-.03 57.56h.097c0 19.987 17.965 39.45 47.004 54.737 33.836 17.82 81.18 28.852 134.007 28.852 52.832 0 100.176-11.03 134.016-28.84 29.04-15.3 47-34.762 47-54.75h.098zM650.12 414.693c-33.816-17.816-81.156-28.84-133.973-28.84-52.816 0-100.144 11.024-133.972 28.84-29.035 15.293-46.992 34.75-46.992 54.742 0 19.99 17.957 39.45 46.992 54.74 33.824 17.82 81.156 28.84 133.972 28.84s100.157-11.02 133.973-28.84c29.043-15.29 47-34.75 47-54.74 0-19.992-17.957-39.449-47-54.742";

/**
 * Marque Brickcard (SVG inline, `fill=currentColor` / `--card-accent-fg`).
 * Pas un masque CSS : Firefox rasterise mask-image à l’impression (logo flou).
 * @param {string} [className]
 */
export function brandLogoMarkup(className = "card-brand-logo") {
  return `<svg class="${className}" viewBox="0 0 2000 2000" aria-hidden="true" focusable="false"><path fill="currentColor" d="${BRAND_LOGO_PATH}"/></svg>`;
}

/**
 * Remplace un logo de thème en échec par la marque Brickcard (tuiles).
 * @param {HTMLImageElement} img
 */
export function fallbackThemeTileToBrandLogo(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.classList.contains("is-brand")) {
    img.remove();
    return;
  }
  img.closest(".theme-tile-logo-wrap")?.classList.remove("theme-tile-logo-wrap--crop");
  const wrap = document.createElement("div");
  wrap.innerHTML = brandLogoMarkup("theme-tile-logo is-brand");
  const mark = wrap.firstElementChild;
  if (mark) img.replaceWith(mark);
  else img.remove();
}

/** Nom court affiché sous le logo sur les cartes. */
export const BRAND_NAME = "Brickcard";

/**
 * @param {HTMLElement} imgEl
 * @param {HTMLElement} boxEl
 * @param {{ imageNaturalWidth: number, imageNaturalHeight: number, imageZoom: number, imageOffsetX: number, imageOffsetY: number }} crop
 */
export function applyImageTransform(imgEl, boxEl, crop) {
  if (!imgEl || !boxEl || !crop.imageNaturalWidth) return;

  // clientWidth/Height = boîte layout (ignore un éventuel scale CSS parent)
  const width = boxEl.clientWidth;
  const height = boxEl.clientHeight;
  if (!width || !height) return;

  const base = Math.max(
    width / crop.imageNaturalWidth,
    height / crop.imageNaturalHeight
  );
  const scale = base * (crop.imageZoom || 1);
  const w = crop.imageNaturalWidth * scale;
  const h = crop.imageNaturalHeight * scale;
  const ox = (crop.imageOffsetX || 0) * width;
  const oy = (crop.imageOffsetY || 0) * height;

  imgEl.style.width = `${w}px`;
  imgEl.style.height = `${h}px`;
  imgEl.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
}

/**
 * @param {HTMLImageElement} imgEl
 * @param {HTMLElement} boxEl
 * @param {Pick<import("./storage.js").Card, "imageDataUrl"|"imageZoom"|"imageOffsetX"|"imageOffsetY"|"title">} card
 */
export function bindCardImage(imgEl, boxEl, card) {
  if (!card?.imageDataUrl) return Promise.resolve();

  return new Promise((resolve) => {
    const apply = () => {
      applyImageTransform(imgEl, boxEl, {
        imageNaturalWidth: imgEl.naturalWidth,
        imageNaturalHeight: imgEl.naturalHeight,
        imageZoom: card.imageZoom || 1,
        imageOffsetX: card.imageOffsetX || 0,
        imageOffsetY: card.imageOffsetY || 0,
      });
      resolve();
    };

    imgEl.alt = card.title || BRAND_NAME;
    if (imgEl.complete && imgEl.naturalWidth) {
      apply();
    } else {
      imgEl.onload = apply;
    }
    imgEl.src = card.imageDataUrl;
    imgEl.hidden = false;
  });
}

/**
 * Zoom / décalage d’un logo de thème (`--logo-zoom`, `--logo-offset-x/y`).
 * `--logo-zoom` : 1 = largeur 75 % de la carte.
 * @param {HTMLElement|null|undefined} imgEl
 * @param {HTMLElement} boxEl
 * @param {Pick<import("./themes-data.js").LegoTheme, "logoZoom"|"logoOffsetX"|"logoOffsetY">|null|undefined} theme
 */
export function applyThemeLogoTransform(imgEl, boxEl, theme) {
  const host =
    (boxEl instanceof HTMLElement && boxEl.closest(".card-back")) || boxEl;
  if (!(host instanceof HTMLElement)) return;
  const zoomRaw = Number(theme?.logoZoom);
  const zoom = zoomRaw > 0 ? Math.min(2.5, zoomRaw) : 1;
  host.style.setProperty("--logo-zoom", String(zoom));
  host.style.setProperty("--logo-offset-x", String(Number(theme?.logoOffsetX) || 0));
  host.style.setProperty("--logo-offset-y", String(Number(theme?.logoOffsetY) || 0));
  if (imgEl instanceof HTMLElement) {
    imgEl.style.removeProperty("width");
    imgEl.style.removeProperty("height");
    imgEl.style.removeProperty("transform");
  }
}

/** Markup branding (logo + nom), face (sous l’image) et dos. */
function cardBrandMarkup() {
  return `
    <div class="card-brand" aria-hidden="true">
      ${brandLogoMarkup()}
      <p class="card-brand-name">${BRAND_NAME}</p>
    </div>
  `;
}

/** Logo de thème (dos). */
function cardThemeMarkup() {
  return `
    <div class="card-theme" hidden>
      <img class="card-theme-logo" alt="" hidden />
    </div>
  `;
}

/**
 * Affiche ou masque le logo de thème.
 * @param {HTMLElement} root
 * @param {import("./themes-data.js").LegoTheme|null|undefined} legoTheme
 */
function applyThemeLogo(root, legoTheme) {
  const themeWrap = root.querySelector(".card-theme");
  const themeLogo = root.querySelector(".card-theme-logo");
  if (!themeWrap || !themeLogo) return;

  const logoUrl = String(legoTheme?.logoDataUrl || "").trim();
  const hideThemeLogo = () => {
    themeLogo.removeAttribute("src");
    themeLogo.hidden = true;
    themeLogo.alt = "";
    themeWrap.hidden = true;
    root.classList.remove("card-back--has-theme-logo");
    delete root.dataset.logoZoom;
    delete root.dataset.logoOffsetX;
    delete root.dataset.logoOffsetY;
    root.style.removeProperty("--logo-zoom");
    root.style.removeProperty("--logo-offset-x");
    root.style.removeProperty("--logo-offset-y");
  };

  const showThemeLogo = () => {
    root.classList.add("card-back--has-theme-logo");
    root.dataset.logoZoom = String(legoTheme?.logoZoom || 1);
    root.dataset.logoOffsetX = String(legoTheme?.logoOffsetX || 0);
    root.dataset.logoOffsetY = String(legoTheme?.logoOffsetY || 0);
    applyThemeLogoTransform(themeLogo, themeWrap, legoTheme);
    themeLogo.hidden = false;
    themeWrap.hidden = false;
  };

  if (!logoUrl) {
    hideThemeLogo();
    return;
  }

  // Cadrage connu tout de suite (l’image peut encore être hidden).
  root.dataset.logoZoom = String(legoTheme?.logoZoom || 1);
  root.dataset.logoOffsetX = String(legoTheme?.logoOffsetX || 0);
  root.dataset.logoOffsetY = String(legoTheme?.logoOffsetY || 0);
  applyThemeLogoTransform(themeLogo, themeWrap, legoTheme);

  themeLogo.onload = showThemeLogo;
  themeLogo.onerror = hideThemeLogo;
  themeLogo.alt = legoTheme?.name || "";
  if (themeLogo.getAttribute("src") !== logoUrl) {
    themeLogo.hidden = true;
    themeWrap.hidden = true;
    root.classList.remove("card-back--has-theme-logo");
    themeLogo.src = logoUrl;
  }
  // Cache navigateur : `complete` peut être vrai sans `onload`.
  if (themeLogo.complete && themeLogo.naturalWidth) showThemeLogo();
}

/** Icônes méta (header) — valeurs seules, sans libellé. */
const ICON_YEAR = ICON_CALENDAR_TODO.replace("<svg ", '<svg class="card-badge-icon" ');
const ICON_PIECES = ICON_APPS_2.replace("<svg ", '<svg class="card-badge-icon" ');
const ICON_FIGURINES = ICON_USER_3.replace("<svg ", '<svg class="card-badge-icon" ');

/** Markup commun face de carte */
export function cardFaceMarkup() {
  return `
    <header class="card-header">
      <p class="card-lego-set-ref"></p>
      <div class="card-meta">
        <span class="card-badge card-meta-release-year" hidden title="${_t("Release year")}">
          ${ICON_YEAR}<span class="card-badge-value"></span>
        </span>
        <span class="card-badge card-meta-piece-count" hidden title="${_t("Pieces")}">
          ${ICON_PIECES}<span class="card-badge-value"></span>
        </span>
        <span class="card-badge card-meta-figurine-count" hidden title="${_t("Figurines")}">
          ${ICON_FIGURINES}<span class="card-badge-value"></span>
        </span>
      </div>
    </header>
    <div class="card-photo">
      ${cardBrandMarkup()}
      <div class="card-photo-frame" hidden>
        <img class="card-photo-img" alt="" hidden />
      </div>
    </div>
    <footer class="card-footer">
      <h3 class="card-title"></h3>
    </footer>
  `;
}

/**
 * Remplit le titre (sauts de ligne via `\n`).
 * @param {HTMLElement|null} el
 * @param {string} title
 */
function setCardTitle(el, title) {
  if (!el) return;
  el.replaceChildren();
  const text = String(title || "");
  if (!text) return;
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (i > 0) el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(line));
  });
}

/**
 * @param {HTMLElement} root
 * @param {Partial<import("./storage.js").Card>} card
 * @param {import("./themes-data.js").LegoTheme|null|undefined} legoTheme
 */
export function fillCardFace(root, card, legoTheme) {
  const accent = resolveCardAccent(legoTheme);
  const fg = resolveCardAccentFg(legoTheme, accent);
  root.dataset.cardThemeColor = parseHexColor(legoTheme?.color);
  root.dataset.cardThemeSecondaryColor = parseHexColor(legoTheme?.secondaryColor);
  root.style.setProperty("--card-accent", accent);
  root.style.setProperty("--card-accent-fg", fg);

  setCardTitle(root.querySelector(".card-title"), card.title || "");

  const refRaw = String(card.legoSetRef || "").trim();
  const refEl = root.querySelector(".card-lego-set-ref");
  if (refRaw) {
    refEl.textContent = refRaw.startsWith("#") ? refRaw : `#${refRaw}`;
  } else {
    refEl.textContent = "";
  }

  const photo = root.querySelector(".card-photo");
  const frame = root.querySelector(".card-photo-frame");
  if (photo) {
    // Fond zone = accent carte (visible sous les coins arrondis de la photo).
    photo.style.backgroundColor = accent;
  }
  if (frame) {
    if (card.imageDataUrl) {
      frame.hidden = false;
      frame.style.backgroundColor = resolveImageBackground(card.imageBackgroundColor);
    } else {
      frame.hidden = true;
      frame.style.backgroundColor = "";
    }
  }

  const brand = root.querySelector(".card-photo .card-brand");
  if (brand) brand.hidden = Boolean(card.imageDataUrl);

  const yearEl = root.querySelector(".card-meta-release-year");
  const piecesEl = root.querySelector(".card-meta-piece-count");
  const figurinesEl = root.querySelector(".card-meta-figurine-count");
  const yearVal = yearEl?.querySelector(".card-badge-value");
  const piecesVal = piecesEl?.querySelector(".card-badge-value");
  const figurinesVal = figurinesEl?.querySelector(".card-badge-value");
  const releaseYear =
    card.releaseYear != null && card.releaseYear !== ""
      ? Number(card.releaseYear)
      : null;
  const pieceCount =
    card.pieceCount != null && card.pieceCount !== "" ? Number(card.pieceCount) : null;
  const figurineCount =
    card.figurineCount != null && card.figurineCount !== ""
      ? Number(card.figurineCount)
      : null;

  const showYear = releaseYear != null && Number.isFinite(releaseYear);
  const showPieces = pieceCount != null && Number.isFinite(pieceCount);
  const showFigurines = figurineCount != null && Number.isFinite(figurineCount);

  if (yearVal) yearVal.textContent = showYear ? String(releaseYear) : "";
  if (yearEl) yearEl.hidden = !showYear;

  if (piecesVal) piecesVal.textContent = showPieces ? String(pieceCount) : "";
  if (piecesEl) piecesEl.hidden = !showPieces;

  if (figurinesVal) figurinesVal.textContent = showFigurines ? String(figurineCount) : "";
  if (figurinesEl) figurinesEl.hidden = !showFigurines;

  const meta = root.querySelector(".card-meta");
  if (meta) meta.hidden = !showYear && !showPieces && !showFigurines;
}

/**
 * @param {Partial<import("./storage.js").Card>} card
 * @param {{ preview?: boolean, legoTheme?: import("./themes-data.js").LegoTheme|null }} [opts]
 */
export function renderCardFace(card, opts = {}) {
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = cardFaceMarkup();
  fillCardFace(el, card, opts.legoTheme || null);

  const photo = el.querySelector(".card-photo");
  const img = el.querySelector(".card-photo-img");

  if (card.imageDataUrl) {
    bindCardImage(img, photo, card);
  } else if (img) {
    img.hidden = true;
    img.removeAttribute("src");
  }

  return el;
}

/**
 * Aperçu unique (liste, éditeur…) : même markup + même taille poker.
 * @param {HTMLElement} host
 * @param {Partial<import("./storage.js").Card>} card
 * @param {{ legoTheme?: import("./themes-data.js").LegoTheme|null }} [opts]
 * @returns {HTMLElement} l’élément `.card`
 */
export function mountCardPreview(host, card, opts = {}) {
  host.classList.add("card-preview");
  host.replaceChildren();
  const el = renderCardFace(card, opts);
  host.appendChild(el);
  return el;
}

/**
 * Met à jour un aperçu déjà monté (même logique que l’éditeur).
 * @param {HTMLElement} cardEl élément `.card`
 * @param {Partial<import("./storage.js").Card>} card
 * @param {{ legoTheme?: import("./themes-data.js").LegoTheme|null, imageNaturalWidth?: number, imageNaturalHeight?: number }} [opts]
 */
export function refreshCardPreview(cardEl, card, opts = {}) {
  updateCardFace(cardEl, card, opts);
  const photo = cardEl.querySelector(".card-photo");
  const img = cardEl.querySelector(".card-photo-img");
  if (card.imageDataUrl && photo && img) {
    const w = opts.imageNaturalWidth || img.naturalWidth;
    const h = opts.imageNaturalHeight || img.naturalHeight;
    if (w && h) {
      applyImageTransform(img, photo, {
        imageNaturalWidth: w,
        imageNaturalHeight: h,
        imageZoom: card.imageZoom || 1,
        imageOffsetX: card.imageOffsetX || 0,
        imageOffsetY: card.imageOffsetY || 0,
      });
    } else {
      bindCardImage(img, photo, card);
    }
  }
}

/**
 * @param {HTMLElement} root élément `.card-back`
 * @param {Partial<import("./storage.js").Card>} _card
 * @param {import("./themes-data.js").LegoTheme|null|undefined} legoTheme
 */
export function fillCardBack(root, _card, legoTheme) {
  const accent = resolveCardAccent(legoTheme);
  const fg = resolveCardAccentFg(legoTheme, accent);
  root.dataset.cardThemeColor = parseHexColor(legoTheme?.color);
  root.dataset.cardThemeSecondaryColor = parseHexColor(legoTheme?.secondaryColor);
  root.style.setProperty("--card-accent", accent);
  root.style.setProperty("--card-accent-fg", fg);
  applyThemeLogo(root, legoTheme);
}

/**
 * @param {Partial<import("./storage.js").Card>} card
 * @param {{ legoTheme?: import("./themes-data.js").LegoTheme|null }} [opts]
 */
export function renderCardBack(card, opts = {}) {
  const el = document.createElement("article");
  el.className = "card-back";
  el.innerHTML = `
    ${cardBrandMarkup()}
    ${cardThemeMarkup()}
  `;
  fillCardBack(el, card, opts.legoTheme || null);
  return el;
}

/**
 * Aperçu dos (éditeur).
 * @param {HTMLElement} host
 * @param {Partial<import("./storage.js").Card>} card
 * @param {{ legoTheme?: import("./themes-data.js").LegoTheme|null }} [opts]
 * @returns {HTMLElement} l’élément `.card-back`
 */
export function mountCardBackPreview(host, card, opts = {}) {
  host.classList.add("card-preview");
  host.replaceChildren();
  const el = renderCardBack(card, opts);
  host.appendChild(el);
  return el;
}

/**
 * @param {HTMLElement} cardEl élément `.card-back`
 * @param {Partial<import("./storage.js").Card>} card
 * @param {{ legoTheme?: import("./themes-data.js").LegoTheme|null }} [opts]
 */
export function refreshCardBackPreview(cardEl, card, opts = {}) {
  fillCardBack(cardEl, card, opts.legoTheme || null);
}

/**
 * @param {HTMLElement} root
 * @param {Partial<import("./storage.js").Card>} card
 * @param {{ imageNaturalWidth?: number, imageNaturalHeight?: number, legoTheme?: import("./themes-data.js").LegoTheme|null }} [opts]
 */
export function updateCardFace(root, card, opts = {}) {
  fillCardFace(root, card, opts.legoTheme || null);

  const photo = root.querySelector(".card-photo");
  const img = root.querySelector(".card-photo-img");

  if (card.imageDataUrl) {
    img.hidden = false;
    if (img.getAttribute("src") !== card.imageDataUrl) {
      img.setAttribute("src", card.imageDataUrl);
    }
    const imageNaturalWidth = opts.imageNaturalWidth || img.naturalWidth;
    const imageNaturalHeight = opts.imageNaturalHeight || img.naturalHeight;
    if (imageNaturalWidth && imageNaturalHeight) {
      applyImageTransform(img, photo, {
        imageNaturalWidth,
        imageNaturalHeight,
        imageZoom: card.imageZoom || 1,
        imageOffsetX: card.imageOffsetX || 0,
        imageOffsetY: card.imageOffsetY || 0,
      });
    }
  } else {
    img.hidden = true;
    img.removeAttribute("src");
  }
}
