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
import { isPrintShortcut, isCollectionSaveShortcut } from "./hotkeys.js";
import { loadingViewMarkup, welcomeViewMarkup } from "./empty-view.js";
import { openConfirmDialog } from "./confirm-dialog.js";
import { bindModalFocusTrap, focusTopModal } from "./modal-focus.js";
import {
  initPrintMenu,
  setPrintMenuVisible,
  syncPrintMenu,
} from "./print-menu.js";
import { clearPrintQty } from "./print-qty.js";
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

/** @param {number} cardCount */
function syncHeaderPrint(cardCount) {
  setPrintMenuVisible(cardCount > 0);
  syncPrintMenu({ cardCount });
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

/** Draft editor: Ctrl/Cmd+S does not open `#backup` (avoids losing input). */
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
 * @template T
 * @param {() => Promise<T>} loader
 * @returns {Promise<T|null>}
 */
async function loadOverlay(loader) {
  try {
    return await loader();
  } catch (err) {
    console.error(err);
    const msg = err && err.message ? err.message : String(err || _t("Loading error"));
    toast(msg, "error");
    dismissOverlay();
    return null;
  }
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

async function showOverlay(routeInfo) {
  if (!modalRoot) {
    toast(_t("Modal unavailable"), "error");
    dismissOverlay();
    return;
  }
  document.body.classList.add("modal-open");

  if (routeInfo.name === "settings") {
    const settings = await loadOverlay(() => import("./views/settings.js"));
    if (!settings) return;
    let cardCount = 0;
    try {
      cardCount = (await loadCards()).length;
    } catch {
      /* ignore */
    }
    cleanupSettings = settings.renderSettingsModal(modalRoot, {
      onClose: overlayOnClose("settings"),
      onClearCards: handleClearCards,
      onDevReset: isDeveloperEnabled() ? handleDevReset : undefined,
      cardCount,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "print") {
    const printDlg = await loadOverlay(() => import("./print-dialog.js"));
    if (!printDlg) return;
    cleanupPrint = printDlg.renderPrintDialog(modalRoot, {
      onClose: overlayOnClose("print"),
      toast,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "backup") {
    const backup = await loadOverlay(() => import("./backup-dialog.js"));
    if (!backup) return;
    cleanupBackup = await backup.renderBackupDialog(modalRoot, {
      onClose: overlayOnClose("backup"),
      toast,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "import") {
    const importDlg = await loadOverlay(() => import("./import-dialog.js"));
    if (!importDlg) return;
    cleanupImport = await importDlg.renderImportDialog(modalRoot, {
      onClose: overlayOnClose("import"),
      onImported: () => {
        underlayStale = true;
      },
      toast,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "themes") {
    const themes = await loadOverlay(() => import("./views/themes.js"));
    if (!themes) return;
    if (routeInfo.page === "list") {
      if (cleanupThemeEditor) {
        cleanupThemeEditor();
        cleanupThemeEditor = null;
      }
      if (!cleanupThemes) {
        cleanupThemes = await themes.renderThemesModal(modalRoot, {
          onClose: overlayOnClose("themes"),
          onCreate: () => navigate("#themes/new"),
          onEdit: (id) => navigate(`#themes/edit/${encodeURIComponent(id)}`),
          onView: (id) => navigate(`#themes/view/${encodeURIComponent(id)}`),
          onClearedCustomThemes: () => {
            toast({
              type: "success",
              message: _t("All custom themes have been deleted"),
              icon: "delete-bin-2",
            });
            underlayStale = true;
          },
        });
        focusTopModal();
        themes.applyPendingThemeFocus();
      } else {
        setAppDocumentTitle(_t("Themes"));
        focusTopModal({ resetScroll: false });
        themes.applyPendingThemeFocus();
      }
      return;
    }

    if (routeInfo.page === "edit" || routeInfo.page === "view") {
      const theme = await getTheme(routeInfo.themeId);
      if (!theme) {
        navigate("#themes", { replace: true });
        return;
      }
      if (routeInfo.page === "edit" && theme.isBuiltin) {
        navigate(`#themes/view/${encodeURIComponent(theme.id)}`, { replace: true });
        return;
      }
      if (routeInfo.page === "view" && !theme.isBuiltin) {
        navigate(`#themes/edit/${encodeURIComponent(theme.id)}`, { replace: true });
        return;
      }
    }

    const themeEditor = await loadOverlay(() => import("./views/theme-editor.js"));
    if (!themeEditor) return;
    if (cleanupThemeEditor) {
      cleanupThemeEditor();
      cleanupThemeEditor = null;
    }
    if (!cleanupThemes) {
      modalRoot.innerHTML = "";
    }
    const editorThemeId = routeInfo.page === "new" ? null : routeInfo.themeId;
    cleanupThemeEditor = await themeEditor.renderThemeEditor(modalRoot, {
      themeId: editorThemeId,
      readOnly: routeInfo.page === "view",
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
          title: _t("Theme saved"),
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
      onDeleted: (name, themeId) => {
        toast({
          type: "success",
          title: _t("Theme deleted"),
          message: name,
          icon: "delete-bin-2",
        });
        underlayStale = true;
        themes.removeThemeFromList(themeId);
        if (parseRoute().name === "themes") {
          navigate("#themes", { replace: true });
        }
      },
    });
    if (!cleanupThemeEditor) {
      navigate("#themes", { replace: true });
      return;
    }
    focusTopModal();
    return;
  }

  if (routeInfo.name === "page") {
    const page = await loadOverlay(() => import("./views/page.js"));
    if (!page) return;
    cleanupPage = await page.renderPageModal(modalRoot, {
      slug: routeInfo.slug,
      toast,
      onClose: overlayOnClose("page"),
    });
    if (!cleanupPage) dismissOverlay();
    else focusTopModal();
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
      const ok = choice === "ok";
      if (parseRoute().name !== "developer") return;
      if (!ok) {
        dismissOverlay();
        return;
      }
      enableDeveloper();
    }
    const developer = await loadOverlay(() => import("./views/developer/modal.js"));
    if (!developer) return;
    const staying = Boolean(modalRoot.querySelector("#developer-modal-backdrop"));
    try {
      cleanupDeveloper = await developer.renderDeveloperModal(modalRoot, {
        page: routeInfo.page,
        presetPage: routeInfo.presetPage,
        themeId: routeInfo.themeId,
        onClose: overlayOnClose("developer"),
        onNavigate: navigate,
      });
    } catch (err) {
      console.error(err);
      const msg = err && err.message ? err.message : String(err || _t("Loading error"));
      toast(msg, "error");
      dismissOverlay();
      return;
    }
    focusTopModal({ resetScroll: !staying });
    return;
  }

  if (routeInfo.name === "editor") {
    const editor = await loadOverlay(() => import("./views/editor.js"));
    if (!editor) return;
    cleanupEditor = await editor.renderEditor(modalRoot, {
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
    });
    focusTopModal();
  }
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
    trackTelemetryPage();
    return;
  }

  if (prev?.name === "developer" && routeInfo.name === "developer") {
    document.body.classList.add("modal-open");
    await showOverlay(routeInfo);
    if (token !== routeToken) return;
    shownRoute = routeInfo;
    trackTelemetryPage();
    return;
  }

  if (prev?.name === "themes" && routeInfo.name === "themes") {
    document.body.classList.add("modal-open");
    await showOverlay(routeInfo);
    if (token !== routeToken) return;
    shownRoute = routeInfo;
    trackTelemetryPage();
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
  await showOverlay(routeInfo);
  if (token !== routeToken) return;
  shownRoute = routeInfo;
  trackTelemetryPage();
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

document.addEventListener("keydown", (e) => {
  if (isCollectionSaveShortcut(e)) {
    e.preventDefault();
    const info = parseRoute();
    if (
      info.name === "backup" ||
      info.name === "import" ||
      isDraftEditorRoute(info) ||
      hasChildDialog()
    ) {
      return;
    }
    navigate("#backup");
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
    .catch((err) => console.error(err));
}

boot();
