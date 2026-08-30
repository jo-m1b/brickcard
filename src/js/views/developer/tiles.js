import { ICON_LAYOUT_GRID, ICON_SEARCH_LINE, ICON_TEXT } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { tileListMarkup } from "../../tile.js";

/**
 * Tile gallery of the design system.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperTiles(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Tile</p>
        <h1 class="view-title">Tile</h1>
      </header>

      <p class="styleguide-intro">
        Class <code>tile</code> in <code>ul.tile-list</code>
        (<code>a</code> or <code>button</code>).
        Title, description and Remix icon on the left (centered) are optional.
        Disabled&nbsp;: <code>disabled</code> / <code>aria-disabled</code>, not clickable.
        Inset bottom rule 2&nbsp;px (<code>--ink-soft</code>, like fields).
        Hover / focus&nbsp;: invert, bottom rule hidden.
        <code>danger</code> variant&nbsp;: danger button colors.
        Helper&nbsp;: <code>tileMarkup()</code> / <code>tileListMarkup()</code> (<code>tile.js</code>).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vocabulary</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Axis</th><th>Options</th></tr>
            </thead>
            <tbody>
              <tr><td>List</td><td><code>ul.tile-list</code></td></tr>
              <tr><td>Tile</td><td><code>a.tile</code> · <code>button.tile</code></td></tr>
              <tr><td>Title</td><td><code>strong.tile-title</code> (optional)</td></tr>
              <tr><td>Description</td><td><code>span.tile-desc</code> (optional)</td></tr>
              <tr><td>Icon</td><td>Remix on the left, vertically centered (optional)</td></tr>
              <tr><td>Variant</td><td>(default) · <code>danger</code></td></tr>
              <tr><td>State</td><td>(active) · <code>disabled</code> / <code>aria-disabled</code></td></tr>
              <tr><td><code>href</code></td><td>address (links)</td></tr>
              <tr><td><code>tag</code></td><td><code>a</code> (default) · <code>button</code> (action)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Title + description</h2>
        ${tileListMarkup([
          {
            title: "Typography",
            desc: "typefaces, headings, Markdown in a modal",
            href: "#developer/typography",
          },
        ])}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Title only</h2>
        ${tileListMarkup([{ title: "Links", href: "#developer/links" }])}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">With icon</h2>
        ${tileListMarkup([
          {
            title: "Search",
            desc: "search-bar — field, count, sort",
            href: "#developer/search",
            icon: ICON_SEARCH_LINE,
          },
          {
            title: "Typography",
            desc: "Open Sans / Inter",
            href: "#developer/typography",
            icon: ICON_TEXT,
          },
        ])}
        <p class="styleguide-hint">Icon on the left, aligned to the middle of the title + description block.</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Disabled</h2>
        ${tileListMarkup([
          {
            title: "Coming soon",
            desc: "tile not clickable",
            href: "#developer",
            disabled: true,
          },
          {
            title: "Tiles",
            desc: "with icon, disabled",
            href: "#developer/tiles",
            icon: ICON_LAYOUT_GRID,
            disabled: true,
          },
        ])}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Button (action)</h2>
        ${tileListMarkup([
          {
            title: "Import cards",
            desc: "Action without navigation (no href)",
            icon: "upload",
            tag: "button",
          },
        ])}
        <p class="styleguide-hint">For an action (import, etc.): <code>tag: "button"</code>, no <code>href</code>.</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Danger</h2>
        ${tileListMarkup([
          {
            title: "Reset local data",
            desc: "Deletes cards, themes, and settings",
            icon: "close-circle",
            tag: "button",
            danger: true,
          },
          {
            title: "Delete",
            desc: "Disabled danger tile",
            icon: "close-circle",
            tag: "button",
            danger: true,
            disabled: true,
          },
        ])}
        <p class="styleguide-hint">Class <code>danger</code>: <code>--danger-line</code>; hover / focus background <code>--danger-bg</code>, red frame and bottom rule.</p>
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
