/**
 * Impression A4 : grille 3×3 (9 cartes / page), faces puis dos alignés.
 *
 * Alignement face/dos : miroir horizontal (flip sur le bord long en portrait).
 */

import { renderCardFace, renderCardBack, applyImageTransform } from "./card-render.js";
import { loadThemes } from "./storage.js";

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
 */
function buildSheet(pageCards, side, themeMap) {
  const sheet = document.createElement("section");
  sheet.className = `print-sheet print-sheet--${side}`;
  sheet.style.setProperty("--cols", String(PRINT_COLS));
  sheet.style.setProperty("--rows", String(PRINT_ROWS));

  /** @type {(import("./storage.js").Card|null)[]} */
  const slots = Array.from({ length: CARDS_PER_PAGE }, () => null);

  pageCards.forEach((card, i) => {
    slots[side === "front" ? i : mirrorIndex(i)] = card;
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
        slot.appendChild(renderCardBack(card, { legoTheme }));
      }
    }
    sheet.appendChild(slot);
  }

  return sheet;
}

/**
 * @param {import("./storage.js").Card[]} cards
 * @param {Map<string, import("./themes-data.js").LegoTheme>} themeMap
 */
function buildPrintDocument(cards, themeMap) {
  const root = document.createElement("div");
  root.className = "print-document";
  for (const pageCards of chunk(cards, CARDS_PER_PAGE)) {
    root.appendChild(buildSheet(pageCards, "front", themeMap));
    root.appendChild(buildSheet(pageCards, "back", themeMap));
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

  printRoot.innerHTML = "";
  printRoot.appendChild(buildPrintDocument(cards, themeMap));
  // display:none → clientWidth/Height à 0 ; forcer un layout hors écran pour le cadrage.
  printRoot.classList.add("is-preparing");

  await waitForImages(printRoot);
  await waitLayout();
  reapplyTransforms(printRoot);

  const onBeforePrint = () => {
    reapplyTransforms(printRoot);
  };
  window.addEventListener("beforeprint", onBeforePrint);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    printRoot.classList.remove("is-preparing");
    printRoot.innerHTML = "";
    window.removeEventListener("beforeprint", onBeforePrint);
    window.removeEventListener("afterprint", cleanup);
    opts.onDone?.();
  };

  window.addEventListener("afterprint", cleanup);
  await new Promise((r) => setTimeout(r, 80));
  window.print();
  setTimeout(cleanup, 2500);
}
