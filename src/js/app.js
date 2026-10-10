import { loadCards, loadThemes, getTheme, wipeAllLocalData, deleteAllCards, isResetReloadQuery, isBootRetryQuery } from "./storage.js";
import { initTheme } from "./theme.js";
import { initTelemetry, trackTelemetryPage } from "./telemetry.js";
import { initCardDesign } from "./card-design.js";
import { initListLayout } from "./list-layout.js";
import { enableDeveloper, isDeveloperEnabled } from "./developer-access.js";
import { APP_ID, APP_VERSION } from "./version.js";
import { setAppDocumentTitle } from "./document-title.js";
import { toast } from "./toast.js";
import { renderList, prepareListAfterCardCreate, patchListCard, removeListCard, focusListCard } from "./views/list.js";
import {
  isBareAboutKey,
  isBareDeveloperKey,
  isBareNewCardKey,
  isBareSettingsKey,
  isBareThemesKey,
  isCollectionSaveShortcut,
  isFindShortcut,
  isNewCardShortcut,
  isPrimaryActionShortcut,
  isPrintShortcut,
  isSearchFocusKey,
  isSettingsShortcut,
  applyShortcutAffordances,
} from "./hotkeys.js";
import { loadingViewMarkup, welcomeViewMarkup } from "./empty-view.js";
import { openConfirmDialog } from "./confirm-dialog.js";
import { bindModalFocusTrap, focusTopModal, getTopModal } from "./modal-focus.js";
import {
  initPrintMenu,
  setPrintMenuVisible,
  syncPrintMenu,
} from "./print-menu.js";
import { clearPrintQty } from "./print-qty.js";
import { ICON_CLOSE, modalTitleMarkup } from "./icons.js";
import { _t, applyChromeI18n, initI18n } from "./i18n.js";

const main = document.getElementById("main");
const modalRoot = document.getElementById("modal-root");
const appVersionEl = document.getElementById("app-version");
const btnNew = document.getElementById("btn-new-card");
const btnSettings = document.getElementById("btn-settings");
const topbarSearch = document.getElementById("topbar-search");

/** @type {null | (() => void)} */
let cleanupEditor = null;

/** @type {null | (() => void)} */
let cleanupPage = null;

/** @type {null | (() => void)} */
let cleanupSettings = null;

/** @type {null | (() => void)} */
let cleanupThemes = null;

/** @type {null | (() => void)} */
let cleanupThemeEditor = null;

/** @type {null | (() => void)} */
let cleanupDeveloper = null;

/** @type {null | (() => void)} */
let cleanupPrint = null;

/** @type {null | (() => void)} */
let cleanupBackup = null;

/** @type {null | (() => void)} */
let cleanupImport = null;

/** @type {null | (() => void)} */
let cleanupList = null;

/** Last route actually shown. */
let shownRoute = /** @type {ReturnType<typeof parseRoute>|null} */ (null);

let underlayReady = false;
let underlayStale = false;

let routeToken = 0;

/** Ignore the hashchange that follows a popstate (Back / Forward). */
let ignoreHashchange = false;

/**
 * @param {string} hash
 * @returns {string}
 */
function normalizeHash(hash) {
  let h = String(hash || "");
  if (!h || h === "#" || h === "#/") return "#";
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.startsWith("#/")) h = `#${h.slice(2)}`;
  if (h.length > 1 && h.endsWith("/")) h = h.slice(0, -1);
  const q = h.indexOf("?");
  if (q !== -1) h = h.slice(0, q);
  return h;
}

/** Home: URL with no fragment (`#` token). Overlays: `#settings`; `#/settings` cleaned. */
function hashUrl(hash) {
  const h = normalizeHash(hash);
  if (h === "#") return `${location.pathname}${location.search}`;
  return `${location.pathname}${location.search}${h}`;
}

function routeDepth() {
  return history.state?.app === APP_ID ? Number(history.state.depth) || 0 : 0;
}

/**
 * @param {number} depth
 * @param {string} hash
 * @param {boolean} replace
 */
function setHistoryState(depth, hash, replace) {
  const state = { app: APP_ID, depth };
  const url = hashUrl(hash);
  if (replace) history.replaceState(state, "", url);
  else history.pushState(state, "", url);
}

function parsePath(path) {
  if (!path) return { name: "home" };
  if (path === "new-card") return { name: "editor", cardId: null };
  if (path.startsWith("edit-card/")) {
    const cardId = path.slice("edit-card/".length);
    if (!cardId) return { name: "unknown" };
    return { name: "editor", cardId };
  }
  if (path === "themes") return { name: "themes", page: "list" };
  if (path === "themes/new") return { name: "themes", page: "new" };
  if (path.startsWith("themes/edit/") || path.startsWith("themes/view/")) {
    const page = path.startsWith("themes/edit/") ? "edit" : "view";
    const raw = path.slice(page === "edit" ? "themes/edit/".length : "themes/view/".length);
    if (!raw) return { name: "unknown" };
    let themeId = raw;
    try {
      themeId = decodeURIComponent(raw);
    } catch {
      /* id as-is */
    }
    if (!themeId) return { name: "unknown" };
    return { name: "themes", page, themeId };
  }
  if (path === "settings") return { name: "settings" };
  if (path === "print") return { name: "print" };
  if (path === "backup") return { name: "backup" };
  if (path === "import") return { name: "import" };
  if (path.startsWith("page/")) {
    const slug = path.slice("page/".length);
    if (!slug || slug.includes("/")) return { name: "unknown" };
    return { name: "page", slug };
  }
  if (path === "developer") return { name: "developer", page: "index" };
  if (path.startsWith("developer/")) {
    return parseDeveloperPage(path.slice("developer/".length));
  }
  return { name: "unknown" };
}

