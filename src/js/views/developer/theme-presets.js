import {
  ICON_ADD,
  ICON_CLOSE_CIRCLE,
  ICON_DOWNLOAD,
  ICON_SEARCH_LINE,
} from "../../icons.js";
import { emptyViewMarkup } from "../../empty-view.js";
import { confirmDialog } from "../../confirm-dialog.js";
import { toast } from "../../toast.js";
import {
  applyThemeLogoTransform,
  brandLogoMarkup,
  fallbackThemeTileToBrandLogo,
} from "../../card-render.js";
import { resolveCardAccent, resolveCardAccentFg } from "../../card-design.js";
import {
  downloadPresetDraftJson,
  downloadPresetDraftLogos,
  draftToLegoTheme,
  loadPresetDraftThemes,
  resetPresetDraft,
} from "../../preset-draft.js";
import { includesCI } from "../../includes-ci.js";
import { _t, getLocale } from "../../i18n.js";

let rememberedQuery = "";

/** @type {((theme: import("../../preset-draft.js").PresetDraftTheme) => boolean) | null} */
let mountedRefreshPresetAfterCreate = null;
/** @type {((theme: import("../../preset-draft.js").PresetDraftTheme, previousId?: string) => boolean) | null} */
let mountedPatchPresetInList = null;
/** @type {((id: string) => boolean) | null} */
let mountedRemovePresetFromList = null;
/** @type {((id: string) => boolean) | null} */
let mountedFocusPresetInList = null;
/** @type {string | null} */
let pendingFocusPresetId = null;

/**
 * Ajoute un thème au brouillon affiché : recherche vidée, tri date desc, scroll haut.
 * @param {import("../../preset-draft.js").PresetDraftTheme} theme
 * @returns {boolean}
 */
export function refreshPresetDraftAfterCreate(theme) {
  if (!mountedRefreshPresetAfterCreate || !theme?.id) return false;
  return mountedRefreshPresetAfterCreate(theme);
}

/**
 * Met à jour la mini-carte d’un thème du brouillon, sans reconstruire la grille.
 * @param {import("../../preset-draft.js").PresetDraftTheme} theme
 * @param {string} [previousId]
 * @returns {boolean}
 */
export function patchPresetDraftInList(theme, previousId) {
  if (!mountedPatchPresetInList || !theme?.id) return false;
  return mountedPatchPresetInList(theme, previousId);
}

/**
 * Place le focus clavier sur la mini-carte d’un thème du brouillon.
 * Si la tuile n’est pas encore dans la grille, le focus est appliqué au prochain rendu.
 * @param {string} [id]
 */
export function focusPresetDraftInList(id) {
  if (!id) return;
  pendingFocusPresetId = id;
  if (mountedFocusPresetInList?.(id)) {
    pendingFocusPresetId = null;
    return;
  }
  requestAnimationFrame(() => applyPendingPresetFocus());
}

/** Applique un focus de tuile en attente (après `focusTopModal` au retour liste). */
export function applyPendingPresetFocus() {
  if (!pendingFocusPresetId) return;
  if (mountedFocusPresetInList?.(pendingFocusPresetId)) pendingFocusPresetId = null;
}

/**
 * @param {Element | null | undefined} tile
 * @returns {boolean}
 */
function applyPresetTileFocus(tile) {
  if (!(tile instanceof HTMLElement)) return false;
  tile.scrollIntoView({ block: "nearest", inline: "nearest" });
  tile.focus({ preventScroll: true, focusVisible: true });
  return true;
}

/**
 * Retire un thème du brouillon affiché, sans reconstruire la grille.
 * @param {string} id
 * @returns {boolean}
 */
export function removePresetDraftFromList(id) {
  if (!mountedRemovePresetFromList || !id) return false;
  return mountedRemovePresetFromList(id);
}

function dialogHost() {
  return (
    document.getElementById("developer-demo-root") ||
    document.getElementById("modal-root")
  );
}

/**
 * Outil développeur : brouillon de `themes-presets.json`.
 * @param {HTMLElement} host
 * @param {{ onCreate: () => void, onEdit: (id: string) => void }} opts
 * @returns {() => void}
 */
