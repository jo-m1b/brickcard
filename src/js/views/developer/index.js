import { linkMarkup } from "../../link.js";
import { tileListMarkup } from "../../tile.js";

/**
 * Index du styleguide / pages de test UI.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperIndex(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">Styleguide</p>
        <h1 class="view-title">Espace développeur</h1>
        <p class="view-desc">Système de design, exemples et documentation</p>
      </header>
      ${tileListMarkup([
        {
          title: "Typographie",
          desc: "polices, titres (classe vs h1–h3), Markdown en modale",
          href: "#/developer/typography",
          icon: "text",
        },
        {
          title: "Liens",
          desc: "link — underline, sm, disabled, icône, externe",
          href: "#/developer/links",
          icon: "links",
        },
        {
          title: "Tuiles",
          desc: "tile — titre, description, icône, disabled, danger",
          href: "#/developer/tiles",
          icon: "layout-grid",
        },
        {
          title: "Boutons",
          desc: "primary, secondary, ghost, danger, icon, badge, tailles",
          href: "#/developer/buttons",
          icon: "add",
        },
        {
          title: "Champs de saisie",
          desc: "text, number, textarea — icônes, états, sm",
          href: "#/developer/fields",
          icon: "file-text-line",
        },
        {
          title: "Listes déroulantes",
          desc: "select — icônes, reset, groupes, états",
          href: "#/developer/selects",
          icon: "arrow-down-s",
        },
        {
          title: "Curseurs",
          desc: "range — hint, valeur, états, sm",
          href: "#/developer/sliders",
          icon: "equalizer",
        },
        {
          title: "Couleurs",
          desc: "color — pastille, hex, effacer",
          href: "#/developer/colors",
          icon: "palette",
        },
        {
          title: "Recherche",
          desc: "search-bar — champ, compteur, tri",
          href: "#/developer/search",
          icon: "search-line",
        },
        {
          title: "Modales",
          desc: "backdrop, tailles, header, scroll, footer",
          href: "#/developer/modals",
          icon: "window",
        },
      ])}
      <p class="styleguide-back">
        ${linkMarkup("← Retour à l’app", { href: "#/" })}
      </p>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
