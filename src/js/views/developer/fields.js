import {
  ICON_CALENDAR_LINE,
  ICON_FILE_TEXT_LINE,
  ICON_HASHTAG,
  ICON_TEXT,
} from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * Input field gallery (design system — test only).
 * Select: see `#developer/selects`.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperFields(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Input</p>
        <h1 class="view-title">Input</h1>
      </header>

      <p class="styleguide-intro">
        Classes&nbsp;: <code>form-field</code> + <code>form-label</code> /
        <code>form-hint</code> / <code>form-error</code> + <code>form-control</code>
        (text, number, textarea).
        Optional icon&nbsp;: <code>form-control-wrap</code> wrapper +
        <code>form-control-icon</code> (Remix, decorative).
        Selects&nbsp;: ${linkMarkup("dedicated page", { href: "#developer/selects" })}.
        Images&nbsp;: ${linkMarkup("dedicated page", { href: "#developer/images" })}.
        Compact&nbsp;: <code>sm</code>.
        Rest&nbsp;: background + inset bottom rule. Focus&nbsp;: frame with 1&nbsp;px gap (no hover).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Text</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-text">Title</label>
            <input class="form-control" type="text" id="demo-text" name="demo-text" placeholder="e.g. Fire truck" autocomplete="off" />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-text-icon">Title with icon</label>
            <p class="form-hint" id="demo-text-icon-desc">Optional icon (<code>ri-text</code>)</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_TEXT}</span>
              <input class="form-control" type="text" id="demo-text-icon" name="demo-text-icon" placeholder="e.g. Fire truck" autocomplete="off" aria-describedby="demo-text-icon-desc" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-text-hinted">Reference</label>
            <p class="form-hint" id="demo-text-hinted-desc">LEGO set number, optionally compound</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_HASHTAG}</span>
              <input class="form-control" type="text" id="demo-text-hinted" name="demo-text-hinted" placeholder="6140/6109" aria-describedby="demo-text-hinted-desc" autocomplete="off" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-text-required">Required field</label>
            <input class="form-control" type="text" id="demo-text-required" name="demo-text-required" required autocomplete="off" />
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Number</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-number">Piece count</label>
            <input class="form-control" type="number" id="demo-number" name="demo-number" min="0" step="1" placeholder="232" inputmode="numeric" />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-number-icon">Pieces with icon</label>
            <p class="form-hint" id="demo-number-icon-desc">Same field with <code>ri-hashtag</code></p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_HASHTAG}</span>
              <input class="form-control" type="number" id="demo-number-icon" name="demo-number-icon" min="0" step="1" placeholder="232" inputmode="numeric" aria-describedby="demo-number-icon-desc" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-number-year">Release year</label>
            <p class="form-hint" id="demo-number-year-desc">Optional — <code>ri-calendar-line</code> icon</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_CALENDAR_LINE}</span>
              <input class="form-control" type="number" id="demo-number-year" name="demo-number-year" min="1949" max="2100" step="1" placeholder="1998" inputmode="numeric" aria-describedby="demo-number-year-desc" />
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Textarea</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-textarea">Description</label>
            <textarea class="form-control" id="demo-textarea" name="demo-textarea" rows="4" placeholder="Free notes…"></textarea>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-textarea-icon">Description with icon</label>
            <p class="form-hint" id="demo-textarea-icon-desc">Icon at the top left (<code>ri-file-text-line</code>)</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_FILE_TEXT_LINE}</span>
              <textarea class="form-control" id="demo-textarea-icon" name="demo-textarea-icon" rows="4" placeholder="Free notes…" aria-describedby="demo-textarea-icon-desc"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Size <code>sm</code></h2>
        <div class="styleguide-fields styleguide-fields--row">
          <div class="form-field">
            <label class="form-label" for="demo-text-sm">Text</label>
            <input class="form-control sm" type="text" id="demo-text-sm" name="demo-text-sm" placeholder="Compact" autocomplete="off" />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-text-sm-icon">Text + icon</label>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_TEXT}</span>
              <input class="form-control sm" type="text" id="demo-text-sm-icon" name="demo-text-sm-icon" placeholder="Compact" autocomplete="off" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-number-sm">Number</label>
            <input class="form-control sm" type="number" id="demo-number-sm" name="demo-number-sm" min="0" placeholder="12" inputmode="numeric" />
          </div>
        </div>
        <div class="form-field" style="margin-top: 0.85rem; max-width: 28rem">
          <label class="form-label" for="demo-textarea-sm">Textarea</label>
          <textarea class="form-control sm" id="demo-textarea-sm" name="demo-textarea-sm" rows="3" placeholder="Compact…"></textarea>
        </div>
        <div class="form-field" style="margin-top: 0.85rem; max-width: 28rem">
          <label class="form-label" for="demo-textarea-sm-icon">Textarea + icon</label>
          <div class="form-control-wrap">
            <span class="form-control-icon" aria-hidden="true">${ICON_FILE_TEXT_LINE}</span>
            <textarea class="form-control sm" id="demo-textarea-sm-icon" name="demo-textarea-sm-icon" rows="3" placeholder="Compact…"></textarea>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">States</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-disabled">Disabled</label>
            <input class="form-control" type="text" id="demo-disabled" name="demo-disabled" value="Not editable" disabled />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-readonly">Read-only</label>
            <input class="form-control" type="text" id="demo-readonly" name="demo-readonly" value="Frozen value" readonly />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-invalid">Error</label>
            <p class="form-hint" id="demo-invalid-hint">The hint stays visible above</p>
            <input class="form-control is-invalid" type="text" id="demo-invalid" name="demo-invalid" aria-invalid="true" aria-describedby="demo-invalid-hint demo-invalid-err" autocomplete="off" />
            <p class="form-error" id="demo-invalid-err">This field is required.</p>
          </div>
        </div>
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
