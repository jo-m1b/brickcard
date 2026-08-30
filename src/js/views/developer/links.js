import { ICON_ARROW_RIGHT, ICON_SEARCH_LINE } from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * Link gallery of the design system.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperLinks(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Link</p>
        <h1 class="view-title">Link</h1>
      </header>

      <p class="styleguide-intro">
        Underlined text, ink color.
        Class <code>link</code>. Compact&nbsp;: <code>sm</code>.
        Icon on the right&nbsp;: <code>icon-right</code>.
        External (<code>https://</code>)&nbsp;: <code>target="_blank"</code> +
        <code>ri-external-link-fill</code> icon on the right.
        Helper&nbsp;: <code>linkMarkup()</code> (<code>link.js</code>).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vocabulary</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Axis</th><th>Options</th></tr>
            </thead>
            <tbody>
              <tr><td>Class</td><td><code>link</code></td></tr>
              <tr><td>Text</td><td>link label</td></tr>
              <tr><td>Size</td><td>(default, medium) · <code>sm</code></td></tr>
              <tr><td>State</td><td>(active) · <code>disabled</code> / <code>aria-disabled</code></td></tr>
              <tr><td><code>href</code></td><td>address</td></tr>
              <tr><td><code>target</code></td><td><code>_blank</code> by default if external</td></tr>
              <tr><td>Icon</td><td>Remix, left (default) · <code>icon-right</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Text only</h2>
        <div class="styleguide-row">
          ${linkMarkup("Internal link", { href: "#developer" })}
        </div>
        <p class="styleguide-hint">
          In a paragraph&nbsp;: see the
          ${linkMarkup("typography gallery", { href: "#developer/typography" })}
          or go back to the ${linkMarkup("index", { href: "#developer" })}.
        </p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Sizes</h2>
        <div class="styleguide-row">
          ${linkMarkup("Medium (default)", { href: "#developer" })}
          ${linkMarkup("Small", { href: "#developer", sm: true })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Disabled</h2>
        <div class="styleguide-row">
          ${linkMarkup("Disabled link", { href: "#developer", disabled: true })}
          ${linkMarkup("Small disabled", { href: "#developer", sm: true, disabled: true })}
          ${linkMarkup("External disabled", { href: "https://remixicon.com/", disabled: true })}
        </div>
        <p class="styleguide-hint">No underline; <code>--muted</code> color; not focusable.</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Icon on the left</h2>
        <div class="styleguide-row">
          ${linkMarkup("Search", { href: "#developer/search", icon: ICON_SEARCH_LINE })}
          ${linkMarkup("Small", { href: "#developer/search", icon: ICON_SEARCH_LINE, sm: true })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Icon on the right</h2>
        <div class="styleguide-row">
          ${linkMarkup("Continue", { href: "#developer/buttons", icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${linkMarkup("Small", { href: "#developer/buttons", icon: ICON_ARROW_RIGHT, iconRight: true, sm: true })}
        </div>
        <p class="styleguide-hint">Class <code>icon-right</code> (SVG first in the DOM, layout reversed).</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">External</h2>
        <div class="styleguide-row">
          ${linkMarkup("Remix Icon", { href: "https://remixicon.com/" })}
          ${linkMarkup("Small", { href: "https://remixicon.com/", sm: true })}
        </div>
        <p class="styleguide-hint">
          Default&nbsp;: <code>target="_blank"</code>, <code>rel="noopener noreferrer"</code>,
          <code>ri-external-link-fill</code> icon on the right (unless the label is an image).
        </p>
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
