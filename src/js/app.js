import { loadCards, loadThemes, wipeAllLocalData, deleteAllCards, isResetReloadQuery } from "./storage.js";
import { initTheme } from "./theme.js";
import { initCardDesign } from "./card-design.js";
import { initListLayout } from "./list-layout.js";
import { enableDeveloper, isDeveloperEnabled } from "./developer-access.js";
import { APP_ID, APP_VERSION } from "./version.js?v=0.8.2";
import { setAppDocumentTitle } from "./document-title.js";
import { toast } from "./toast.js";
import { renderEditor } from "./views/editor.js";
import { renderList, prepareListAfterCardCreate, patchListCard, removeListCard, focusListCard } from "./views/list.js";
import { renderThemesModal, prepareThemesAfterThemeCreate, refreshThemesListAfterCreate, patchThemeInList, removeThemeFromList, focusThemeInList, applyPendingThemeFocus } from "./views/themes.js";
import { renderThemeEditor } from "./views/theme-editor.js";
import { renderPageModal } from "./views/page.js";
import { renderSettingsModal } from "./views/settings.js";
import { isPrintShortcut, renderPrintDialog } from "./print-dialog.js";
import { isCollectionSaveShortcut, renderBackupDialog } from "./backup-dialog.js";
import { openDemoBackupDialog, renderImportDialog } from "./import-dialog.js";
import { renderDeveloperModal } from "./views/developer/modal.js";
import { applyPendingPresetFocus } from "./views/developer/theme-presets.js";
import { loadingViewMarkup, welcomeViewMarkup } from "./empty-view.js";
import { openConfirmDialog } from "./confirm-dialog.js";
import { bindModalFocusTrap, focusTopModal } from "./modal-focus.js";
import {
  initPrintMenu,
  setPrintMenuVisible,
  syncPrintMenu,
} from "./print-menu.js";
import { clearPrintQty } from "./print-qty.js";

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

/** Dernière route effectivement affichée. */
let shownRoute = /** @type {ReturnType<typeof parseRoute>|null} */ (null);

let underlayReady = false;
let underlayStale = false;

let routeToken = 0;

/** Ignore le hashchange qui suit un popstate (Précédent / Suivant). */
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

