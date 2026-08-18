import { ICON_ADD, ICON_PRINTER, ICON_SORT_ASC, ICON_SORT_DESC, ICON_SUBTRACT } from "../icons.js";
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
import { emptyViewMarkup } from "../empty-view.js";
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

/** Après enregistrement d’une carte : recherche vidée, tri par date de modification (récent d’abord). */
export function prepareListAfterCardSave() {
  const searchInput = document.getElementById("global-search");
  if (searchInput instanceof HTMLInputElement) {
    searchInput.value = "";
  }
  saveSortKey("updatedAt");
  saveSortDir("desc");
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
  const searchBar = searchInput?.closest(".search-bar");
  const searchTrail = searchBar?.querySelector(".search-bar-trail");

  main.innerHTML = `
    <section class="panel">
      <h1 class="visually-hidden">Cartes</h1>
      <div class="cards-grid" id="cards-grid"></div>
      ${emptyViewMarkup({
        id: "empty-filter",
        hidden: true,
        titleTag: "p",
        title: "Oups !",
        text: "Aucune carte ne correspond à la recherche.",
      })}
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
      legoTheme?.name || "",
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
      searchCount.textContent = "0 cartes";
      return;
    }
    if (q) {
      searchCount.textContent = `${shown} / ${total} cartes`;
    } else {
      searchCount.textContent = `${total} cartes`;
    }
  }

  /** Compteur + tri : visibles seulement s’il y a au moins 2 cartes. */
  function syncSearchTrail() {
    const show = cards.length >= 2;
    if (searchTrail) searchTrail.hidden = !show;
    if (!show) setSortMenuOpen(false);
  }

  /** @returns {HTMLElement[]} */
  function sortOptionEls() {
    if (!sortMenu) return [];
    return /** @type {HTMLElement[]} */ ([
      ...sortMenu.querySelectorAll("[data-sort]"),
    ]);
  }

  let sortActiveIndex = -1;

  function clearSortActive() {
    sortActiveIndex = -1;
    sortOptionEls().forEach((el) => el.classList.remove("is-active"));
    sortBtn?.removeAttribute("aria-activedescendant");
  }

  /** @param {number} index @param {boolean} [scroll] */
  function setSortActive(index, scroll = false) {
    const opts = sortOptionEls();
    if (!opts.length || !sortBtn) return;
    let i = index;
    if (i < 0) i = opts.length - 1;
    if (i >= opts.length) i = 0;
    sortActiveIndex = i;
    opts.forEach((el, n) => el.classList.toggle("is-active", n === i));
    const active = opts[i];
    if (active?.id) {
      sortBtn.setAttribute("aria-activedescendant", active.id);
      if (scroll) active.scrollIntoView({ block: "nearest" });
    }
  }

  function isSortMenuOpen() {
    return Boolean(sortMenu && !sortMenu.hidden);
  }

  function syncSortMenu() {
    if (!sortMenu || !sortBtn) return;
    sortOptionEls().forEach((el) => {
      const key = el.getAttribute("data-sort");
      const on = key === sortKey;
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.classList.toggle("is-selected", on);
      const iconSlot = el.querySelector(".form-select-icon--right");
      if (!(iconSlot instanceof HTMLElement)) return;
      if (on) {
        iconSlot.hidden = false;
        iconSlot.innerHTML = sortDir === "asc" ? ICON_SORT_ASC : ICON_SORT_DESC;
        iconSlot.title = sortDir === "asc" ? "Croissant" : "Décroissant";
      } else {
        iconSlot.hidden = true;
        iconSlot.innerHTML = "";
        iconSlot.removeAttribute("title");
      }
    });
  }

  /**
   * @param {boolean} open
   * @param {{ focusBtn?: boolean }} [opts]
   */
  function setSortMenuOpen(open, opts = {}) {
    if (!sortMenu || !sortBtn) return;
    sortMenu.hidden = !open;
    sortBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      syncSortMenu();
      const selectedIdx = sortOptionEls().findIndex((el) =>
        el.classList.contains("is-selected")
      );
      if (selectedIdx >= 0) setSortActive(selectedIdx, true);
      else clearSortActive();
    } else {
      clearSortActive();
    }
    if (opts.focusBtn) sortBtn.focus();
  }

  /** @param {string} key */
  function applySortKey(key) {
    if (!SORT_KEYS.includes(/** @type {ListSortKey} */ (key))) return;
    const next = /** @type {ListSortKey} */ (key);
    if (next !== sortKey) {
      sortKey = next;
      sortDir = defaultSortDir(next);
      saveSortKey(sortKey);
      saveSortDir(sortDir);
    } else {
      sortDir = sortDir === "asc" ? "desc" : "asc";
      saveSortDir(sortDir);
    }
    renderGrid();
    const idx = sortOptionEls().findIndex(
      (el) => el.getAttribute("data-sort") === sortKey
    );
    if (idx >= 0) setSortActive(idx);
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
    const addableCount = list.filter((c) => getPrintQty(c.id) < 1).length;
    syncSearchTrail();
    updateSearchCount();
    syncSortMenu();
    syncPrintMenu({
      cardCount: cards.length,
      addableCount,
      searching: Boolean(searchQuery()),
      missing: addableCount < list.length,
    });

    const active = document.activeElement;
    /** @type {{ id: string, which: "inc" | "dec" } | null} */
    let restoreFocus = null;
    if (active instanceof HTMLElement && els.grid.contains(active)) {
      const tile = active.closest(".card-tile");
      const id = tile?.dataset.id;
      if (id) {
        if (active.closest("[data-qty-inc]")) restoreFocus = { id, which: "inc" };
        else if (active.closest("[data-qty-dec]")) restoreFocus = { id, which: "dec" };
      }
    }

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

    if (restoreFocus) {
      const tile = els.grid.querySelector(
        `.card-tile[data-id="${CSS.escape(restoreFocus.id)}"]`
      );
      /** @type {HTMLElement|null} */
      let el = null;
      if (restoreFocus.which === "inc") {
        el = tile?.querySelector("[data-qty-inc]") ?? null;
      } else {
        el = tile?.querySelector("[data-qty-dec]:not([hidden])") ?? null;
        if (!el) el = tile?.querySelector("[data-qty-inc]") ?? null;
      }
      el?.focus({ preventScroll: true });
    }
  }

  function onSearchInput() {
    renderGrid();
  }

  /** @param {MouseEvent} e */
  function onDocClick(e) {
    if (!isSortMenuOpen()) return;
    const t = /** @type {Node} */ (e.target);
    if (sortMenu?.contains(t) || sortBtn?.contains(t)) return;
    setSortMenuOpen(false);
  }

  /** @param {KeyboardEvent} e */
  function onDocKeydown(e) {
    if (e.key === "Escape" && isSortMenuOpen()) {
      e.preventDefault();
      setSortMenuOpen(false, { focusBtn: true });
    }
  }

  /** @param {KeyboardEvent} e */
  function onSortBtnKeydown(e) {
    if (!sortBtn || !sortMenu) return;
    const open = isSortMenuOpen();
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault();
      if (!open) {
        setSortMenuOpen(true);
        if (e.key === "ArrowUp") {
          setSortActive(sortOptionEls().length - 1, true);
        }
        return;
      }
      if (e.key === "ArrowDown") setSortActive(sortActiveIndex + 1, true);
      else if (e.key === "ArrowUp") setSortActive(sortActiveIndex - 1, true);
      else if (e.key === "Enter" || e.key === " ") {
        const opt = sortOptionEls()[sortActiveIndex];
        const key = opt?.getAttribute("data-sort");
        if (key) applySortKey(key);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setSortMenuOpen(false, { focusBtn: true });
      }
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setSortActive(0, true);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setSortActive(sortOptionEls().length - 1, true);
    }
  }

  function onSearchBarFocusIn(e) {
    if (!searchInput || !searchBar) return;
    if (e.target !== searchBar) return;
    const from = e.relatedTarget;
    if (from === searchInput) {
      const brand = document.getElementById("brand-link");
      if (brand instanceof HTMLElement) brand.focus();
      return;
    }
    searchInput.focus();
  }

  /** Clic sur l’icône / le padding : même cible que le champ. */
  function onSearchBarMouseDown(e) {
    if (!searchInput || !searchBar) return;
    const t = /** @type {Node} */ (e.target);
    if (t === searchInput || searchInput.contains(t)) return;
    if (sortBtn?.contains(t) || sortMenu?.contains(t)) return;
    e.preventDefault();
    searchInput.focus();
  }

  if (searchInput) {
    searchInput.addEventListener("input", onSearchInput);
  }
  if (searchBar && searchInput) {
    searchBar.tabIndex = 0;
    searchInput.tabIndex = -1;
    searchBar.addEventListener("focusin", onSearchBarFocusIn);
    searchBar.addEventListener("mousedown", onSearchBarMouseDown);
  }

  /** @param {MouseEvent} e */
  function onSortBtnClick(e) {
    e.stopPropagation();
    setSortMenuOpen(!isSortMenuOpen());
  }

  /** @param {MouseEvent} e */
  function onSortMenuClick(e) {
    const t = /** @type {HTMLElement} */ (e.target);
    const opt = t.closest?.("[data-sort]");
    if (!opt || !sortMenu?.contains(opt)) return;
    e.stopPropagation();
    const key = opt.getAttribute("data-sort");
    if (key) applySortKey(key);
  }

  /** @param {PointerEvent} e */
  function onSortMenuPointer(e) {
    if (!isSortMenuOpen() || !sortMenu) return;
    const t = /** @type {HTMLElement} */ (e.target);
    const opt = t.closest?.(".form-select-option");
    if (!opt || !sortMenu.contains(opt)) return;
    const idx = sortOptionEls().indexOf(/** @type {HTMLElement} */ (opt));
    if (idx >= 0) setSortActive(idx);
  }

  if (sortBtn && sortMenu) {
    sortBtn.addEventListener("click", onSortBtnClick);
    sortBtn.addEventListener("keydown", onSortBtnKeydown);
    sortMenu.addEventListener("click", onSortMenuClick);
    sortMenu.addEventListener("pointerenter", onSortMenuPointer, true);
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
    if (searchBar) {
      searchBar.removeEventListener("focusin", onSearchBarFocusIn);
      searchBar.removeEventListener("mousedown", onSearchBarMouseDown);
      searchBar.removeAttribute("tabindex");
    }
    if (searchInput) searchInput.removeAttribute("tabindex");
    if (sortBtn) {
      sortBtn.removeEventListener("click", onSortBtnClick);
      sortBtn.removeEventListener("keydown", onSortBtnKeydown);
    }
    if (sortMenu) {
      sortMenu.removeEventListener("click", onSortMenuClick);
      sortMenu.removeEventListener("pointerenter", onSortMenuPointer, true);
    }
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onDocKeydown);
    setSortMenuOpen(false);
    if (searchTrail) searchTrail.hidden = false;
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