/**
 * @param {string} rest path after `developer/`
 * @returns {{ name: string, page?: string, presetPage?: string, themeId?: string }}
 */
function parseDeveloperPage(rest) {
  const page = rest || "index";
  if (page === "theme-presets") {
    return { name: "developer", page: "theme-presets" };
  }
  if (page === "theme-presets/new") {
    return { name: "developer", page: "theme-presets", presetPage: "new" };
  }
  if (page.startsWith("theme-presets/edit/")) {
    const raw = page.slice("theme-presets/edit/".length);
    if (!raw || raw.includes("/")) return { name: "unknown" };
    let themeId = raw;
    try {
      themeId = decodeURIComponent(raw);
    } catch {
      /* slug as-is */
    }
    if (!themeId) return { name: "unknown" };
    return { name: "developer", page: "theme-presets", presetPage: "edit", themeId };
  }
  if (page.startsWith("theme-presets/")) {
    return { name: "unknown" };
  }
  return { name: "developer", page };
}

function parseRoute() {
  const h = normalizeHash(location.hash);
  return parsePath(h === "#" ? "" : h.slice(1));
}

/**
 * @param {string} hash
 * @param {{ replace?: boolean }} [opts]
 */
function navigate(hash, opts = {}) {
  const target = normalizeHash(hash);
  const current = normalizeHash(location.hash);
  const replace = Boolean(opts.replace);

  if (replace) {
    setHistoryState(target === "#" ? 0 : routeDepth(), target, true);
    route();
    return;
  }
  if (target === current) {
    route();
    return;
  }
  setHistoryState(routeDepth() + 1, target, false);
  route();
}

/** Close / Escape / backdrop: close the overlay to home (replace). Browser Back keeps history. */
function dismissOverlay() {
  if (normalizeHash(location.hash) === "#") return;
  navigate("#", { replace: true });
}

function setNewButtonVisible(visible) {
  btnNew.classList.toggle("is-hidden", !visible);
}

/** Search bar: visible on the home list (and under a modal). */
function setSearchVisible(visible) {
  if (topbarSearch) topbarSearch.hidden = !visible;
}

/** @param {number} numCards */
function syncHeaderPrint(numCards) {
  setPrintMenuVisible(numCards > 0);
  syncPrintMenu({ numCards });
}

function isOverlayRoute(info) {
  return Boolean(
    info &&
      (info.name === "editor" ||
        info.name === "themes" ||
        info.name === "settings" ||
        info.name === "print" ||
        info.name === "backup" ||
        info.name === "import" ||
        info.name === "page" ||
        info.name === "developer")
  );
}

function overlayOnClose(name) {
  return () => {
    if (parseRoute().name === name) dismissOverlay();
  };
}

/** Draft editor: Ctrl/Cmd+S saves the draft instead of opening `#backup`. */
function isDraftEditorRoute(info) {
  if (info.name === "editor") return true;
  if (info.name === "themes" && (info.page === "new" || info.page === "edit")) return true;
  if (info.name === "developer" && info.presetPage) return true;
  return false;
}

/** Second backdrop (confirm, image URL…) above the overlay. */
function hasChildDialog() {
  if (!modalRoot) return false;
  const n = modalRoot.querySelectorAll(":scope > .modal-backdrop").length;
  if (n > 1) return true;
  return n === 1 && !isOverlayRoute(parseRoute());
}

/**
 * Remove overlay listeners. The DOM is cleared only if `clearDom`.
 * `modal-open` is removed only if `dropModalOpen` (going to home).
 * @param {{ clearDom?: boolean, dropModalOpen?: boolean }} [opts]
 */
function teardownOverlays(opts = {}) {
  const fns = [cleanupEditor, cleanupPage, cleanupSettings, cleanupThemeEditor, cleanupThemes, cleanupDeveloper, cleanupPrint, cleanupBackup, cleanupImport];
  cleanupEditor = null;
  cleanupPage = null;
  cleanupSettings = null;
  cleanupThemeEditor = null;
  cleanupThemes = null;
  cleanupDeveloper = null;
  cleanupPrint = null;
  cleanupBackup = null;
  cleanupImport = null;
  for (const fn of fns) {
    if (fn) fn();
  }
  if (opts.clearDom && modalRoot) modalRoot.innerHTML = "";
  if (opts.dropModalOpen) document.body.classList.remove("modal-open");
}

/**
 * Load an overlay module. Failure → toast + home (boot stays usable).
 * A stale route (`token` no longer current) does not toast or navigate.
 * @template T
 * @param {() => Promise<T>} loader
 * @param {number} token `route()` generation
 * @returns {Promise<T|null>}
 */
async function loadOverlay(loader, token) {
  try {
    return await loader();
  } catch (err) {
    console.error(err);
    if (!routeIsCurrent(token)) return null;
    const msg = err && err.message ? err.message : String(err || _t("Loading error"));
    toast(msg, "error");
    dismissOverlay();
    return null;
  }
}

/** @param {number} token */
function routeIsCurrent(token) {
  return token === routeToken;
}

/** @type {Promise<typeof import("./views/settings.js")> | null} */
let settingsModulePromise = null;

/** @type {Promise<typeof import("./views/page.js")> | null} */
let pageModulePromise = null;

/** @type {Promise<{ slug: string, title: string, html: string }> | null} */
let aboutPagePromise = null;

let headerOverlaysWarmed = false;

/** Shared with the idle prefetch so a tap awaits an import already in flight. */
function loadSettingsModule() {
  if (!settingsModulePromise) {
    settingsModulePromise = import("./views/settings.js").catch((err) => {
      settingsModulePromise = null;
      throw err;
    });
  }
  return settingsModulePromise;
}

