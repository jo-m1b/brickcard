import {
  ICON_ADD,
  ICON_CLOSE,
  ICON_DELETE_BIN_2,
  ICON_FILTER_3,
  ICON_PALETTE,
  ICON_SEARCH_LINE,
  ICON_SORT_ASC,
  ICON_SORT_DESC,
  modalTitleMarkup,
} from "../icons.js";
import { confirmDialog } from "../confirm-dialog.js";
import { toast } from "../toast.js";
import { deleteAllCustomThemes, loadCards, loadThemes } from "../storage.js";
import { partitionThemes } from "../themes-data.js";
import { resolveCardAccent, resolveCardAccentFg } from "../card-design.js";
import {
  applyThemeLogoTransform,
  brandLogoMarkup,
  fallbackThemeTileToBrandLogo,
} from "../card-render.js";
import { emptyViewMarkup } from "../empty-view.js";
import { setAppDocumentTitle } from "../document-title.js";
import { _t, getLocale } from "../i18n.js";
import { includesCI } from "../includes-ci.js";

const SORT_KEY = "brickcard:themes-sort";
const SORT_DIR_KEY = "brickcard:themes-sort-dir";

/** @typedef {"cardCount"|"name"|"updatedAt"} ThemesSortKey */
/** @typedef {"asc"|"desc"} ThemesSortDir */

/** @type {ThemesSortKey[]} */
const SORT_KEYS = ["cardCount", "name", "updatedAt"];

/** @param {ThemesSortKey} key @returns {ThemesSortDir} */
function defaultSortDir(key) {
  return key === "name" ? "asc" : "desc";
}

/** @returns {ThemesSortKey} */
function loadSortKey() {
  try {
    const raw = localStorage.getItem(SORT_KEY);
    const v = raw === "themeName" ? "name" : raw;
    if (v && SORT_KEYS.includes(/** @type {ThemesSortKey} */ (v))) {
      return /** @type {ThemesSortKey} */ (v);
    }
  } catch {
    /* ignore */
  }
  return "cardCount";
}

/** @param {ThemesSortKey} key */
function saveSortKey(key) {
  try {
    localStorage.setItem(SORT_KEY, key);
  } catch {
    /* ignore */
  }
}

/** @param {ThemesSortKey} sortKey @returns {ThemesSortDir} */
function loadSortDir(sortKey) {
  try {
    const v = localStorage.getItem(SORT_DIR_KEY);
    if (v === "asc" || v === "desc") return v;
  } catch {
    /* ignore */
  }
  return defaultSortDir(sortKey);
}

/** @param {ThemesSortDir} dir */
function saveSortDir(dir) {
  try {
    localStorage.setItem(SORT_DIR_KEY, dir);
  } catch {
    /* ignore */
  }
}

/** Après création d’un thème : recherche vidée, tri par date de modification (récent d’abord). */
export function prepareThemesAfterThemeCreate() {
  rememberedQuery = "";
  saveSortKey("updatedAt");
  saveSortDir("desc");
}

/** @type {((theme: import("../themes-data.js").LegoTheme) => boolean) | null} */
let mountedRefreshThemesAfterCreate = null;
/** @type {((theme: import("../themes-data.js").LegoTheme) => boolean) | null} */
let mountedPatchThemeInList = null;
/** @type {((id: string) => boolean) | null} */
let mountedRemoveThemeFromList = null;
/** @type {((id: string) => boolean) | null} */
let mountedFocusThemeInList = null;
/** @type {string | null} */
let pendingFocusThemeId = null;

/**
 * Ajoute un thème à la liste montée, reset tri/recherche, repeint et scrolle en haut.
 * @param {import("../themes-data.js").LegoTheme} theme
 * @returns {boolean} false si la liste n’est pas montée
 */
export function refreshThemesListAfterCreate(theme) {
  if (!mountedRefreshThemesAfterCreate || !theme?.id) return false;
  return mountedRefreshThemesAfterCreate(theme);
}

