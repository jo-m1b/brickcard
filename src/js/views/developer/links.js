import { ICON_ARROW_RIGHT, ICON_SEARCH_LINE } from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * Galerie des liens du design system.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperLinks(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Lien (Link)</p>
        <h1 class="view-title">Lien (Link)</h1>
      </header>

      <p class="styleguide-intro">
        Texte souligné, couleur d’encre.
        Classe <code>link</code>. Compact&nbsp;: <code>sm</code>.
        Icône à droite&nbsp;: <code>icon-right</code>.
        Externe (<code>https://</code>)&nbsp;: <code>target="_blank"</code> + icône
        <code>ri-external-link-fill</code> à droite.
        Helper&nbsp;: <code>linkMarkup()</code> (<code>link.js</code>).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vocabulaire</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Axe</th><th>Options</th></tr>
            </thead>
            <tbody>
              <tr><td>Classe</td><td><code>link</code></td></tr>
              <tr><td>Texte</td><td>libellé du lien</td></tr>
              <tr><td>Taille</td><td>(défaut, moyen) · <code>sm</code></td></tr>
              <tr><td>État</td><td>(actif) · <code>disabled</code> / <code>aria-disabled</code></td></tr>
              <tr><td><code>href</code></td><td>adresse</td></tr>
              <tr><td><code>target</code></td><td><code>_blank</code> par défaut si externe</td></tr>
              <tr><td>Icône</td><td>Remix, gauche (défaut) · <code>icon-right</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Texte seul</h2>
        <div class="styleguide-row">
          ${linkMarkup("Lien interne", { href: "#developer" })}
        </div>
        <p class="styleguide-hint">
          Dans un paragraphe&nbsp;: consulter la
          ${linkMarkup("galerie typographie", { href: "#developer/typography" })}
          ou revenir à l’${linkMarkup("index", { href: "#developer" })}.
        </p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Tailles</h2>
        <div class="styleguide-row">
          ${linkMarkup("Moyen (défaut)", { href: "#developer" })}
          ${linkMarkup("Petit", { href: "#developer", sm: true })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Disabled</h2>
        <div class="styleguide-row">
          ${linkMarkup("Lien désactivé", { href: "#developer", disabled: true })}
          ${linkMarkup("Petit désactivé", { href: "#developer", sm: true, disabled: true })}
          ${linkMarkup("Externe désactivé", { href: "https://remixicon.com/", disabled: true })}
        </div>
        <p class="styleguide-hint">Plus d’underline ; couleur <code>--muted</code> ; non focusable.</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Icône à gauche</h2>
        <div class="styleguide-row">
          ${linkMarkup("Rechercher", { href: "#developer/search", icon: ICON_SEARCH_LINE })}
          ${linkMarkup("Petit", { href: "#developer/search", icon: ICON_SEARCH_LINE, sm: true })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Icône à droite</h2>
        <div class="styleguide-row">
          ${linkMarkup("Continuer", { href: "#developer/buttons", icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${linkMarkup("Petit", { href: "#developer/buttons", icon: ICON_ARROW_RIGHT, iconRight: true, sm: true })}
        </div>
        <p class="styleguide-hint">Classe <code>icon-right</code> (SVG en premier dans le DOM, disposition inversée).</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Externe</h2>
        <div class="styleguide-row">
          ${linkMarkup("Remix Icon", { href: "https://remixicon.com/" })}
          ${linkMarkup("Petit", { href: "https://remixicon.com/", sm: true })}
        </div>
        <p class="styleguide-hint">
          Défaut&nbsp;: <code>target="_blank"</code>, <code>rel="noopener noreferrer"</code>,
          icône <code>ri-external-link-fill</code> à droite (sauf si le libellé est une image).
        </p>
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
