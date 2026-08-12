import { loadCards, loadThemes, exportToJson, importFromJson, wipeAllLocalData } from "./storage.js";
import { initTheme } from "./theme.js";
import { initCardDesign } from "./card-design.js";
import { initListLayout } from "./list-layout.js";
import { isLocalDevHost } from "./themes-data.js";
import { APP_VERSION } from "./version.js";
import { renderEditor } from "./views/editor.js";
import { renderList } from "./views/list.js";
import { renderThemesModal } from "./views/themes.js";
import { renderPageModal } from "./views/page.js";
import { renderSettingsModal } from "./views/settings.js";
import { renderTestIndex } from "./views/test/index.js";
import { renderTestButtons } from "./views/test/buttons.js";
import { renderTestFields } from "./views/test/fields.js";
import { renderTestSelects } from "./views/test/selects.js";
import { renderTestSliders } from "./views/test/sliders.js";
import { renderTestColors } from "./views/test/colors.js";
import { renderTestSearch } from "./views/test/search.js";
import { renderTestModals } from "./views/test/modals.js";
import {
  initPrintMenu,
  setPrintMenuVisible,
  syncPrintMenu,
} from "./print-menu.js";

const main = document.getElementById("main");
const modalRoot = document.getElementById("modal-root");
const brandLink = document.getElementById("brand-link");
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
let cleanupList = null;

let routeToken = 0;

/** Page MD à ouvrir juste après un changement de route (ex. quitter l’éditeur). */
let pendingPageSlug = null;

function toast(message, type = "info") {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " is-error" : "");
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, "") || "";
  const [path, query = ""] = hash.split("?");
  const params = Object.fromEntries(new URLSearchParams(query));

  if (path === "new") return { name: "editor", cardId: null };
  if (path.startsWith("edit/")) {
    return { name: "editor", cardId: path.slice(5) || null };
  }
  if (path === "list") return { name: "list" };
  if (path === "themes") return { name: "themes" };
  if (path === "test" || path === "test/") return { name: "test", page: "index" };
  if (path.startsWith("test/")) {
    const page = path.slice(5).replace(/\/$/, "") || "index";
    return { name: "test", page };
  }
  return { name: "home", params };
}

function setNewButtonVisible(visible) {
  btnNew.classList.toggle("is-hidden", !visible);
}

/** Barre de recherche : visible sur la liste (et sous la modale d’édition). */
function setSearchVisible(visible) {
  if (topbarSearch) topbarSearch.hidden = !visible;
}

/** @param {number} cardCount */
function syncHeaderPrint(cardCount) {
  setPrintMenuVisible(cardCount > 0);
  syncPrintMenu({ cardCount });
}

function navigate(hash) {
  if (location.hash === hash) {
    route();
  } else {
    location.hash = hash;
  }
}

function closeCardModal() {
  if (cleanupEditor) {
    cleanupEditor();
    cleanupEditor = null;
  }
  if (cleanupPage) {
    cleanupPage();
    cleanupPage = null;
  }
  if (cleanupSettings) {
    cleanupSettings();
    cleanupSettings = null;
  }
  if (cleanupThemes) {
    cleanupThemes();
    cleanupThemes = null;
  }
  if (modalRoot) modalRoot.innerHTML = "";
  document.body.classList.remove("modal-open");
}

/**
 * Ouvre une page Markdown (`data/page-{{slug}}.md`) en overlay, sans changer la route.
 * @param {string} slug
 */
async function openPageModal(slug) {
  if (!modalRoot) {
    toast("Modale indisponible", "error");
    return;
  }
  closeCardModal();
  cleanupPage = await renderPageModal(modalRoot, {
    slug,
    toast,
    onClose: () => {
      cleanupPage = null;
      if (modalRoot) modalRoot.innerHTML = "";
      document.body.classList.remove("modal-open");
    },
  });
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
      const merge = confirm(
        `${existing} carte(s) déjà enregistrée(s).\n\nOK = fusionner avec l’existant (même id mis à jour)\nAnnuler = choisir de remplacer toute la collection`
      );
      if (merge) {
        mode = "merge";
      } else {
        const sure = confirm(
          "Remplacer TOUTES les cartes actuelles par le contenu du fichier ?\nCette action est irréversible (sauf si tu as un export)."
        );
        if (!sure) return;
        mode = "replace";
      }
    }

    const result = await importFromJson(text, mode);
    const themeMsg = result.themesImported
      ? ` · ${result.themesImported} thème(s)`
      : "";
    toast(`${result.imported} carte(s) importée(s) · total ${result.total}${themeMsg}`);
    navigate(result.total ? "#/list" : "#/");
    await route();
  } catch (err) {
    toast(err.message || "Import impossible", "error");
  }
}

