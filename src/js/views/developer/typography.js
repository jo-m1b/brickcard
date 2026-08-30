import { ICON_CLOSE, ICON_TOOLS, modalTitleMarkup } from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * Typography gallery of the design system (2 typefaces max).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperTypography(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Typography</p>
        <h1 class="view-title">Typography</h1>
      </header>

      <p class="styleguide-intro">
        Open Sans for the UI, Inter for the cards.
        Class = appearance&nbsp;; tag <code>h1</code>–<code>h3</code> = document outline.
        One level-1 heading per view, do not skip levels.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Typefaces</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr>
                <th>Typeface</th>
                <th>Variable</th>
                <th>Role</th>
                <th>Weights</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Open Sans</strong></td>
                <td><code>--font-ui</code></td>
                <td>The whole app (text, headings, forms, buttons, brand, code…)</td>
                <td>400 · 500 · 600 · 700 (+ italic 400)</td>
              </tr>
              <tr>
                <td><strong>Inter</strong></td>
                <td><code>--font-card</code></td>
                <td>Cards only (preview &amp; print)</td>
                <td>400 · 500 · 600 · 700</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="styleguide-type-specimens" aria-label="Typeface specimens">
          <p class="styleguide-type-specimen styleguide-type-specimen--ui">
            <span class="styleguide-type-specimen-label">Open Sans — UI</span>
            Brickcard — Aa Bb Cc 0123456789
          </p>
          <p class="styleguide-type-specimen styleguide-type-specimen--card">
            <span class="styleguide-type-specimen-label">Inter — cards</span>
            Brickcard — Aa Bb Cc 0123456789
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Text colors</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Token</th><th>Usage</th><th>Example</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>--ink</code></td>
                <td>Primary text</td>
                <td><span style="color: var(--ink)">Ink text</span></td>
              </tr>
              <tr>
                <td><code>--ink-soft</code></td>
                <td>Descriptions, hints, meta</td>
                <td><span style="color: var(--ink-soft)">Ink-soft text</span></td>
              </tr>
              <tr>
                <td><code>--muted</code></td>
                <td>Muted secondary</td>
                <td><span style="color: var(--muted)">Muted text</span></td>
              </tr>
              <tr>
                <td><code>--form-error</code></td>
                <td>Error messages</td>
                <td><span class="form-error" style="margin:0">Error text</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Headings — appearance</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          Specimens in <code>p</code> (this gallery already has its <code>h1</code>).
          In production, the tag follows the “&nbsp;outline&nbsp;” table below.
        </p>
        <div class="styleguide-type-demo">
          <p class="view-title">View title (view-title)</p>
          <p class="view-desc">View description (view-desc) — ink-soft, 0.95rem. Not a heading, not in the modal header.</p>
          <p class="section-title">Section (section-title)</p>
          <p class="styleguide-hint" style="margin-top: 0">
            <code>view-title</code> 1.7rem / 700 (1.35rem in <code>.modal-header</code>)
            · <code>section-title</code> 1.25rem / 700
            · <code>styleguide-section-title</code> 1rem — gallery-internal only.
          </p>
          <div class="empty-view" style="padding: 4.5rem 1.5rem 1.75rem; border: 1px dashed var(--line); margin-top: 1rem">
            <div class="empty-view-body">
              <div class="brick" aria-hidden="true"></div>
              <p class="view-title">Empty state</p>
              <p>Same <code>view-title</code> class (it is the view title).</p>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Headings — outline (which tag)</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          One level-1 heading per view (page or dialog). Do not skip levels. Not headings&nbsp;:
          topbar brand, <code>form-label</code>, card names (theme grid, Brickcard).
        </p>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Context</th><th>Title</th><th>Next</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Page (<code>#main</code>)</td>
                <td><code>h1.view-title</code></td>
                <td><code>h2.section-title</code></td>
              </tr>
              <tr>
                <td>List</td>
                <td><code>h1.visually-hidden</code> “&nbsp;Cards&nbsp;”</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Empty state (home, loading)</td>
                <td><code>h1.view-title</code></td>
                <td>CSS brick; optional text / tiles</td>
              </tr>
              <tr>
                <td>Empty state (list / themes search)</td>
                <td><code>p.view-title</code></td>
                <td><code>h1</code> already on the view / dialog</td>
              </tr>
              <tr>
                <td>Dialog</td>
                <td><code>h1.view-title</code> + <code>aria-labelledby</code> (short title; confirmations a bit longer)</td>
                <td><code>h2.section-title</code></td>
              </tr>
              <tr>
                <td>Markdown page in a modal</td>
                <td><code># Title</code> → dialog title (removed from the body)</td>
                <td><code>##</code> → <code>h2</code> · <code>###</code> → <code>h3</code> in <code>.md-content</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Dialog — chrome</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          The specimen title is a <code>p.view-title</code> (avoid a second <code>h1</code> in the gallery).
          In production&nbsp;: <code>h1.view-title</code>.
        </p>
        <div class="styleguide-dialog-demo">
          <div class="modal-header">
            <div>
              <p class="view-title">${modalTitleMarkup("Settings", ICON_TOOLS)}</p>
            </div>
            <button type="button" class="btn primary icon-only modal-close" tabindex="-1">
              ${ICON_CLOSE}
              <span class="visually-hidden">Close</span>
            </button>
          </div>
          <div class="modal-body" tabindex="-1">
            <h2 class="section-title">Application</h2>
            <p class="form-label">Display mode</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Dialog — Markdown (<code>md-content</code>)</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          File&nbsp;: <code># Title</code>, then <code>##</code> / <code>###</code>.
          No <code>h1</code> in the body. Subheadings smaller than the header (1.2rem / 1.05rem).
        </p>
        <div class="styleguide-dialog-demo">
          <div class="modal-header">
            <div>
              <p class="view-title">About</p>
            </div>
            <button type="button" class="btn primary icon-only modal-close" tabindex="-1">
              ${ICON_CLOSE}
              <span class="visually-hidden">Close</span>
            </button>
          </div>
          <div class="modal-body" tabindex="-1">
            <article class="md-content">
              <p>Content paragraph. Text with <strong>bold</strong>, <em>italic</em>,
                a ${linkMarkup("link", { href: "#developer" })} and <code>inline code</code>.</p>
              <h2>Features</h2>
              <ul>
                <li>Bullet list — first item</li>
                <li>Second item</li>
                <li>Third with <strong>emphasis</strong></li>
              </ul>
              <h3>Detail</h3>
              <ol>
                <li>Numbered list — step one</li>
                <li>Step two</li>
              </ol>
              <blockquote>
                <p>Quote (blockquote) — left ink border, ink-soft text.</p>
              </blockquote>
              <pre><code>// Code block (Open Sans)
const APP_ID = "brickcard";</code></pre>
              <hr />
              <p>After an <code>hr</code> separator.</p>
            </article>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Brand (topbar)</h2>
        <div class="styleguide-type-demo">
          <div class="brand-text">
            <span class="brand-name">Brickcard</span>
            <span class="brand-version">0.x.x</span>
          </div>
          <p class="styleguide-hint">
            Not a heading. <code>brand-name</code> Open Sans 1.15rem / 700 · <code>brand-version</code> 0.8rem / 500 ink-soft.
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Form</h2>
        <div class="styleguide-type-demo styleguide-fields">
          <div class="form-field">
            <label class="form-label form-label--required" for="typo-demo-input">Field label</label>
            <p class="form-hint" id="typo-demo-hint">Hint / description above the control (0.8rem, ink-soft)</p>
            <input class="form-control" id="typo-demo-input" type="text" value="Example value" aria-describedby="typo-demo-hint typo-demo-error" />
            <p class="form-error" id="typo-demo-error" role="alert">Error message (form-error).</p>
          </div>
          <p class="styleguide-hint">
            <code>form-label</code> is not a heading. 0.82rem / 600 · <code>form-label--required</code> adds an asterisk.
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Body &amp; inline</h2>
        <div class="styleguide-type-demo">
          <p style="margin: 0 0 0.75rem">
            UI paragraph in <strong>Open Sans</strong> (inherited from <code>body</code>).
            Emphasis <em>italic</em>, <strong>bold</strong>,
            ${linkMarkup("link", { href: "#developer" })} and <code>inline code</code> (same typeface, weight 600).
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Role recap (UI)</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Class / context</th><th>Size / weight</th></tr>
            </thead>
            <tbody>
              <tr><td><code>body</code></td><td>inherited · 400</td></tr>
              <tr><td><code>view-title</code></td><td>1.7rem · 700 (1.35rem in the modal header)</td></tr>
              <tr><td><code>view-desc</code></td><td>0.95rem · ink-soft (views, not the modal header)</td></tr>
              <tr><td><code>section-title</code></td><td>1.25rem · 700</td></tr>
              <tr><td><code>styleguide-section-title</code></td><td>1rem · 700 (gallery)</td></tr>
              <tr><td><code>a.link</code></td><td>inherited · underline · see the Link gallery</td></tr>
              <tr><td><code>form-label</code></td><td>0.82rem · 600</td></tr>
              <tr><td><code>form-hint</code> / <code>form-error</code></td><td>0.8rem / 0.82rem</td></tr>
              <tr><td><code>brand-name</code></td><td>1.15rem · 700</td></tr>
              <tr><td><code>.md-content h2</code> / <code>h3</code></td><td>1.2rem / 1.05rem · 700</td></tr>
              <tr><td><code>.md-content</code> body</td><td>0.98rem · lh 1.55</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  return () => {
    host.innerHTML = "";
  };
}
