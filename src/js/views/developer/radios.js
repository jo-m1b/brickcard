import { bindFormRadios, formRadioMarkup } from "../../form-radio.js";
import { linkMarkup } from "../../link.js";

/**
 * Galerie des boutons radio — design system / test uniquement.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperRadios(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Bouton radio (Radio)</p>
        <h1 class="view-title">Bouton radio (Radio)</h1>
      </header>

      <p class="styleguide-intro">
        Contrôle&nbsp;: <code>form-check form-radio</code> (rond à gauche du
        libellé / hint, centré sur le bloc texte). Glyphe
        <code>ri-radio-button-line</code> (masque CSS) ; au repos, le disque
        interne est retiré.
        Hint optionnel sous le libellé ; erreur = message
        <code>form-error</code> seulement (pas de teinte rouge sur le rond).
        Taille&nbsp;: <code>sm</code> (rond plus petit).
        Lecture seule&nbsp;: <code>aria-readonly</code> (l’attribut HTML
        <code>readonly</code> est ignoré par les radios).
        Module&nbsp;: <code>form-radio.js</code>.
        Groupes&nbsp;: même <code>name</code> pour une option unique ;
        <code>form-check-group</code> + légende optionnelle, liste en colonne
        ou en rangée.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Défaut</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-face",
              name: "demo-radio",
              value: "face",
              label: "Face",
              checked: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-back",
              name: "demo-radio",
              value: "back",
              label: "Dos",
              hint: "Miroir horizontal (flip bord long).",
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Taille <code>sm</code></h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-sm-on",
              name: "demo-radio-sm",
              value: "on",
              label: "Mode compact",
              hint: "Même libellé ; rond plus petit.",
              sm: true,
              checked: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-sm-off",
              name: "demo-radio-sm",
              value: "off",
              label: "Mode étendu",
              sm: true,
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">États</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-disabled",
              name: "demo-radio-disabled",
              value: "off",
              label: "Disabled",
              hint: "Non cliquable, non soumise.",
              disabled: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-readonly-on",
              name: "demo-radio-readonly",
              value: "on",
              label: "Lecture seule",
              hint: "Cochée et figée ; la valeur reste soumise.",
              checked: true,
              readonly: true,
            })}
          </div>
          <div class="form-field">
            ${formRadioMarkup({
              id: "demo-radio-readonly-off",
              name: "demo-radio-readonly",
              value: "off",
              label: "Autre option",
              hint: "Le choix figé empêche de changer de radio.",
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
            <p class="form-error" id="demo-radio-invalid-err">Choisis une option.</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Groupe (colonne)</h2>
        <div class="styleguide-fields">
        <fieldset class="form-check-group" aria-describedby="demo-radio-group-hint">
          <legend class="form-label">Côtés à imprimer</legend>
          <p class="form-hint" id="demo-radio-group-hint">Une seule face.</p>
          <div class="form-check-list">
            ${formRadioMarkup({
              id: "demo-radio-group-face",
              name: "demo-radio-group",
              value: "face",
              label: "Face",
              checked: true,
            })}
            ${formRadioMarkup({
              id: "demo-radio-group-back",
              name: "demo-radio-group",
              value: "back",
              label: "Dos",
              hint: "Miroir horizontal (flip bord long).",
            })}
            ${formRadioMarkup({
              id: "demo-radio-group-both",
              name: "demo-radio-group",
              value: "both",
              label: "Face et dos",
            })}
          </div>
        </fieldset>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Groupe (rangée)</h2>
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
          <p class="form-error" id="demo-radio-row-err">Choisis un format.</p>
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
