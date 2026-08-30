import { bindFormRadios, formRadioMarkup } from "../../form-radio.js";
import { linkMarkup } from "../../link.js";

/**
 * Radio gallery — design system / test only.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperRadios(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Radio</p>
        <h1 class="view-title">Radio</h1>
      </header>

      <p class="styleguide-intro">
        Control&nbsp;: <code>form-check form-radio</code> (circle to the left of the
        label / hint, centered on the text block). Glyph
        <code>ri-radio-button-line</code> (CSS mask); at rest, the inner
        disk is removed.
        Optional hint under the label; error = <code>form-error</code>
        message only (no red tint on the circle).
        Size&nbsp;: <code>sm</code> (smaller circle).
        Read-only&nbsp;: <code>aria-readonly</code> (the HTML
        <code>readonly</code> attribute is ignored by radios).
        Module&nbsp;: <code>form-radio.js</code>.
        Groups&nbsp;: same <code>name</code> for a single choice;
        <code>form-check-group</code> + optional legend, vertical
        or horizontal list.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Default</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-face",
              name: "demo-radio",
              value: "face",
              label: "Front",
              checked: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-back",
              name: "demo-radio",
              value: "back",
              label: "Back",
              hint: "Horizontal mirror (long-edge flip)",
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Size <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-sm-on",
              name: "demo-radio-sm",
              value: "on",
              label: "Compact mode",
              hint: "Same label; smaller circle",
              sm: true,
              checked: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-sm-off",
              name: "demo-radio-sm",
              value: "off",
              label: "Expanded mode",
              sm: true,
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">States</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-disabled",
              name: "demo-radio-disabled",
              value: "off",
              label: "Disabled",
              hint: "Not clickable, not submitted",
              disabled: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-readonly-on",
              name: "demo-radio-readonly",
              value: "on",
              label: "Read-only",
              hint: "Checked and frozen; the value is still submitted",
              checked: true,
              readonly: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-readonly-off",
              name: "demo-radio-readonly",
              value: "off",
              label: "Other option",
              hint: "The frozen choice prevents switching radios",
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-invalid-a",
              name: "demo-radio-invalid",
              value: "a",
              label: "Option A",
              describedBy: "demo-radio-invalid-err",
            })}
            ${formRadioMarkup({
              id: "demo-radio-invalid-b",
              name: "demo-radio-invalid",
              value: "b",
              label: "Option B",
              describedBy: "demo-radio-invalid-err",
            })}
            <p class="form-error" id="demo-radio-invalid-err">Choose an option.</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Group (vertical)</h2>
        <div class="styleguide-fields">
        <fieldset class="form-check-group" aria-describedby="demo-radio-group-hint">
          <legend class="form-label">Sides to print</legend>
          <p class="form-hint" id="demo-radio-group-hint">One side only</p>
          <div class="form-check-list">
            ${formRadioMarkup({
              id: "demo-radio-group-face",
              name: "demo-radio-group",
              value: "face",
              label: "Front",
              checked: true,
            })}
            ${formRadioMarkup({
              id: "demo-radio-group-back",
              name: "demo-radio-group",
              value: "back",
              label: "Back",
              hint: "Horizontal mirror (long-edge flip)",
            })}
            ${formRadioMarkup({
              id: "demo-radio-group-both",
              name: "demo-radio-group",
              value: "both",
              label: "Front and back",
            })}
          </div>
        </fieldset>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Group (horizontal)</h2>
        <div class="styleguide-fields">
        <fieldset class="form-check-group" aria-describedby="demo-radio-row-err">
          <legend class="form-label">Format</legend>
          <div class="form-check-list form-check-list--row">
            ${formRadioMarkup({
              id: "demo-radio-row-a4",
              name: "demo-radio-row",
              value: "a4",
              label: "A4",
            })}
            ${formRadioMarkup({
              id: "demo-radio-row-letter",
              name: "demo-radio-row",
              value: "letter",
              label: "Letter",
            })}
            ${formRadioMarkup({
              id: "demo-radio-row-poker",
              name: "demo-radio-row",
              value: "poker",
              label: "Poker",
            })}
          </div>
          <p class="form-error" id="demo-radio-row-err">Choose a format.</p>
        </fieldset>
        </div>
      </div>
    </section>
  `;

  const unbind = bindFormRadios(host);

  return () => {
    unbind();
    host.innerHTML = "";
  };
}
