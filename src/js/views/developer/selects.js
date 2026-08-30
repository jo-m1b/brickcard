import { enhanceFormSelects } from "../../form-select.js";
import { linkMarkup } from "../../link.js";

/**
 * Select gallery (design system — test only).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperSelects(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Select</p>
        <h1 class="view-title">Select</h1>
      </header>

      <p class="styleguide-intro">
        Markup&nbsp;: <code>select.form-control</code> in a <code>form-field</code>,
        enhanced via <code>enhanceFormSelects()</code> (<code>form-select.js</code>)&nbsp;:
        the HTML5 select stays in place (submit / fallback), the trigger
        is a real <code>form-control</code> (bottom rule + focus) with
        <code>ri-arrow-down-s-line</code> on the right, and the open list is
        fully styleable. The placeholder option (<code>value=""</code>,
        e.g. “&nbsp;Choose&nbsp;”) is omitted from the list; a reset
        (<code>ri-close-circle-fill</code>, not focusable) lets you go back to it.
        Option icons&nbsp;: <code>data-icon-left</code> /
        <code>data-icon-right</code> (Remix keys from <code>icons.js</code>).
        Keyboard&nbsp;: ↓ ↑ Enter Escape. Compact&nbsp;: <code>sm</code>.
        Used: editor (theme picker).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Default</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select">Theme</label>
            <select class="form-control" id="demo-select" name="demo-select">
              <option value="">— Choose —</option>
              <option value="city">CITY</option>
              <option value="space">Space</option>
              <option value="star-wars">Star Wars</option>
              <option value="ninjago">Ninjago</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-hinted">Sort</label>
            <p class="form-hint" id="demo-select-hinted-desc">List display criterion</p>
            <select class="form-control" id="demo-select-hinted" name="demo-select-hinted" aria-describedby="demo-select-hinted-desc">
              <option value="updatedAt">Date modified</option>
              <option value="title">Title</option>
              <option value="legoSetRef">Reference</option>
              <option value="releaseYear">Release year</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-select-required">Required theme</label>
            <select class="form-control" id="demo-select-required" name="demo-select-required" required>
              <option value="">— Choose —</option>
              <option value="city">CITY</option>
              <option value="friends">Friends</option>
            </select>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Size <code>sm</code></h2>
        <div class="styleguide-fields styleguide-fields--row">
          <div class="form-field">
            <label class="form-label" for="demo-select-sm">Compact</label>
            <select class="form-control sm" id="demo-select-sm" name="demo-select-sm">
              <option>CITY</option>
              <option>Space</option>
              <option>Ninjago</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-sm-empty">With placeholder</label>
            <select class="form-control sm" id="demo-select-sm-empty" name="demo-select-sm-empty">
              <option value="">—</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </select>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">States</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select-disabled">Disabled</label>
            <select class="form-control" id="demo-select-disabled" name="demo-select-disabled" disabled>
              <option>Unavailable</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-invalid">Error</label>
            <p class="form-hint" id="demo-select-invalid-hint">Pick the matching theme</p>
            <select class="form-control is-invalid" id="demo-select-invalid" name="demo-select-invalid" aria-invalid="true" aria-describedby="demo-select-invalid-hint demo-select-invalid-err">
              <option value="">— Choose —</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </select>
            <p class="form-error" id="demo-select-invalid-err">Choose an option.</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">With icons</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select-icon-left">Icon on the left</label>
            <p class="form-hint" id="demo-select-icon-left-desc"><code>data-icon-left</code> on each <code>option</code></p>
            <select class="form-control" id="demo-select-icon-left" name="demo-select-icon-left" aria-describedby="demo-select-icon-left-desc">
              <option value="">— Choose —</option>
              <option value="print" data-icon-left="printer">Print</option>
              <option value="settings" data-icon-left="settings">Settings</option>
              <option value="tools" data-icon-left="tools">Tools</option>
              <option value="filter" data-icon-left="filter3">Filter</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-icon-right">Icon on the right</label>
            <p class="form-hint" id="demo-select-icon-right-desc"><code>data-icon-right</code> on each <code>option</code></p>
            <select class="form-control" id="demo-select-icon-right" name="demo-select-icon-right" aria-describedby="demo-select-icon-right-desc">
              <option value="">— Choose —</option>
              <option value="next" data-icon-right="arrow-right">Continue</option>
              <option value="down" data-icon-right="arrow-down-s">Down</option>
              <option value="up" data-icon-right="arrow-up-s">Up</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-icon-both">Icons on both sides</label>
            <p class="form-hint" id="demo-select-icon-both-desc"><code>data-icon-left</code> + <code>data-icon-right</code></p>
            <select class="form-control" id="demo-select-icon-both" name="demo-select-icon-both" aria-describedby="demo-select-icon-both-desc">
              <option value="">— Choose —</option>
              <option value="export" data-icon-left="printer" data-icon-right="arrow-right">Export / print</option>
              <option value="tune" data-icon-left="tools" data-icon-right="settings">Advanced settings</option>
              <option value="add-filter" data-icon-left="add" data-icon-right="filter3">Add a filter</option>
            </select>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Long options / groups</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select-long">Long label</label>
            <select class="form-control" id="demo-select-long" name="demo-select-long">
              <option value="">— Choose —</option>
              <option value="1">Brickcard — .brickcard backup</option>
              <option value="2">A4 3×3 print, face + mirrored back</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-groups">Groups (optgroup)</label>
            <select class="form-control" id="demo-select-groups" name="demo-select-groups">
              <option value="">— Choose —</option>
              <optgroup label="Classics">
                <option value="city">CITY</option>
                <option value="space">Space</option>
              </optgroup>
              <optgroup label="Licensed">
                <option value="star-wars">Star Wars</option>
                <option value="harry-potter">Harry Potter</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>
    </section>
  `;

  const destroySelects = enhanceFormSelects(host);

  return () => {
    destroySelects();
    host.innerHTML = "";
  };
}
