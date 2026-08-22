import {
  ICON_ADD,
  ICON_CLOSE,
  ICON_FILTER_3,
  ICON_PALETTE,
  ICON_SEARCH_LINE,
  ICON_SORT_ASC,
  ICON_SORT_DESC,
  modalTitleMarkup,
} from "../icons.js";
import { loadCards, loadThemes } from "../storage.js";
import { contrastText, partitionThemes } from "../themes-data.js";
import { resolveCardAccent } from "../card-design.js";
import { applyThemeLogoTransform, brandLogoSrc } from "../card-render.js";
import { emptyViewMarkup } from "../empty-view.js";

/** @param {string} hay @param {string} needle */
function includesCI(hay, needle) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

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

/** Après enregistrement d’un thème : recherche vidée, tri par date de modification (récent d’abord). */
export function prepareThemesAfterThemeSave() {
  rememberedQuery = "";
  saveSortKey("updatedAt");
  saveSortDir("desc");
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
  return String(a.name || "").localeCompare(String(b.name || ""), "fr", {
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
 * }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderThemesModal(host, opts) {
  const { onClose, onCreate, onEdit } = opts;
  const [themes, cards] = await Promise.all([loadThemes(), loadCards()]);
  const { custom, builtin } = partitionThemes(themes);

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
            <h1 class="view-title" id="themes-modal-title">${modalTitleMarkup("Thèmes", ICON_PALETTE)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-themes-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="themes-toolbar">
          <div class="search-bar" id="themes-search-bar">
            <span class="form-control-icon" aria-hidden="true">${ICON_SEARCH_LINE}</span>
            <input
              class="form-control"
              type="search"
              id="themes-search"
              placeholder="Rechercher un thème…"
              autocomplete="off"
              aria-label="Rechercher un thème"
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
                  <span class="visually-hidden">Trier les thèmes</span>
                </button>
              </div>
            </div>
            <div class="search-sort-menu form-select-list" id="themes-sort-menu" role="listbox" hidden>
              <div class="form-select-option" role="option" id="themes-sort-opt-cardCount" data-sort="cardCount" aria-selected="false">
                <span class="form-select-option-label">Nombre de cartes</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="themes-sort-opt-name" data-sort="name" aria-selected="false">
                <span class="form-select-option-label">Titre</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="themes-sort-opt-updatedAt" data-sort="updatedAt" aria-selected="false">
                <span class="form-select-option-label">Date de modification</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-body" tabindex="-1">
          <section class="themes-section" id="themes-section-custom" hidden>
            <h2 class="section-title">Thèmes personnalisés</h2>
            <div class="themes-grid" id="themes-grid-custom"></div>
          </section>
          <section class="themes-section" id="themes-section-builtin" hidden>
            <h2 class="section-title">Thèmes par défaut</h2>
            <div class="themes-grid" id="themes-grid-builtin"></div>
          </section>
          ${emptyViewMarkup({
            id: "themes-empty-filter",
            hidden: true,
            titleTag: "p",
            title: "Oups !",
            text: "Aucun thème ne correspond à la recherche.",
          })}
        </div>
        <div class="modal-footer">
          <div class="modal-footer-end">
            <button type="button" class="btn primary" id="btn-add-theme">
              ${ICON_ADD}
              <span>Nouveau thème</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

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
      return String(a.name || "").localeCompare(String(b.name || ""), "fr", {
        sensitivity: "base",
      });
    });
  }

  function updateSearchCount(shown) {
    const total = themes.length;
    const query = searchQuery();
    if (!total) {
      searchCount.textContent = "0 thèmes";
      return;
    }
    searchCount.textContent = query
      ? `${shown} / ${total} thèmes`
      : `${total} thèmes`;
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
      .map((t) => themeTileMarkup(t, usage.get(t.id) || 0, true))
      .join("");
    builtinGrid.innerHTML = builtinShown
      .map((t) => themeTileMarkup(t, usage.get(t.id) || 0, false))
      .join("");

    customSection.hidden = customShown.length === 0;
    builtinSection.hidden = builtinShown.length === 0;
    emptyFilter.hidden = shown > 0;
    updateSearchCount(shown);
    syncSortMenu();

    host.querySelectorAll("img.theme-tile-logo").forEach((img) => {
      img.onerror = () => {
        if (img.classList.contains("is-brand")) {
          img.remove();
          return;
        }
        img.classList.add("is-brand");
        img.closest(".theme-tile-logo-wrap")?.classList.remove("theme-tile-logo-wrap--crop");
        const lightFg = img.closest(".theme-tile")?.classList.contains("is-light-fg");
        img.src = brandLogoSrc(Boolean(lightFg));
      };
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

  /** @param {MouseEvent} e */
  function onGridClick(e) {
    const t = /** @type {HTMLElement} */ (e.target);
    const tile = t.closest("[data-edit]");
    if (!tile) return;
    const id = tile.getAttribute("data-edit");
    if (id) onEdit(id);
  }

  paint();

  q("#btn-add-theme").onclick = () => onCreate();
  customGrid.addEventListener("click", onGridClick);
  customGrid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = /** @type {HTMLElement} */ (e.target);
    const tile = t.closest("[data-edit]");
    if (!tile) return;
    e.preventDefault();
    const id = tile.getAttribute("data-edit");
    if (id) onEdit(id);
  });

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
 * @param {boolean} editable
 */
function themeTileMarkup(theme, count, editable) {
  const accent = resolveCardAccent(theme);
  const fg = contrastText(accent);
  const countLabel =
    count <= 1 ? `${count} carte` : `${count} cartes`;
  const name = escapeHtml(theme.name);
  const hasThemeLogo = Boolean(theme.logoDataUrl);
  const logoSrc = hasThemeLogo
    ? theme.logoDataUrl
    : brandLogoSrc(fg === "#ffffff");
  const logoClass = hasThemeLogo ? "theme-tile-logo" : "theme-tile-logo is-brand";
  const wrapClass = hasThemeLogo
    ? "theme-tile-logo-wrap theme-tile-logo-wrap--crop"
    : "theme-tile-logo-wrap";
  const cropAttrs = hasThemeLogo
    ? ` data-logo-zoom="${escapeAttr(String(theme.logoZoom || 1))}" data-logo-offset-x="${escapeAttr(String(theme.logoOffsetX || 0))}" data-logo-offset-y="${escapeAttr(String(theme.logoOffsetY || 0))}" style="--logo-zoom:${escapeAttr(String(theme.logoZoom || 1))};--logo-offset-x:${escapeAttr(String(theme.logoOffsetX || 0))};--logo-offset-y:${escapeAttr(String(theme.logoOffsetY || 0))}"`
    : "";
  const logo = `<div class="${wrapClass}"${cropAttrs}><img class="${logoClass}" src="${escapeAttr(logoSrc)}" alt="" /></div>`;
  const label = editable
    ? `Modifier « ${escapeAttr(theme.name)} »${count > 0 ? `, ${countLabel}` : ""}`
    : `${escapeAttr(theme.name)}${count > 0 ? `, ${countLabel}` : ""}`;
  const attrs = editable
    ? `role="button" tabindex="0" data-edit="${escapeAttr(theme.id)}"`
    : "";
  const fgClass = fg === "#ffffff" ? " is-light-fg" : "";

  return `
    <article class="theme-tile${editable ? " is-editable" : ""}${fgClass}" style="--theme-accent:${escapeAttr(accent)};--theme-accent-fg:${escapeAttr(fg)}" ${attrs} aria-label="${label}">
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
