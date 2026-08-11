import { ICON_ADD, ICON_ARROW_DOWN_S, ICON_ARROW_UP_S, ICON_PRINTER, ICON_SUBTRACT } from "../icons.js";
import { loadCards, loadThemes } from "../storage.js";
import {
  printQty,
  getPrintQty,
  setPrintQty,
  savePrintQty,
  QTY_MAX,
} from "../print-qty.js";
import {
  setPrintMenuHooks,
  clearPrintMenuHooks,
  syncPrintMenu,
} from "../print-menu.js";
import { registerCardsGrid } from "../list-layout.js";
import { mountCardPreview } from "../card-render.js";

/**
 * @param {string} hay
 * @param {string} needle
 */
function includesCI(hay, needle) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

const ICON_PRINT = ICON_PRINTER;
const ICON_MINUS = ICON_SUBTRACT;
const ICON_PLUS = ICON_ADD;

const SORT_KEY = "brickcard-generator:list-sort";
const SORT_DIR_KEY = "brickcard-generator:list-sort-dir";

/** @typedef {"updatedAt"|"legoSetRef"|"title"|"releaseYear"|"pieceCount"|"figurineCount"} ListSortKey */
/** @typedef {"asc"|"desc"} ListSortDir */

/** @type {ListSortKey[]} */
const SORT_KEYS = [
  "updatedAt",
  "legoSetRef",
  "title",
  "releaseYear",
  "pieceCount",
  "figurineCount",
];

const ICON_SORT_ASC = ICON_ARROW_UP_S;
const ICON_SORT_DESC = ICON_ARROW_DOWN_S;

/** @param {ListSortKey} key @returns {ListSortDir} */
function defaultSortDir(key) {
  return key === "updatedAt" ? "desc" : "asc";
}

/** @returns {ListSortKey} */
function loadSortKey() {
  try {
    const v = localStorage.getItem(SORT_KEY);
    if (v && SORT_KEYS.includes(/** @type {ListSortKey} */ (v))) {
      return /** @type {ListSortKey} */ (v);
    }
  } catch {
    /* ignore */
  }
  return "updatedAt";
}

/** @param {ListSortKey} key */
function saveSortKey(key) {
  try {
    localStorage.setItem(SORT_KEY, key);
  } catch {
    /* ignore */
  }
}

/** @param {ListSortKey} sortKey @returns {ListSortDir} */
function loadSortDir(sortKey) {
  try {
    const v = localStorage.getItem(SORT_DIR_KEY);
    if (v === "asc" || v === "desc") return v;
  } catch {
    /* ignore */
  }
  return defaultSortDir(sortKey);
}

/** @param {ListSortDir} dir */
function saveSortDir(dir) {
  try {
    localStorage.setItem(SORT_DIR_KEY, dir);
  } catch {
    /* ignore */
  }
}

/**
 * @param {import("../storage.js").Card} a
 * @param {import("../storage.js").Card} b
 * @param {ListSortKey} key
 */
