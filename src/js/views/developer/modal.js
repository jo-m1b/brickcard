import { ICON_ARROW_RIGHT_WIDE, ICON_CLOSE, modalTitleMarkup } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { setAppDocumentTitle } from "../../document-title.js";
import { renderDeveloperIndex } from "./index.js";
import { renderDeveloperTypography } from "./typography.js";
import { renderDeveloperLinks } from "./links.js";
import { renderDeveloperTiles } from "./tiles.js";
import { renderDeveloperButtons } from "./buttons.js";
import { renderDeveloperFields } from "./fields.js";
import { renderDeveloperSelects } from "./selects.js";
import { renderDeveloperSliders } from "./sliders.js";
import { renderDeveloperCheckboxes } from "./checkboxes.js";
import { renderDeveloperRadios } from "./radios.js";
import { renderDeveloperColors } from "./colors.js";
import { renderDeveloperImages } from "./images.js";
import { renderDeveloperSearch } from "./search.js";
import { renderDeveloperModals } from "./modals.js";
import { renderDeveloperNotifications } from "./notifications.js";
import { renderDeveloperLoading } from "./loading.js";
import { renderDeveloperWelcome } from "./welcome.js";
import {
  refreshPresetDraftAfterCreate,
  patchPresetDraftInList,
  removePresetDraftFromList,
  renderDeveloperThemePresets,
} from "./theme-presets.js";
import { renderPresetDraftEditor } from "./theme-presets-editor.js";

/** @type {Record<string, (host: HTMLElement) => (() => void)|void>} */
const PAGES = {
  index: renderDeveloperIndex,
  typography: renderDeveloperTypography,
  links: renderDeveloperLinks,
  tiles: renderDeveloperTiles,
  buttons: renderDeveloperButtons,
  fields: renderDeveloperFields,
  selects: renderDeveloperSelects,
  sliders: renderDeveloperSliders,
  checkboxes: renderDeveloperCheckboxes,
  radios: renderDeveloperRadios,
  colors: renderDeveloperColors,
  images: renderDeveloperImages,
  search: renderDeveloperSearch,
  modals: renderDeveloperModals,
  notifications: renderDeveloperNotifications,
  loading: renderDeveloperLoading,
  welcome: renderDeveloperWelcome,
};

/** @typedef {{ name: string, icon?: string }} DeveloperSection */

/** @type {DeveloperSection} */
const SECTION_DESIGN = { name: "Système de design", icon: "collage" };
/** @type {DeveloperSection} */
const SECTION_TOOLS = { name: "Aide au développement", icon: "pencil-ruler-2" };
/** @type {DeveloperSection} */
const SECTION_MODELS = { name: "Modèles", icon: "pages" };

/** Section d’index pour les pages ouvertes par une tuile (`#developer`). */
const PAGE_SECTIONS = {
  typography: SECTION_DESIGN,
  links: SECTION_DESIGN,
  tiles: SECTION_DESIGN,
  buttons: SECTION_DESIGN,
  fields: SECTION_DESIGN,
  selects: SECTION_DESIGN,
  sliders: SECTION_DESIGN,
  checkboxes: SECTION_DESIGN,
  radios: SECTION_DESIGN,
  colors: SECTION_DESIGN,
  images: SECTION_DESIGN,
  search: SECTION_DESIGN,
  modals: SECTION_DESIGN,
  notifications: SECTION_DESIGN,
  loading: SECTION_MODELS,
  welcome: SECTION_MODELS,
  "theme-presets": SECTION_TOOLS,
};

/**
 * @type {null | {
 *   cleanup: () => void,
 *   setPage: (page: string, extras?: { presetPage?: string, themeId?: string }) => void,
 *   setOnClose: (fn: () => void) => void,
 *   setOnNavigate: (fn: (hash: string, opts?: { replace?: boolean }) => void) => void,
 * }}
 */
let session = null;

/**
 * Titre du dialog = header de la galerie (comme les pages Markdown).
 * Pages tuile : section (lien `#developer`, icône optionnelle) + séparateur + titre de page (pas d’icône de tuile).
 * @param {HTMLElement} body
 * @param {HTMLElement} titleEl
 * @param {string} page
 */