/** Shared with the idle prefetch so a tap awaits an import already in flight. */
function loadPageModule() {
  if (!pageModulePromise) {
    pageModulePromise = import("./views/page.js").catch((err) => {
      pageModulePromise = null;
      throw err;
    });
  }
  return pageModulePromise;
}

/** About Markdown, started with the page module so the dialog is not fetched twice. */
function loadAboutPage() {
  if (!aboutPagePromise) {
    aboutPagePromise = import("./markdown.js")
      .then((mod) => mod.loadMarkdownPage("about"))
      .catch((err) => {
        aboutPagePromise = null;
        throw err;
      });
  }
  return aboutPagePromise;
}

/**
 * After the first screen is up, load Settings and About while the browser is idle.
 * One shot for every device (no hover): a later tap reuses the same promises.
 */
function warmHeaderOverlays() {
  if (headerOverlaysWarmed) return;
  headerOverlaysWarmed = true;
  const run = () => {
    void loadSettingsModule().catch(() => {});
    void loadPageModule().catch(() => {});
    void loadAboutPage().catch(() => {});
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 200);
  }
}

/**
 * Close handler for the loading shell. Theme create / edit returns to the list,
 * matching the editor; every other overlay closes home.
 * @param {{ name: string, page?: string }} routeInfo
 */
function shellOnClose(routeInfo) {
  if (routeInfo.name === "themes" && routeInfo.page && routeInfo.page !== "list") {
    return () => {
      if (parseRoute().name === "themes") navigate("#themes", { replace: true });
    };
  }
  return overlayOnClose(routeInfo.name);
}

/**
 * Header of a route overlay, known before its module loads.
 * `null` while the developer-space confirmation is still the thing to show.
 * @param {{ name: string, page?: string, slug?: string, cardId?: string|null }} routeInfo
 * @returns {{
 *   title: string,
 *   icon: string|false,
 *   size: "md"|"lg",
 *   backdropId: string,
 *   titleId: string,
 *   onClose: () => void,
 * } | null}
 */
function overlayShellSpec(routeInfo) {
  /** @type {{ title: string, icon: string|false, size: "md"|"lg", backdropId: string, titleId: string }} */
  let spec;
  switch (routeInfo.name) {
    case "settings":
      spec = {
        title: _t("Settings"),
        icon: "tools",
        size: "md",
        backdropId: "settings-modal-backdrop",
        titleId: "settings-modal-title",
      };
      break;
    case "print":
      spec = {
        title: _t("Print settings"),
        icon: "printer",
        size: "md",
        backdropId: "print-dialog-backdrop",
        titleId: "print-dialog-title",
      };
      break;
    case "backup":
      spec = {
        title: _t("Save"),
        icon: "download",
        size: "md",
        backdropId: "backup-dialog-backdrop",
        titleId: "backup-dialog-title",
      };
      break;
    case "import":
      spec = {
        title: _t("Import a backup"),
        icon: "upload",
        size: "md",
        backdropId: "import-dialog-backdrop",
        titleId: "import-dialog-title",
      };
      break;
    case "themes":
      if (routeInfo.page === "new") {
        spec = {
          title: _t("New theme"),
          icon: "add",
          size: "lg",
          backdropId: "theme-editor-backdrop",
          titleId: "theme-editor-title",
        };
      } else if (routeInfo.page === "edit" || routeInfo.page === "view") {
        spec = {
          title: _t("Edit theme"),
          icon: "pencil",
          size: "lg",
          backdropId: "theme-editor-backdrop",
          titleId: "theme-editor-title",
        };
      } else {
        spec = {
          title: _t("Themes"),
          icon: "palette",
          size: "lg",
          backdropId: "themes-modal-backdrop",
          titleId: "themes-modal-title",
        };
      }
      break;
    case "page":
      spec = {
        title: routeInfo.slug === "about" ? _t("About") : String(routeInfo.slug || ""),
        icon: false,
        size: "md",
        backdropId: "page-modal-backdrop",
        titleId: "page-modal-title",
      };
      break;
    case "developer":
      if (!isDeveloperEnabled()) return null;
      spec = {
        title: "Developer space",
        icon: "tools",
        size: routeInfo.page === "theme-presets" ? "lg" : "md",
        backdropId: "developer-modal-backdrop",
        titleId: "developer-modal-title",
      };
      break;
    case "editor":
      spec = {
        title: routeInfo.cardId ? _t("Edit card") : _t("New card"),
        icon: routeInfo.cardId ? "pencil" : "add",
        size: "lg",
        backdropId: "card-editor-backdrop",
        titleId: "editor-title",
      };
      break;
    default:
      return null;
  }
  return { ...spec, onClose: shellOnClose(routeInfo) };
}

/**
 * Paint the loading shell. Returns a detach for the document listener
 * (the backdrop listener dies with the element when the real modal replaces it).
 * @param {NonNullable<ReturnType<typeof overlayShellSpec>>} spec
 */
function paintOverlayShell(spec) {
  if (!modalRoot) return () => {};
  document.body.classList.add("modal-open");
  modalRoot.innerHTML = `
    <div class="modal-backdrop is-overlay-shell" id="${spec.backdropId}" role="presentation">
      <div class="modal modal--${spec.size}" role="dialog" aria-modal="true" aria-busy="true" aria-labelledby="${spec.titleId}">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="${spec.titleId}">${modalTitleMarkup(spec.title, spec.icon)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-overlay-shell-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          ${loadingViewMarkup({ titleTag: "p" })}
        </div>
      </div>
    </div>
  `;
  setAppDocumentTitle(spec.title);

  const backdrop = modalRoot.querySelector(".is-overlay-shell");
  const btnClose = modalRoot.querySelector("#btn-overlay-shell-close");

  /** @param {MouseEvent} e */
  const onBackdropClick = (e) => {
    if (e.target === backdrop) spec.onClose();
  };

  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (!backdrop?.isConnected) return;
    if (e.key !== "Escape" || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    e.preventDefault();
    spec.onClose();
  };

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", () => spec.onClose());
  document.addEventListener("keydown", onKey);
  focusTopModal();

  return () => {
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
  };
}

