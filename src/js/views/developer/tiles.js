import { ICON_LAYOUT_GRID, ICON_SEARCH_LINE, ICON_TEXT } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { tileListMarkup } from "../../tile.js";

/**
 * Galerie des tuiles du design system.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperTiles(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#/developer" })} / Tuiles</p>
        <h1 class="view-title">Tuiles</h1>
        <p class="view-desc">Titre, description, icône, disabled, danger.</p>
      </header>

      <p class="styleguide-intro">
        Classe <code>tile</code> dans <code>ul.tile-list</code>
        (<code>a</code> ou <code>button</code>).
        Titre, description et icône Remix à gauche (centrée) sont optionnels.
        Disabled&nbsp;: <code>disabled</code> / <code>aria-disabled</code>, non cliquable.
        Trait bas inset 2&nbsp;px (<code>--ink-soft</code>, comme les champs).
        Hover / focus&nbsp;: inversion, trait bas masqué.
        Variante <code>danger</code>&nbsp;: couleurs des boutons danger.
        Helper&nbsp;: <code>tileMarkup()</code> / <code>tileListMarkup()</code> (<code>tile.js</code>).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vocabulaire</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Axe</th><th>Options</th></tr>
            </thead>
            <tbody>
              <tr><td>Liste</td><td><code>ul.tile-list</code></td></tr>
              <tr><td>Tuile</td><td><code>a.tile</code> · <code>button.tile</code></td></tr>
              <tr><td>Titre</td><td><code>strong.tile-title</code> (optionnel)</td></tr>
              <tr><td>Description</td><td><code>span.tile-desc</code> (optionnel)</td></tr>
              <tr><td>Icône</td><td>Remix à gauche, centrée verticalement (optionnel)</td></tr>
              <tr><td>Variante</td><td>(défaut) · <code>danger</code></td></tr>
              <tr><td>État</td><td>(actif) · <code>disabled</code> / <code>aria-disabled</code></td></tr>
              <tr><td><code>href</code></td><td>adresse (liens)</td></tr>
              <tr><td><code>tag</code></td><td><code>a</code> (défaut) · <code>button</code> (action)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Titre + description</h2>
        ${tileListMarkup([
          {
            title: "Typographie",
            desc: "polices, titres, Markdown en modale",
            href: "#/developer/typography",
          },
        ])}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Titre seul</h2>
        ${tileListMarkup([{ title: "Liens", href: "#/developer/links" }])}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Avec icône</h2>
        ${tileListMarkup([
          {
            title: "Recherche",
            desc: "search-bar — champ, compteur, tri",
            href: "#/developer/search",
            icon: ICON_SEARCH_LINE,
          },
          {
            title: "Typographie",
            desc: "Open Sans / Inter",
            href: "#/developer/typography",
            icon: ICON_TEXT,
          },
        ])}
        <p class="styleguide-hint">Icône à gauche, alignée au milieu du bloc titre + description.</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Disabled</h2>
        ${tileListMarkup([
          {
            title: "Bientôt",
            desc: "tuile non cliquable",
            href: "#/developer",
            disabled: true,
          },
          {
            title: "Tuiles",
            desc: "avec icône, désactivée",
            href: "#/developer/tiles",
            icon: ICON_LAYOUT_GRID,
            disabled: true,
          },
        ])}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Bouton (action)</h2>
        ${tileListMarkup([
          {
            title: "Importer des cartes",
            desc: "Action sans navigation (pas de href)",
            icon: "upload",
            tag: "button",
          },
        ])}
        <p class="styleguide-hint">Pour une action (import, etc.) : <code>tag: "button"</code>, pas de <code>href</code>.</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Danger</h2>
        ${tileListMarkup([
          {
            title: "Réinitialiser les données locales",
            desc: "Supprime cartes, thèmes et réglages",
            icon: "close-circle",
            tag: "button",
            danger: true,
          },
          {
            title: "Supprimer",
            desc: "Tuile danger désactivée",
            icon: "close-circle",
            tag: "button",
            danger: true,
            disabled: true,
          },
        ])}
        <p class="styleguide-hint">Classe <code>danger</code> : <code>--danger-line</code> ; hover / focus fond <code>--danger-bg</code>, cadre et trait bas rouges.</p>
      </div>

      <p class="styleguide-back">
        ${linkMarkup("← Index styleguide", { href: "#/developer" })}
        ·
        ${linkMarkup("Liens", { href: "#/developer/links" })}
        ·
        ${linkMarkup("App", { href: "#/" })}
      </p>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
