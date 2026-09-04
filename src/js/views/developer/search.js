import {
  ICON_FILTER_3,
  ICON_SEARCH_LINE,
  ICON_SORT_ASC,
  ICON_SORT_DESC,
} from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * @param {string} svg
 * @returns {string}
 */
function controlIconMarkup(svg) {
  return `<span class="form-control-icon" aria-hidden="true">${svg}</span>`;
}
/**
 * Search bar gallery (design system — test only).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperSearch(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Search</p>
        <h1 class="view-title">Search</h1>
      </header>

      <p class="styleguide-intro">
        <code>search-bar</code> block&nbsp;: <code>input.form-control</code>
        (<code>type="search"</code>) + optional trail (<code>search-num-results</code>,
        <code>search-sort</code> menu).
        Icon&nbsp;: <code>form-control-icon</code> <strong>optional</strong>
        (search default&nbsp;: <code>ri-search-line</code>).
        Same look as a text field (<code>--form-control-bg</code> background,
        inset bottom rule, focus frame <code>ink</code>).
        Topbar slot&nbsp;: <code>topbar-search</code> centers the block.
        Results + sort&nbsp;: visible only when there are <strong>at least 2</strong>
        items. Label is always “&nbsp;cards&nbsp;”.
        Used: card list (topbar) · themes modal (num results + sort) ·
        developer home and settings (<code>search-bar--input-only</code>).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Input only</h2>
        <div class="styleguide-fields" style="max-width: 36rem">
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">With icon (search default)</p>
            <div class="styleguide-search-demo">
              <div class="search-bar search-bar--input-only">
                ${controlIconMarkup(ICON_SEARCH_LINE)}
                <input class="form-control" type="search" id="demo-search-plain" placeholder="Search…" autocomplete="off" aria-label="Search with icon" />
              </div>
            </div>
          </div>
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">Without icon</p>
            <div class="styleguide-search-demo">
              <div class="search-bar search-bar--input-only">
                <input class="form-control" type="search" id="demo-search-plain-noicon" placeholder="Search…" autocomplete="off" aria-label="Search without icon" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">With results</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Type to see the results update (local demo)</p>
        <div class="styleguide-search-demo">
          <div class="search-bar">
            ${controlIconMarkup(ICON_SEARCH_LINE)}
            <input class="form-control" type="search" id="demo-search-num-results" placeholder="Search for a card…" autocomplete="off" aria-label="Search with results" aria-describedby="demo-search-num-results-out" />
            <div class="search-bar-trail">
              <span class="search-num-results" id="demo-search-num-results-out" aria-live="polite">12 cards</span>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Full (results + sort)</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Same composition as the list topbar. Menu styled like <code>form-select</code>; ↑↓ / Enter / Escape; clicking the active option again reverses direction (<code>ri-sort-asc</code> / <code>ri-sort-desc</code>).</p>
        <div class="styleguide-search-demo">
          <div class="search-bar" data-demo-sort>
            ${controlIconMarkup(ICON_SEARCH_LINE)}
            <input class="form-control" type="search" id="demo-search-full" placeholder="Search for a card…" autocomplete="off" aria-label="Full search" />
            <div class="search-bar-trail">
              <span class="search-num-results" id="demo-search-full-num-results" aria-live="polite">3 / 12 cards</span>
              <div class="search-sort">
                <button
                  type="button"
                  class="btn ghost sm icon-only search-sort-btn"
                  id="demo-search-sort-btn"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="demo-search-sort-menu"
                >
                  ${ICON_FILTER_3}
                  <span class="visually-hidden">Sort cards</span>
                </button>
              </div>
            </div>
            <div class="search-sort-menu form-select-list" id="demo-search-sort-menu" role="listbox" hidden>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-updatedAt" data-sort="updatedAt" aria-selected="true">
                <span class="form-select-option-label">Date modified</span>
                <span class="form-select-icon form-select-icon--right"></span>
              </div>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-legoSetRef" data-sort="legoSetRef" aria-selected="false">
                <span class="form-select-option-label">Reference</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-title" data-sort="title" aria-selected="false">
                <span class="form-select-option-label">Title</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-releaseYear" data-sort="releaseYear" aria-selected="false">
                <span class="form-select-option-label">Release year</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Fewer than 2 items</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Trail hidden (<code>hidden</code>) — same look as a text field alone</p>
        <div class="styleguide-search-demo">
          <div class="search-bar">
            ${controlIconMarkup(ICON_SEARCH_LINE)}
            <input class="form-control" type="search" placeholder="Search for a card…" autocomplete="off" aria-label="Search without trail" />
            <div class="search-bar-trail" hidden>
              <span class="search-num-results">12 cards</span>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">States</h2>
        <div class="styleguide-fields">
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">Empty results (hidden)</p>
            <div class="styleguide-search-demo">
              <div class="search-bar">
                ${controlIconMarkup(ICON_SEARCH_LINE)}
                <input class="form-control" type="search" placeholder="Search…" autocomplete="off" aria-label="Search without results" disabled />
                <div class="search-bar-trail">
                  <span class="search-num-results"></span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">Disabled</p>
            <div class="styleguide-search-demo">
              <div class="search-bar search-bar--input-only">
                ${controlIconMarkup(ICON_SEARCH_LINE)}
                <input class="form-control" type="search" placeholder="Unavailable" value="City" autocomplete="off" aria-label="Disabled search" disabled />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const TOTAL = 12;
  const countInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#demo-search-num-results")
  );
  const countOut = host.querySelector("#demo-search-num-results-out");
  const fullInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#demo-search-full")
  );
  const fullCount = host.querySelector("#demo-search-full-num-results");

  function syncDemoCount(input, out) {
    if (!input || !out) return;
    const q = input.value.trim();
    if (!q) {
      out.textContent = `${TOTAL} cards`;
      return;
    }
    const shown = Math.max(0, TOTAL - Math.min(TOTAL, q.length));
    out.textContent = `${shown} / ${TOTAL} cards`;
  }

  const onCountInput = () => syncDemoCount(countInput, countOut);
  const onFullInput = () => syncDemoCount(fullInput, fullCount);
  countInput?.addEventListener("input", onCountInput);
  fullInput?.addEventListener("input", onFullInput);

  const sortRoot = host.querySelector("[data-demo-sort]");
  const sortBtn = /** @type {HTMLButtonElement|null} */ (
    host.querySelector("#demo-search-sort-btn")
  );
  const sortMenu = host.querySelector("#demo-search-sort-menu");
  let sortKey = "updatedAt";
  let sortDir = /** @type {"asc"|"desc"} */ ("desc");
  let sortActiveIndex = -1;

  /** @returns {HTMLElement[]} */
  function sortOptionEls() {
    if (!sortMenu) return [];
    return /** @type {HTMLElement[]} */ ([
      ...sortMenu.querySelectorAll("[data-sort]"),
    ]);
  }

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

  function isSortOpen() {
    return Boolean(sortMenu && !sortMenu.hidden);
  }

  function syncSortMenu() {
    if (!sortMenu) return;
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
        iconSlot.title = sortDir === "asc" ? "Ascending" : "Descending";
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
  function setSortOpen(open, opts = {}) {
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
    if (key === sortKey) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = key === "title" || key === "legoSetRef" ? "asc" : "desc";
    }
    syncSortMenu();
    const idx = sortOptionEls().findIndex(
      (el) => el.getAttribute("data-sort") === sortKey
    );
    if (idx >= 0) setSortActive(idx);
  }

  const onSortBtn = (e) => {
    e.preventDefault();
    setSortOpen(!isSortOpen());
  };

  /** @param {KeyboardEvent} e */
  const onSortBtnKey = (e) => {
    const open = isSortOpen();
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault();
      if (!open) {
        setSortOpen(true);
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
        setSortOpen(false, { focusBtn: true });
      }
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setSortActive(0, true);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setSortActive(sortOptionEls().length - 1, true);
    }
  };

  const onSortClick = (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const opt = t.closest?.("[data-sort]");
    if (!opt || !sortMenu?.contains(opt)) return;
    const key = opt.getAttribute("data-sort");
    if (key) applySortKey(key);
  };

  /** @param {PointerEvent} e */
  const onSortPointer = (e) => {
    if (!isSortOpen() || !sortMenu) return;
    const t = /** @type {HTMLElement} */ (e.target);
    const opt = t.closest?.(".form-select-option");
    if (!opt || !sortMenu.contains(opt)) return;
    const idx = sortOptionEls().indexOf(/** @type {HTMLElement} */ (opt));
    if (idx >= 0) setSortActive(idx);
  };

  /** @param {MouseEvent} e */
  const onDocClick = (e) => {
    if (!isSortOpen() || !sortRoot) return;
    if (sortRoot.contains(/** @type {Node} */ (e.target))) return;
    setSortOpen(false);
  };

  /** @param {KeyboardEvent} e */
  const onDocKey = (e) => {
    if (e.key === "Escape" && isSortOpen()) {
      e.preventDefault();
      setSortOpen(false, { focusBtn: true });
    }
  };

  syncSortMenu();
  sortBtn?.addEventListener("click", onSortBtn);
  sortBtn?.addEventListener("keydown", onSortBtnKey);
  sortMenu?.addEventListener("click", onSortClick);
  sortMenu?.addEventListener("pointerenter", onSortPointer, true);
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onDocKey);

  return () => {
    countInput?.removeEventListener("input", onCountInput);
    fullInput?.removeEventListener("input", onFullInput);
    sortBtn?.removeEventListener("click", onSortBtn);
    sortBtn?.removeEventListener("keydown", onSortBtnKey);
    sortMenu?.removeEventListener("click", onSortClick);
    sortMenu?.removeEventListener("pointerenter", onSortPointer, true);
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onDocKey);
    host.innerHTML = "";
  };
}
