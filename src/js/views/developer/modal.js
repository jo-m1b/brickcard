import { ICON_ARROW_RIGHT_WIDE, ICON_CLOSE, modalTitleMarkup } from "../../icons.js";
import { linkMarkup } from "../../link.js";
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
import { renderDeveloperThemePresets } from "./theme-presets.js";

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
  "theme-presets": renderDeveloperThemePresets,
};

/** @typedef {{ name: string, icon?: string }} DeveloperSection */

/** @type {DeveloperSection} */
const SECTION_DESIGN = { name: "Système de design", icon: "collage" };
/** @type {DeveloperSection} */
const SECTION_TOOLS = { name: "Aide au développement", icon: "pencil-ruler-2" };

/** Section d’index pour les pages ouvertes par une tuile (`#/developer`). */
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
  "theme-presets": SECTION_TOOLS,
};

/**
 * @type {null | {
 *   cleanup: () => void,
 *   setPage: (page: string) => void,
 *   setOnClose: (fn: () => void) => void,
 * }}
 */
let session = null;

/**
 * Titre du dialog = header de la galerie (comme les pages Markdown).
 * Pages tuile : section (lien `#/developer`, icône optionnelle) + séparateur + titre de page (pas d’icône de tuile).
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
        href: "#/developer",
        icon: section.icon || false,
      })}${ICON_ARROW_RIGHT_WIDE}${modalTitleMarkup(pageTitle)}`;
    } else {
      titleEl.innerHTML = modalTitleMarkup(pageTitle, "tools");
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
 * Barre de recherche : collée sous le header, hors du corps qui défile (comme `#/themes`).
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
 * @param {HTMLElement} host Conteneur (#modal-root)
 * @param {{ page?: string, onClose: () => void }} opts
 * @returns {() => void}
 */
export function renderDeveloperModal(host, opts) {
  let onClose = opts.onClose;
  const page = opts.page || "index";

  if (session && host.querySelector("#developer-modal-backdrop")) {
    session.setOnClose(onClose);
    session.setPage(page);
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

  function setPage(nextPage) {
    pageCleanup();
    clearLiftedChrome(modal);
    if (modal) {
      modal.classList.toggle("is-fixed-h", nextPage === "theme-presets");
    }
    if (demoRoot) demoRoot.innerHTML = "";
    if (!body || !titleEl) return;
    const renderPage = PAGES[nextPage] || PAGES.index;
    pageCleanup = renderPage(body) || (() => {});
    liftStyleguideHeader(body, titleEl, nextPage);
    if (modal) {
      liftThemesToolbar(body, modal);
      liftModalFooter(body, modal);
    }
    body.scrollTop = 0;
    if (backdrop) backdrop.scrollTop = 0;
    if (modal) modal.scrollTop = 0;
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
  };

  setPage(page);
  return cleanup;
}
