import { ICON_CLOSE } from "../icons.js";
import { loadMarkdownPage } from "../markdown.js";
import { setAppDocumentTitle } from "../document-title.js";
import { APP_NAME, APP_VERSION } from "../version.js";
import { _t } from "../i18n.js";

function aboutBrandHtml() {
  return `
    <p class="about-brand">
      <img class="brand-logo" src="img/brickcard-logo.svg" width="40" height="55" alt="" />
      <span class="brand-text">
        <span class="brand-name">${APP_NAME}</span>
        <span class="brand-version">v${APP_VERSION}</span>
      </span>
    </p>
  `;
}

/**
 * Plain-text Markdown title (already HTML-escaped) for `document.title`.
 * @param {{ title: string }} page
 * @returns {string}
 */
function pageTitleText(page) {
  const t = document.createElement("template");
  t.innerHTML = page.title || "";
  return (t.content.textContent || "").trim();
}

/**
 * Shows a Markdown page (`data/page-{{slug}}.md` or `.{{locale}}.md`) in an overlay modal.
 * @param {HTMLElement} host Modal container (#modal-root)
 * @param {{ slug: string, onClose: () => void, toast?: (msg: string, type?: string) => void }} opts
 * @returns {Promise<(() => void)|null>} cleanup, or `null` if the page is not found
 */
export async function renderPageModal(host, opts) {
  const { slug, onClose, toast } = opts;

  let page;
  try {
    page = await loadMarkdownPage(slug);
  } catch (err) {
    console.error(err);
    if (toast) toast(err.message || _t("Page not found"), "error");
    return null;
  }

  document.body.classList.add("modal-open");

  host.innerHTML = `
    <div class="modal-backdrop" id="page-modal-backdrop" role="presentation">
      <div class="modal modal--md" role="dialog" aria-modal="true" aria-labelledby="page-modal-title">
        <div class="modal-header">
          <div>
            <h1 class="view-title" id="page-modal-title">${page.title}</h1>
          </div>
          <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="btn-page-close">
            ${ICON_CLOSE}
            <span class="visually-hidden">${_t("Close")}</span>
          </button>
        </div>
        <div class="modal-body" tabindex="-1">
          <article class="md-content" id="page-md-body"></article>
        </div>
      </div>
    </div>
  `;

  setAppDocumentTitle(pageTitleText(page));

  const body = host.querySelector("#page-md-body");
  if (body) body.innerHTML = page.html;

  // Markdown # = dialog title (h1). ## / ### stay h2 / h3.
  const firstH1 = body?.querySelector("h1");
  if (firstH1) firstH1.remove();

  if (slug === "about" && body) {
    body.insertAdjacentHTML("afterbegin", aboutBrandHtml());
  }

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
