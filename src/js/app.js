import { loadCards, loadThemes, exportToJson, importFromJson, wipeAllLocalData, deleteAllCards } from "./storage.js";
import { initTheme } from "./theme.js";
import { initCardDesign } from "./card-design.js";
import { initListLayout } from "./list-layout.js";
import { isLocalDevHost } from "./themes-data.js";
import { APP_ID, APP_VERSION } from "./version.js";
import { renderEditor } from "./views/editor.js";
import { renderList } from "./views/list.js";
import { renderThemesModal } from "./views/themes.js";
import { renderThemeEditor } from "./views/theme-editor.js";
import { renderPageModal } from "./views/page.js";
import { renderSettingsModal } from "./views/settings.js";
import { renderDeveloperModal } from "./views/developer/modal.js";
import { tileListMarkup } from "./tile.js";
import { confirmDialog, openConfirmDialog } from "./confirm-dialog.js";
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
const importFile = document.getElementById("import-file");
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
let cleanupDeveloper = null;

/** @type {null | (() => void)} */
let cleanupList = null;

/** Dernière route effectivement affichée. */
let shownRoute = /** @type {ReturnType<typeof parseRoute>|null} */ (null);

let underlayReady = false;
let underlayStale = false;

let routeToken = 0;

/** Ignore le hashchange qui suit un popstate (Précédent / Suivant). */
let ignoreHashchange = false;

function toast(message, type = "info") {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " is-error" : "");
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/**
 * @param {string} hash
 * @returns {string}
 */
function normalizeHash(hash) {
  let h = String(hash || "");
  if (!h || h === "#" || h === "#/") return "#/";
  if (!h.startsWith("#")) h = `#${h}`;
  if (!h.startsWith("#/")) h = `#/${h.slice(1)}`;
  if (h.length > 2 && h.endsWith("/")) h = h.slice(0, -1);
  const q = h.indexOf("?");
  if (q !== -1) h = h.slice(0, q);
  return h;
}

/** @param {string} hash */
function hashUrl(hash) {
  return `${location.pathname}${location.search}${normalizeHash(hash)}`;
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
  if (path.startsWith("page/")) {
    const slug = path.slice("page/".length);
    if (!slug || slug.includes("/")) return { name: "unknown" };
    return { name: "page", slug };
  }
  if (path === "developer") return { name: "developer", page: "index" };
  if (path.startsWith("developer/")) {
    const page = path.slice("developer/".length) || "index";
    return { name: "developer", page };
  }
  return { name: "unknown" };
}

function parseRoute() {
  return parsePath(normalizeHash(location.hash).slice(2));
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
    setHistoryState(target === "#/" ? 0 : routeDepth(), target, true);
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
  if (normalizeHash(location.hash) === "#/") return;
  navigate("#/", { replace: true });
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
        info.name === "page" ||
        info.name === "developer")
  );
}

function overlayOnClose(name) {
  return () => {
    if (parseRoute().name === name) dismissOverlay();
  };
}

/**
 * Retire les listeners des overlays. Le DOM n’est vidé que si `clearDom`.
 * `modal-open` n’est retiré que si `dropModalOpen` (destination accueil).
 * @param {{ clearDom?: boolean, dropModalOpen?: boolean }} [opts]
 */
function teardownOverlays(opts = {}) {
  const fns = [cleanupEditor, cleanupPage, cleanupSettings, cleanupThemes, cleanupDeveloper];
  cleanupEditor = null;
  cleanupPage = null;
  cleanupSettings = null;
  cleanupThemes = null;
  cleanupDeveloper = null;
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
      onImport: () => importFile?.click(),
      onExport: exportCards,
      onClearCards: handleClearCards,
      onDevReset: isLocalDevHost() ? handleDevReset : undefined,
      cardCount,
    });
    return;
  }

  if (routeInfo.name === "themes") {
    if (routeInfo.page === "list") {
      cleanupThemes = await renderThemesModal(modalRoot, {
        onClose: overlayOnClose("themes"),
        onCreate: () => navigate("#/themes/new"),
        onEdit: (id) => navigate(`#/themes/edit/${encodeURIComponent(id)}`),
      });
      return;
    }

    cleanupThemes = await renderThemeEditor(modalRoot, {
      themeId: routeInfo.page === "edit" ? routeInfo.themeId : null,
      onClose: () => {
        if (parseRoute().name === "themes") {
          navigate("#/themes", { replace: true });
        }
      },
      onSaved: () => {
        toast("Thème enregistré");
        underlayStale = true;
        if (parseRoute().name === "themes") {
          navigate("#/themes", { replace: true });
        }
      },
      onDeleted: () => {
        toast("Thème supprimé");
        underlayStale = true;
        if (parseRoute().name === "themes") {
          navigate("#/themes", { replace: true });
        }
      },
    });
    if (!cleanupThemes) {
      navigate("#/themes", { replace: true });
    }
    return;
  }

  if (routeInfo.name === "page") {
    cleanupPage = await renderPageModal(modalRoot, {
      slug: routeInfo.slug,
      toast,
      onClose: overlayOnClose("page"),
    });
    if (!cleanupPage) dismissOverlay();
    return;
  }

  if (routeInfo.name === "developer") {
    cleanupDeveloper = renderDeveloperModal(modalRoot, {
      page: routeInfo.page,
      onClose: overlayOnClose("developer"),
    });
    return;
  }

  if (routeInfo.name === "editor") {
    cleanupEditor = await renderEditor(modalRoot, {
      cardId: routeInfo.cardId,
      toast,
      onSaved: () => {
        toast("Carte enregistrée");
        underlayStale = true;
        if (parseRoute().name === "editor") navigate("#/", { replace: true });
      },
      onCancel: overlayOnClose("editor"),
      onDeleted: () => {
        toast("Carte supprimée");
        underlayStale = true;
        if (parseRoute().name === "editor") navigate("#/", { replace: true });
      },
    });
  }
}