/**
 * Show a modal shell while `import()` is in flight.
 * From home, wait one frame so a module already in memory does not flash the brick.
 * Replacing a dialog paints immediately: its listeners are already gone.
 * @param {ReturnType<typeof overlayShellSpec>} spec
 * @param {number} token
 * @returns {{ cancel: () => void }}
 */
function scheduleOverlayShell(spec, token) {
  if (!spec || !modalRoot) return { cancel() {} };
  let detach = () => {};
  const paint = () => {
    if (!routeIsCurrent(token)) return;
    detach();
    detach = paintOverlayShell(spec);
  };
  const alreadyOpen = Boolean(modalRoot.querySelector(".modal-backdrop"));
  let raf = 0;
  if (alreadyOpen) paint();
  else {
    raf = requestAnimationFrame(() => {
      raf = 0;
      paint();
    });
  }
  return {
    cancel() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      detach();
      detach = () => {};
    },
  };
}

async function ensureUnderlay() {
  if (underlayReady && !underlayStale) return;
  let cards;
  try {
    cards = await loadCards();
  } catch (err) {
    console.error(err);
    underlayReady = false;
    main.innerHTML = `<section class="panel"><p class="error">${_t("Storage error: %(message)s", { message: err.message || err })}</p></section>`;
    return;
  }
  await renderHomeUnderlay(cards);
  underlayReady = true;
  underlayStale = false;
}

/**
 * @param {ReturnType<typeof parseRoute>} routeInfo
 * @param {number} token
 */
