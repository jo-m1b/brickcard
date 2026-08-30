import { bindFormCheckboxes, formCheckboxMarkup } from "../../form-checkbox.js";
import { linkMarkup } from "../../link.js";

/**
 * Checkbox gallery — design system / test only.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperCheckboxes(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Checkbox</p>
        <h1 class="view-title">Checkbox</h1>
      </header>

      <p class="styleguide-intro">
        Control&nbsp;: <code>form-check</code> (checkbox to the left of the label /
        hint, centered on the text block).
        Optional hint under the label; error = <code>form-error</code>
        message only (no red tint on the checkbox).
        Size&nbsp;: <code>sm</code> (smaller checkbox).
        Read-only&nbsp;: <code>aria-readonly</code> (the HTML
        <code>readonly</code> attribute is ignored by checkboxes).
        Module&nbsp;: <code>form-checkbox.js</code>.
        Groups&nbsp;: <code>form-check-group</code> + optional legend,
        vertical or horizontal list.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Default</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check",
              name: "demo-check",
              label: "Include figurines",
              checked: true,
            })}
          </div>
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-hinted",
              name: "demo-check-hinted",
              label: "Show the release year",
              hint: "Visible on the face, under the title",
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Size <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-sm",
              name: "demo-check-sm",
              label: "Compact mode",
              hint: "Same label; smaller checkbox",
              sm: true,
              checked: true,
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">States</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-disabled",
              name: "demo-check-disabled",
              label: "Disabled",
              hint: "Not clickable, not submitted",
              disabled: true,
            })}
          </div>
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-readonly",
              name: "demo-check-readonly",
              label: "Read-only",
              hint: "Checked and frozen; the value is still submitted",
              checked: true,
              readonly: true,
            })}
          </div>
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-invalid",
              name: "demo-check-invalid",
              label: "Terms of use",
              hint: "Required to continue",
              describedBy: "demo-check-invalid-err",
            })}
            <p class="form-error" id="demo-check-invalid-err">You must accept the terms.</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Group (vertical)</h2>
        <div class="styleguide-fields">
        <fieldset class="form-check-group" aria-describedby="demo-check-group-hint">
          <legend class="form-label">Sides to print</legend>
          <p class="form-hint" id="demo-check-group-hint">At least one side</p>
          <div class="form-check-list">
            ${formCheckboxMarkup({
              id: "demo-check-group-face",
              name: "demo-check-group",
              value: "face",
              label: "Front",
              checked: true,
            })}
            ${formCheckboxMarkup({
              id: "demo-check-group-back",
              name: "demo-check-group",
              value: "back",
              label: "Back",
              hint: "Horizontal mirror (long-edge flip)",
              checked: true,
            })}
            ${formCheckboxMarkup({
              id: "demo-check-group-bleed",
              name: "demo-check-group",
              value: "bleed",
              label: "Bleed",
            })}
          </div>
        </fieldset>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Group (horizontal)</h2>
        <div class="styleguide-fields">
        <fieldset class="form-check-group" aria-describedby="demo-check-row-err">
          <legend class="form-label">Formats</legend>
          <div class="form-check-list form-check-list--row">
            ${formCheckboxMarkup({
              id: "demo-check-row-a4",
              name: "demo-check-row",
              value: "a4",
              label: "A4",
            })}
            ${formCheckboxMarkup({
              id: "demo-check-row-letter",
              name: "demo-check-row",
              value: "letter",
              label: "Letter",
            })}
            ${formCheckboxMarkup({
              id: "demo-check-row-poker",
              name: "demo-check-row",
              value: "poker",
              label: "Poker",
            })}
          </div>
          <p class="form-error" id="demo-check-row-err">Check at least one format.</p>
        </fieldset>
        </div>
      </div>
    </section>
  `;

  const unbind = bindFormCheckboxes(host);

  return () => {
    unbind();
    host.innerHTML = "";
  };
}
