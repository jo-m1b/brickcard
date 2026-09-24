/**
 * One tab stop for a wrapping tile grid (home cards, theme mini-cards).
 * Arrows move between cells. Home / End jump to the ends.
 * Column count comes from the laid-out first row (the grids are flex-wrap).
 */

/** @type {WeakMap<HTMLElement, string>} */
const activeIdByGrid = new WeakMap();

/**
 * @param {HTMLElement} grid
 * @returns {HTMLElement[]}
 */
export function rovingItems(grid) {
  return [...grid.children].filter(
    (el) =>
      el instanceof HTMLElement &&
      el.getAttribute("role") === "gridcell" &&
      !el.hidden &&
      !el.closest("[hidden]")
  );
}

/**
 * @param {HTMLElement[]} items
 * @returns {number}
 */
function columnCount(items) {
  if (items.length <= 1) return Math.max(1, items.length);
  const firstTop = items[0].getBoundingClientRect().top;
  let cols = 0;
  for (const el of items) {
    if (Math.abs(el.getBoundingClientRect().top - firstTop) > 4) break;
    cols += 1;
  }
  return Math.max(1, cols);
}

/**
 * @param {HTMLElement} grid
 * @param {HTMLElement[]} items
 * @param {HTMLElement} active
 * @param {string} idAttr
 */
function placeRovingTab(grid, items, active, idAttr) {
  const cols = columnCount(items);
  items.forEach((el, i) => {
    el.tabIndex = el === active ? 0 : -1;
    el.setAttribute("aria-rowindex", String(Math.floor(i / cols) + 1));
    el.setAttribute("aria-colindex", String((i % cols) + 1));
  });
  grid.setAttribute("aria-rowcount", String(Math.ceil(items.length / cols)));
  grid.setAttribute("aria-colcount", String(cols));
  const id = active.getAttribute(idAttr);
  if (id) activeIdByGrid.set(grid, id);
}

/**
 * Keeps a single tabindex="0" cell. Does not move focus.
 * @param {HTMLElement} grid
 * @param {string} idAttr
 * @returns {HTMLElement|null}
 */
export function syncRovingTab(grid, idAttr) {
  const items = rovingItems(grid);
  if (!items.length) {
    grid.removeAttribute("aria-rowcount");
    grid.removeAttribute("aria-colcount");
    return null;
  }
  const want = activeIdByGrid.get(grid);
  const active =
    items.find((el) => want && el.getAttribute(idAttr) === want) ||
    items.find((el) => el.tabIndex === 0) ||
    items[0];
  placeRovingTab(grid, items, active, idAttr);
  return active;
}

/**
 * @param {HTMLElement} item
 * @param {string} idAttr
 * @returns {boolean}
 */
export function focusRovingItem(item, idAttr) {
  const grid = item.parentElement;
  if (!(grid instanceof HTMLElement)) return false;
  const items = rovingItems(grid);
  if (!items.includes(item)) return false;
  placeRovingTab(grid, items, item, idAttr);
  item.scrollIntoView({ block: "nearest", inline: "nearest" });
  item.focus({ preventScroll: true, focusVisible: true });
  return true;
}

/**
 * After a rebuild: keep the active cell. Pass `restoreFocus` when the grid
 * was wiped while it held focus (the old node is already gone).
 * @param {HTMLElement} grid
 * @param {string} idAttr
 * @param {{ restoreFocus?: boolean }} [opts]
 * @returns {HTMLElement|null}
 */
export function refreshRovingGrid(grid, idAttr, opts = {}) {
  const activeEl = document.activeElement;
  const wasInside =
    opts.restoreFocus ?? (activeEl instanceof Node && grid.contains(activeEl));
  const item = syncRovingTab(grid, idAttr);
  if (wasInside && item && document.activeElement !== item) {
    item.scrollIntoView({ block: "nearest", inline: "nearest" });
    item.focus({ preventScroll: true, focusVisible: true });
  }
  return item;
}

/**
 * @param {number} index
 * @param {string} key
 * @param {number} count
 * @param {number} cols
 * @returns {number}
 */
function moveIndex(index, key, count, cols) {
  if (key === "ArrowRight") return index < count - 1 ? index + 1 : index;
  if (key === "ArrowLeft") return index > 0 ? index - 1 : index;
  if (key === "ArrowDown") return index + cols < count ? index + cols : index;
  if (key === "ArrowUp") return index - cols >= 0 ? index - cols : index;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return -1;
}

/**
 * @param {HTMLElement} grid
 * @param {string} idAttr
 * @param {{ onActivate?: (item: HTMLElement) => void, onAdjust?: (item: HTMLElement, delta: number) => void }} [opts]
 * @returns {() => void}
 */
export function bindRovingGrid(grid, idAttr, opts = {}) {
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const items = rovingItems(grid);
    if (!items.length) return;
    const active = document.activeElement;
    if (!(active instanceof Element) || !grid.contains(active)) return;
    const current = items.find((el) => el === active || el.contains(active));
    if (!current) return;
    const index = items.indexOf(current);

    if ((e.key === "+" || e.key === "Add") && opts.onAdjust) {
      e.preventDefault();
      opts.onAdjust(current, 1);
      return;
    }
    if ((e.key === "-" || e.key === "Subtract") && opts.onAdjust) {
      e.preventDefault();
      opts.onAdjust(current, -1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (active.closest("[data-print-qty]")) return;
      if (!opts.onActivate) return;
      e.preventDefault();
      opts.onActivate(current);
      return;
    }
    if (e.shiftKey) return;

    const next = moveIndex(index, e.key, items.length, columnCount(items));
    if (next < 0) return;
    e.preventDefault();
    if (next !== index) focusRovingItem(items[next], idAttr);
  }

  /** @param {FocusEvent} e */
  function onFocusIn(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const item = t.closest('[role="gridcell"]');
    if (!(item instanceof HTMLElement) || item.parentElement !== grid) return;
    if (!rovingItems(grid).includes(item)) return;
    placeRovingTab(grid, rovingItems(grid), item, idAttr);
  }

  function onResize() {
    if (!grid.isConnected) return;
    syncRovingTab(grid, idAttr);
  }

  grid.addEventListener("keydown", onKey);
  grid.addEventListener("focusin", onFocusIn);
  window.addEventListener("resize", onResize);
  return () => {
    grid.removeEventListener("keydown", onKey);
    grid.removeEventListener("focusin", onFocusIn);
    window.removeEventListener("resize", onResize);
  };
}
