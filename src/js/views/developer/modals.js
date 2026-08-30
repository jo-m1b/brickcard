import { ICON_CLOSE, ICON_DELETE_BIN_2, ICON_SAVE, ICON_WINDOW, modalTitleMarkup } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { focusTopModal } from "../../modal-focus.js";
import { popModalDocumentTitle, pushModalDocumentTitle } from "../../document-title.js";

/**
 * @typedef {"sm"|"md"|"lg"} ModalSize
 * @typedef {"top"|"middle"|"bottom"} ModalAlign
 */

/**
 * Modal gallery / playground (design system).
 * Opens demos in `#modal-root` without changing production modals.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperModals(host) {
  function getDemoRoot() {
    return document.getElementById("developer-demo-root");
  }

  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Modal</p>
        <h1 class="view-title">Modal</h1>
      </header>

      <p class="styleguide-intro">
        Playground to standardize dialogs.
        <strong>3 sizes</strong> (<code>modal--sm</code> / <code>modal--md</code> / <code>modal--lg</code>).
        Below <code>640px</code> width&nbsp;: full screen (no visible overlay).
        Width / height always capped to the <strong>viewport</strong> (<code>100vw</code> / <code>100dvh</code>), not the page scroll.
        Demos stack on top of this gallery (without replacing it).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vocabulary</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Axis</th><th>Options</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Shell</td>
                <td><code>modal-backdrop</code> + <code>modal</code> (<code>role="dialog"</code> <code>aria-modal</code>)</td>
              </tr>
              <tr>
                <td>Size</td>
                <td><code>modal--sm</code> (small, ~640) · <code>modal--md</code> (medium, ~896, default) · <code>modal--lg</code> (large, ~1152)</td>
              </tr>
              <tr>
                <td>Vertical alignment</td>
                <td><code>modal-backdrop--top</code> · <code>modal-backdrop--middle</code> (default) · <code>modal-backdrop--bottom</code></td>
              </tr>
              <tr>
                <td>Responsive</td>
                <td>≤&nbsp;640px&nbsp;: full-screen viewport; otherwise <code>max-width: calc(100vw - 2rem)</code> / <code>max-height: calc(100dvh - 2.5rem)</code></td>
              </tr>
              <tr>
                <td>Header</td>
                <td><code>modal-header</code>: <code>h1.view-title</code> (optional Remix icon on the left, centered; title beside it, wrapping if needed) + <code>btn primary icon-only modal-close</code> (inverted colors, <code>tabindex="-1"</code>)</td>
              </tr>
              <tr>
                <td>Body</td>
                <td><code>modal-body</code> (scrolls if needed)</td>
              </tr>
              <tr>
                <td>Footer</td>
                <td><code>modal-footer</code> + <code>modal-footer-start</code> (save / confirm) + <code>modal-footer-end</code> (danger) — buttons vertically centered</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="form-hint" style="margin-top: 0.75rem">
          Used in the app&nbsp;: settings / MD page / developer space / print (<code>modal--md</code>),
          themes + card editor + theme editor + default themes (<code>modal--lg</code>)
        </p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">App mapping</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Usage</th><th>Size</th></tr>
            </thead>
            <tbody>
              <tr><td>Settings / MD page / developer space / print</td><td><code>modal--md</code></td></tr>
              <tr><td>LEGO themes / card editor / theme editor / default themes</td><td><code>modal--lg</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Sizes</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">On desktop&nbsp;: distinct widths. Shrink the window (&lt;&nbsp;640px) to see full screen.</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="size" data-size="sm">Small — sm</button>
          <button type="button" class="btn secondary" data-demo-modal="size" data-size="md">Medium — md</button>
          <button type="button" class="btn secondary" data-demo-modal="size" data-size="lg">Large — lg</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vertical alignment</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">On the <code>modal-backdrop</code>. Default&nbsp;: middle. No effect in full screen (&lt;&nbsp;640px).</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="align" data-align="top">Top</button>
          <button type="button" class="btn secondary" data-demo-modal="align" data-align="middle">Middle (default)</button>
          <button type="button" class="btn secondary" data-demo-modal="align" data-align="bottom">Bottom</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Header</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">
          Short title + close button (<code>btn primary icon-only</code>, inverted colors).
          Icon on the left (centered); title beside it, wrapping if needed (like toasts).
        </p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="header-plain">Short title</button>
          <button type="button" class="btn secondary" data-demo-modal="header-confirm">Confirmation title</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Long body</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Large modal with lots of content (scroll in the body)</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="scroll">Open (long content)</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Action footer</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">
          <code>modal-footer-start</code> (left&nbsp;: save / confirm) ·
          <code>modal-footer-end</code> (right&nbsp;: danger). Buttons vertically centered (normal + <code>sm</code>).
          <strong>Cancel</strong>&nbsp;: <code>sm</code> if there are other actions in the footer; normal size if it is alone.
        </p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="footer">Left / right slots</button>
          <button type="button" class="btn secondary" data-demo-modal="footer-danger">Delete confirm (sm)</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Behavior</h2>
        <ul class="styleguide-notes">
          <li>Backdrop click → closes (desktop only — in full screen the backdrop is no longer visible)</li>
          <li>Escape → closes (the Close button is not tabbable)</li>
          <li>Close button → closes</li>
          <li><code>body.modal-open</code> blocks background scroll</li>
        </ul>
      </div>
    </section>
  `;

  /** @type {(() => void)|null} */
  let demoCleanup = null;

  function closeDemo() {
    if (demoCleanup) {
      demoCleanup();
      demoCleanup = null;
    }
  }

  /**
   * @param {{
   *   size?: ModalSize,
   *   align?: ModalAlign,
   *   title: string,
   *   icon?: string,
   *   bodyHtml: string,
   *   footerHtml?: string,
   * }} spec
   */
  function openDemo(spec) {
    const demoRoot = getDemoRoot();
    if (!demoRoot) return;
    closeDemo();

    const size = spec.size || "md";
    const align = spec.align || "middle";
    const sizeClass = `modal--${size}`;
    const alignClass =
      align === "top" || align === "bottom" || align === "middle"
        ? ` modal-backdrop--${align}`
        : " modal-backdrop--middle";
    const footer = spec.footerHtml
      ? `<div class="modal-footer">${spec.footerHtml}</div>`
      : "";

    demoRoot.innerHTML = `
      <div class="modal-backdrop${alignClass}" id="demo-modal-backdrop" role="presentation">
        <div
          class="modal ${sizeClass}"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
        >
          <div class="modal-header">
            <div>
              <h1 class="view-title" id="demo-modal-title">${modalTitleMarkup(spec.title, spec.icon || ICON_WINDOW)}</h1>
            </div>
            <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="demo-modal-close">
              ${ICON_CLOSE}
              <span class="visually-hidden">Close</span>
            </button>
          </div>
          <div class="modal-body" tabindex="-1">
            ${spec.bodyHtml}
          </div>
          ${footer}
        </div>
      </div>
    `;

    const backdrop = demoRoot.querySelector("#demo-modal-backdrop");
    const btnClose = demoRoot.querySelector("#demo-modal-close");

    const onBackdrop = (/** @type {MouseEvent} */ e) => {
      if (e.target === backdrop) closeDemo();
    };
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeDemo();
      }
    };

    backdrop?.addEventListener("click", onBackdrop);
    btnClose?.addEventListener("click", closeDemo);
    demoRoot.querySelectorAll("[data-demo-close]").forEach((el) => {
      el.addEventListener("click", closeDemo);
    });
    document.addEventListener("keydown", onKey, true);
    queueMicrotask(() => focusTopModal());
    pushModalDocumentTitle(spec.title, "Design system");

    demoCleanup = () => {
      backdrop?.removeEventListener("click", onBackdrop);
      btnClose?.removeEventListener("click", closeDemo);
      document.removeEventListener("keydown", onKey, true);
      demoRoot.innerHTML = "";
      popModalDocumentTitle();
    };
  }

  function longBodyHtml() {
    const paras = Array.from({ length: 12 }, (_, i) => {
      return `<p>Demo paragraph ${i + 1}. Intentionally long content to test internal scrolling of <code>modal-body</code>.</p>`;
    }).join("\n");
    return `<div class="md-content">${paras}</div>`;
  }

  const sizeLabels = { sm: "small", md: "medium", lg: "large" };

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const btn = t.closest?.("[data-demo-modal]");
    if (!btn || !host.contains(btn)) return;
    const kind = btn.getAttribute("data-demo-modal");
    if (kind === "size") {
      const size = /** @type {ModalSize} */ (btn.getAttribute("data-size") || "md");
      openDemo({
        size,
        title: `Modal ${sizeLabels[size] || size}`,
        bodyHtml: `<p>Class <code>modal--${size}</code>. Below 640px&nbsp;: full screen.</p><p>Demo body. On a large screen, width follows the size. On a phone, the modal fills the screen.</p>`,
      });
      return;
    }
    if (kind === "align") {
      const align = /** @type {ModalAlign} */ (btn.getAttribute("data-align") || "middle");
      const alignLabels = { top: "top", middle: "middle", bottom: "bottom" };
      openDemo({
        size: "sm",
        align,
        title: `Aligned ${alignLabels[align] || align}`,
        bodyHtml: `<p>Class <code>modal-backdrop--${align}</code> on the backdrop.</p><p>Small modal so the vertical position is easy to see. The default with no class (or <code>--middle</code>) centers vertically.</p>`,
      });
      return;
    }
    if (kind === "header-plain") {
      openDemo({
        size: "md",
        title: "Settings",
        icon: "tools",
        bodyHtml: `<p>Header&nbsp;: short title + <code>btn primary icon-only modal-close</code> (inverted colors on the ink header).</p>`,
      });
      return;
    }
    if (kind === "header-confirm") {
      openDemo({
        size: "sm",
        title: "Delete the card “Saucer Centurien (#6939)”?",
        icon: "delete-bin-2",
        bodyHtml: `<p class="modal-confirm-msg">Warning, deletion is permanent and cannot be undone! Do you want to continue?</p>`,
        footerHtml: `
          <div class="modal-footer-end">
            <button type="button" class="btn secondary sm" data-demo-close>Cancel</button>
            <button type="button" class="btn danger" data-demo-close>${ICON_DELETE_BIN_2}<span>Delete</span></button>
          </div>
        `,
      });
      return;
    }
    if (kind === "scroll") {
      openDemo({
        size: "lg",
        title: "Long content",
        bodyHtml: `<p><code>modal--lg</code> — the body scrolls.</p>${longBodyHtml()}`,
      });
      return;
    }
    if (kind === "footer") {
      openDemo({
        size: "md",
        title: "Two-slot footer",
        bodyHtml: `<p>Left&nbsp;: save / confirm · Right&nbsp;: danger. Mixed sizes (normal + <code>sm</code>).</p><p>Buttons stay vertically centered in the footer, regardless of their size.</p>`,
        footerHtml: `
          <div class="modal-footer-start">
            <button type="button" class="btn primary" data-demo-close>${ICON_SAVE}<span>Save</span></button>
            <button type="button" class="btn secondary sm" data-demo-close>Cancel</button>
          </div>
          <div class="modal-footer-end">
            <button type="button" class="btn danger" data-demo-close>${ICON_DELETE_BIN_2}<span>Delete</span></button>
          </div>
        `,
      });
      return;
    }
    if (kind === "footer-danger") {
      openDemo({
        size: "sm",
        title: "Delete the theme “Star Wars”?",
        icon: "delete-bin-2",
        bodyHtml: `<p class="modal-confirm-msg">This action is irreversible (demo).</p>`,
        footerHtml: `
          <div class="modal-footer-start">
            <button type="button" class="btn secondary sm" data-demo-close>Cancel</button>
          </div>
          <div class="modal-footer-end">
            <button type="button" class="btn danger" data-demo-close>${ICON_DELETE_BIN_2}<span>Delete</span></button>
          </div>
        `,
      });
    }
  };

  host.addEventListener("click", onClick);

  return () => {
    host.removeEventListener("click", onClick);
    closeDemo();
    host.innerHTML = "";
  };
}
