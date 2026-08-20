import { bindFormCheckboxes, formCheckboxMarkup } from "../../form-checkbox.js";
import { linkMarkup } from "../../link.js";

/**
 * Galerie des cases à cocher — design system / test uniquement.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperCheckboxes(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#/developer" })} / Case à cocher (Checkbox)</p>
        <h1 class="view-title">Case à cocher (Checkbox)</h1>
      </header>

      <p class="styleguide-intro">
        Contrôle&nbsp;: <code>form-check</code> (case à gauche du libellé /
        hint, centrée sur le bloc texte).
        Hint optionnel sous le libellé ; erreur = message
        <code>form-error</code> seulement (pas de teinte rouge sur la case).
        Taille&nbsp;: <code>sm</code> (case plus petite).
        Lecture seule&nbsp;: <code>aria-readonly</code> (l’attribut HTML
        <code>readonly</code> est ignoré par les checkboxes).
        Module&nbsp;: <code>form-checkbox.js</code>.
        Groupes&nbsp;: <code>form-check-group</code> + légende optionnelle,
        liste en colonne ou en rangée.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Défaut</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check",
              name: "demo-check",
              label: "Inclure les figurines",
              checked: true,
            })}
          </div>
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-hinted",
              name: "demo-check-hinted",
              label: "Afficher l’année de sortie",
              hint: "Visible sur la face, sous le titre.",
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Taille <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-sm",
              name: "demo-check-sm",
              label: "Mode compact",
              hint: "Même libellé ; case plus petite.",
              sm: true,
              checked: true,
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">États</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-disabled",
              name: "demo-check-disabled",
              label: "Disabled",
              hint: "Non cliquable, non soumise.",
              disabled: true,
            })}
          </div>
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-readonly",
              name: "demo-check-readonly",
              label: "Lecture seule",
              hint: "Cochée et figée ; la valeur reste soumise.",
              checked: true,
              readonly: true,
            })}
          </div>
          <div class="form-field">
            ${formCheckboxMarkup({
              id: "demo-check-invalid",
              name: "demo-check-invalid",
              label: "Conditions d’utilisation",
              hint: "Obligatoire pour continuer.",
              describedBy: "demo-check-invalid-err",
            })}
            <p class="form-error" id="demo-check-invalid-err">Tu dois accepter les conditions.</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Groupe (colonne)</h2>
        <div class="styleguide-fields">
        <fieldset class="form-check-group" aria-describedby="demo-check-group-hint">
          <legend class="form-label">Côtés à imprimer</legend>
          <p class="form-hint" id="demo-check-group-hint">Au moins une face.</p>
          <div class="form-check-list">
            ${formCheckboxMarkup({
              id: "demo-check-group-face",
              name: "demo-check-group",
              value: "face",
              label: "Face",
              checked: true,
            })}
            ${formCheckboxMarkup({
              id: "demo-check-group-back",
              name: "demo-check-group",
              value: "back",
              label: "Dos",
              hint: "Miroir horizontal (flip bord long).",
              checked: true,
            })}
            ${formCheckboxMarkup({
              id: "demo-check-group-bleed",
              name: "demo-check-group",
              value: "bleed",
              label: "Fond perdu",
            })}
          </div>
        </fieldset>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Groupe (rangée)</h2>
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
          <p class="form-error" id="demo-check-row-err">Coche au moins un format.</p>
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
