import { bindFormColor } from "../../form-color.js";
import { ICON_CLOSE_CIRCLE } from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * Galerie des champs couleur (design system — test uniquement).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperColors(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#/developer" })} / Couleurs</p>
        <h1 class="view-title">Champs couleur</h1>
      </header>

      <p class="styleguide-intro">
        Contrôle&nbsp;: un vrai <code>input.form-control</code> texte,
        avec à l’intérieur une pastille (ouvre le color picker) et un bouton
        effacer (<code>ri-close-circle-fill</code>, visible seulement s’il y a
        une valeur, non focusable). Wrapper&nbsp;: <code>form-color</code>.
        Pastille&nbsp;: affiche la valeur, sinon la couleur par défaut du champ,
        sinon damier (transparent). Appliqué dans l’app.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Défaut</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-hex">Couleur</label>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-hex" name="demo-color-hex" value="#e3000b" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#e3000b">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#e3000b" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-color-required-hex">Accent requis</label>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-required-hex" name="demo-color-required-hex" value="#0055bf" maxlength="7" placeholder="#ffffff" required spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#0055bf">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#0055bf" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Champ vide</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-empty-default-hex">Vide avec couleur par défaut</label>
            <p class="form-hint" id="demo-color-empty-default-desc">La pastille affiche le défaut (#6e6e6e) même si le champ est vide. Clear masqué.</p>
            <div class="form-color" data-form-color data-fallback="#6e6e6e">
              <input class="form-control form-color-hex" type="text" id="demo-color-empty-default-hex" name="demo-color-empty-default-hex" value="" maxlength="7" placeholder="#6e6e6e" spellcheck="false" autocomplete="off" aria-describedby="demo-color-empty-default-desc" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#6e6e6e">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#6e6e6e" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" hidden aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-empty-none-hex">Vide sans couleur par défaut</label>
            <p class="form-hint" id="demo-color-empty-none-desc">Pas de défaut → pastille en damier (transparent).</p>
            <div class="form-color" data-form-color data-fallback="">
              <input class="form-control form-color-hex" type="text" id="demo-color-empty-none-hex" name="demo-color-empty-none-hex" value="" maxlength="7" placeholder="#rrggbb" spellcheck="false" autocomplete="off" aria-describedby="demo-color-empty-none-desc" />
              <label class="form-color-swatch is-empty" title="Choisir une couleur">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#ffffff" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" hidden aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Sans bouton effacer</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-noclear-hex">Couleur figée (clear désactivé)</label>
            <p class="form-hint" id="demo-color-noclear-desc">Le bouton est <code>disabled</code> : visible seulement s’il y a une valeur, mais non cliquable.</p>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-noclear-hex" name="demo-color-noclear-hex" value="#ffd500" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" aria-describedby="demo-color-noclear-desc" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#ffd500">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#ffd500" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" disabled aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-noclear2-hex">Sans clear (absent)</label>
            <div class="form-color" data-form-color data-clear-mode="omit" data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-noclear2-hex" name="demo-color-noclear2-hex" value="#0a8a00" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#0a8a00">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#0a8a00" tabindex="-1" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Taille <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-sm-hex">Fond image</label>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control sm form-color-hex" type="text" id="demo-color-sm-hex" name="demo-color-sm-hex" value="#ffffff" maxlength="7" placeholder="#ffffff" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#ffffff">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#ffffff" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">États</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-color-disabled-hex">Disabled</label>
            <div class="form-color" data-form-color data-fallback="#ffffff">
              <input class="form-control form-color-hex" type="text" id="demo-color-disabled-hex" name="demo-color-disabled-hex" value="#141414" maxlength="7" disabled spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#141414">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#141414" tabindex="-1" disabled />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" disabled aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-invalid-hex">Erreur / saisie invalide</label>
            <p class="form-hint" id="demo-color-invalid-hint">Pastille = défaut (#6e6e6e) tant que le code n’est pas un hex valide.</p>
            <div class="form-color" data-form-color data-fallback="#6e6e6e">
              <input class="form-control form-color-hex is-invalid" type="text" id="demo-color-invalid-hex" name="demo-color-invalid-hex" value="pas-hex" maxlength="16" aria-invalid="true" aria-describedby="demo-color-invalid-hint demo-color-invalid-err" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch" title="Choisir une couleur" style="--swatch:#6e6e6e">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#6e6e6e" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
            <p class="form-error" id="demo-color-invalid-err">Couleur hex invalide (ex. #ff0000).</p>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-color-invalid-none-hex">Invalide sans défaut</label>
            <p class="form-hint" id="demo-color-invalid-none-desc">Sans couleur par défaut → pastille transparente.</p>
            <div class="form-color" data-form-color data-fallback="">
              <input class="form-control form-color-hex is-invalid" type="text" id="demo-color-invalid-none-hex" name="demo-color-invalid-none-hex" value="xyz" maxlength="16" aria-invalid="true" aria-describedby="demo-color-invalid-none-desc demo-color-invalid-none-err" spellcheck="false" autocomplete="off" />
              <label class="form-color-swatch is-empty" title="Choisir une couleur">
                <span class="visually-hidden">Ouvrir le sélecteur de couleur</span>
                <input type="color" class="form-color-native" value="#ffffff" tabindex="-1" />
              </label>
              <button type="button" class="form-color-clear" tabindex="-1" aria-label="Effacer la couleur">
                ${ICON_CLOSE_CIRCLE}
              </button>
            </div>
            <p class="form-error" id="demo-color-invalid-none-err">Couleur hex invalide.</p>
          </div>
        </div>
      </div>

      <p class="styleguide-back">
        ${linkMarkup("← Index styleguide", { href: "#/developer" })}
        ·
        ${linkMarkup("Champs", { href: "#/developer/fields" })}
        ·
        ${linkMarkup("Images", { href: "#/developer/images" })}
        ·
        ${linkMarkup("App", { href: "#/" })}
      </p>
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
