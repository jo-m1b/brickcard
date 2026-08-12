import {
  ICON_CALENDAR_LINE,
  ICON_FILE_TEXT_LINE,
  ICON_HASHTAG,
  ICON_TEXT,
} from "../../icons.js";

/**
 * Galerie des champs de saisie (design system — test uniquement).
 * Select : voir `#/test/selects`.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderTestFields(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker"><a href="#/test">Styleguide</a> / Champs</p>
        <h1 class="view-title">Champs de saisie</h1>
        <p class="view-desc">
          Ordre&nbsp;: label → hint → contrôle → erreur.
          Classes&nbsp;: <code>form-field</code> + <code>form-label</code> /
          <code>form-hint</code> / <code>form-error</code> + <code>form-control</code>
          (text, number, textarea).
          Icône optionnelle&nbsp;: wrapper <code>form-control-wrap</code> +
          <code>form-control-icon</code> (Remix, décoratif).
          Listes déroulantes&nbsp;: <a href="#/test/selects">page dédiée</a>.
          Compact&nbsp;: <code>sm</code>.
          Repos&nbsp;: fond + trait bas (inset). Focus&nbsp;: cadre avec 1&nbsp;px d’air (pas de hover).
        </p>
      </header>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Texte</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-text">Titre</label>
            <input class="form-control" type="text" id="demo-text" name="demo-text" placeholder="Ex. Camion de pompiers" autocomplete="off" />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-text-icon">Titre avec icône</label>
            <p class="form-hint" id="demo-text-icon-desc">Icône optionnelle (<code>ri-text</code>).</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_TEXT}</span>
              <input class="form-control" type="text" id="demo-text-icon" name="demo-text-icon" placeholder="Ex. Camion de pompiers" autocomplete="off" aria-describedby="demo-text-icon-desc" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-text-hinted">Référence</label>
            <p class="form-hint" id="demo-text-hinted-desc">Numéro de set LEGO, éventuellement composé.</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_HASHTAG}</span>
              <input class="form-control" type="text" id="demo-text-hinted" name="demo-text-hinted" placeholder="6140/6109" aria-describedby="demo-text-hinted-desc" autocomplete="off" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-text-required">Champ requis</label>
            <input class="form-control" type="text" id="demo-text-required" name="demo-text-required" required autocomplete="off" />
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Nombre</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-number">Nombre de pièces</label>
            <input class="form-control" type="number" id="demo-number" name="demo-number" min="0" step="1" placeholder="232" inputmode="numeric" />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-number-icon">Pièces avec icône</label>
            <p class="form-hint" id="demo-number-icon-desc">Même champ avec <code>ri-hashtag</code>.</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_HASHTAG}</span>
              <input class="form-control" type="number" id="demo-number-icon" name="demo-number-icon" min="0" step="1" placeholder="232" inputmode="numeric" aria-describedby="demo-number-icon-desc" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-number-year">Année de sortie</label>
            <p class="form-hint" id="demo-number-year-desc">Optionnel — icône <code>ri-calendar-line</code>.</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_CALENDAR_LINE}</span>
              <input class="form-control" type="number" id="demo-number-year" name="demo-number-year" min="1949" max="2100" step="1" placeholder="1998" inputmode="numeric" aria-describedby="demo-number-year-desc" />
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Zone de texte</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-textarea">Description</label>
            <textarea class="form-control" id="demo-textarea" name="demo-textarea" rows="4" placeholder="Notes libres…"></textarea>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-textarea-icon">Description avec icône</label>
            <p class="form-hint" id="demo-textarea-icon-desc">Icône en haut à gauche (<code>ri-file-text-line</code>).</p>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_FILE_TEXT_LINE}</span>
              <textarea class="form-control" id="demo-textarea-icon" name="demo-textarea-icon" rows="4" placeholder="Notes libres…" aria-describedby="demo-textarea-icon-desc"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Taille <code>sm</code></h2>
        <div class="styleguide-fields styleguide-fields--row">
          <div class="form-field">
            <label class="form-label" for="demo-text-sm">Texte</label>
            <input class="form-control sm" type="text" id="demo-text-sm" name="demo-text-sm" placeholder="Compact" autocomplete="off" />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-text-sm-icon">Texte + icône</label>
            <div class="form-control-wrap">
              <span class="form-control-icon" aria-hidden="true">${ICON_TEXT}</span>
              <input class="form-control sm" type="text" id="demo-text-sm-icon" name="demo-text-sm-icon" placeholder="Compact" autocomplete="off" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-number-sm">Nombre</label>
            <input class="form-control sm" type="number" id="demo-number-sm" name="demo-number-sm" min="0" placeholder="12" inputmode="numeric" />
          </div>
        </div>
        <div class="form-field" style="margin-top: 0.85rem; max-width: 28rem">
          <label class="form-label" for="demo-textarea-sm">Textarea</label>
          <textarea class="form-control sm" id="demo-textarea-sm" name="demo-textarea-sm" rows="3" placeholder="Compact…"></textarea>
        </div>
        <div class="form-field" style="margin-top: 0.85rem; max-width: 28rem">
          <label class="form-label" for="demo-textarea-sm-icon">Textarea + icône</label>
          <div class="form-control-wrap">
            <span class="form-control-icon" aria-hidden="true">${ICON_FILE_TEXT_LINE}</span>
            <textarea class="form-control sm" id="demo-textarea-sm-icon" name="demo-textarea-sm-icon" rows="3" placeholder="Compact…"></textarea>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">États</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-disabled">Disabled</label>
            <input class="form-control" type="text" id="demo-disabled" name="demo-disabled" value="Non modifiable" disabled />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-readonly">Lecture seule</label>
            <input class="form-control" type="text" id="demo-readonly" name="demo-readonly" value="Valeur figée" readonly />
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-invalid">Erreur</label>
            <p class="form-hint" id="demo-invalid-hint">Le hint reste visible au-dessus.</p>
            <input class="form-control is-invalid" type="text" id="demo-invalid" name="demo-invalid" aria-invalid="true" aria-describedby="demo-invalid-hint demo-invalid-err" autocomplete="off" />
            <p class="form-error" id="demo-invalid-err">Ce champ est obligatoire.</p>
          </div>
        </div>
      </div>

      <p class="styleguide-back">
        <a href="#/test">← Index styleguide</a>
        ·
        <a href="#/test/selects">Listes déroulantes</a>
        ·
        <a href="#/list">App</a>
      </p>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
