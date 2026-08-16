import { enhanceFormSelects } from "../../form-select.js";
import { linkMarkup } from "../../link.js";

/**
 * Galerie des listes déroulantes (design system — test uniquement).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperSelects(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#/developer" })} / Listes déroulantes</p>
        <h1 class="view-title">Listes déroulantes</h1>
      </header>

      <p class="styleguide-intro">
        Markup&nbsp;: <code>select.form-control</code> dans un <code>form-field</code>,
        amélioré via <code>enhanceFormSelects()</code> (<code>form-select.js</code>)&nbsp;:
        le select HTML5 reste en place (soumission / secours), le déclencheur
        est un vrai <code>form-control</code> (trait bas + focus) avec
        <code>ri-arrow-down-s-line</code> à droite, et la liste ouverte est
        entièrement stylable. L’option placeholder (<code>value=""</code>,
        ex. «&nbsp;Choisir&nbsp;») est absente de la liste ; un reset
        (<code>ri-close-circle-fill</code>, non focusable) permet d’y revenir.
        Icônes d’option&nbsp;: <code>data-icon-left</code> /
        <code>data-icon-right</code> (clés Remix de <code>icons.js</code>).
        Clavier&nbsp;: ↓ ↑ Entrée Échap. Compact&nbsp;: <code>sm</code>.
        Appliqué : éditeur (choix du thème).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Défaut</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select">Thème</label>
            <select class="form-control" id="demo-select" name="demo-select">
              <option value="">— Choisir —</option>
              <option value="city">CITY</option>
              <option value="space">Space</option>
              <option value="star-wars">Star Wars</option>
              <option value="ninjago">Ninjago</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-hinted">Tri</label>
            <p class="form-hint" id="demo-select-hinted-desc">Critère d’affichage de la liste.</p>
            <select class="form-control" id="demo-select-hinted" name="demo-select-hinted" aria-describedby="demo-select-hinted-desc">
              <option value="updatedAt">Date de modification</option>
              <option value="title">Titre</option>
              <option value="legoSetRef">Référence</option>
              <option value="releaseYear">Année de sortie</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label form-label--required" for="demo-select-required">Thème requis</label>
            <select class="form-control" id="demo-select-required" name="demo-select-required" required>
              <option value="">— Choisir —</option>
              <option value="city">CITY</option>
              <option value="friends">Friends</option>
            </select>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Taille <code>sm</code></h2>
        <div class="styleguide-fields styleguide-fields--row">
          <div class="form-field">
            <label class="form-label" for="demo-select-sm">Compact</label>
            <select class="form-control sm" id="demo-select-sm" name="demo-select-sm">
              <option>CITY</option>
              <option>Space</option>
              <option>Ninjago</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-sm-empty">Avec placeholder</label>
            <select class="form-control sm" id="demo-select-sm-empty" name="demo-select-sm-empty">
              <option value="">—</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </select>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">États</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select-disabled">Disabled</label>
            <select class="form-control" id="demo-select-disabled" name="demo-select-disabled" disabled>
              <option>Indisponible</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-invalid">Erreur</label>
            <p class="form-hint" id="demo-select-invalid-hint">Choisis le thème adapté.</p>
            <select class="form-control is-invalid" id="demo-select-invalid" name="demo-select-invalid" aria-invalid="true" aria-describedby="demo-select-invalid-hint demo-select-invalid-err">
              <option value="">— Choisir —</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </select>
            <p class="form-error" id="demo-select-invalid-err">Choisis une option.</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Avec icônes</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select-icon-left">Icône à gauche</label>
            <p class="form-hint" id="demo-select-icon-left-desc"><code>data-icon-left</code> sur chaque <code>option</code>.</p>
            <select class="form-control" id="demo-select-icon-left" name="demo-select-icon-left" aria-describedby="demo-select-icon-left-desc">
              <option value="">— Choisir —</option>
              <option value="print" data-icon-left="printer">Imprimer</option>
              <option value="settings" data-icon-left="settings">Paramètres</option>
              <option value="tools" data-icon-left="tools">Outils</option>
              <option value="filter" data-icon-left="filter3">Filtrer</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-icon-right">Icône à droite</label>
            <p class="form-hint" id="demo-select-icon-right-desc"><code>data-icon-right</code> sur chaque <code>option</code>.</p>
            <select class="form-control" id="demo-select-icon-right" name="demo-select-icon-right" aria-describedby="demo-select-icon-right-desc">
              <option value="">— Choisir —</option>
              <option value="next" data-icon-right="arrow-right">Continuer</option>
              <option value="down" data-icon-right="arrow-down-s">Descendre</option>
              <option value="up" data-icon-right="arrow-up-s">Monter</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-icon-both">Icônes des deux côtés</label>
            <p class="form-hint" id="demo-select-icon-both-desc"><code>data-icon-left</code> + <code>data-icon-right</code>.</p>
            <select class="form-control" id="demo-select-icon-both" name="demo-select-icon-both" aria-describedby="demo-select-icon-both-desc">
              <option value="">— Choisir —</option>
              <option value="export" data-icon-left="printer" data-icon-right="arrow-right">Exporter / imprimer</option>
              <option value="tune" data-icon-left="tools" data-icon-right="settings">Réglages avancés</option>
              <option value="add-filter" data-icon-left="add" data-icon-right="filter3">Ajouter un filtre</option>
            </select>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Options longues / groupes</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" for="demo-select-long">Libellé long</label>
            <select class="form-control" id="demo-select-long" name="demo-select-long">
              <option value="">— Choisir —</option>
              <option value="1">Brickcard Generator — export JSON v3</option>
              <option value="2">Impression A4 3×3 face + dos miroir</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="demo-select-groups">Groupes (optgroup)</label>
            <select class="form-control" id="demo-select-groups" name="demo-select-groups">
              <option value="">— Choisir —</option>
              <optgroup label="Classiques">
                <option value="city">CITY</option>
                <option value="space">Space</option>
              </optgroup>
              <optgroup label="Licences">
                <option value="star-wars">Star Wars</option>
                <option value="harry-potter">Harry Potter</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <p class="styleguide-back">
        ${linkMarkup("← Index styleguide", { href: "#/developer" })}
        ·
        ${linkMarkup("Champs", { href: "#/developer/fields" })}
        ·
        ${linkMarkup("App", { href: "#/" })}
      </p>
    </section>
  `;

  const destroySelects = enhanceFormSelects(host);

  return () => {
    destroySelects();
    host.innerHTML = "";
  };
}