async function showOverlay(routeInfo, token) {
  if (!modalRoot) {
    if (!routeIsCurrent(token)) return;
    toast(_t("Modal unavailable"), "error");
    dismissOverlay();
    return;
  }
  document.body.classList.add("modal-open");
  const alive = () => routeIsCurrent(token);

  if (routeInfo.name === "settings") {
    const countPromise = loadCards()
      .then((cards) => cards.length)
      .catch(() => 0);
    const settings = await loadOverlay(() => loadSettingsModule(), token);
    if (!settings || !alive()) return;
    const numCards = await countPromise;
    if (!alive()) return;
    cleanupSettings = settings.renderSettingsModal(modalRoot, {
      onClose: overlayOnClose("settings"),
      onClearCards: handleClearCards,
      onDevReset: isDeveloperEnabled() ? handleDevReset : undefined,
      numCards,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "print") {
    const printDlg = await loadOverlay(() => import("./print-dialog.js"), token);
    if (!printDlg || !alive()) return;
    cleanupPrint = printDlg.renderPrintDialog(modalRoot, {
      onClose: overlayOnClose("print"),
      toast,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "backup") {
    const backup = await loadOverlay(() => import("./backup-dialog.js"), token);
    if (!backup || !alive()) return;
    const cleanup = await backup.renderBackupDialog(modalRoot, {
      onClose: overlayOnClose("backup"),
      toast,
      alive,
    });
    if (!alive()) return;
    cleanupBackup = cleanup;
    focusTopModal();
    return;
  }

  if (routeInfo.name === "import") {
    const importDlg = await loadOverlay(() => import("./import-dialog.js"), token);
    if (!importDlg || !alive()) return;
    const cleanup = await importDlg.renderImportDialog(modalRoot, {
      onClose: overlayOnClose("import"),
      onImported: () => {
        underlayStale = true;
      },
      toast,
      alive,
    });
    if (!alive()) return;
    cleanupImport = cleanup;
    focusTopModal();
    return;
  }

  if (routeInfo.name === "themes") {
    const themes = await loadOverlay(() => import("./views/themes.js"), token);
    if (!themes || !alive()) return;
    if (routeInfo.page === "list") {
      if (cleanupThemeEditor) {
        cleanupThemeEditor();
        cleanupThemeEditor = null;
      }
      if (!cleanupThemes) {
        const cleanup = await themes.renderThemesModal(modalRoot, {
          onClose: overlayOnClose("themes"),
          onCreate: () => navigate("#themes/new"),
          onEdit: (id) => navigate(`#themes/edit/${encodeURIComponent(id)}`),
          onClearedCustomThemes: () => {
            toast({
              type: "success",
              message: _t("All custom themes have been deleted"),
              icon: "delete-bin-2",
            });
            underlayStale = true;
          },
          alive,
        });
        if (!alive()) return;
        cleanupThemes = cleanup;
        focusTopModal();
        themes.applyPendingThemeFocus();
      } else {
        setAppDocumentTitle(_t("Themes"));
        focusTopModal({ resetScroll: false });
        themes.applyPendingThemeFocus();
      }
      return;
    }

    if (routeInfo.page === "view" && routeInfo.themeId) {
      if (!alive()) return;
      navigate(`#themes/edit/${encodeURIComponent(routeInfo.themeId)}`, { replace: true });
      return;
    }

    if (routeInfo.page === "edit") {
      const theme = await getTheme(routeInfo.themeId);
      if (!alive()) return;
      if (!theme) {
        navigate("#themes", { replace: true });
        return;
      }
    }

    const themeEditor = await loadOverlay(() => import("./views/theme-editor.js"), token);
    if (!themeEditor || !alive()) return;
    if (cleanupThemeEditor) {
      cleanupThemeEditor();
      cleanupThemeEditor = null;
    }
    const editorThemeId = routeInfo.page === "new" ? null : routeInfo.themeId;
    const clearHost = !cleanupThemes;
    const cleanup = await themeEditor.renderThemeEditor(modalRoot, {
      themeId: editorThemeId,
      clearHost,
      alive,
      onClose: () => {
        const id = editorThemeId;
        if (parseRoute().name === "themes") {
          navigate("#themes", { replace: true });
        }
        if (id) themes.focusThemeInList(id);
      },
      onSaved: (name, meta) => {
        toast({
          type: "success",
          title: meta?.presetOverride ? _t("Customization saved") : _t("Theme saved"),
          message: name,
          icon: "palette",
        });
        underlayStale = true;
        if (meta?.isNew) {
          if (!themes.refreshThemesListAfterCreate(meta.theme)) {
            themes.prepareThemesAfterThemeCreate();
          }
        } else if (!themes.patchThemeInList(meta?.theme)) {
          /* list missing: #themes will rebuild it */
        }
        if (parseRoute().name === "themes") {
          navigate("#themes", { replace: true });
        }
        themes.focusThemeInList(meta?.theme?.id);
      },
      onDeleted: (name, themeId, meta) => {
        const presetOverride = Boolean(meta?.presetOverride);
        toast({
          type: "success",
          title: presetOverride ? _t("Customization removed") : _t("Theme deleted"),
          message: name,
          icon: "delete-bin-2",
        });
        underlayStale = true;
        themes.removeThemeFromList(themeId, meta?.restoredPreset);
        if (parseRoute().name === "themes") {
          navigate("#themes", { replace: true });
        }
      },
    });
    if (!alive()) return;
    if (!cleanup) {
      navigate("#themes", { replace: true });
      return;
    }
    cleanupThemeEditor = cleanup;
    focusTopModal();
    return;
  }

  if (routeInfo.name === "page") {
    const pagePromise = loadPageModule();
    const aboutPromise = routeInfo.slug === "about" ? loadAboutPage() : null;
    const page = await loadOverlay(() => pagePromise, token);
    if (!page || !alive()) return;
    const cleanup = await page.renderPageModal(modalRoot, {
      slug: routeInfo.slug,
      toast,
      onClose: overlayOnClose("page"),
      page: aboutPromise,
      alive,
    });
    if (!alive()) return;
    if (!cleanup) dismissOverlay();
    else {
      cleanupPage = cleanup;
      focusTopModal();
    }
    return;
  }

  if (routeInfo.name === "developer") {
    if (!isDeveloperEnabled()) {
      setAppDocumentTitle();
      const choice = await openConfirmDialog(modalRoot, {
        title: _t("Enable the developer space?"),
        icon: "tools",
        message:
          _t("The developer space gives access to development help, the design system, documentation, and some options such as resetting locally saved data."),
        actions: [
          { id: "cancel", label: _t("Cancel"), variant: "secondary", size: "sm", slot: "end" },
          { id: "ok", label: _t("Enable"), variant: "primary", slot: "end" },
        ],
      });
      if (!alive()) return;
      const ok = choice === "ok";
      if (parseRoute().name !== "developer") return;
      if (!ok) {
        dismissOverlay();
        return;
      }
      enableDeveloper();
      const shell = scheduleOverlayShell(overlayShellSpec(routeInfo), token);
      try {
        await mountDeveloperOverlay(routeInfo, token);
      } finally {
        shell.cancel();
      }
      return;
    }
    await mountDeveloperOverlay(routeInfo, token);
    return;
  }

  if (routeInfo.name === "editor") {
    const editor = await loadOverlay(() => import("./views/editor.js"), token);
    if (!editor || !alive()) return;
    const cleanup = await editor.renderEditor(modalRoot, {
      alive,
      cardId: routeInfo.cardId,
      onSaved: (subject, meta) => {
        toastCardSavedOrDeleted("saved", subject);
        if (meta?.isNew) {
          prepareListAfterCardCreate();
          underlayStale = true;
        } else if (!patchListCard(meta?.card)) {
          underlayStale = true;
        }
        if (parseRoute().name === "editor") navigate("#", { replace: true });
        focusListCard(meta?.card?.id);
      },
      onCancel: () => {
        const id = routeInfo.cardId;
        overlayOnClose("editor")();
        if (id) focusListCard(id);
      },
      onDeleted: (subject, cardId) => {
        toastCardSavedOrDeleted("deleted", subject);
        const result = removeListCard(cardId);
        if (!result || result.empty) {
          underlayStale = true;
        }
        if (parseRoute().name === "editor") navigate("#", { replace: true });
      },
      onThemeChanged: () => {
        underlayStale = true;
      },
    });
    if (!alive()) return;
    cleanupEditor = cleanup;
    focusTopModal();
  }
}

/**
 * Developer space after access is granted. The loading shell is scheduled by the caller
 * when this is the first open (the confirmation dialog stays in front until then).
 * @param {{ page?: string, presetPage?: string, themeId?: string }} routeInfo
 * @param {number} token
 */
async function mountDeveloperOverlay(routeInfo, token) {
  const developer = await loadOverlay(() => import("./views/developer/modal.js"), token);
  if (!developer || !routeIsCurrent(token) || !modalRoot) return;
  const staying = Boolean(modalRoot.querySelector("#developer-modal-backdrop:not(.is-overlay-shell)"));
  try {
    const cleanup = await developer.renderDeveloperModal(modalRoot, {
      page: routeInfo.page,
      presetPage: routeInfo.presetPage,
      themeId: routeInfo.themeId,
      onClose: overlayOnClose("developer"),
      onNavigate: navigate,
    });
    if (!routeIsCurrent(token)) return;
    cleanupDeveloper = cleanup;
  } catch (err) {
    console.error(err);
    if (!routeIsCurrent(token)) return;
    const msg = err && err.message ? err.message : String(err || _t("Loading error"));
    toast(msg, "error");
    dismissOverlay();
    return;
  }
  focusTopModal({ resetScroll: !staying });
}

function disposeList() {
  if (cleanupList) {
    cleanupList();
    cleanupList = null;
  }
}

function renderEmpty() {
  main.innerHTML = welcomeViewMarkup();
  main.querySelector("#empty-import-demo")?.addEventListener("click", async () => {
    if (!modalRoot) {
      toast(_t("Modal unavailable"), "error");
      return;
    }
    try {
      const { openDemoBackupDialog } = await import("./import-dialog.js");
      openDemoBackupDialog(modalRoot, {
        toast,
        onImported: async () => {
          underlayStale = true;
          await ensureUnderlay();
        },
      });
    } catch (err) {
      console.error(err);
      const msg = err && err.message ? err.message : String(err || _t("Loading error"));
      toast(msg, "error");
    }
  });
}

const listOpts = {
  onEdit: (id) => navigate(`#edit-card/${id}`),
  onCreate: () => navigate("#new-card"),
  toast,
};

/** Home under a modal, or the home page alone. */
async function renderHomeUnderlay(cards) {
  disposeList();
  setNewButtonVisible(true);
  if (!cards.length) {
    setSearchVisible(false);
    syncHeaderPrint(0);
    renderEmpty();
    return;
  }
  setSearchVisible(true);
  syncHeaderPrint(cards.length);
  cleanupList = await renderList(main, listOpts);
}

/** First-visit welcome on home (no-op once `brickcard:welcome-seen` is set). */
async function openWelcomeOnHome(token) {
  try {
    const { openWelcomeIfNeeded } = await import("./welcome-dialog.js");
    if (token !== routeToken) return;
    if (parseRoute().name !== "home" || !modalRoot) return;
    openWelcomeIfNeeded(modalRoot);
  } catch (err) {
    console.error(err);
  }
}

async function route() {
  const token = ++routeToken;

  let routeInfo = parseRoute();
  if (routeInfo.name === "unknown") {
    history.replaceState({ app: APP_ID, depth: 0 }, "", hashUrl("#"));
    routeInfo = { name: "home" };
  } else {
    const raw = (location.hash || "").split("?")[0];
    const canonical = normalizeHash(raw);
    const written = canonical === "#" ? "" : canonical;
    if (raw !== written) {
      history.replaceState(
        { app: APP_ID, depth: canonical === "#" ? 0 : routeDepth() },
        "",
        hashUrl(canonical)
      );
    }
  }

  const prev = shownRoute;
  const nextIsOverlay = isOverlayRoute(routeInfo);
  const prevIsOverlay = isOverlayRoute(prev);

  if (!nextIsOverlay) {
    teardownOverlays({ clearDom: true, dropModalOpen: true });
    shownRoute = routeInfo;
    setAppDocumentTitle();
    await ensureUnderlay();
    if (token !== routeToken) return;
    trackTelemetryPage();
    applyShortcutAffordances(document);
    void openWelcomeOnHome(token);
    return;
  }

  if (modalRoot?.querySelector("#welcome-dialog-backdrop")) {
    const { dismissWelcomeDialog } = await import("./welcome-dialog.js");
    if (token !== routeToken) return;
    dismissWelcomeDialog();
  }

  if (prev?.name === "developer" && routeInfo.name === "developer") {
    document.body.classList.add("modal-open");
    await showOverlay(routeInfo, token);
    if (token !== routeToken) return;
    shownRoute = routeInfo;
    trackTelemetryPage();
    applyShortcutAffordances(document);
    return;
  }

  if (prev?.name === "themes" && routeInfo.name === "themes") {
    document.body.classList.add("modal-open");
    await showOverlay(routeInfo, token);
    if (token !== routeToken) return;
    shownRoute = routeInfo;
    trackTelemetryPage();
    applyShortcutAffordances(document);
    return;
  }

  if (!underlayReady || underlayStale) {
    await ensureUnderlay();
    if (token !== routeToken) return;
  }

  if (prevIsOverlay) {
    teardownOverlays({ clearDom: false, dropModalOpen: false });
  }

  document.body.classList.add("modal-open");
  const shell = scheduleOverlayShell(overlayShellSpec(routeInfo), token);
  try {
    await showOverlay(routeInfo, token);
  } finally {
    shell.cancel();
  }
  if (token !== routeToken) return;
  shownRoute = routeInfo;
  trackTelemetryPage();
  applyShortcutAffordances(document);
}

/**
 * @param {"saved"|"deleted"} kind
 * @param {string} [subject]
 */
function toastCardSavedOrDeleted(kind, subject) {
  const label = kind === "saved" ? _t("Card saved") : _t("Card deleted");
  const trimmed = String(subject || "").trim();
  toast({
    type: "success",
    title: trimmed ? label : false,
    message: trimmed || label,
    ...(kind === "deleted" ? { icon: "delete-bin-2" } : {}),
  });
}

async function handleClearCards() {
  try {
    await deleteAllCards();
    clearPrintQty();
    toast({
      type: "success",
      message: _t("All cards have been deleted, your collection is empty"),
      icon: "delete-bin-2",
    });
    underlayStale = true;
    navigate("#", { replace: true });
  } catch (err) {
    toast(err.message || _t("Unable to delete the cards"), "error");
  }
}

async function handleDevReset() {
  try {
    /* Close the modal before wipe to avoid a stuck UI if reload fails. */
    if (cleanupSettings) {
      cleanupSettings();
      cleanupSettings = null;
    }
    await wipeAllLocalData();
    location.replace(`${location.pathname}?${Date.now()}`);
  } catch (err) {
    toast(err.message || _t("Reset failed"), "error");
  }
}

btnNew.addEventListener("click", () => navigate("#new-card"));
if (btnSettings) btnSettings.addEventListener("click", () => navigate("#settings"));

/**
 * Visible catalog / list search (`type="search"` inside `.search-bar`).
 * @param {EventTarget|null} el
 * @returns {el is HTMLInputElement}
 */
function isAvailableSearchInput(el) {
  if (!(el instanceof HTMLInputElement) || el.disabled) return false;
  if ((el.type || "").toLowerCase() !== "search") return false;
  if (!el.closest(".search-bar")) return false;
  if (el.closest("[hidden]")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

/** Search field of the front view (modal first, otherwise the home bar). */
function availableSearchInput() {
  const modal = getTopModal();
  const scope = modal instanceof HTMLElement ? modal : document;
  const inputs = scope.querySelectorAll(".search-bar input[type='search']");
  for (const input of inputs) {
    if (isAvailableSearchInput(input)) return input;
  }
  return null;
}

function focusAvailableSearch() {
  const input = availableSearchInput();
  if (!input) return false;
  input.focus();
  input.select();
  return true;
}

/** Suggestion list or sort menu still open under this search field. */
function searchListOpen(input) {
  const bar = input.closest(".search-bar");
  if (!bar) return false;
  const list = bar.querySelector(":scope > .form-select-list, :scope > .search-sort-menu");
  return list instanceof HTMLElement && !list.hidden;
}

/**
 * Escape in a filled search field clears it (the open list closes first,
 * via its own handler).
 * @returns {boolean}
 */
function clearFocusedSearch() {
  const el = document.activeElement;
  if (!isAvailableSearchInput(el) || !el.value || searchListOpen(el)) return false;
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

/**
 * Save button of the front draft editor, or the unsaved-close **Save**.
 * @param {HTMLElement} modal
 * @returns {HTMLButtonElement|null}
 */
function editorSaveButton(modal) {
  const save = modal.querySelector("#btn-card-save, #theme-save, #preset-theme-save");
  if (save instanceof HTMLButtonElement) return save;
  const confirmSave = modal.querySelector('[data-confirm-action="save"]');
  if (confirmSave instanceof HTMLButtonElement) return confirmSave;
  return null;
}

/** @param {HTMLButtonElement} btn */
function clickIfEnabled(btn) {
  if (btn.disabled) return;
  btn.click();
}

/**
 * Primary footer action (`btn primary`, not the icon-only close, not danger).
 * @param {HTMLElement} modal
 * @returns {HTMLButtonElement|null}
 */
function primaryActionButton(modal) {
  const buttons = modal.querySelectorAll(".modal-footer button.btn.primary:not(.icon-only)");
  for (const btn of buttons) {
    if (!(btn instanceof HTMLButtonElement)) continue;
    if (btn.hidden || btn.closest("[hidden]")) continue;
    return btn;
  }
  return null;
}

/** Hash change would drop a draft, an import, or a child dialog. */
function canLeaveForShortcut() {
  const info = parseRoute();
  if (isDraftEditorRoute(info)) return false;
  if (info.name === "import") return false;
  if (hasChildDialog()) return false;
  return true;
}

/** @param {string} hash */
function openShortcutRoute(hash) {
  if (normalizeHash(location.hash) === normalizeHash(hash)) return;
  navigate(hash);
}

document.addEventListener(
  "keydown",
  (e) => {
    if (isNewCardShortcut(e)) {
      if (!canLeaveForShortcut()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openShortcutRoute("#new-card");
      return;
    }
    if (isSettingsShortcut(e)) {
      if (!canLeaveForShortcut()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openShortcutRoute("#settings");
      return;
    }
    if (e.key === "Escape" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      if (clearFocusedSearch()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      return;
    }
    if (!isPrimaryActionShortcut(e)) return;
    const modal = getTopModal();
    if (!modal) return;
    const btn = primaryActionButton(modal);
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    clickIfEnabled(btn);
  },
  true
);

document.addEventListener("keydown", (e) => {
  if (isCollectionSaveShortcut(e)) {
    e.preventDefault();
    const info = parseRoute();
    if (isDraftEditorRoute(info)) {
      const modal = getTopModal();
      const save = modal ? editorSaveButton(modal) : null;
      if (save) clickIfEnabled(save);
      return;
    }
    if (info.name === "backup" || info.name === "import" || hasChildDialog()) return;
    navigate("#backup");
    return;
  }
  if (isFindShortcut(e) || isSearchFocusKey(e)) {
    if (focusAvailableSearch()) {
      e.preventDefault();
    }
    return;
  }
  if (isBareNewCardKey(e)) {
    if (!canLeaveForShortcut()) return;
    e.preventDefault();
    openShortcutRoute("#new-card");
    return;
  }
  if (isBareSettingsKey(e)) {
    if (!canLeaveForShortcut()) return;
    e.preventDefault();
    openShortcutRoute("#settings");
    return;
  }
  if (isBareThemesKey(e)) {
    if (!canLeaveForShortcut()) return;
    e.preventDefault();
    openShortcutRoute("#themes");
    return;
  }
  if (isBareDeveloperKey(e)) {
    if (!canLeaveForShortcut()) return;
    e.preventDefault();
    openShortcutRoute("#developer");
    return;
  }
  if (isBareAboutKey(e)) {
    if (!canLeaveForShortcut()) return;
    e.preventDefault();
    openShortcutRoute("#page/about");
    return;
  }
  if (!isPrintShortcut(e)) return;
  e.preventDefault();
  const info = parseRoute();
  if (
    info.name === "print" ||
    info.name === "import" ||
    isDraftEditorRoute(info) ||
    hasChildDialog()
  ) {
    return;
  }
  navigate("#print");
});

const TOPBAR_TABBABLE = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** @param {Element} el */
function isShownTabStop(el) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.closest("[hidden]")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if ("disabled" in el && /** @type {HTMLButtonElement} */ (el).disabled) return false;
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

/** @param {ParentNode} root */
function shownTabStops(root) {
  return [...root.querySelectorAll(TOPBAR_TABBABLE)].filter(isShownTabStop);
}

/**
 * Tab skips the top bar unless focus is already inside it.
 * Inside, Tab keeps the usual order (logo, search, sort, new card, print, settings),
 * including Shift+Tab from the search field back to the logo.
 */
function bindTopbarTabSkip() {
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Tab" || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const topbar = document.querySelector(".topbar");
      if (!(topbar instanceof HTMLElement) || getTopModal()) return;
      const active = document.activeElement;
      if (active instanceof Node && topbar.contains(active)) return;

      const stops = shownTabStops(document);
      const index = active instanceof Element ? stops.indexOf(active) : -1;
      const upcoming = e.shiftKey ? (index > 0 ? stops[index - 1] : null) : index === -1 ? stops[0] : stops[index + 1];
      if (!(upcoming instanceof Element) || !topbar.contains(upcoming)) return;

      const target = e.shiftKey
        ? stops.findLast((el, i) => i < index && !topbar.contains(el))
        : stops.find((el, i) => i > index && !topbar.contains(el));
      e.preventDefault();
      if (target instanceof HTMLElement) {
        target.focus({ focusVisible: true });
        return;
      }
      if (e.shiftKey && active instanceof HTMLElement) active.blur();
    },
    true
  );
}

document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return;
  }
  const t = e.target;
  const el =
    t instanceof Element ? t : t instanceof Node ? t.parentElement : null;
  const a = el?.closest("a[href]");
  if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
  if (a.getAttribute("aria-disabled") === "true" || a.classList.contains("disabled")) {
    e.preventDefault();
    return;
  }
  const href = a.getAttribute("href");
  if (!href || href[0] !== "#") return;
  e.preventDefault();
  navigate(href);
});

window.addEventListener("popstate", () => {
  ignoreHashchange = true;
  if (!history.state || history.state.app !== APP_ID) {
    history.replaceState({ app: APP_ID, depth: 0 }, "", location.href);
  }
  route();
  setTimeout(() => {
    ignoreHashchange = false;
  }, 0);
});

window.addEventListener("hashchange", () => {
  if (ignoreHashchange) return;
  history.replaceState({ app: APP_ID, depth: 0 }, "", location.href);
  route();
});

async function boot() {
  try {
    await initI18n();
    applyChromeI18n();
    if (!main || !btnNew) {
      throw new Error(_t("Incomplete HTML structure (#main / #btn-new-card)."));
    }
    if (appVersionEl) {
      appVersionEl.textContent = `v${APP_VERSION}`;
    }
    setAppDocumentTitle();
    initTheme();
    initTelemetry();
    initCardDesign();
    initListLayout();
    initPrintMenu({ toast, onOpenPrint: () => navigate("#print") });
    bindModalFocusTrap();
    bindTopbarTabSkip();
    applyShortcutAffordances(document);
    const modalRootObserved = document.getElementById("modal-root");
    if (modalRootObserved && typeof MutationObserver === "function") {
      let shortcutAffordanceQueued = false;
      const shortcutObserver = new MutationObserver(() => {
        if (shortcutAffordanceQueued) return;
        shortcutAffordanceQueued = true;
        queueMicrotask(() => {
          shortcutAffordanceQueued = false;
          applyShortcutAffordances(document);
        });
      });
      shortcutObserver.observe(modalRootObserved, { childList: true, subtree: true });
    }
    registerServiceWorker();

    history.replaceState({ app: APP_ID, depth: 0 }, "", hashUrl(location.hash));

    await Promise.all([loadCards(), loadThemes()]);
    if (isResetReloadQuery(location.search) || isBootRetryQuery(location.search)) {
      const h = normalizeHash(location.hash);
      const clean = h === "#" ? location.pathname : `${location.pathname}${h}`;
      history.replaceState({ app: APP_ID, depth: 0 }, "", clean);
    }
    main.removeAttribute("aria-busy");
    await route();
    warmHeaderOverlays();
  } catch (err) {
    console.error(err);
    if (typeof window.showBootError === "function") {
      window.showBootError(err);
    } else if (main) {
      const msg = err && err.message ? err.message : String(err || _t("Unknown error"));
      main.removeAttribute("aria-busy");
      main.innerHTML = loadingViewMarkup({ error: msg, busy: false, retry: true });
      main.querySelector("#boot-retry")?.addEventListener("click", () => {
        location.replace(`${location.pathname}?r=${Date.now()}${location.hash || ""}`);
      });
    }
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const host = location.hostname;
  const secure =
    location.protocol === "https:" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]";
  if (!secure) return;
  navigator.serviceWorker
    .register(`service-worker.js?v=${APP_VERSION}`, { updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready)
    .then((reg) => {
      reg.active?.postMessage({ type: "precache-offline" });
    })
    .catch((err) => console.error(err));
}

boot();