async function handleDevReset() {
  const ok = confirm(
    "Reset local (dev)\n\nCela va supprimer toutes les cartes, thèmes et réglages stockés dans ce navigateur, puis recharger l’app à zéro.\n\nContinuer ?"
  );
  if (!ok) return;
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

function openSettingsModal() {
  if (!modalRoot) {
    toast("Modale indisponible", "error");
    return;
  }
  closeCardModal();
  cleanupSettings = renderSettingsModal(modalRoot, {
    onClose: () => {
      cleanupSettings = null;
      if (modalRoot) modalRoot.innerHTML = "";
      document.body.classList.remove("modal-open");
    },
    onImport: () => importFile?.click(),
    onExport: exportCards,
    onThemes: () => {
      openThemesModal();
    },
    onStyleguide: isLocalDevHost()
      ? () => {
          navigate("#/test");
        }
      : undefined,
    onDevReset: isLocalDevHost() ? handleDevReset : undefined,
  });
}

async function openThemesModal() {
  if (!modalRoot) {
    toast("Modale indisponible", "error");
    return;
  }
  closeCardModal();
  cleanupThemes = await renderThemesModal(modalRoot, {
    toast,
    onClose: () => {
      cleanupThemes = null;
      if (modalRoot) modalRoot.innerHTML = "";
      document.body.classList.remove("modal-open");
      if (parseRoute().name === "themes") {
        loadCards().then((list) => {
          navigate(list.length ? "#/list" : "#/");
        });
      }
    },
  });
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
      <h2>Aucune carte pour l'instant</h2>
      <p>Crée ta première carte : référence, photo, titre, thème. Tu pourras ensuite les lister et imprimer en lot sur A4 (face + dos).</p>
      <button type="button" class="btn primary" id="btn-empty-create">Créer ma première carte</button>
    </section>
  `;
  main.querySelector("#btn-empty-create").addEventListener("click", () => {
    navigate("#/new");
  });
}

const listOpts = {
  onEdit: (id) => navigate(`#/edit/${id}`),
  onCreate: () => navigate("#/new"),
  toast,
};

/** Liste (ou vide) sous la modale d’édition de carte. */
async function renderCardsUnderlay(cards) {
  disposeList();
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

  closeCardModal();
  disposeList();
  setSearchVisible(false);

  const routeInfo = parseRoute();

  /* Styleguide : pas besoin d’IndexedDB (évite de bloquer toute l’UI si la DB est coincée). */
  if (routeInfo.name === "test") {
    setNewButtonVisible(false);
    setSearchVisible(false);
    syncHeaderPrint(0);
    if (routeInfo.page === "buttons") {
      cleanupList = renderTestButtons(main);
    } else if (routeInfo.page === "fields") {
      cleanupList = renderTestFields(main);
    } else if (routeInfo.page === "selects") {
      cleanupList = renderTestSelects(main);
    } else if (routeInfo.page === "sliders") {
      cleanupList = renderTestSliders(main);
    } else if (routeInfo.page === "colors") {
      cleanupList = renderTestColors(main);
    } else if (routeInfo.page === "search") {
      cleanupList = renderTestSearch(main);
    } else if (routeInfo.page === "modals") {
      cleanupList = renderTestModals(main);
    } else {
      cleanupList = renderTestIndex(main);
    }
    return;
  }

  let cards;
  try {
    cards = await loadCards();
  } catch (err) {
    console.error(err);
    main.innerHTML = `<section class="panel"><p class="error">Erreur de stockage : ${err.message || err}</p></section>`;
    return;
  }

  if (token !== routeToken) return;

  if (routeInfo.name === "themes") {
    setNewButtonVisible(true);
    if (!cards.length) {
      syncHeaderPrint(0);
      renderEmpty();
    } else {
      setSearchVisible(true);
      syncHeaderPrint(cards.length);
      cleanupList = await renderList(main, listOpts);
    }
    if (token !== routeToken) return;
    await openThemesModal();
    return;
  }

  if (routeInfo.name === "home") {
    if (!cards.length) {
      setNewButtonVisible(true);
      syncHeaderPrint(0);
      renderEmpty();
      return;
    }
    navigate("#/list");
    return;
  }

  if (routeInfo.name === "list") {
    if (!cards.length) {
      setNewButtonVisible(true);
      syncHeaderPrint(0);
      renderEmpty();
      if (location.hash !== "#/" && location.hash !== "") {
        history.replaceState(null, "", `${location.pathname}${location.search}#/`);
      }
      return;
    }
    setNewButtonVisible(true);
    setSearchVisible(true);
    syncHeaderPrint(cards.length);
    cleanupList = await renderList(main, listOpts);
    return;
  }

  if (routeInfo.name === "editor") {
    if (!modalRoot) {
      main.innerHTML = `<section class="panel"><p class="error">#modal-root manquant</p></section>`;
      return;
    }
    setNewButtonVisible(true);
    await renderCardsUnderlay(cards);
    if (token !== routeToken) return;

    cleanupEditor = await renderEditor(modalRoot, {
      cardId: routeInfo.cardId,
      toast,
      onSaved: () => {
        toast("Carte enregistrée");
        navigate("#/list");
      },
      onCancel: async () => {
        const list = await loadCards();
        navigate(list.length ? "#/list" : "#/");
      },
      onDeleted: async () => {
        toast("Carte supprimée");
        const list = await loadCards();
        navigate(list.length ? "#/list" : "#/");
      },
    });
  }

  if (pendingPageSlug) {
    const slug = pendingPageSlug;
    pendingPageSlug = null;
    await openPageModal(slug);
  }
}

btnNew.addEventListener("click", () => navigate("#/new"));
if (btnSettings) btnSettings.addEventListener("click", () => openSettingsModal());

if (brandLink) {
  brandLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const r = parseRoute();
    if (r.name === "editor") {
      pendingPageSlug = "about";
      const cards = await loadCards();
      navigate(cards.length ? "#/list" : "#/");
      return;
    }
    openPageModal("about");
  });
}

if (importFile) {
  importFile.addEventListener("change", () => {
    handleImportFile();
  });
}

window.addEventListener("hashchange", () => {
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
    /* Afficher tout de suite l’accueil vide pendant l’ouverture IndexedDB. */
    if (parseRoute().name === "home") {
      setNewButtonVisible(true);
      syncHeaderPrint(0);
      renderEmpty();
    }
    const cards = await loadCards();
    syncHeaderPrint(cards.length);
    if (!location.hash || location.hash === "#") {
      history.replaceState(null, "", cards.length ? "#/list" : "#/");
    }
    await route();
  } catch (err) {
    console.error(err);
    if (main) {
      main.innerHTML = `<section class="panel"><p class="error">Erreur au démarrage : ${err.message}</p></section>`;
    }
  }
}

boot();
