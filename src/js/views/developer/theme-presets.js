import {
  ICON_ADD,
  ICON_CLOSE_CIRCLE,
  ICON_DOWNLOAD,
  ICON_SEARCH_LINE,
} from "../../icons.js";
import { emptyViewMarkup } from "../../empty-view.js";
import { confirmDialog } from "../../confirm-dialog.js";
import { applyThemeLogoTransform, brandLogoSrc } from "../../card-render.js";
import { contrastText } from "../../themes-data.js";
import { resolveCardAccent } from "../../card-design.js";
import {
  downloadPresetDraftJson,
  downloadPresetDraftLogos,
  draftToLegoTheme,
  loadPresetDraftThemes,
  resetPresetDraft,
} from "../../preset-draft.js";
import { renderPresetDraftEditor } from "./theme-presets-editor.js";

/** @param {string} hay @param {string} needle */
function includesCI(hay, needle) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

let rememberedQuery = "";

function dialogHost() {
  return (
    document.getElementById("developer-demo-root") ||
    document.getElementById("modal-root")
  );
}

/**
 * Outil développeur : brouillon de `themes-presets.json`.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperThemePresets(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <h1 class="view-title">Thèmes par défaut</h1>
      </header>
      <div class="themes-toolbar">
        <div class="search-bar" id="preset-draft-search-bar">
          <span class="form-control-icon" aria-hidden="true">${ICON_SEARCH_LINE}</span>
          <input
            class="form-control"
            type="search"
            id="preset-draft-search"
            placeholder="Rechercher un thème…"
            autocomplete="off"
            aria-label="Rechercher un thème"
            aria-describedby="preset-draft-search-count"
          />
          <div class="search-bar-trail" id="preset-draft-search-trail">
            <span class="search-count" id="preset-draft-search-count" aria-live="polite"></span>
          </div>
        </div>
      </div>
      <p class="view-desc">Copie locale de <code>themes-presets.json</code> — n’affecte pas la collection. Téléchargez le JSON et les logos pour les placer dans <code>data/</code>.</p>
      <p class="form-hint" id="preset-draft-status" hidden></p>
      <p class="form-error" id="preset-draft-error" role="alert" hidden></p>
      <div class="themes-grid" id="preset-draft-grid" hidden></div>
      ${emptyViewMarkup({
        id: "preset-draft-empty-filter",
        hidden: true,
        titleTag: "p",
        title: "Oups !",
        text: "Aucun thème ne correspond à la recherche.",
      })}
      ${emptyViewMarkup({
        id: "preset-draft-loading",
        titleTag: "p",
        title: "Chargement...",
      })}
      <div class="modal-footer">
        <div class="modal-footer-start">
          <button type="button" class="btn danger" id="preset-draft-reset">
            ${ICON_CLOSE_CIRCLE}
            <span>Réinitialiser</span>
          </button>
        </div>
        <div class="modal-footer-end">
          <button type="button" class="btn secondary" id="preset-draft-json">
            ${ICON_DOWNLOAD}
            <span>Télécharger themes-presets.json</span>
          </button>
          <button type="button" class="btn secondary" id="preset-draft-logos">
            ${ICON_DOWNLOAD}
            <span>Télécharger les logos</span>
          </button>
          <button type="button" class="btn primary" id="preset-draft-new">
            ${ICON_ADD}
            <span>Nouveau thème</span>
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
  const statusEl = q("#preset-draft-status");
  const errorEl = q("#preset-draft-error");
  const btnNew = q("#preset-draft-new");
  const btnJson = q("#preset-draft-json");
  const btnLogos = q("#preset-draft-logos");
  const btnReset = q("#preset-draft-reset");

  searchInput.value = rememberedQuery;

  /** @type {import("../../preset-draft.js").PresetDraftTheme[]} */
  let themes = [];
  let cancelled = false;
  /** @type {() => void} */
  let editorCleanup = () => {};
  let busy = false;

  function setStatus(message, isError = false) {
    const text = String(message || "");
    if (statusEl) {
      statusEl.textContent = isError ? "" : text;
      statusEl.hidden = isError || !text;
    }
    if (errorEl) {
      errorEl.textContent = isError ? text : "";
      errorEl.hidden = !isError || !text;
    }
  }

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

  /**
   * @param {import("../../preset-draft.js").PresetDraftTheme[]} list
   * @returns {import("../../preset-draft.js").PresetDraftTheme[]}
   */
  function sorted(list) {
    return list.slice().sort((a, b) => {
      const cmp = String(a.name || "").localeCompare(String(b.name || ""), "fr", {
        sensitivity: "base",
      });
      if (cmp !== 0) return cmp;
      return String(a.id || "").localeCompare(String(b.id || ""), "en");
    });
  }

  function updateSearchCount(shown) {
    const total = themes.length;
    const query = searchQuery();
    if (!searchCount) return;
    if (!total) {
      searchCount.textContent = "0 thèmes";
      return;
    }
    searchCount.textContent = query
      ? `${shown} / ${total} thèmes`
      : `${total} thèmes`;
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
    const shownThemes = sorted(themes.filter(matchesSearch));
    const shown = shownThemes.length;
    if (grid) {
      grid.innerHTML = shownThemes.map((t) => themeTileMarkup(draftToLegoTheme(t))).join("");
      grid.hidden = shown === 0;
    }
    if (emptyFilter) {
      const titleEl = emptyFilter.querySelector(".view-title");
      const textEl = emptyFilter.querySelector(".empty-view-body > p:not(.view-title)");
      if (!themes.length) {
        if (titleEl) titleEl.textContent = "Aucun thème";
        if (textEl) {
          textEl.textContent =
            "Le brouillon est vide. Créez un thème ou réinitialisez depuis themes-presets.json.";
        }
        emptyFilter.hidden = false;
      } else if (!shown) {
        if (titleEl) titleEl.textContent = "Oups !";
        if (textEl) textEl.textContent = "Aucun thème ne correspond à la recherche.";
        emptyFilter.hidden = false;
      } else {
        emptyFilter.hidden = true;
      }
    }
    if (searchTrail) searchTrail.hidden = themes.length < 2;
    updateSearchCount(shown);

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
      setStatus(err.message || "Impossible de charger le brouillon.", true);
    }
  }

  function closeEditor() {
    editorCleanup();
    editorCleanup = () => {};
    const root = document.getElementById("developer-demo-root");
    if (root) root.innerHTML = "";
  }

  /**
   * @param {string|null} [themeId]
   */
  async function openEditor(themeId) {
    const root = document.getElementById("developer-demo-root");
    if (!root) return;
    closeEditor();
    const cleanup = await renderPresetDraftEditor(root, {
      themeId: themeId || null,
      onClose: closeEditor,
      onSaved: () => {
        closeEditor();
        reload();
      },
      onDeleted: () => {
        closeEditor();
        reload();
      },
    });
    editorCleanup = cleanup || (() => {});
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
    if (id) openEditor(id);
  }

  /** @param {KeyboardEvent} e */
  function onGridKey(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = /** @type {HTMLElement} */ (e.target);
    const tile = t.closest("[data-edit]");
    if (!tile) return;
    e.preventDefault();
    const id = tile.getAttribute("data-edit");
    if (id) openEditor(id);
  }

  btnNew.onclick = () => openEditor(null);

  btnJson.onclick = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const { count } = await downloadPresetDraftJson();
      setStatus(`${count} thème(s) — fichier themes-presets.json téléchargé.`);
    } catch (err) {
      setStatus(err.message || "Téléchargement du JSON impossible.", true);
    } finally {
      setBusy(false);
    }
  };

  btnLogos.onclick = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("Préparation des logos…");
    try {
      const { ok, skipped } = await downloadPresetDraftLogos();
      if (!ok && skipped) {
        setStatus("Aucun logo n’a pu être téléchargé.", true);
      } else if (skipped) {
        setStatus(`${ok} logo(s) téléchargé(s), ${skipped} ignoré(s).`);
      } else {
        setStatus(`${ok} logo(s) téléchargé(s) (theme-logo-{id}.{ext}).`);
      }
    } catch (err) {
      setStatus(err.message || "Téléchargement des logos impossible.", true);
    } finally {
      setBusy(false);
    }
  };

  btnReset.onclick = async () => {
    if (busy) return;
    const wrap = dialogHost();
    if (!wrap) return;
    const ok = await confirmDialog(wrap, {
      title: "Réinitialiser le brouillon des thèmes par défaut ?",
      message:
        "Le brouillon local sera effacé et rechargé depuis themes-presets.json. La collection (cartes, thèmes personnalisés, réglages) n’est pas touchée.",
      okLabel: "Réinitialiser",
      danger: true,
    });
    if (!ok || cancelled) return;
    setBusy(true);
    setStatus("");
    try {
      themes = await resetPresetDraft();
      if (cancelled) return;
      rememberedQuery = "";
      searchInput.value = "";
      paint();
      setStatus("Brouillon rechargé depuis themes-presets.json.");
    } catch (err) {
      setStatus(err.message || "Impossible de réinitialiser le brouillon.", true);
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

  reload();

  return () => {
    cancelled = true;
    closeEditor();
    window.removeEventListener("resize", applyTileLogoCrops);
    host.innerHTML = "";
  };
}

/**
 * @param {import("../../themes-data.js").LegoTheme} theme
 */
function themeTileMarkup(theme) {
  const accent = resolveCardAccent(theme);
  const fg = contrastText(accent);
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
  const label = `Modifier « ${escapeAttr(theme.name)} » (${escapeAttr(theme.id)})`;
  const fgClass = fg === "#ffffff" ? " is-light-fg" : "";

  return `
    <article class="theme-tile is-editable${fgClass}" style="--theme-accent:${escapeAttr(accent)};--theme-accent-fg:${escapeAttr(fg)}" role="button" tabindex="0" data-edit="${escapeAttr(theme.id)}" aria-label="${label}">
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