function compareCardsAsc(a, b, key) {
  if (key === "updatedAt") {
    return String(a.updatedAt || "").localeCompare(String(b.updatedAt || ""));
  }
  if (key === "legoSetRef") {
    return String(a.legoSetRef || "").localeCompare(String(b.legoSetRef || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
  if (key === "title") {
    return String(a.title || "").localeCompare(String(b.title || ""), undefined, {
      sensitivity: "base",
    });
  }
  if (key === "releaseYear") {
    const ay = a.releaseYear;
    const by = b.releaseYear;
    if (ay == null && by == null) return 0;
    if (ay == null) return 1;
    if (by == null) return -1;
    return ay - by;
  }
  if (key === "pieceCount") {
    const ap = a.pieceCount;
    const bp = b.pieceCount;
    if (ap == null && bp == null) return 0;
    if (ap == null) return 1;
    if (bp == null) return -1;
    return ap - bp;
  }
  if (key === "figurineCount") {
    const af = a.figurineCount;
    const bf = b.figurineCount;
    if (af == null && bf == null) return 0;
    if (af == null) return 1;
    if (bf == null) return -1;
    return af - bf;
  }
  return 0;
}

/**
 * @param {HTMLElement} main
 * @param {{ onEdit: (id: string) => void, onCreate: () => void, toast: (msg: string, type?: string) => void }} opts
 */
export async function renderList(main, opts) {
  const [cards, themes] = await Promise.all([loadCards(), loadThemes()]);
  /** @type {Map<string, import("../storage.js").LegoTheme>} */
  const themeMap = new Map(themes.map((t) => [t.id, t]));

  let pruned = false;
  const ids = new Set(cards.map((c) => c.id));
  for (const id of [...printQty.keys()]) {
    if (!ids.has(id)) {
      printQty.delete(id);
      pruned = true;
    }
  }
  if (pruned) savePrintQty();

  /** @type {ListSortKey} */
  let sortKey = loadSortKey();
  /** @type {ListSortDir} */
  let sortDir = loadSortDir(sortKey);

  const searchInput = document.getElementById("global-search");
  const searchCount = document.getElementById("search-count");
  const sortBtn = document.getElementById("search-sort-btn");
  const sortMenu = document.getElementById("search-sort-menu");

  main.innerHTML = `
    <section class="panel" aria-label="Liste des cartes">
      <div class="cards-grid" id="cards-grid"></div>
      <div class="empty-table" id="empty-filter" hidden>Aucune carte ne correspond à la recherche.</div>
    </section>
  `;

  const els = {
    grid: main.querySelector("#cards-grid"),
    emptyFilter: main.querySelector("#empty-filter"),
  };

  function searchQuery() {
    return (searchInput?.value || "").trim();
  }

  /** @param {import("../storage.js").Card} card */
  function matchesSearch(card) {
    const q = searchQuery();
    if (!q) return true;
    const legoTheme = card.brickcardThemeId
      ? themeMap.get(card.brickcardThemeId)
      : null;
    const haystack = [
      card.legoSetRef || "",
      card.title || "",
      legoTheme?.themeName || "",
      card.releaseYear != null ? String(card.releaseYear) : "",
    ].join("\n");
    return includesCI(haystack, q);
  }

  function filtered() {
    const dir = sortDir === "asc" ? 1 : -1;
    return cards
      .filter(matchesSearch)
      .slice()
      .sort((a, b) => compareCardsAsc(a, b, sortKey) * dir);
  }

  function updateSearchCount() {
    if (!searchCount) return;
    const total = cards.length;
    const shown = filtered().length;
    const q = searchQuery();
    if (!total) {
      searchCount.textContent = "0 carte";
      return;
    }
    if (q) {
      searchCount.textContent = `${shown} / ${total} carte${total > 1 ? "s" : ""}`;
    } else {
      searchCount.textContent = `${total} carte${total > 1 ? "s" : ""}`;
    }
  }

  function syncSortMenu() {
    if (!sortMenu || !sortBtn) return;
    sortMenu.querySelectorAll("[data-sort]").forEach((btn) => {
      const key = btn.getAttribute("data-sort");
      const on = key === sortKey;
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    sortMenu.querySelectorAll("[data-sort-dir]").forEach((btn) => {
      const key = btn.getAttribute("data-sort-dir");
      const on = key === sortKey;
      btn.hidden = !on;
      if (on) {
        btn.innerHTML = sortDir === "asc" ? ICON_SORT_ASC : ICON_SORT_DESC;
        btn.setAttribute(
          "aria-label",
          sortDir === "asc" ? "Tri croissant — cliquer pour inverser" : "Tri décroissant — cliquer pour inverser"
        );
        btn.title = sortDir === "asc" ? "Croissant" : "Décroissant";
      }
    });
  }

  function setSortMenuOpen(open) {
    if (!sortMenu || !sortBtn) return;
    sortMenu.hidden = !open;
    sortBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /**
   * @param {string} id
   * @param {number} qty
   */
  function printQtyMarkup(id, qty) {
    const has = qty > 0;
    const safeId = escapeAttr(id);
    const decLabel = "Retirer une carte";
    const incLabel = has ? "Ajouter une carte" : "Ajouter à l’impression";
    return `
      <div class="print-qty${has ? " is-active" : ""}" data-print-qty="${safeId}">
        <button type="button" class="btn ghost icon-only sm" data-qty-dec="${safeId}" ${has ? "" : "hidden"}>
          ${ICON_MINUS}
          <span class="visually-hidden">${decLabel}</span>
        </button>
        <span class="print-qty-count" ${has ? "" : "hidden"} aria-label="${qty} carte${qty > 1 ? "s" : ""}">
          ${ICON_PRINT}
          <span class="print-qty-num">${qty}</span>
        </span>
        <button type="button" class="btn ghost icon-only${has ? " sm" : ""}" data-qty-inc="${safeId}">
          ${has ? ICON_PLUS : ICON_PRINT}
          <span class="visually-hidden">${incLabel}</span>
        </button>
      </div>
    `;
  }

  function renderGrid() {
    const list = filtered();
    updateSearchCount();
    syncSortMenu();
    syncPrintMenu({ cardCount: cards.length });

    els.grid.innerHTML = "";
    els.emptyFilter.hidden = list.length > 0 || cards.length === 0;

    for (const card of list) {
      const legoTheme = card.brickcardThemeId
        ? themeMap.get(card.brickcardThemeId)
        : null;
      const qty = getPrintQty(card.id);
      const isSel = qty > 0;

      const tile = document.createElement("article");
      tile.className = "card-tile" + (isSel ? " is-selected" : "");
      tile.dataset.id = card.id;
      tile.setAttribute("role", "button");
      tile.tabIndex = 0;
      tile.setAttribute(
        "aria-label",
        `Modifier${card.title ? ` « ${card.title} »` : " la carte"}${card.legoSetRef ? ` (${card.legoSetRef})` : ""}`
      );

      const preview = document.createElement("div");
      preview.className = "card-tile-preview";
      mountCardPreview(preview, card, { legoTheme });
      tile.appendChild(preview);

      const actions = document.createElement("div");
      actions.className = "card-tile-actions";
      actions.innerHTML = printQtyMarkup(card.id, qty);
      tile.appendChild(actions);
      els.grid.appendChild(tile);
    }
  }

  function onSearchInput() {
    renderGrid();
  }

  /** @param {MouseEvent} e */
  function onDocClick(e) {
    if (!sortMenu || sortMenu.hidden) return;
    const t = /** @type {Node} */ (e.target);
    if (sortMenu.contains(t) || sortBtn?.contains(t)) return;
    setSortMenuOpen(false);
  }

  /** @param {KeyboardEvent} e */
  function onDocKeydown(e) {
    if (e.key === "Escape") setSortMenuOpen(false);
  }

  if (searchInput) {
    searchInput.addEventListener("input", onSearchInput);
  }

  if (sortBtn && sortMenu) {
    sortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setSortMenuOpen(sortMenu.hidden);
    });
    sortMenu.addEventListener("click", (e) => {
      const t = /** @type {HTMLElement} */ (e.target);
      const dirBtn = t.closest("[data-sort-dir]");
      if (dirBtn) {
        e.stopPropagation();
        const key = dirBtn.getAttribute("data-sort-dir");
        if (key !== sortKey) return;
        sortDir = sortDir === "asc" ? "desc" : "asc";
        saveSortDir(sortDir);
        renderGrid();
        return;
      }
      const opt = t.closest?.("[data-sort]");
      if (!opt) return;
      e.stopPropagation();
      const key = opt.getAttribute("data-sort");
      if (!key || !SORT_KEYS.includes(/** @type {ListSortKey} */ (key))) return;
      const next = /** @type {ListSortKey} */ (key);
      if (next !== sortKey) {
        sortKey = next;
        sortDir = defaultSortDir(next);
        saveSortKey(sortKey);
        saveSortDir(sortDir);
      }
      setSortMenuOpen(false);
      renderGrid();
    });
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onDocKeydown);
  }

  setPrintMenuHooks({
    getSelectAllCards: () => filtered(),
    onSelectionChange: () => renderGrid(),
  });

  const unregisterGrid = registerCardsGrid(els.grid);

  els.grid.addEventListener("click", async (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const decBtn = t.closest("[data-qty-dec]");
    const incBtn = t.closest("[data-qty-inc]");

    if (decBtn) {
      e.stopPropagation();
      const id = decBtn.getAttribute("data-qty-dec");
      if (!id) return;
      setPrintQty(id, getPrintQty(id) - 1);
      renderGrid();
      return;
    }

    if (incBtn) {
      e.stopPropagation();
      const id = incBtn.getAttribute("data-qty-inc");
      if (!id) return;
      setPrintQty(id, Math.min(QTY_MAX, getPrintQty(id) + 1));
      renderGrid();
      return;
    }

    if (t.closest("[data-print-qty]") || t.closest(".card-tile-actions")) {
      e.stopPropagation();
      return;
    }

    /* Édition uniquement au clic sur la carte (pas sur les marges de la tuile) */
    const preview = t.closest(".card-tile-preview");
    const tile = preview?.closest(".card-tile");
    if (tile?.dataset.id) {
      opts.onEdit(tile.dataset.id);
    }
  });

  els.grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const tile = /** @type {HTMLElement} */ (e.target).closest?.(".card-tile");
    if (!tile?.dataset.id || e.target.closest("[data-print-qty]")) return;
    e.preventDefault();
    opts.onEdit(tile.dataset.id);
  });

  syncSortMenu();
  renderGrid();

  return () => {
    unregisterGrid();
    if (searchInput) searchInput.removeEventListener("input", onSearchInput);
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onDocKeydown);
    setSortMenuOpen(false);
    clearPrintMenuHooks();
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}
