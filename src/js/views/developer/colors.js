import { bindFormColor, formColorMarkup } from "../../form-color.js";
import { ICON_CLOSE_CIRCLE } from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * Color field gallery (design system — test only).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperColors(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Color</p>
        <h1 class="view-title">Color</h1>
      </header>

      <p class="styleguide-intro">
        Control&nbsp;: a real <code>input.form-control</code> text field,
        with a swatch inside (opens the color picker) and a
        clear button (<code>ri-close-circle-fill</code>, visible only when there is
        a value, not focusable). Wrapper&nbsp;: <code>form-color</code>.
        Swatch&nbsp;: shows the value, otherwise the field’s default color,
        otherwise a checkerboard (transparent). Used in the app.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Default</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-hex">Color</label>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-hex" name="demo-color-hex" value="#e3000b" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choose a color" style="--swatch:#e3000b">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#e3000b" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-color-required-hex">Required accent</label>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-required-hex" name="demo-color-required-hex" value="#0055bf" maxlength="7" placeholder="#ffffff" required spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choose a color" style="--swatch:#0055bf">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#0055bf" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Empty field</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-empty-default-hex">Empty with default color</label>
            <p class="form-hint" id="demo-color-empty-default-desc">The swatch shows the default (#6e6e6e) even when the field is empty. Clear hidden.</p>
            <div class="form-color" data-form-color data-fallback="#6e6e6e">
              <input class="form-control form-color-hex" type="text" id="demo-color-empty-default-hex" name="demo-color-empty-default-hex" value="" maxlength="7" placeholder="#6e6e6e" spellcheck="false" autocomplete="off" aria-describedby="demo-color-empty-default-desc" />
              <label class="form-color-swatch" title="Choose a color" style="--swatch:#6e6e6e">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#6e6e6e" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" hidden aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-empty-none-hex">Empty without default color</label>
            <p class="form-hint" id="demo-color-empty-none-desc">No default → checkerboard swatch (transparent)</p>
            <div class="form-color" data-form-color data-fallback="">
              <input class="form-control form-color-hex" type="text" id="demo-color-empty-none-hex" name="demo-color-empty-none-hex" value="" maxlength="7" placeholder="#rrggbb" spellcheck="false" autocomplete="off" aria-describedby="demo-color-empty-none-desc" />
              <label class="form-color-swatch is-empty" title="Choose a color">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#ffffff" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" hidden aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Without clear button</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-noclear-hex">Fixed color (clear disabled)</label>
            <p class="form-hint" id="demo-color-noclear-desc">The button is <code>disabled</code>: visible only when there is a value, but not clickable</p>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-noclear-hex" name="demo-color-noclear-hex" value="#ffd500" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" aria-describedby="demo-color-noclear-desc" />
              <label class="form-color-swatch" title="Choose a color" style="--swatch:#ffd500">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#ffd500" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" disabled aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-noclear2-hex">No clear (omitted)</label>
            <div class="form-color" data-form-color data-clear-mode="omit" data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-noclear2-hex" name="demo-color-noclear2-hex" value="#0a8a00" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choose a color" style="--swatch:#0a8a00">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#0a8a00" tabindex="-1" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Size <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-sm-hex">Image background</label>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control sm form-color-hex" type="text" id="demo-color-sm-hex" name="demo-color-sm-hex" value="#ffffff" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choose a color" style="--swatch:#ffffff">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#ffffff" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">States</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-disabled-hex">Disabled</label>
            ${formColorMarkup({
              id: "demo-color-disabled-hex",
              value: "#141414",
              fallback: "#ffffff",
              disabled: true,
            })}
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-invalid-hex">Error / invalid input</label>
            <p class="form-hint" id="demo-color-invalid-hint">Swatch = default (#6e6e6e) until the value is a valid hex</p>
            <div class="form-color" data-form-color data-fallback="#6e6e6e">
              <input class="form-control form-color-hex is-invalid" type="text" id="demo-color-invalid-hex" name="demo-color-invalid-hex" value="pas-hex" maxlength="16" aria-invalid="true" aria-describedby="demo-color-invalid-hint demo-color-invalid-err" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choose a color" style="--swatch:#6e6e6e">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#6e6e6e" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
            <p class="form-error" id="demo-color-invalid-err">Invalid hex color (e.g. #ff0000).</p>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-invalid-none-hex">Invalid without default</label>
            <p class="form-hint" id="demo-color-invalid-none-desc">No default color → transparent swatch</p>
            <div class="form-color" data-form-color data-fallback="">
              <input class="form-control form-color-hex is-invalid" type="text" id="demo-color-invalid-none-hex" name="demo-color-invalid-none-hex" value="xyz" maxlength="16" aria-invalid="true" aria-describedby="demo-color-invalid-none-desc demo-color-invalid-none-err" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch is-empty" title="Choose a color">
                <span class="visually-hidden">Open the color picker</span>
                <input type="color" class="form-color-native" value="#ffffff" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Clear color">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
            <p class="form-error" id="demo-color-invalid-none-err">Invalid hex color.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  /** @type {(() => void)[]} */
  const unbind = [];
  host.querySelectorAll("[data-form-color]").forEach((el) => {
    const raw = el.getAttribute("data-fallback");
    /** @type {string|null} */
    let fallbackColor = null;
    if (raw !== null && raw !== "") {
      fallbackColor = raw;
    }
    const ctl = bindFormColor(/** @type {HTMLElement} */ (el), { fallbackColor });
    unbind.push(() => ctl.destroy());
  });

  return () => {
    unbind.forEach((fn) => fn());
    host.innerHTML = "";
  };
}
