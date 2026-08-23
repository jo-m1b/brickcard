/** Rendu d'une carte (face / dos) + transform image */

import { parseHexColor } from "./themes-data.js";
import { resolveCardAccent, resolveCardAccentFg } from "./card-design.js";
import { resolveImageBackground } from "./storage.js";
import { ICON_APPS_2, ICON_CALENDAR_TODO, ICON_USER_3 } from "./icons.js";

/**
 * Marque Brickcard (masque CSS, couleur = `currentColor` / `--card-accent-fg`).
 * @param {string} [className]
 */
export function brandLogoMarkup(className = "card-brand-logo") {
  return `<span class="${className}" aria-hidden="true"></span>`;
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
  const mark = document.createElement("span");
  mark.className = "theme-tile-logo is-brand";
  mark.setAttribute("aria-hidden", "true");
  img.replaceWith(mark);
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

  themeLogo.onload = showThemeLogo;
  themeLogo.onerror = hideThemeLogo;
  themeLogo.alt = legoTheme?.name || "";
  if (themeLogo.getAttribute("src") !== logoUrl) {
    themeLogo.hidden = true;
    themeWrap.hidden = true;
    root.classList.remove("card-back--has-theme-logo");
    themeLogo.src = logoUrl;
  } else if (themeLogo.complete) {
    showThemeLogo();
  }
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
        <span class="card-badge card-meta-release-year" hidden title="Année de sortie">
          ${ICON_YEAR}<span class="card-badge-value"></span>
        </span>
        <span class="card-badge card-meta-piece-count" hidden title="Pièces">
          ${ICON_PIECES}<span class="card-badge-value"></span>
        </span>
        <span class="card-badge card-meta-figurine-count" hidden title="Figurines">
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
