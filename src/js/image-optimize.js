/**
 * Conversion WebP à l’import des images (localStorage).
 * SVG exclus. Ne concerne que les nouveaux chargements.
 */

const OPTIMIZE_KEY = "brickcard:optimize-images";

/** Défaut : case cochée. */
export const DEFAULT_OPTIMIZE_IMAGES = true;

/** @returns {boolean} */
export function getOptimizeImages() {
  try {
    const raw = localStorage.getItem(OPTIMIZE_KEY);
    if (raw === null || raw === "") return DEFAULT_OPTIMIZE_IMAGES;
    return raw === "1";
  } catch {
    return DEFAULT_OPTIMIZE_IMAGES;
  }
}

/** @param {boolean} on */
export function setOptimizeImages(on) {
  try {
    localStorage.setItem(OPTIMIZE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