/** Accueil : URL sans fragment (jeton `#`). Overlays : `#settings` ; `#/settings` nettoyé. */
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
  if (path.startsWith("themes/edit/")) {
    const raw = path.slice("themes/edit/".length);
    if (!raw) return { name: "unknown" };
    let themeId = raw;
    try {
      themeId = decodeURIComponent(raw);
    } catch {
      /* id tel quel */
    }
    if (!themeId) return { name: "unknown" };
    return { name: "themes", page: "edit", themeId };
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
 * @param {string} rest chemin après `developer/`
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
      /* slug tel quel */
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

/** Croix / Échap / backdrop : ferme l’overlay vers l’accueil (replace). Le Précédent navigateur garde l’historique. */
function dismissOverlay() {
  if (normalizeHash(location.hash) === "#") return;
  navigate("#", { replace: true });
}

function setNewButtonVisible(visible) {
  btnNew.classList.toggle("is-hidden", !visible);
}

/** Barre de recherche : visible sur l’accueil liste (et sous une modale). */
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

/** Éditeur avec brouillon : Ctrl/Cmd+S n’ouvre pas `#backup` (évite de perdre la saisie). */
function isDraftEditorRoute(info) {
  if (info.name === "editor") return true;
  if (info.name === "themes" && info.page !== "list") return true;
  if (info.name === "developer" && info.presetPage) return true;
  return false;
}

/** Second backdrop (confirm, URL d’image…) au-dessus de l’overlay. */
function hasChildDialog() {
  if (!modalRoot) return false;
  const n = modalRoot.querySelectorAll(":scope > .modal-backdrop").length;
  if (n > 1) return true;
  return n === 1 && !isOverlayRoute(parseRoute());
}

/**
 * Retire les listeners des overlays. Le DOM n’est vidé que si `clearDom`.
 * `modal-open` n’est retiré que si `dropModalOpen` (destination accueil).
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

async function ensureUnderlay() {
  if (underlayReady && !underlayStale) return;
  let cards;
  try {
    cards = await loadCards();
  } catch (err) {
    console.error(err);
    underlayReady = false;
    main.innerHTML = `<section class="panel"><p class="error">Erreur de stockage : ${err.message || err}</p></section>`;
    return;
  }
  await renderHomeUnderlay(cards);
  underlayReady = true;
  underlayStale = false;
}

async function showOverlay(routeInfo) {
  if (!modalRoot) {
    toast("Modale indisponible", "error");
    dismissOverlay();
    return;
  }
  document.body.classList.add("modal-open");

  if (routeInfo.name === "settings") {
    let cardCount = 0;
    try {
      cardCount = (await loadCards()).length;
    } catch {
      /* ignore */
    }
    cleanupSettings = renderSettingsModal(modalRoot, {
      onClose: overlayOnClose("settings"),
      onClearCards: handleClearCards,
      onDevReset: isDeveloperEnabled() ? handleDevReset : undefined,
      cardCount,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "print") {
    cleanupPrint = renderPrintDialog(modalRoot, {
      onClose: overlayOnClose("print"),
      toast,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "backup") {
    cleanupBackup = await renderBackupDialog(modalRoot, {
      onClose: overlayOnClose("backup"),
      toast,
    });
    focusTopModal();
    return;
  }

  if (routeInfo.name === "import") {
    cleanupImport = await renderImportDialog(modalRoot, {
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
    if (routeInfo.page === "list") {
      if (cleanupThemeEditor) {
        cleanupThemeEditor();
        cleanupThemeEditor = null;
      }
      if (!cleanupThemes) {
        cleanupThemes = await renderThemesModal(modalRoot, {
          onClose: overlayOnClose("themes"),
          onCreate: () => navigate("#themes/new"),
          onEdit: (id) => navigate(`#themes/edit/${encodeURIComponent(id)}`),
          onClearedCustomThemes: () => {
            toast({
              type: "success",
              message: "Tous les thèmes personnalisés ont été supprimés",
              icon: "delete-bin-2",
            });
            underlayStale = true;
          },
        });
        focusTopModal();
        applyPendingThemeFocus();
      } else {
        setAppDocumentTitle("Thèmes");
        focusTopModal({ resetScroll: false });
        applyPendingThemeFocus();
      }
      return;
    }

    if (cleanupThemeEditor) {
      cleanupThemeEditor();
      cleanupThemeEditor = null;
    }
    if (!cleanupThemes) {
      modalRoot.innerHTML = "";
    }
    cleanupThemeEditor = await renderThemeEditor(modalRoot, {
      themeId: routeInfo.page === "edit" ? routeInfo.themeId : null,
      onClose: () => {
        const id = routeInfo.page === "edit" ? routeInfo.themeId : null;
        if (parseRoute().name === "themes") {
          navigate("#themes", { replace: true });
        }
        if (id) focusThemeInList(id);
      },
      onSaved: (name, meta) => {
        toast({
          type: "success",
          title: "Thème enregistré",
          message: name,
          icon: "palette",
        });
        underlayStale = true;
        if (meta?.isNew) {
          if (!refreshThemesListAfterCreate(meta.theme)) {
            prepareThemesAfterThemeCreate();
          }
        } else if (!patchThemeInList(meta?.theme)) {
          /* liste absente : #themes la remontera */
        }
        if (parseRoute().name === "themes") {
          navigate("#themes", { replace: true });
        }
        focusThemeInList(meta?.theme?.id);
      },
      onDeleted: (name, themeId) => {
        toast({
          type: "success",
          title: "Thème supprimé",
          message: name,
          icon: "delete-bin-2",
        });
        underlayStale = true;
        removeThemeFromList(themeId);
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
    cleanupPage = await renderPageModal(modalRoot, {
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
        title: "Activer l’espace développeur ?",
        icon: "tools",
        message:
          "L’espace développeur donne accès à l’aide au développement, le système de design, la documentation et certaines options comme la réinitialisation des données locales enregistrées.",
        actions: [
          { id: "cancel", label: "Annuler", variant: "secondary", size: "sm", slot: "end" },
          { id: "ok", label: "Activer", variant: "primary", slot: "end" },
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
    const staying = Boolean(modalRoot.querySelector("#developer-modal-backdrop"));
    cleanupDeveloper = renderDeveloperModal(modalRoot, {
      page: routeInfo.page,
      presetPage: routeInfo.presetPage,
      themeId: routeInfo.themeId,
      onClose: overlayOnClose("developer"),
      onNavigate: navigate,
    });
    focusTopModal({ resetScroll: !staying });
    applyPendingPresetFocus();
    return;
  }

  if (routeInfo.name === "editor") {
    cleanupEditor = await renderEditor(modalRoot, {
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
  main.querySelector("#empty-import-demo")?.addEventListener("click", () => {
    if (!modalRoot) {
      toast("Modale indisponible", "error");
      return;
    }
    openDemoBackupDialog(modalRoot, {
      toast,
      onImported: async () => {
        underlayStale = true;
        await ensureUnderlay();
      },
    });
  });
}

const listOpts = {
  onEdit: (id) => navigate(`#edit-card/${id}`),
  onCreate: () => navigate("#new-card"),
  toast,
};

/** Accueil sous une modale, ou page d’accueil seule. */
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
    return;
  }

  if (prev?.name === "developer" && routeInfo.name === "developer") {
    document.body.classList.add("modal-open");
    await showOverlay(routeInfo);
    if (token !== routeToken) return;
    shownRoute = routeInfo;
    return;
  }

  if (prev?.name === "themes" && routeInfo.name === "themes") {
    document.body.classList.add("modal-open");
    await showOverlay(routeInfo);
    if (token !== routeToken) return;
    shownRoute = routeInfo;
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
}

/**
 * @param {"saved"|"deleted"} kind
 * @param {string} [subject]
 */
function toastCardSavedOrDeleted(kind, subject) {
  const label = kind === "saved" ? "Carte enregistrée" : "Carte supprimée";
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
      message: "Toutes les cartes ont été supprimées, votre collection est vide",
      icon: "delete-bin-2",
    });
    underlayStale = true;
    navigate("#", { replace: true });
  } catch (err) {
    toast(err.message || "Impossible de supprimer les cartes", "error");
  }
}

async function handleDevReset() {
  try {
    /* Fermer la modale avant wipe pour éviter un état UI coincé si le reload échoue. */
    if (cleanupSettings) {
      cleanupSettings();
      cleanupSettings = null;
    }
    await wipeAllLocalData();
    location.replace(`${location.pathname}?${Date.now()}`);
  } catch (err) {
    toast(err.message || "Reset impossible", "error");
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
    if (!main || !btnNew) {
      throw new Error("Structure HTML incomplète (#main / #btn-new-card).");
    }
    if (appVersionEl) {
      appVersionEl.textContent = `v${APP_VERSION}`;
    }
    setAppDocumentTitle();
    initTheme();
    initCardDesign();
    initListLayout();
    initPrintMenu({ toast, onOpenPrint: () => navigate("#print") });
    bindModalFocusTrap();
    registerServiceWorker();

    history.replaceState({ app: APP_ID, depth: 0 }, "", hashUrl(location.hash));

    await Promise.all([loadCards(), loadThemes()]);
    if (isResetReloadQuery(location.search)) {
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
      const msg = err && err.message ? err.message : String(err || "Erreur inconnue");
      main.removeAttribute("aria-busy");
      main.innerHTML = loadingViewMarkup({ error: msg, busy: false });
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