/**
 * Met à jour la mini-carte d’un thème déjà affiché, sans reconstruire la grille.
 * @param {import("../themes-data.js").LegoTheme} theme
 * @returns {boolean} false si la liste n’est pas montée
 */
export function patchThemeInList(theme) {
  if (!mountedPatchThemeInList || !theme?.id) return false;
  return mountedPatchThemeInList(theme);
}

/**
 * Place le focus clavier sur la mini-carte d’un thème (perso ou par défaut).
 * Si la tuile n’est pas encore dans la grille, le focus est appliqué au prochain rendu.
 * @param {string} [id]
 */
export function focusThemeInList(id) {
  if (!id) return;
  pendingFocusThemeId = id;
  if (mountedFocusThemeInList?.(id)) {
    pendingFocusThemeId = null;
    return;
  }
  requestAnimationFrame(() => applyPendingThemeFocus());
}

/** Applique un focus de tuile en attente (après `focusTopModal` au retour liste). */
export function applyPendingThemeFocus() {
  if (!pendingFocusThemeId) return;
  if (mountedFocusThemeInList?.(pendingFocusThemeId)) pendingFocusThemeId = null;
}

/**
 * @param {Element | null | undefined} tile
 * @returns {boolean}
 */
function applyThemeTileFocus(tile) {
  if (!(tile instanceof HTMLElement)) return false;
  tile.scrollIntoView({ block: "nearest", inline: "nearest" });
  tile.focus({ preventScroll: true, focusVisible: true });
  return true;
}

/**
 * Retire un thème de la liste montée (tuile + mémoire + compteurs), sans reconstruire la grille.
 * @param {string} id
 * @returns {boolean} false si la liste n’est pas montée
 */
export function removeThemeFromList(id) {
  if (!mountedRemoveThemeFromList || !id) return false;
  return mountedRemoveThemeFromList(id);
}

/**
 * @param {import("../themes-data.js").LegoTheme} a
 * @param {import("../themes-data.js").LegoTheme} b
 * @param {ThemesSortKey} key
 * @param {Map<string, number>} usage
 */
function compareThemesAsc(a, b, key, usage) {
  if (key === "cardCount") {
    return (usage.get(a.id) || 0) - (usage.get(b.id) || 0);
  }
  return String(a.name || "").localeCompare(String(b.name || ""), getLocale(), {
    sensitivity: "base",
  });
}

/** Conserve la requête en swap liste ↔ éditeur. */
let rememberedQuery = "";