function liftStyleguideHeader(body, titleEl, page) {
  const head = body.querySelector(".styleguide-header");
  if (!head) return;

  const h1 = head.querySelector("h1");
  const section = PAGE_SECTIONS[page];

  if (h1) {
    const pageTitle = h1.textContent || "";
    if (section) {
      titleEl.innerHTML = `${linkMarkup(section.name, {
        href: "#developer",
        icon: section.icon || false,
      })}${ICON_ARROW_RIGHT_WIDE}${modalTitleMarkup(pageTitle)}`;
      setAppDocumentTitle(pageTitle, section.name);
    } else {
      titleEl.innerHTML = modalTitleMarkup(pageTitle, "tools");
      setAppDocumentTitle(pageTitle);
    }
    h1.remove();
  }

  head.remove();
}

/**
 * Pied de page optionnel : déplacé hors du corps pour rester collé au bas de la modale.
 * @param {HTMLElement} body
 * @param {HTMLElement} modal
 */
function liftModalFooter(body, modal) {
  modal.querySelectorAll(":scope > .modal-footer").forEach((el) => el.remove());
  const footer = body.querySelector(".modal-footer");
  if (footer) modal.appendChild(footer);
}

/**
 * Barre de recherche : collée sous le header, hors du corps qui défile (comme `#themes`).
 * @param {HTMLElement} body
 * @param {HTMLElement} modal
 */
function liftThemesToolbar(body, modal) {
  modal.querySelectorAll(":scope > .themes-toolbar").forEach((el) => el.remove());
  const bar = body.querySelector(".themes-toolbar");
  if (!bar) return;
  const header = modal.querySelector(".modal-header");
  if (header) header.after(bar);
  else modal.insertBefore(bar, modal.querySelector(".modal-body"));
}

/** @param {HTMLElement|null} modal */
function clearLiftedChrome(modal) {
  if (!modal) return;
  modal
    .querySelectorAll(":scope > .modal-footer, :scope > .themes-toolbar")
    .forEach((el) => el.remove());
}

/**
 * Espace développeur en modale overlay (même coquille que les pages Markdown).
 * Un second appel avec la coquille déjà en place ne swap que le corps.
 * Liste `#developer/theme-presets` : conservée sous l’éditeur (`/new`, `/edit/:slug`).
 * @param {HTMLElement} host Conteneur (#modal-root)
 * @param {{
 *   page?: string,
 *   presetPage?: string,
 *   themeId?: string,
 *   onClose: () => void,
 *   onNavigate: (hash: string, opts?: { replace?: boolean }) => void,
 * }} opts
 * @returns {() => void}
 */
