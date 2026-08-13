/**
 * Galerie des curseurs (range) — design system / test uniquement.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperSliders(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker"><a href="#/developer">Styleguide</a> / Curseurs</p>
        <h1 class="view-title">Curseurs (range)</h1>
        <p class="view-desc">
          Ordre&nbsp;: label → hint → contrôle → erreur.
          Contrôle&nbsp;: <code>form-range-row</code> avec
          <code>input[type=range]</code> (+ <code>output</code> optionnel).
          Même vocabulaire de champ (<code>form-field</code> / <code>form-label</code> /
          <code>form-hint</code> / <code>form-error</code>).
          Appliqué dans les paramètres et l’éditeur (zoom photo).
        </p>
      </header>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Défaut</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range">Zoom</label>
            <div class="form-range-row">
              <input type="range" id="demo-range" name="demo-range" min="25" max="400" step="1" value="100" aria-valuemin="25" aria-valuemax="400" aria-valuenow="100" aria-describedby="demo-range-out" />
              <output id="demo-range-out" for="demo-range">100&nbsp;%</output>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-range-hinted">Bordure (face)</label>
            <p class="form-hint" id="demo-range-hinted-desc">Épaisseur de la bordure colorée sur la face de la carte.</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-hinted" name="demo-range-hinted" min="0" max="8" step="0.5" value="3" aria-valuemin="0" aria-valuemax="8" aria-valuenow="3" aria-describedby="demo-range-hinted-desc demo-range-hinted-out" />
              <output id="demo-range-hinted-out" for="demo-range-hinted">3&nbsp;mm</output>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-range-required">Cartes par ligne</label>
            <div class="form-range-row">
              <input type="range" id="demo-range-required" name="demo-range-required" min="2" max="10" step="1" value="4" required aria-valuemin="2" aria-valuemax="10" aria-valuenow="4" aria-describedby="demo-range-required-out" />
              <output id="demo-range-required-out" for="demo-range-required">4</output>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Sans valeur affichée</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range-bare">Opacité</label>
            <p class="form-hint" id="demo-range-bare-desc">Le <code>output</code> est optionnel.</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-bare" name="demo-range-bare" min="0" max="100" step="1" value="80" aria-describedby="demo-range-bare-desc" />
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Taille <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range-sm">Coins arrondis</label>
            <div class="form-range-row sm">
              <input type="range" id="demo-range-sm" name="demo-range-sm" min="0" max="6" step="0.5" value="1.5" aria-valuemin="0" aria-valuemax="6" aria-valuenow="1.5" aria-describedby="demo-range-sm-out" />
              <output id="demo-range-sm-out" for="demo-range-sm">1,5&nbsp;mm</output>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">États</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-range-disabled">Disabled</label>
            <div class="form-range-row">
              <input type="range" id="demo-range-disabled" name="demo-range-disabled" min="0" max="100" value="40" disabled aria-describedby="demo-range-disabled-out" />
              <output id="demo-range-disabled-out" for="demo-range-disabled">40</output>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-range-invalid">Erreur</label>
            <p class="form-hint" id="demo-range-invalid-hint">Le hint reste visible au-dessus.</p>
            <div class="form-range-row">
              <input type="range" id="demo-range-invalid" name="demo-range-invalid" min="2" max="10" step="1" value="1" aria-invalid="true" aria-valuemin="2" aria-valuemax="10" aria-valuenow="1" aria-describedby="demo-range-invalid-hint demo-range-invalid-out demo-range-invalid-err" />
              <output id="demo-range-invalid-out" for="demo-range-invalid">1</output>
            </div>
            <p class="form-error" id="demo-range-invalid-err">Minimum&nbsp;: 2 cartes par ligne.</p>
          </div>
        </div>
      </div>

      <p class="styleguide-back">
        <a href="#/developer">← Index styleguide</a>
        ·
        <a href="#/developer/fields">Champs</a>
        ·
        <a href="#/">App</a>
      </p>
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
      format: (v) => `${String(v).replace(".", ",")}\u00a0mm`,
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

  return () => {
    unbind.forEach((fn) => fn());
    host.innerHTML = "";
  };
}