/**
 * Modale de gestion des thèmes LEGO (`#themes`).
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{
 *   onClose: () => void,
 *   onCreate: () => void,
 *   onEdit: (id: string) => void,
 *   onView: (id: string) => void,
 *   onClearedCustomThemes?: () => void,
 * }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderThemesModal(host, opts) {
  const { onClose, onCreate, onEdit, onView, onClearedCustomThemes } = opts;
  const [allThemes, cards] = await Promise.all([loadThemes(), loadCards()]);
  let { custom, builtin } = partitionThemes(allThemes);

  /** @type {Map<string, number>} */
  const usage = new Map();
  for (const card of cards) {
    const id = card.brickcardThemeId;
    if (!id) continue;
    usage.set(id, (usage.get(id) || 0) + 1);
  }

  /** @type {ThemesSortKey} */
  let sortKey = loadSortKey();
  /** @type {ThemesSortDir} */
  let sortDir = loadSortDir(sortKey);

  function canSortByDate() {
    return custom.length >= 2;
  }

  function canDeleteAllCustom() {
    return custom.length > 2;
  }

  function syncDeleteAllCustomBtn() {
    const show = canDeleteAllCustom();
    if (!(deleteAllWrap instanceof HTMLElement)) return;
    deleteAllWrap.hidden = !show;
    deleteAllWrap.classList.toggle("is-hidden", !show);
  }

  if (sortKey === "updatedAt" && !canSortByDate()) {
    sortKey = "cardCount";
    sortDir = defaultSortDir("cardCount");
  }

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="themes-modal-backdrop" role="presentation">
      <div class="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="themes-modal-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="themes-modal-title">${modalTitleMarkup(_t("Themes"), ICON_PALETTE)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-themes-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="themes-toolbar">
          <div class="search-bar" id="themes-search-bar">
            <span class="form-control-icon" aria-hidden="true">${ICON_SEARCH_LINE}</span>
            <input
              class="form-control"
              type="search"
              id="themes-search"
              placeholder="${_t("Search for a theme…")}"
              autocomplete="off"
              aria-label="${_t("Search for a theme")}"
              aria-describedby="themes-search-count"
            />
            <div class="search-bar-trail" id="themes-search-trail">
              <span class="search-count" id="themes-search-count" aria-live="polite"></span>
              <div class="search-sort">
                <button
                  type="button"
                  class="btn ghost sm icon-only search-sort-btn"
                  id="themes-sort-btn"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="themes-sort-menu"
                >
                  ${ICON_FILTER_3}
                  <span class="visually-hidden">${_t("Sort themes")}</span>
                </button>
              </div>
            </div>
            <div class="search-sort-menu form-select-list" id="themes-sort-menu" role="listbox" hidden>
              <div class="form-select-option" role="option" id="themes-sort-opt-cardCount" data-sort="cardCount" aria-selected="false">
                <span class="form-select-option-label">${_t("Number of cards")}</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="themes-sort-opt-name" data-sort="name" aria-selected="false">
                <span class="form-select-option-label">${_t("Title")}</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="themes-sort-opt-updatedAt" data-sort="updatedAt" aria-selected="false">
                <span class="form-select-option-label">${_t("Date modified")}</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-body" tabindex="-1">
          <section class="themes-section" id="themes-section-custom" hidden>
            <h2 class="section-title">${_t("Custom themes")}</h2>
            <div class="themes-grid" id="themes-grid-custom"></div>
          </section>
          <section class="themes-section" id="themes-section-builtin" hidden>
            <h2 class="section-title">${_t("Default themes")}</h2>
            <div class="themes-grid" id="themes-grid-builtin"></div>
          </section>
          ${emptyViewMarkup({
            id: "themes-empty-filter",
            hidden: true,
            titleTag: "p",
            title: _t("Oops!"),
            text: _t("No themes match the search."),
          })}
        </div>
        <div class="modal-footer">
          <div class="modal-footer-start is-hidden" id="themes-footer-danger" hidden>
            <button type="button" class="btn danger" id="btn-delete-all-custom-themes">
              ${ICON_DELETE_BIN_2}
              <span>${_t("Delete all custom themes")}</span>
            </button>
          </div>
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-add-theme">
              ${ICON_ADD}
              <span>${_t("New theme")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  setAppDocumentTitle(_t("Themes"));

  const q = (sel) => host.querySelector(sel);
  const backdrop = q("#themes-modal-backdrop");
  const btnClose = q("#btn-themes-close");
  const searchBar = q("#themes-search-bar");
  const searchInput = q("#themes-search");
  const searchCount = q("#themes-search-count");
  const sortBtn = q("#themes-sort-btn");
  const sortMenu = q("#themes-sort-menu");
  const customSection = q("#themes-section-custom");
  const builtinSection = q("#themes-section-builtin");
  const customGrid = q("#themes-grid-custom");
  const builtinGrid = q("#themes-grid-builtin");
  const emptyFilter = q("#themes-empty-filter");
  const deleteAllWrap = q("#themes-footer-danger");
  const deleteAllBtn = q("#btn-delete-all-custom-themes");
  const btnAddTheme = q("#btn-add-theme");

  searchInput.value = rememberedQuery;

  function searchQuery() {
    return (searchInput?.value || "").trim();
  }

  /** @param {import("../themes-data.js").LegoTheme} theme */
  function matchesSearch(theme) {
    const needle = searchQuery();
    if (!needle) return true;
    return includesCI(theme.name, needle);
  }

  /**
   * @param {import("../themes-data.js").LegoTheme[]} list
   * @param {ThemesSortKey} key
   * @param {ThemesSortDir} [dirKey]
   * @returns {import("../themes-data.js").LegoTheme[]}
   */
  function sorted(list, key, dirKey = sortDir) {
    const dir = dirKey === "asc" ? 1 : -1;
    return list.slice().sort((a, b) => {
      if (key === "updatedAt") {
        const ad = a.updatedAt || "";
        const bd = b.updatedAt || "";
        if (ad && bd) {
          const cmp = ad.localeCompare(bd) * dir;
          if (cmp !== 0) return cmp;
        } else if (ad && !bd) return -1;
        else if (!ad && bd) return 1;
      } else {
        const cmp = compareThemesAsc(a, b, key, usage) * dir;
        if (cmp !== 0) return cmp;
      }
      return String(a.name || "").localeCompare(String(b.name || ""), getLocale(), {
        sensitivity: "base",
      });
    });
  }

  function updateSearchCount(shown) {
    const total = custom.length + builtin.length;
    const query = searchQuery();
    if (!total) {
      searchCount.textContent = _t("0 themes");
      return;
    }
    searchCount.textContent = query
      ? _t("%(shown)s / %(total)s themes", { shown, total })
      : _t("%(total)s themes", { total });
  }

  /** @returns {HTMLElement[]} */
  function sortOptionEls() {
    if (!sortMenu) return [];
    return /** @type {HTMLElement[]} */ (
      [...sortMenu.querySelectorAll("[data-sort]")].filter(
        (el) => el instanceof HTMLElement && !el.hidden
      )
    );
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
    const dateOpt = q("#themes-sort-opt-updatedAt");
    if (dateOpt instanceof HTMLElement) {
      dateOpt.hidden = !canSortByDate();
    }
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
        iconSlot.title = sortDir === "asc" ? _t("Ascending") : _t("Descending");
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
    if (key === "updatedAt" && !canSortByDate()) return;
    if (!SORT_KEYS.includes(/** @type {ThemesSortKey} */ (key))) return;
    const next = /** @type {ThemesSortKey} */ (key);
    if (next !== sortKey) {
      sortKey = next;
      sortDir = defaultSortDir(next);
      saveSortKey(sortKey);
      saveSortDir(sortDir);
    } else {
      sortDir = sortDir === "asc" ? "desc" : "asc";
      saveSortDir(sortDir);
    }
    paint();
    const idx = sortOptionEls().findIndex(
      (el) => el.getAttribute("data-sort") === sortKey
    );
    if (idx >= 0) setSortActive(idx);
  }

  function applyTileLogoCrops() {
    host.querySelectorAll(".theme-tile-logo-wrap--crop").forEach((wrap) => {
      if (!(wrap instanceof HTMLElement)) return;
      const img = wrap.querySelector("img.theme-tile-logo:not(.is-brand)");
      if (!(img instanceof HTMLImageElement)) return;
      applyThemeLogoTransform(img, wrap, {
        logoZoom: Number(wrap.dataset.logoZoom) || 1,
        logoOffsetX: Number(wrap.dataset.logoOffsetX) || 0,
        logoOffsetY: Number(wrap.dataset.logoOffsetY) || 0,
      });
    });
  }

  function bindThemeTileLogos(root) {
    if (!root) return;
    root.querySelectorAll("img.theme-tile-logo").forEach((img) => {
      img.onerror = () => fallbackThemeTileToBrandLogo(img);
      if (img.classList.contains("is-brand")) return;
      const wrap = img.closest(".theme-tile-logo-wrap--crop");
      const apply = () => {
        if (!(wrap instanceof HTMLElement)) return;
        applyThemeLogoTransform(img, wrap, {
          logoZoom: Number(wrap.dataset.logoZoom) || 1,
          logoOffsetX: Number(wrap.dataset.logoOffsetX) || 0,
          logoOffsetY: Number(wrap.dataset.logoOffsetY) || 0,
        });
      };
      apply();
    });
  }

  function paint() {
    const dateSort = sortKey === "updatedAt" && canSortByDate();
    const customShown = sorted(custom.filter(matchesSearch), dateSort ? "updatedAt" : sortKey);
    const builtinShown = sorted(
      builtin.filter(matchesSearch),
      dateSort ? "name" : sortKey,
      dateSort ? "asc" : sortDir
    );
    const shown = customShown.length + builtinShown.length;

    customGrid.innerHTML = customShown
      .map((t) => themeTileMarkup(t, usage.get(t.id) || 0, "edit"))
      .join("");
    builtinGrid.innerHTML = builtinShown
      .map((t) => themeTileMarkup(t, usage.get(t.id) || 0, "view"))
      .join("");

    customSection.hidden = customShown.length === 0;
    builtinSection.hidden = builtinShown.length === 0;
    emptyFilter.hidden = shown > 0;
    updateSearchCount(shown);
    syncSortMenu();
    syncDeleteAllCustomBtn();
    bindThemeTileLogos(host);
  }

  /** @param {string} id */
  function queryCustomTile(id) {
    return customGrid.querySelector(`[data-edit="${CSS.escape(id)}"]`);
  }

  /** @param {string} id */
  function queryThemeTile(id) {
    return (
      queryCustomTile(id) ||
      builtinGrid.querySelector(`[data-view="${CSS.escape(id)}"]`)
    );
  }

  function visibleTileCount() {
    return (
      customGrid.querySelectorAll(".theme-tile").length +
      builtinGrid.querySelectorAll(".theme-tile").length
    );
  }

  function syncThemesChrome() {
    const shown = visibleTileCount();
    customSection.hidden = customGrid.querySelectorAll(".theme-tile").length === 0;
    builtinSection.hidden = builtinGrid.querySelectorAll(".theme-tile").length === 0;
    emptyFilter.hidden = shown > 0;
    updateSearchCount(shown);
    if (sortKey === "updatedAt" && !canSortByDate()) {
      sortKey = "cardCount";
      sortDir = defaultSortDir("cardCount");
    }
    syncSortMenu();
    syncDeleteAllCustomBtn();
  }

  function scrollThemesListTop() {
    const body = backdrop?.querySelector(".modal-body");
    if (backdrop instanceof HTMLElement) backdrop.scrollTop = 0;
    if (body instanceof HTMLElement) body.scrollTop = 0;
  }

  function onSearchInput() {
    rememberedQuery = searchInput.value;
    paint();
  }

  function onSearchBarFocusIn(e) {
    if (!searchInput || !searchBar) return;
    if (e.target !== searchBar) return;
    const from = e.relatedTarget;
    if (from === searchInput) {
      btnClose?.focus();
      return;
    }
    searchInput.focus();
  }

  function onSearchBarMouseDown(e) {
    if (!searchInput || !searchBar) return;
    const t = /** @type {Node} */ (e.target);
    if (t === searchInput || searchInput.contains(t)) return;
    if (sortBtn?.contains(t) || sortMenu?.contains(t)) return;
    e.preventDefault();
    searchInput.focus();
  }

  const close = () => onClose();

  /** @param {MouseEvent} e */
  const onBackdropClick = (e) => {
    if (e.target === backdrop) close();
  };

  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (e.key === "Escape" && isSortMenuOpen()) {
      e.preventDefault();
      setSortMenuOpen(false, { focusBtn: true });
      return;
    }
    if (e.key !== "Escape") return;
    if (document.getElementById("theme-editor-backdrop")) return;
    e.preventDefault();
    close();
  };

  /** @param {MouseEvent} e */
  function onDocClick(e) {
    if (!isSortMenuOpen()) return;
    const t = /** @type {Node} */ (e.target);
    if (sortMenu?.contains(t) || sortBtn?.contains(t)) return;
    setSortMenuOpen(false);
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
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setSortActive(0, true);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setSortActive(sortOptionEls().length - 1, true);
    }
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

  /** @param {Element} tile */
  function openThemeTile(tile) {
    const editId = tile.getAttribute("data-edit");
    if (editId) {
      onEdit(editId);
      return;
    }
    const viewId = tile.getAttribute("data-view");
    if (viewId) onView?.(viewId);
  }

  /** @param {MouseEvent} e */
  function onGridClick(e) {
    const t = /** @type {HTMLElement} */ (e.target);
    const tile = t.closest("[data-edit], [data-view]");
    if (!tile) return;
    openThemeTile(tile);
  }

  /** @param {KeyboardEvent} e */
  function onGridKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = /** @type {HTMLElement} */ (e.target);
    const tile = t.closest("[data-edit], [data-view]");
    if (!tile) return;
    e.preventDefault();
    openThemeTile(tile);
  }

  paint();

  mountedFocusThemeInList = (id) => applyThemeTileFocus(queryThemeTile(id));

  mountedRefreshThemesAfterCreate = (theme) => {
    const idx = custom.findIndex((t) => t.id === theme.id);
    if (idx >= 0) custom[idx] = theme;
    else custom.push(theme);
    prepareThemesAfterThemeCreate();
    searchInput.value = rememberedQuery;
    sortKey = loadSortKey();
    sortDir = loadSortDir(sortKey);
    if (sortKey === "updatedAt" && !canSortByDate()) {
      sortKey = "cardCount";
      sortDir = defaultSortDir("cardCount");
    }
    paint();
    scrollThemesListTop();
    return true;
  };

  mountedPatchThemeInList = (theme) => {
    const idx = custom.findIndex((t) => t.id === theme.id);
    if (idx >= 0) custom[idx] = theme;
    else custom.push(theme);
    const tile = queryCustomTile(theme.id);
    if (!(tile instanceof HTMLElement)) return true;
    const wrap = document.createElement("div");
    wrap.innerHTML = themeTileMarkup(theme, usage.get(theme.id) || 0, "edit").trim();
    const next = wrap.firstElementChild;
    if (!(next instanceof HTMLElement)) return true;
    tile.replaceWith(next);
    bindThemeTileLogos(next);
    return true;
  };

  mountedRemoveThemeFromList = (id) => {
    const idx = custom.findIndex((t) => t.id === id);
    if (idx >= 0) custom.splice(idx, 1);
    queryCustomTile(id)?.remove();
    syncThemesChrome();
    return true;
  };

  btnAddTheme.onclick = () => onCreate();
  if (deleteAllBtn) {
    deleteAllBtn.onclick = async () => {
      if (!canDeleteAllCustom()) return;
      const ok = await confirmDialog(host, {
        title: _t("Delete all custom themes?"),
        icon: "delete-bin-2",
        message: _t(
          "All custom themes will be permanently deleted. Cards from the deleted themes are kept but will no longer be associated with a theme."
        ),
        okLabel: _t("Delete"),
        danger: true,
      });
      if (!ok) return;
      deleteAllBtn.setAttribute("disabled", "true");
      try {
        await deleteAllCustomThemes();
        custom.length = 0;
        customGrid.innerHTML = "";
        syncThemesChrome();
        onClearedCustomThemes?.();
        btnAddTheme?.focus();
      } catch (ex) {
        toast(ex.message || _t("Unable to delete the custom themes"), "error");
      } finally {
        deleteAllBtn.removeAttribute("disabled");
      }
    };
  }
  customGrid.addEventListener("click", onGridClick);
  customGrid.addEventListener("keydown", onGridKeydown);
  builtinGrid.addEventListener("click", onGridClick);
  builtinGrid.addEventListener("keydown", onGridKeydown);

  searchInput.addEventListener("input", onSearchInput);
  searchBar.tabIndex = 0;
  searchInput.tabIndex = -1;
  searchBar.addEventListener("focusin", onSearchBarFocusIn);
  searchBar.addEventListener("mousedown", onSearchBarMouseDown);

  sortBtn.addEventListener("click", onSortBtnClick);
  sortBtn.addEventListener("keydown", onSortBtnKeydown);
  sortMenu.addEventListener("click", onSortMenuClick);
  sortMenu.addEventListener("pointerenter", onSortMenuPointer, true);
  document.addEventListener("click", onDocClick);

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", applyTileLogoCrops);

  return () => {
    mountedRefreshThemesAfterCreate = null;
    mountedPatchThemeInList = null;
    mountedRemoveThemeFromList = null;
    mountedFocusThemeInList = null;
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("click", onDocClick);
    window.removeEventListener("resize", applyTileLogoCrops);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
  };
}