export function renderDeveloperModal(host, opts) {
  let onClose = opts.onClose;
  let onNavigate = opts.onNavigate;
  const page = opts.page || "index";
  const extras = { presetPage: opts.presetPage, themeId: opts.themeId };

  if (session && host.querySelector("#developer-modal-backdrop")) {
    session.setOnClose(onClose);
    session.setOnNavigate(onNavigate);
    session.setPage(page, extras);
    return session.cleanup;
  }

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="developer-modal-backdrop" role="presentation">
      <div class="modal modal--lg" role="dialog" aria-modal="true" aria-labelledby="developer-modal-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="developer-modal-title">${modalTitleMarkup("Espace développeur", "tools")}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-developer-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" id="developer-modal-body" tabindex="-1"></div>
      </div>
    </div>
    <div id="developer-demo-root"></div>
  `;

  const body = host.querySelector("#developer-modal-body");
  const titleEl = host.querySelector("#developer-modal-title");
  const backdrop = host.querySelector("#developer-modal-backdrop");
  const modal = host.querySelector("#developer-modal-backdrop > .modal");
  const btnClose = host.querySelector("#btn-developer-close");
  const demoRoot = host.querySelector("#developer-demo-root");

  /** @type {() => void} */
  let pageCleanup = () => {};
  /** @type {string} */
  let renderedPage = "";
  let editorToken = 0;
  /** @type {() => void} */
  let editorCleanup = () => {};
  let shownPresetKey = "";

  const PRESET_LIST_HASH = "#developer/theme-presets";

  function closePresetEditor() {
    editorToken += 1;
    editorCleanup();
    editorCleanup = () => {};
    shownPresetKey = "";
    if (demoRoot) demoRoot.innerHTML = "";
  }

  function goToPresetList() {
    const hash = String(location.hash || "");
    if (!hash.includes("developer/theme-presets")) return;
    onNavigate(PRESET_LIST_HASH, { replace: true });
  }

  /**
   * @param {string} nextPage
   * @param {{ presetPage?: string, themeId?: string }} extras
   */
  function presetEditorKey(nextPage, extras) {
    if (nextPage !== "theme-presets") return "";
    if (extras.presetPage === "new") return "new";
    if (extras.presetPage === "edit") return `edit:${extras.themeId || ""}`;
    return "";
  }

  /**
   * @param {string} nextPage
   * @param {{ presetPage?: string, themeId?: string }} nextExtras
   */
  async function syncPresetEditor(nextPage, nextExtras) {
    const nextKey = presetEditorKey(nextPage, nextExtras);
    if (nextKey && nextKey === shownPresetKey) return;
    closePresetEditor();
    if (!nextKey || !demoRoot) return;

    const token = editorToken;
    const cleanup = await renderPresetDraftEditor(demoRoot, {
      themeId: nextExtras.presetPage === "edit" ? nextExtras.themeId || null : null,
      onClose: goToPresetList,
      onSaved: (meta) => {
        if (meta?.isNew) {
          if (!refreshPresetDraftAfterCreate(meta.theme)) {
            /* liste absente */
          }
        } else {
          patchPresetDraftInList(meta.theme, meta.previousId);
        }
        goToPresetList();
      },
      onDeleted: (id) => {
        removePresetDraftFromList(id);
        goToPresetList();
      },
    });
    if (token !== editorToken) {
      if (cleanup) cleanup();
      return;
    }
    if (!cleanup) {
      goToPresetList();
      return;
    }
    editorCleanup = cleanup;
    shownPresetKey = nextKey;
  }

  /**
   * @param {string} nextPage
   * @param {{ presetPage?: string, themeId?: string }} [nextExtras]
   */
  function setPage(nextPage, nextExtras = {}) {
    const stayOnPresets = renderedPage === "theme-presets" && nextPage === "theme-presets";
    if (!stayOnPresets) {
      if (renderedPage === "theme-presets") closePresetEditor();
      pageCleanup();
      clearLiftedChrome(modal);
      if (modal) {
        modal.classList.toggle("is-fixed-h", nextPage === "theme-presets");
      }
      if (!body || !titleEl) return;
      if (nextPage === "theme-presets") {
        pageCleanup =
          renderDeveloperThemePresets(body, {
            onCreate: () => onNavigate(`${PRESET_LIST_HASH}/new`),
            onEdit: (id) =>
              onNavigate(`${PRESET_LIST_HASH}/edit/${encodeURIComponent(id)}`),
          }) || (() => {});
      } else {
        const renderPage = PAGES[nextPage] || PAGES.index;
        pageCleanup = renderPage(body) || (() => {});
      }
      liftStyleguideHeader(body, titleEl, nextPage);
      if (modal) {
        liftThemesToolbar(body, modal);
        liftModalFooter(body, modal);
      }
      body.scrollTop = 0;
      if (backdrop) backdrop.scrollTop = 0;
      if (modal) modal.scrollTop = 0;
      renderedPage = nextPage;
    }
    void syncPresetEditor(nextPage, nextExtras);
  }

  const close = () => onClose();

  /** @param {MouseEvent} e */
  const onBackdropClick = (e) => {
    if (e.target === backdrop) close();
  };

  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    if (demoRoot && demoRoot.childElementCount) return;
    e.preventDefault();
    close();
  };

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  function cleanup() {
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
    closePresetEditor();
    pageCleanup();
    clearLiftedChrome(modal);
    session = null;
  }

  session = {
    cleanup,
    setPage,
    setOnClose(fn) {
      onClose = fn;
    },
    setOnNavigate(fn) {
      onNavigate = fn;
    },
  };

  setPage(page, extras);
  return cleanup;
}
