/**
 * Layout de la liste de cartes — nombre max de colonnes (localStorage).
 * Largeur de ligne calculée en px (mesure réelle) pour éviter les erreurs de calc CSS.
 * Plage : 2–10, plus un cran « illimité » (pas de plafond).
 */

const COLS_KEY = "brickcard-generator:list-cols-max";
const GAP_X = "1.25rem";
const UNLIMITED_TOKEN = "infinite";

/** Défaut : 4 cartes max par ligne. */
export const DEFAULT_LIST_COLS_MAX = 4;

/** Minimum de cartes par ligne (réglage fini). */
export const LIST_COLS_MIN = 2;

/** Maximum de cartes par ligne (réglage fini). */
export const LIST_COLS_MAX = 10;

/**
 * Valeur du curseur pour « illimité » (11ᵉ cran après 2…10).
 * @type {11}
 */
export const LIST_COLS_SLIDER_UNLIMITED = 11;

/** @type {Set<HTMLElement>} */
const grids = new Set();

/** @type {ResizeObserver | null} */
let resizeObserver = null;

/** @param {unknown} value @returns {boolean} */
export function isListColsUnlimited(value) {
  if (value === UNLIMITED_TOKEN || value === "inf" || value === "∞") return true;
  if (value === Infinity) return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= LIST_COLS_SLIDER_UNLIMITED;
}

/**
 * Normalise une valeur stockée / saisie.
 * @param {unknown} value
 * @returns {number} 2–10, ou `Infinity` si illimité
 */
export function normalizeListColsMax(value) {
  if (isListColsUnlimited(value)) return Infinity;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_LIST_COLS_MAX;
  if (n > LIST_COLS_MAX) return Infinity;
  return Math.min(LIST_COLS_MAX, Math.max(LIST_COLS_MIN, n));
}

/** Valeur du range HTML (2–11). @param {number} cols @returns {number} */
export function listColsToSlider(cols) {
  return Number.isFinite(cols) ? cols : LIST_COLS_SLIDER_UNLIMITED;
}

/** @param {unknown} sliderValue @returns {number} */
export function listColsFromSlider(sliderValue) {
  return normalizeListColsMax(sliderValue);
}

/** Libellé UI. @param {number} cols @returns {string} */
export function formatListColsLabel(cols) {
  return Number.isFinite(cols) ? String(cols) : "∞";
}

/** @returns {number} 2–10 ou Infinity */
export function getListColsMax() {
  try {
    const raw = localStorage.getItem(COLS_KEY);
    if (raw == null || raw === "") return DEFAULT_LIST_COLS_MAX;
    return normalizeListColsMax(raw);
  } catch {
    return DEFAULT_LIST_COLS_MAX;
  }
}

/**
 * Mesure une longueur CSS en pixels (ex. `var(--card-w)`, `1.25rem`).
 * @param {string} cssLength
 * @returns {number}
 */
function measurePx(cssLength) {
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:${cssLength}`;
  document.body.appendChild(el);
  const w = el.getBoundingClientRect().width;
  el.remove();
  return w;
}

/**
 * Applique le nombre de colonnes effectif via max-width en px (gap fixe, lignes centrées).
 * @param {HTMLElement} grid
 */
export function layoutCardsGrid(grid) {
  if (!grid) return;
  const max = getListColsMax();
  const cardPx = measurePx("var(--card-w)");
  const gapPx = measurePx(GAP_X);
  if (!(cardPx > 0) || !(gapPx >= 0)) {
    grid.style.removeProperty("max-width");
    return;
  }

  /* Largeur dispo = parent (pas la grille déjà bornée, sinon boucle N→N-1) */
  const parent = grid.parentElement;
  const available = parent?.clientWidth || grid.clientWidth || 0;
  const fit = Math.max(1, Math.floor((available + gapPx) / (cardPx + gapPx)));

  if (!Number.isFinite(max)) {
    /* Illimité : pas de plafond, uniquement la largeur d’écran */
    grid.style.removeProperty("max-width");
    grid.dataset.listCols = String(fit);
    return;
  }

  const cols = Math.min(max, fit);
  const rowMax = cols * cardPx + Math.max(0, cols - 1) * gapPx;
  /* +1px : évite qu’un arrondi sous-pixel fasse passer la Nᵉ carte à la ligne */
  grid.style.maxWidth = `${Math.ceil(rowMax) + 1}px`;
  grid.dataset.listCols = String(cols);
}

function ensureResizeObserver() {
  if (resizeObserver) return;
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const parent = /** @type {HTMLElement} */ (entry.target);
      for (const grid of grids) {
        if (grid.parentElement === parent) layoutCardsGrid(grid);
      }
    }
  });
}

/**
 * Enregistre une grille de liste (observe le parent pour le resize).
 * @param {HTMLElement | null | undefined} grid
 * @returns {() => void} unregister
 */
export function registerCardsGrid(grid) {
  if (!grid) return () => {};
  grids.add(grid);
  ensureResizeObserver();
  const parent = grid.parentElement;
  if (parent) resizeObserver?.observe(parent);
  layoutCardsGrid(grid);
  return () => {
    grids.delete(grid);
    if (parent) resizeObserver?.unobserve(parent);
  };
}

/**
 * @param {unknown} value
 * @returns {number} 2–10 ou Infinity
 */
export function setListColsMax(value) {
  const n = normalizeListColsMax(value);
  try {
    localStorage.setItem(
      COLS_KEY,
      Number.isFinite(n) ? String(n) : UNLIMITED_TOKEN
    );
  } catch {
    /* ignore */
  }
  applyListColsMax(n);
  return n;
}

/** @param {number} [n] */
export function applyListColsMax(n = getListColsMax()) {
  const cols = normalizeListColsMax(n);
  document.documentElement.style.setProperty(
    "--list-cols-max",
    Number.isFinite(cols) ? String(cols) : "none"
  );
  for (const grid of grids) layoutCardsGrid(grid);
}

/** Applique la valeur stockée au démarrage. */
export function initListLayout() {
  applyListColsMax();
}