/**
 * @param {import("../themes-data.js").LegoTheme} theme
 * @param {number} count
 * @param {"edit"|"view"|""} action
 */
function themeTileMarkup(theme, count, action) {
  const accent = resolveCardAccent(theme);
  const fg = resolveCardAccentFg(theme, accent);
  const countLabel =
    count === 1
      ? _t("%(count)s card", { count })
      : _t("%(count)s cards", { count });
  const name = escapeHtml(theme.name);
  const hasThemeLogo = Boolean(theme.logoDataUrl);
  const wrapClass = hasThemeLogo
    ? "theme-tile-logo-wrap theme-tile-logo-wrap--crop"
    : "theme-tile-logo-wrap";
  const cropAttrs = hasThemeLogo
    ? ` data-logo-zoom="${escapeAttr(String(theme.logoZoom || 1))}" data-logo-offset-x="${escapeAttr(String(theme.logoOffsetX || 0))}" data-logo-offset-y="${escapeAttr(String(theme.logoOffsetY || 0))}" style="--logo-zoom:${escapeAttr(String(theme.logoZoom || 1))};--logo-offset-x:${escapeAttr(String(theme.logoOffsetX || 0))};--logo-offset-y:${escapeAttr(String(theme.logoOffsetY || 0))}"`
    : "";
  const logoInner = hasThemeLogo
    ? `<img class="theme-tile-logo" src="${escapeAttr(theme.logoDataUrl)}" alt="" />`
    : brandLogoMarkup("theme-tile-logo is-brand");
  const logo = `<div class="${wrapClass}"${cropAttrs}>${logoInner}</div>`;
  let named = theme.name;
  if (action === "edit") named = _t("Edit “%(name)s”", { name: theme.name });
  else if (action === "view") named = _t("View “%(name)s”", { name: theme.name });
  const label = escapeAttr(count > 0 ? `${named}, ${countLabel}` : named);
  const dataAttr =
    action === "edit"
      ? `data-edit="${escapeAttr(theme.id)}"`
      : action === "view"
        ? `data-view="${escapeAttr(theme.id)}"`
        : "";
  const attrs = dataAttr ? `role="button" tabindex="0" ${dataAttr}` : "";

  return `
    <article class="theme-tile${action ? " is-editable" : ""}" style="--theme-accent:${escapeAttr(accent)};--theme-accent-fg:${escapeAttr(fg)}" ${attrs} aria-label="${label}">
      <div class="theme-tile-face">
        <p class="theme-tile-name">${name}</p>
        ${logo}
      </div>
      ${count > 0 ? `<p class="theme-tile-count">${countLabel}</p>` : ""}
    </article>`;
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
