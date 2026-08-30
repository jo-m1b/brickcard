import { bindFormRange, formRangeResetMarkup } from "../../form-range.js";
import { linkMarkup } from "../../link.js";

/**
 * Range slider gallery — design system / test only.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperSliders(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Range</p>
        <h1 class="view-title">Range</h1>
      </header>

      <p class="styleguide-intro">
        Control&nbsp;: <code>form-range-row</code> with
        <code>input[type=range]</code> (+ optional <code>output</code>).
        Optional reset (<code>ri-close-circle-fill</code>, not focusable):
        slot always reserved, icon visible only when the value
        differs from the default; the <code>output</code> then goes bold.
        Module&nbsp;: <code>form-range.js</code>.
        Same field vocabulary (<code>form-field</code> / <code>form-label</code> /
        <code>form-hint</code> / <code>form-error</code>).
        Used in Settings.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Default</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range">Zoom</label>
            <div class="form-range-row">
              <input type="range" id="demo-range" name="demo-range" min="25" max="400" step="1" value="100" aria-valuemin="25" aria-valuemax="400" aria-valuenow="100" aria-describedby="demo-range-out" />
              <output id="demo-range-out" for="demo-range">100&nbsp;%</output>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-range-hinted">Face border</label>
            <p class="form-hint" id="demo-range-hinted-desc">Thickness of the colored border on the card face</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-hinted" name="demo-range-hinted" min="0" max="8" step="0.5" value="3" aria-valuemin="0" aria-valuemax="8" aria-valuenow="3" aria-describedby="demo-range-hinted-desc demo-range-hinted-out" />
              <output id="demo-range-hinted-out" for="demo-range-hinted">3&nbsp;mm</output>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-range-required">Cards per row</label>
            <div class="form-range-row">
              <input type="range" id="demo-range-required" name="demo-range-required" min="2" max="10" step="1" value="4" required aria-valuemin="2" aria-valuemax="10" aria-valuenow="4" aria-describedby="demo-range-required-out" />
              <output id="demo-range-required-out" for="demo-range-required">4</output>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Reset (default value)</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range-reset-default">Zoom</label>
            <p class="form-hint" id="demo-range-reset-default-desc">Icon hidden while the value is the default (100&nbsp;%)</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-reset-default" name="demo-range-reset-default" min="25" max="400" step="1" value="100" aria-valuemin="25" aria-valuemax="400" aria-valuenow="100" aria-describedby="demo-range-reset-default-desc demo-range-reset-default-out" />
              <output id="demo-range-reset-default-out" for="demo-range-reset-default">100&nbsp;%</output>
              ${formRangeResetMarkup()}
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-range-reset-custom">Face border</label>
            <p class="form-hint" id="demo-range-reset-custom-desc">Default 3&nbsp;mm; here 6&nbsp;mm → bold output and visible reset</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-reset-custom" name="demo-range-reset-custom" min="0" max="8" step="0.5" value="6" aria-valuemin="0" aria-valuemax="8" aria-valuenow="6" aria-describedby="demo-range-reset-custom-desc demo-range-reset-custom-out" />
              <output id="demo-range-reset-custom-out" for="demo-range-reset-custom">6&nbsp;mm</output>
              ${formRangeResetMarkup()}
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-range-reset-sm">Rounded corners</label>
            <div class="form-range-row sm">
              <input type="range" id="demo-range-reset-sm" name="demo-range-reset-sm" min="0" max="6" step="0.5" value="3" aria-valuemin="0" aria-valuemax="6" aria-valuenow="3" aria-describedby="demo-range-reset-sm-out" />
              <output id="demo-range-reset-sm-out" for="demo-range-reset-sm">3&nbsp;mm</output>
              ${formRangeResetMarkup()}
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-range-reset-bare">Opacity</label>
            <p class="form-hint" id="demo-range-reset-bare-desc">Without <code>output</code>: the reset sits after the track</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-reset-bare" name="demo-range-reset-bare" min="0" max="100" step="1" value="80" aria-describedby="demo-range-reset-bare-desc" />
              ${formRangeResetMarkup()}
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Without displayed value</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range-bare">Opacity</label>
            <p class="form-hint" id="demo-range-bare-desc">The <code>output</code> is optional</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-bare" name="demo-range-bare" min="0" max="100" step="1" value="80" aria-describedby="demo-range-bare-desc" />
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Size <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range-sm">Rounded corners</label>
            <div class="form-range-row sm">
              <input type="range" id="demo-range-sm" name="demo-range-sm" min="0" max="6" step="0.5" value="1.5" aria-valuemin="0" aria-valuemax="6" aria-valuenow="1.5" aria-describedby="demo-range-sm-out" />
              <output id="demo-range-sm-out" for="demo-range-sm">1.5&nbsp;mm</output>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">States</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range-disabled">Disabled</label>
            <div class="form-range-row">
              <input type="range" id="demo-range-disabled" name="demo-range-disabled" min="0" max="100" value="40" disabled aria-describedby="demo-range-disabled-out" />
              <output id="demo-range-disabled-out" for="demo-range-disabled">40</output>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-range-invalid">Error</label>
            <p class="form-hint" id="demo-range-invalid-hint">The hint stays visible above</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-invalid" name="demo-range-invalid" min="2" max="10" step="1" value="1" aria-invalid="true" aria-valuemin="2" aria-valuemax="10" aria-valuenow="1" aria-describedby="demo-range-invalid-hint demo-range-invalid-out demo-range-invalid-err" />
              <output id="demo-range-invalid-out" for="demo-range-invalid">1</output>
            </div>
            <p class="form-error" id="demo-range-invalid-err">Minimum&nbsp;: 2 cards per row.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  /** @type {{ input: HTMLInputElement, output: HTMLOutputElement|null, format: (v: string) => string }[]} */
  const live = [
    {
      input: /** @type {HTMLInputElement} */ (host.querySelector("#demo-range")),
      output: /** @type {HTMLOutputElement|null} */ (host.querySelector("#demo-range-out")),
      format: (v) => `${v}\u00a0%`,
    },
    {
      input: /** @type {HTMLInputElement} */ (host.querySelector("#demo-range-hinted")),
      output: /** @type {HTMLOutputElement|null} */ (host.querySelector("#demo-range-hinted-out")),
      format: (v) => `${v}\u00a0mm`,
    },
    {
      input: /** @type {HTMLInputElement} */ (host.querySelector("#demo-range-required")),
      output: /** @type {HTMLOutputElement|null} */ (host.querySelector("#demo-range-required-out")),
      format: (v) => v,
    },
    {
      input: /** @type {HTMLInputElement} */ (host.querySelector("#demo-range-sm")),
      output: /** @type {HTMLOutputElement|null} */ (host.querySelector("#demo-range-sm-out")),
      format: (v) => `${v}\u00a0mm`,
    },
    {
      input: /** @type {HTMLInputElement} */ (host.querySelector("#demo-range-invalid")),
      output: /** @type {HTMLOutputElement|null} */ (host.querySelector("#demo-range-invalid-out")),
      format: (v) => v,
    },
  ];

  /** @type {(() => void)[]} */
  const unbind = [];

  for (const item of live) {
    if (!item.input || !item.output) continue;
    const onInput = () => {
      const v = item.input.value;
      item.input.setAttribute("aria-valuenow", v);
      item.output.textContent = item.format(v);
    };
    item.input.addEventListener("input", onInput);
    unbind.push(() => item.input.removeEventListener("input", onInput));
  }

  /**
   * @param {string} id
   * @param {{ defaultValue: number|string, format?: (value: string) => string }} opts
   */
  function bindReset(id, opts) {
    const row = host.querySelector(id)?.closest(".form-range-row");
    if (!(row instanceof HTMLElement)) return;
    const field = bindFormRange(row, opts);
    unbind.push(() => field.destroy());
  }

  bindReset("#demo-range-reset-default", {
    defaultValue: 100,
    format: (v) => `${v}\u00a0%`,
  });
  bindReset("#demo-range-reset-custom", {
    defaultValue: 3,
    format: (v) => `${v}\u00a0mm`,
  });
  bindReset("#demo-range-reset-sm", {
    defaultValue: 1.5,
    format: (v) => `${v}\u00a0mm`,
  });
  bindReset("#demo-range-reset-bare", {
    defaultValue: 50,
  });

  return () => {
    unbind.forEach((fn) => fn());
    host.innerHTML = "";
  };
}