export function renderDeveloperThemePresets(host, opts) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <h1 class="view-title">${_t("Default themes")}</h1>
      </header>
      <div class="themes-toolbar">
        <div class="search-bar" id="preset-draft-search-bar">
          <span class="form-control-icon" aria-hidden="true">${ICON_SEARCH_LINE}</span>
          <input
            class="form-control"
            type="search"
            id="preset-draft-search"
            placeholder="${_t("Search for a theme…")}"
            autocomplete="off"
            aria-label="${_t("Search for a theme")}"
            aria-describedby="preset-draft-search-count"
          />
          <div class="search-bar-trail" id="preset-draft-search-trail">
            <span class="search-count" id="preset-draft-search-count" aria-live="polite"></span>
          </div>
        </div>
      </div>
      <p class="view-desc">Local copy of <code>themes-presets.json</code> — does not affect the collection. Download the JSON and logos and place them in <code>data/</code>.</p>
      <div class="themes-grid" id="preset-draft-grid" hidden></div>
      ${emptyViewMarkup({
        id: "preset-draft-empty-filter",
        hidden: true,
        titleTag: "p",
        title: _t("Oops!"),
        text: _t("No themes match the search."),
      })}
      ${emptyViewMarkup({
        id: "preset-draft-loading",
        titleTag: "p",
        title: _t("Loading"),
      })}
      <div class="modal-footer">
        <div class="modal-footer-start">
          <button type="button" class="btn danger" id="preset-draft-reset">
            ${ICON_CLOSE_CIRCLE}
            <span>${_t("Reset")}</span>
          </button>
        </div>
        <div class="modal-footer-end">
          <button type="button" class="btn secondary" id="preset-draft-json">
            ${ICON_DOWNLOAD}
            <span>Save themes-presets.json</span>
          </button>
          <button type="button" class="btn secondary" id="preset-draft-logos">
            ${ICON_DOWNLOAD}
            <span>Save logos</span>
          </button>
          <button type="button" class="btn primary" id="preset-draft-new">
            ${ICON_ADD}
            <span>${_t("New theme")}</span>
          </button>
        </div>
      </div>
    </section>
  `;

  const q = (sel) => host.querySelector(sel);
  const searchBar = q("#preset-draft-search-bar");
  const searchInput = /** @type {HTMLInputElement} */ (q("#preset-draft-search"));
  const searchCount = q("#preset-draft-search-count");
  const searchTrail = q("#preset-draft-search-trail");
  const grid = q("#preset-draft-grid");
  const emptyFilter = q("#preset-draft-empty-filter");
  const loadingEl = q("#preset-draft-loading");
  const btnNew = q("#preset-draft-new");
  const btnJson = q("#preset-draft-json");
  const btnLogos = q("#preset-draft-logos");
  const btnReset = q("#preset-draft-reset");

  searchInput.value = rememberedQuery;

  /** @type {import("../../preset-draft.js").PresetDraftTheme[]} */
  let themes = [];
  let cancelled = false;
  let busy = false;

  function setBusy(next) {
    busy = next;
    [btnNew, btnJson, btnLogos, btnReset].forEach((btn) => {
      if (btn instanceof HTMLButtonElement) btn.disabled = next;
    });
  }

  function searchQuery() {
    return (searchInput?.value || "").trim();
  }

  /** @param {import("../../preset-draft.js").PresetDraftTheme} theme */
  function matchesSearch(theme) {
    const needle = searchQuery();
    if (!needle) return true;
    return includesCI(theme.name, needle) || includesCI(theme.id, needle);
  }

  function updateSearchCount(shown) {
    const total = themes.length;
    const query = searchQuery();
    if (!searchCount) return;
    if (!total) {
      searchCount.textContent = _t("0 themes");
      return;
    }
    searchCount.textContent = query
      ? _t("%(shown)s / %(total)s themes", { shown, total })
      : _t("%(total)s themes", { total });
  }

  /**
   * @param {import("../../preset-draft.js").PresetDraftTheme[]} list
   * @param {boolean} [byDate]
   * @returns {import("../../preset-draft.js").PresetDraftTheme[]}
   */
  function sorted(list, byDate = false) {
    return list.slice().sort((a, b) => {
      if (byDate) {
        const cmp = String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
        if (cmp !== 0) return cmp;
      }
      const cmp = String(a.name || "").localeCompare(String(b.name || ""), getLocale(), {
        sensitivity: "base",
      });
      if (cmp !== 0) return cmp;
      return String(a.id || "").localeCompare(String(b.id || ""), "en");
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

  /**
   * @param {{ byDate?: boolean }} [opts]
   */
  function paint(opts = {}) {
    const shownThemes = sorted(themes.filter(matchesSearch), opts.byDate);
    const shown = shownThemes.length;
    if (grid) {
      grid.innerHTML = shownThemes.map((t) => themeTileMarkup(draftToLegoTheme(t))).join("");
      grid.hidden = shown === 0;
    }
    syncPresetChrome(shown);
    bindThemeTileLogos(host);
  }

  /** @param {number} [shown] */
  function syncPresetChrome(shown) {
    const visible =
      shown != null ? shown : grid ? grid.querySelectorAll(".theme-tile").length : 0;
    if (grid) grid.hidden = visible === 0;
    if (emptyFilter) {
      const titleEl = emptyFilter.querySelector(".view-title");
      const textEl = emptyFilter.querySelector(".empty-view-body > p:not(.view-title)");
      if (!themes.length) {
        if (titleEl) titleEl.textContent = "No themes";
        if (textEl) {
          textEl.textContent =
            "The draft is empty. Create a theme or reset from themes-presets.json.";
        }
        emptyFilter.hidden = false;
      } else if (!visible) {
        if (titleEl) titleEl.textContent = _t("Oops!");
        if (textEl) textEl.textContent = _t("No themes match the search.");
        emptyFilter.hidden = false;
      } else {
        emptyFilter.hidden = true;
      }
    }
    if (searchTrail) searchTrail.hidden = themes.length < 2;
    updateSearchCount(visible);
  }

  function scrollPresetListTop() {
    const body = document.getElementById("developer-modal-body");
    const backdrop = document.getElementById("developer-modal-backdrop");
    if (body instanceof HTMLElement) body.scrollTop = 0;
    if (backdrop instanceof HTMLElement) backdrop.scrollTop = 0;
  }

  /** @param {string} id */
  function queryPresetTile(id) {
    return grid?.querySelector(`[data-edit="${CSS.escape(id)}"]`) ?? null;
  }

  async function reload() {
    if (cancelled) return;
    try {
      themes = await loadPresetDraftThemes();
      if (cancelled) return;
      if (loadingEl) loadingEl.hidden = true;
      paint();
    } catch (err) {
      if (cancelled) return;
      if (loadingEl) loadingEl.hidden = true;
      if (emptyFilter) emptyFilter.hidden = true;
      toast(err.message || "Unable to load the draft", "error");
    }
  }

  function onSearchInput() {
    rememberedQuery = searchInput.value;
    paint();
  }

  function onSearchBarFocusIn(e) {
    if (!searchInput || !searchBar) return;
    if (e.target !== searchBar) return;
    searchInput.focus();
  }

  function onSearchBarMouseDown(e) {
    if (!searchInput || !searchBar) return;
    const t = /** @type {Node} */ (e.target);
    if (t === searchInput || searchInput.contains(t)) return;
    e.preventDefault();
    searchInput.focus();
  }

  /** @param {MouseEvent} e */
  function onGridClick(e) {
    const t = /** @type {HTMLElement} */ (e.target);
    const tile = t.closest("[data-edit]");
    if (!tile) return;
    const id = tile.getAttribute("data-edit");
    if (id) opts.onEdit(id);
  }

  /** @param {KeyboardEvent} e */
  function onGridKey(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = /** @type {HTMLElement} */ (e.target);
    const tile = t.closest("[data-edit]");
    if (!tile) return;
    e.preventDefault();
    const id = tile.getAttribute("data-edit");
    if (id) opts.onEdit(id);
  }

  btnNew.onclick = () => opts.onCreate();

  btnJson.onclick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { count } = await downloadPresetDraftJson();
      if (cancelled) return;
      toast({
        type: "success",
        message: `${count} theme(s) — themes-presets.json downloaded`,
        messageHtml: `${count} theme(s) — <code>themes-presets.json</code> downloaded`,
      });
    } catch (err) {
      if (!cancelled) toast(err.message || "Unable to download the JSON", "error");
    } finally {
      setBusy(false);
    }
  };

  btnLogos.onclick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { ok, skipped } = await downloadPresetDraftLogos();
      if (cancelled) return;
      if (!ok && skipped) {
        toast("No logos could be downloaded", "error");
      } else if (skipped) {
        toast({
          type: "success",
          message: `${ok} logo(s) downloaded, ${skipped} skipped`,
        });
      } else {
        toast({
          type: "success",
          message: `${ok} logo(s) downloaded (theme-logo-{id}.{ext})`,
          messageHtml: `${ok} logo(s) downloaded (<code>theme-logo-{id}.{ext}</code>)`,
        });
      }
    } catch (err) {
      if (!cancelled) toast(err.message || "Unable to download the logos", "error");
    } finally {
      setBusy(false);
    }
  };

  btnReset.onclick = async () => {
    if (busy) return;
    const wrap = dialogHost();
    if (!wrap) return;
    const ok = await confirmDialog(wrap, {
      title: "Reset the default themes draft?",
      icon: "close-circle",
      message:
        "The local draft will be cleared and reloaded from themes-presets.json. The collection (cards, custom themes, settings) is not touched.",
      okLabel: _t("Reset"),
      danger: true,
    });
    if (!ok || cancelled) return;
    setBusy(true);
    try {
      themes = await resetPresetDraft();
      if (cancelled) return;
      rememberedQuery = "";
      searchInput.value = "";
      paint();
      toast({
        type: "success",
        message: "Draft reloaded from /data/themes-presets.json",
        messageHtml:
          "Draft reloaded from <code>/data/themes-presets.json</code>",
      });
    } catch (err) {
      if (cancelled) return;
      toast(err.message || "Unable to reset the draft", "error");
    } finally {
      setBusy(false);
    }
  };

  searchBar.tabIndex = 0;
  searchInput.tabIndex = -1;
  searchInput.addEventListener("input", onSearchInput);
  searchBar.addEventListener("focusin", onSearchBarFocusIn);
  searchBar.addEventListener("mousedown", onSearchBarMouseDown);
  grid.addEventListener("click", onGridClick);
  grid.addEventListener("keydown", onGridKey);
  window.addEventListener("resize", applyTileLogoCrops);

  function applyTileLogoCrops() {
    bindThemeTileLogos(host);
  }

  mountedFocusPresetInList = (id) => applyPresetTileFocus(queryPresetTile(id));

  reload();

  mountedRefreshPresetAfterCreate = (theme) => {
    if (cancelled) return false;
    rememberedQuery = "";
    searchInput.value = "";
    const idx = themes.findIndex((t) => t.id === theme.id);
    if (idx >= 0) themes[idx] = theme;
    else themes.push(theme);
    paint({ byDate: true });
    scrollPresetListTop();
    return true;
  };

  mountedPatchPresetInList = (theme, previousId) => {
    if (cancelled) return false;
    const oldId = previousId && previousId !== theme.id ? previousId : theme.id;
    const idx = themes.findIndex((t) => t.id === oldId);
    if (idx >= 0) themes[idx] = theme;
    else themes.push(theme);
    const tile = queryPresetTile(oldId);
    if (!(tile instanceof HTMLElement)) return true;
    const wrap = document.createElement("div");
    wrap.innerHTML = themeTileMarkup(draftToLegoTheme(theme)).trim();
    const next = wrap.firstElementChild;
    if (!(next instanceof HTMLElement)) return true;
    tile.replaceWith(next);
    bindThemeTileLogos(next);
    return true;
  };

  mountedRemovePresetFromList = (id) => {
    if (cancelled) return false;
    const idx = themes.findIndex((t) => t.id === id);
    if (idx >= 0) themes.splice(idx, 1);
    queryPresetTile(id)?.remove();
    syncPresetChrome();
    return true;
  };

  return () => {
    cancelled = true;
    mountedRefreshPresetAfterCreate = null;
    mountedPatchPresetInList = null;
    mountedRemovePresetFromList = null;
    mountedFocusPresetInList = null;
    window.removeEventListener("resize", applyTileLogoCrops);
    host.innerHTML = "";
  };
}

/**
 * @param {import("../../themes-data.js").LegoTheme} theme
 */
function themeTileMarkup(theme) {
  const accent = resolveCardAccent(theme);
  const fg = resolveCardAccentFg(theme, accent);
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
  const label = `Edit “${escapeAttr(theme.name)}” (${escapeAttr(theme.id)})`;

  return `
    <article class="theme-tile is-editable" style="--theme-accent:${escapeAttr(accent)};--theme-accent-fg:${escapeAttr(fg)}" role="button" tabindex="0" data-edit="${escapeAttr(theme.id)}" aria-label="${label}">
      <div class="theme-tile-face">
        <p class="theme-tile-name">${name}</p>
        ${logo}
      </div>
      <p class="theme-tile-count">${escapeHtml(theme.id)}</p>
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
