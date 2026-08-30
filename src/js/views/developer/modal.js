import { ICON_ARROW_RIGHT_WIDE, ICON_CLOSE, modalTitleMarkup } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { setAppDocumentTitle } from "../../document-title.js";
import { toast } from "../../toast.js";
import { _t } from "../../i18n.js";

/** @type {Record<string, () => Promise<(host: HTMLElement) => (() => void)|void>>} */
const PAGE_LOADERS = {
  index: () => import("./index.js").then((m) => m.renderDeveloperIndex),
  typography: () => import("./typography.js").then((m) => m.renderDeveloperTypography),
  links: () => import("./links.js").then((m) => m.renderDeveloperLinks),
  tiles: () => import("./tiles.js").then((m) => m.renderDeveloperTiles),
  buttons: () => import("./buttons.js").then((m) => m.renderDeveloperButtons),
  fields: () => import("./fields.js").then((m) => m.renderDeveloperFields),
  selects: () => import("./selects.js").then((m) => m.renderDeveloperSelects),
  sliders: () => import("./sliders.js").then((m) => m.renderDeveloperSliders),
  checkboxes: () => import("./checkboxes.js").then((m) => m.renderDeveloperCheckboxes),
  radios: () => import("./radios.js").then((m) => m.renderDeveloperRadios),
  colors: () => import("./colors.js").then((m) => m.renderDeveloperColors),
  images: () => import("./images.js").then((m) => m.renderDeveloperImages),
  search: () => import("./search.js").then((m) => m.renderDeveloperSearch),
  modals: () => import("./modals.js").then((m) => m.renderDeveloperModals),
  notifications: () => import("./notifications.js").then((m) => m.renderDeveloperNotifications),
  loading: () => import("./loading.js").then((m) => m.renderDeveloperLoading),
  welcome: () => import("./welcome.js").then((m) => m.renderDeveloperWelcome),
};

/** @typedef {{ name: string, icon?: string }} DeveloperSection */

/** @type {DeveloperSection} */
const SECTION_DESIGN = { name: "Design system", icon: "collage" };
/** @type {DeveloperSection} */
const SECTION_TOOLS = { name: "Development help", icon: "pencil-ruler-2" };
/** @type {DeveloperSection} */
const SECTION_MODELS = { name: "Templates", icon: "pages" };

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
 *   setPage: (page: string, extras?: { presetPage?: string, themeId?: string }) => Promise<void>,
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
 * @returns {Promise<() => void>}
 */
export async function renderDeveloperModal(host, opts) {
  let onClose = opts.onClose;
  let onNavigate = opts.onNavigate;
  const page = opts.page || "index";
  const extras = { presetPage: opts.presetPage, themeId: opts.themeId };

  if (session && host.querySelector("#developer-modal-backdrop")) {
    session.setOnClose(onClose);
    session.setOnNavigate(onNavigate);
    await session.setPage(page, extras);
    return session.cleanup;
  }

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="developer-modal-backdrop" role="presentation">
      <div class="modal ${page === "theme-presets" ? "modal--lg" : "modal--md"}" role="dialog" aria-modal="true" aria-labelledby="developer-modal-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="developer-modal-title">${modalTitleMarkup("Developer space", "tools")}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-developer-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
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
  let pageToken = 0;
  let editorToken = 0;
  /** @type {() => void} */
  let editorCleanup = () => {};
  let shownPresetKey = "";
  /** @type {typeof import("./theme-presets.js") | null} */
  let presetsMod = null;

  const PRESET_LIST_HASH = "#developer/theme-presets";

  async function ensurePresets() {
    if (!presetsMod) presetsMod = await import("./theme-presets.js");
    return presetsMod;
  }

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
    let editor;
    let presets;
    try {
      presets = await ensurePresets();
      editor = await import("./theme-presets-editor.js");
    } catch (err) {
      console.error(err);
      const msg = err && err.message ? err.message : String(err || _t("Loading error"));
      toast(msg, "error");
      goToPresetList();
      return;
    }
    if (token !== editorToken) return;

    const cleanup = await editor.renderPresetDraftEditor(demoRoot, {
      themeId: nextExtras.presetPage === "edit" ? nextExtras.themeId || null : null,
      onClose: () => {
        const id = nextExtras.presetPage === "edit" ? nextExtras.themeId : null;
        goToPresetList();
        if (id) presets.focusPresetDraftInList(id);
      },
      onSaved: (meta) => {
        if (meta?.isNew) {
          if (!presets.refreshPresetDraftAfterCreate(meta.theme)) {
            /* liste absente */
          }
        } else {
          presets.patchPresetDraftInList(meta.theme, meta.previousId);
        }
        goToPresetList();
        presets.focusPresetDraftInList(meta?.theme?.id);
      },
      onDeleted: (id) => {
        presets.removePresetDraftFromList(id);
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
  async function setPage(nextPage, nextExtras = {}) {
    const stayOnPresets = renderedPage === "theme-presets" && nextPage === "theme-presets";
    let pageToRender = nextPage;
    if (!stayOnPresets) {
      const token = ++pageToken;
      /** @type {((host: HTMLElement) => (() => void)|void) | null} */
      let renderFn = null;
      /** @type {typeof import("./theme-presets.js") | null} */
      let presets = null;
      try {
        if (pageToRender === "theme-presets") {
          presets = await ensurePresets();
        } else {
          const loader = PAGE_LOADERS[pageToRender] || PAGE_LOADERS.index;
          if (!PAGE_LOADERS[pageToRender]) pageToRender = "index";
          renderFn = await loader();
        }
      } catch (err) {
        console.error(err);
        if (renderedPage) {
          const msg = err && err.message ? err.message : String(err || _t("Loading error"));
          toast(msg, "error");
          return;
        }
        if (pageToRender !== "index") {
          const msg = err && err.message ? err.message : String(err || _t("Loading error"));
          toast(msg, "error");
          pageToRender = "index";
          renderFn = await PAGE_LOADERS.index();
        } else {
          throw err;
        }
      }
      if (token !== pageToken) return;
      if (renderedPage === "theme-presets") closePresetEditor();
      pageCleanup();
      clearLiftedChrome(modal);
      if (!body || !titleEl) return;
      if (pageToRender === "theme-presets" && presets) {
        pageCleanup =
          presets.renderDeveloperThemePresets(body, {
            onCreate: () => onNavigate(`${PRESET_LIST_HASH}/new`),
            onEdit: (id) =>
              onNavigate(`${PRESET_LIST_HASH}/edit/${encodeURIComponent(id)}`),
          }) || (() => {});
      } else if (renderFn) {
        pageCleanup = renderFn(body) || (() => {});
      }
      liftStyleguideHeader(body, titleEl, pageToRender);
      if (modal) {
        liftThemesToolbar(body, modal);
        liftModalFooter(body, modal);
        const isPresets = pageToRender === "theme-presets";
        modal.classList.toggle("modal--lg", isPresets);
        modal.classList.toggle("modal--md", !isPresets);
        modal.classList.toggle(
          "is-fixed-h",
          Boolean(modal.querySelector(":scope > .themes-toolbar")),
        );
      }
      body.scrollTop = 0;
      if (backdrop) backdrop.scrollTop = 0;
      if (modal) modal.scrollTop = 0;
      renderedPage = pageToRender;
    }
    await syncPresetEditor(pageToRender, nextExtras);
    if (pageToRender === "theme-presets") {
      const presets = await ensurePresets();
      requestAnimationFrame(() => presets.applyPendingPresetFocus());
    }
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

  try {
    await setPage(page, extras);
  } catch (err) {
    cleanup();
    throw err;
  }
  return cleanup;
}
