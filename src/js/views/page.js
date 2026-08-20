import { ICON_ARROW_RIGHT_WIDE, ICON_CLOSE } from "../icons.js";
import { loadMarkdownPage } from "../markdown.js";
import { APP_VERSION } from "../version.js";

/** Logo app en titre de modale : même taille / `currentColor` qu’une icône Remix. */
const MODAL_TITLE_BRAND = `<span class="modal-title-brand" aria-hidden="true"></span>`;

/**
 * @param {{ slug: string, title: string }} page Titre déjà en HTML (échappé)
 * @returns {string}
 */
function pageModalTitleMarkup(page) {
  const title = page.title || "";
  if (page.slug !== "about") return title;
  return `<span class="modal-title-lead">${MODAL_TITLE_BRAND}<span>Brickcard Generator v${APP_VERSION}</span></span>${ICON_ARROW_RIGHT_WIDE}<span>${title}</span>`;
}

/**
 * Affiche une page Markdown (`data/page-{{slug}}.md`) en modale overlay.
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{ slug: string, onClose: () => void, toast?: (msg: string, type?: string) => void }} opts
 * @returns {Promise<(() => void)|null>} cleanup, ou `null` si la page est introuvable
 */
export async function renderPageModal(host, opts) {
  const { slug, onClose, toast } = opts;

  let page;
  try {
    page = await loadMarkdownPage(slug);
  } catch (err) {
    console.error(err);
    if (toast) toast(err.message || "Page introuvable", "error");
    return null;
  }

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="page-modal-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="page-modal-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="page-modal-title">${pageModalTitleMarkup(page)}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-page-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">Fermer</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <article class="md-content" id="page-md-body"></article>
        </div>
      </div>
    </div>
  `;

  const body = host.querySelector("#page-md-body");
  if (body) body.innerHTML = page.html;

  // Le # du markdown = titre du dialog (h1). ## / ### restent h2 / h3.
  const firstH1 = body?.querySelector("h1");
  if (firstH1) firstH1.remove();

  const backdrop = host.querySelector("#page-modal-backdrop");
  const btnClose = host.querySelector("#btn-page-close");

  const close = () => onClose();

  /** @param {MouseEvent} e */
  const onBackdropClick = (e) => {
    if (e.target === backdrop) close();
  };

  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  backdrop?.addEventListener("click", onBackdropClick);
  btnClose?.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  function cleanup() {
    document.removeEventListener("keydown", onKey);
    backdrop?.removeEventListener("click", onBackdropClick);
    btnClose?.removeEventListener("click", close);
  }

  return cleanup;
}
