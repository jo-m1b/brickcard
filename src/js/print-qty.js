const QTY_MAX = 99;
const PRINT_QTY_KEY = "brickcard:print-qty";

export { QTY_MAX, PRINT_QTY_KEY };

/** @returns {Map<string, number>} */
function loadPrintQtyMap() {
  /** @type {Map<string, number>} */
  const map = new Map();
  try {
    const raw = localStorage.getItem(PRINT_QTY_KEY);
    if (!raw) return map;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return map;
    for (const [id, qty] of Object.entries(obj)) {
      const n = Math.round(Number(qty));
      if (typeof id === "string" && id && Number.isFinite(n) && n > 0) {
        map.set(id, Math.min(QTY_MAX, n));
      }
    }
  } catch {
    /* ignore */
  }
  return map;
}

/** Sélection d’impression (persistée). */
/** @type {Map<string, number>} */
export const printQty = loadPrintQtyMap();

export function savePrintQty() {
  try {
    if (!printQty.size) {
      localStorage.removeItem(PRINT_QTY_KEY);
      return;
    }
    /** @type {Record<string, number>} */
    const obj = {};
    for (const [id, qty] of printQty) obj[id] = qty;
    localStorage.setItem(PRINT_QTY_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

/** @param {string} id */
export function getPrintQty(id) {
  return printQty.get(id) || 0;
}

/** @param {string} id @param {number} qty */
export function setPrintQty(id, qty) {
  const n = Math.max(0, Math.min(QTY_MAX, Math.round(Number(qty) || 0)));
  if (n <= 0) printQty.delete(id);
  else printQty.set(id, n);
  savePrintQty();
}

export function clearPrintQty() {
  printQty.clear();
  savePrintQty();
}

export function totalPrintCount() {
  let total = 0;
  for (const n of printQty.values()) total += n;
  return total;
}
