import { loadMarkdownPage } from "../markdown.js";

/**
 * Affiche une page Markdown (`data/page-{{slug}}.md`) en modale overlay.
 * @param {HTMLElement} host Conteneur modale (#modal-root)
 * @param {{ slug: string, onClose: () => void, toast?: (msg: string, type?: string) => void }} opts
 * @returns {Promise<() => void>} cleanup
 */
export async function renderPageModal(host, opts) {
  const { slug, onClose, toast } = opts;

  let page;
  try {
    page = await loadMarkdownPage(slug);
  } catch (err) {
    console.error(err);
    if (toast) toast(err.message || "Page introuvable", "error");
    onClose();
    return () => {};
  }

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="page-modal-backdrop" role="presentation">
      <div class="modal modal-page" role="dialog" aria-modal="true" aria-labelledby="page-modal-title">
        <div class="modal-header">
          <div>
            <h2 class="view-title" id="page-modal-title">${escapeAttr(page.title)}</h2>
          </div>
          <button type="button" class="btn-icon modal-close" id="btn-page-close" aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.586L16.95 5.63599L18.364 7.04999L13.414 12L18.364 16.95L16.95 18.364L12 13.414L7.04999 18.364L5.63599 16.95L10.586 12L5.63599 7.04999L7.04999 5.63599L12 10.586Z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <article class="md-content" id="page-md-body"></article>
        </div>
      </div>
    </div>
  `;

  const body = host.querySelector("#page-md-body");
  if (body) body.innerHTML = page.html;

  // Le H1 du markdown est déjà dans le header de la modale → on le retire du corps.
  const firstH1 = body?.querySelector("h1");
  if (firstH1) firstH1.remove();

  const backdrop = host.querySelector("#page-modal-backdrop");
  const btnClose = host.querySelector("#btn-page-close");

  const close = () => {
    cleanup();
    onClose();
  };

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
    host.innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  return cleanup;
}

/** @param {string} s */
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}
