/**
 * Impression A4 : grille variable (1×1 à 10×10), faces / dos, miroir colonne.
 *
 * Alignement face/dos : miroir horizontal (flip sur le bord long en portrait).
 */

import { renderCardFace, renderCardBack, applyImageTransform, applyThemeLogoTransform } from "./card-render.js";
import { loadThemes } from "./storage.js";
import {
  computePrintLayout,
  formatPrintPdfBasename,
  getPrintSettings,
} from "./print-settings.js";

export const PRINT_COLS = 3;
export const PRINT_ROWS = 3;
export const CARDS_PER_PAGE = PRINT_COLS * PRINT_ROWS;

/**
 * @template T
 * @param {T[]} items
 * @param {number} size
 * @returns {T[][]}
 */
function chunk(items, size) {
  const pages = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

/**
 * @param {number} index
 * @param {number} [cols]
 */
export function mirrorIndex(index, cols = PRINT_COLS) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  return row * cols + (cols - 1 - col);
}

/**
 * @param {import("./storage.js").Card[]} pageCards
 * @param {"front"|"back"} side
 * @param {Map<string, import("./themes-data.js").LegoTheme>} themeMap
 * @param {import("./print-settings.js").PrintLayout} layout
 */
function buildSheet(pageCards, side, themeMap, layout) {
  const { cols, rows, scale, cardsPerPage } = layout;
  const sheet = document.createElement("section");
  sheet.className = `print-sheet print-sheet--${side}`;
  sheet.style.setProperty("--cols", String(cols));
  sheet.style.setProperty("--rows", String(rows));
  sheet.style.setProperty("--print-scale", String(scale));

  /** @type {(import("./storage.js").Card|null)[]} */
  const slots = Array.from({ length: cardsPerPage }, () => null);

  pageCards.forEach((card, i) => {
    slots[side === "front" ? i : mirrorIndex(i, cols)] = card;
  });

  for (const card of slots) {
    const slot = document.createElement("div");
    slot.className = "print-slot" + (card ? "" : " is-empty");
    if (card) {
      const legoTheme = card.brickcardThemeId
        ? themeMap.get(card.brickcardThemeId) || null
        : null;
      if (side === "front") {
        const face = renderCardFace(card, { legoTheme });
        face.dataset.imageZoom = String(card.imageZoom || 1);
        face.dataset.imageOffsetX = String(card.imageOffsetX || 0);
        face.dataset.imageOffsetY = String(card.imageOffsetY || 0);
        slot.appendChild(face);
      } else {
        const back = renderCardBack(card, { legoTheme });
        slot.style.setProperty(
          "--card-accent",
          back.style.getPropertyValue("--card-accent")
        );
        slot.appendChild(back);
      }
    }
    sheet.appendChild(slot);
  }

  return sheet;
}

/**
 * @param {import("./storage.js").Card[]} cards
 * @param {Map<string, import("./themes-data.js").LegoTheme>} themeMap
 * @param {import("./print-settings.js").PrintLayout} layout
 * @param {import("./print-settings.js").PrintSettings} settings
 */
function buildPrintDocument(cards, themeMap, layout, settings) {
  const root = document.createElement("div");
  root.className = "print-document";
  const pages = chunk(cards, layout.cardsPerPage);

  /** @param {"front"|"back"} side */
  function appendSide(side) {
    for (const pageCards of pages) {
      root.appendChild(buildSheet(pageCards, side, themeMap, layout));
    }
  }

  if (settings.cardSidesToPrint === "faceOnly") {
    appendSide("front");
  } else if (settings.cardSidesToPrint === "backOnly") {
    appendSide("back");
  } else if (settings.sheetRectoVerso === "grouped") {
    appendSide("front");
    appendSide("back");
  } else {
    for (const pageCards of pages) {
      root.appendChild(buildSheet(pageCards, "front", themeMap, layout));
      root.appendChild(buildSheet(pageCards, "back", themeMap, layout));
    }
  }
  return root;
}

/** @param {HTMLElement} root */
async function waitForImages(root) {
  const imgs = Array.from(
    root.querySelectorAll(".card-photo-img, .card-brand-logo, .card-theme-logo")
  );
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.hidden || !img.getAttribute("src")) resolve();
          else if (img.complete && img.naturalWidth) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );
}

/** @param {HTMLElement} root */
function reapplyTransforms(root) {
  root.querySelectorAll(".card[data-image-zoom]").forEach((cardEl) => {
    const img = cardEl.querySelector(".card-photo-img");
    const frame = cardEl.querySelector(".card-photo-frame:not([hidden])");
    const photo = cardEl.querySelector(".card-photo");
    const box = frame || photo;
    if (!img?.naturalWidth || !box) return;
    applyImageTransform(img, box, {
      imageNaturalWidth: img.naturalWidth,
      imageNaturalHeight: img.naturalHeight,
      imageZoom: Number(cardEl.dataset.imageZoom) || 1,
      imageOffsetX: Number(cardEl.dataset.imageOffsetX) || 0,
      imageOffsetY: Number(cardEl.dataset.imageOffsetY) || 0,
    });
  });
  root.querySelectorAll(".card-back.card-back--has-theme-logo").forEach((back) => {
    const img = back.querySelector(".card-theme-logo");
    const box = back.querySelector(".card-theme");
    if (!(img instanceof HTMLImageElement) || !box || box.hasAttribute("hidden")) return;
    applyThemeLogoTransform(img, box, {
      logoZoom: Number(back.dataset.logoZoom) || 1,
      logoOffsetX: Number(back.dataset.logoOffsetX) || 0,
      logoOffsetY: Number(back.dataset.logoOffsetY) || 0,
    });
  });
}

/** Attend 2 frames pour laisser le layout se stabiliser. */
function waitLayout() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

/**
 * @param {import("./storage.js").Card[]} cards
 * @param {{ onDone?: () => void }} [opts]
 */
export async function printCards(cards, opts = {}) {
  if (!cards.length) return;

  const printRoot = document.getElementById("print-root");
  if (!printRoot) throw new Error("Zone d'impression introuvable");

  const themes = await loadThemes();
  const themeMap = new Map(themes.map((t) => [t.id, t]));
  const settings = getPrintSettings();
  const layout = computePrintLayout(settings.printGrid);

  printRoot.innerHTML = "";
  printRoot.appendChild(buildPrintDocument(cards, themeMap, layout, settings));
  // display:none → clientWidth/Height à 0 ; forcer un layout hors écran pour le cadrage.
  printRoot.classList.add("is-preparing");

  await waitForImages(printRoot);
  await waitLayout();
  reapplyTransforms(printRoot);

  const onBeforePrint = () => {
    reapplyTransforms(printRoot);
  };
  window.addEventListener("beforeprint", onBeforePrint);

  const previousTitle = document.title;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.title = previousTitle;
    printRoot.classList.remove("is-preparing");
    printRoot.innerHTML = "";
    window.removeEventListener("beforeprint", onBeforePrint);
    window.removeEventListener("afterprint", cleanup);
    opts.onDone?.();
  };

  window.addEventListener("afterprint", cleanup);
  await new Promise((r) => setTimeout(r, 80));
  document.title = formatPrintPdfBasename(cards.length, settings);
  window.print();
  setTimeout(cleanup, 2500);
}