function disposeList() {
  if (cleanupList) {
    cleanupList();
    cleanupList = null;
  }
}

function renderEmpty() {
  main.innerHTML = `
    <section class="panel empty-view no-print">
      <div class="brick" aria-hidden="true"></div>
      <h1 class="view-title">Aucune carte pour l'instant</h1>
      <p>Crée ta première carte : référence, photo, titre, thème. Tu pourras ensuite les lister et imprimer en lot sur A4 (face + dos).</p>
      ${tileListMarkup([
        {
          title: "Créer ma première carte",
          desc: "Référence, photo, titre, thème",
          href: "#/new-card",
          icon: "add",
        },
      ])}
    </section>
  `;
}

const listOpts = {
  onEdit: (id) => navigate(`#/edit-card/${id}`),
  onCreate: () => navigate("#/new-card"),
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
    history.replaceState({ app: APP_ID, depth: 0 }, "", hashUrl("#/"));
    routeInfo = { name: "home" };
  }

  const prev = shownRoute;
  const nextIsOverlay = isOverlayRoute(routeInfo);
  const prevIsOverlay = isOverlayRoute(prev);

  if (!nextIsOverlay) {
    teardownOverlays({ clearDom: true, dropModalOpen: true });
    shownRoute = routeInfo;
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
    teardownOverlays({ clearDom: false, dropModalOpen: false });
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

async function exportCards() {
  try {
    const cards = await loadCards();
    if (!cards.length) {
      toast("Aucune carte à sauvegarder", "error");
      return;
    }
    const result = await exportToJson();
    toast(
      `Sauvegarde : ${result.cards} carte(s) + ${result.themes} thème(s) (JSON)`
    );
  } catch (err) {
    toast(err.message || "Sauvegarde impossible", "error");
  }
}

async function handleImportFile() {
  const file = importFile?.files && importFile.files[0];
  if (importFile) importFile.value = "";
  if (!file) return;

  try {
    const text = await file.text();
    const existing = (await loadCards()).length;
    let mode = "merge";

    if (existing > 0) {
      if (!modalRoot) return;
      const choice = await openConfirmDialog(modalRoot, {
        title: "Importer ?",
        subtitle: `${existing} carte(s) déjà enregistrée(s)`,
        message:
          "Fusionner met à jour les cartes de même id. Remplacer efface toute la collection actuelle.",
        actions: [
          { id: "merge", label: "Fusionner", variant: "primary", slot: "start" },
          { id: "cancel", label: "Annuler", variant: "secondary", slot: "end" },
          { id: "replace", label: "Remplacer", variant: "danger", slot: "end" },
        ],
      });
      if (choice == null || choice === "cancel") return;
      if (choice === "replace") {
        const sure = await confirmDialog(modalRoot, {
          title: "Remplacer ?",
          subtitle: "Toute la collection",
          message: "Cette action est irréversible (sauf si tu as un export).",
          okLabel: "Remplacer",
          danger: true,
        });
        if (!sure) return;
        mode = "replace";
      } else {
        mode = "merge";
      }
    }

    const result = await importFromJson(text, mode);
    const themeMsg = result.themesImported
      ? ` · ${result.themesImported} thème(s)`
      : "";
    toast(`${result.imported} carte(s) importée(s) · total ${result.total}${themeMsg}`);
    underlayStale = true;
    navigate("#/", { replace: true });
  } catch (err) {
    toast(err.message || "Import impossible", "error");
  }
}

async function handleClearCards() {
  try {
    await deleteAllCards();
    clearPrintQty();
    toast("Toutes les cartes ont été supprimées");
    underlayStale = true;
    navigate("#/", { replace: true });
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
    const url = new URL(location.href);
    url.searchParams.set("_", String(Date.now()));
    url.hash = "#/";
    location.replace(url.toString());
  } catch (err) {
    toast(err.message || "Reset impossible", "error");
  }
}

btnNew.addEventListener("click", () => navigate("#/new-card"));
if (btnSettings) btnSettings.addEventListener("click", () => navigate("#/settings"));

if (importFile) {
  importFile.addEventListener("change", () => {
    handleImportFile();
  });
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
  if (!href || !href.startsWith("#/")) return;
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
    document.title = `Brickcard Generator v${APP_VERSION}`;
    initTheme();
    initCardDesign();
    initListLayout();
    initPrintMenu({ toast });
    /* Seed thèmes en arrière-plan : ne bloque pas l’empty state après un reset. */
    void loadThemes().catch((err) => console.error(err));

    const initialHash = !location.hash || location.hash === "#" ? "#/" : normalizeHash(location.hash);
    history.replaceState({ app: APP_ID, depth: 0 }, "", hashUrl(initialHash));

    /* Afficher tout de suite l’accueil vide pendant l’ouverture IndexedDB. */
    if (parseRoute().name === "home") {
      setNewButtonVisible(true);
      syncHeaderPrint(0);
      renderEmpty();
    }
    const cards = await loadCards();
    syncHeaderPrint(cards.length);
    await route();
  } catch (err) {
    console.error(err);
    if (main) {
      main.innerHTML = `<section class="panel"><p class="error">Erreur au démarrage : ${err.message}</p></section>`;
    }
  }
}

boot();
