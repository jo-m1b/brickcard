import { ICON_COLLAGE, ICON_PAGES, ICON_PENCIL_RULER_2 } from "../../icons.js";
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
      </header>
      <section class="styleguide-section">
        <h2 class="section-title">${ICON_PENCIL_RULER_2} Aide au développement</h2>
        ${tileListMarkup([
        {
          title: "Thèmes par défaut",
          desc: "Paramétrer et exporter themes-presets.json",
          href: "#developer/theme-presets",
          icon: "palette",
        },
      ])}
      </section>
      <section class="styleguide-section">
        <h2 class="section-title">${ICON_PAGES} Modèles</h2>
        ${tileListMarkup([
        {
          title: "Page de chargement",
          desc: "Modèle de la page de chargement utilisée pendant le démarrage de l’application",
          href: "#developer/loading",
          icon: "loader-4",
        },
      ])}
      </section>
      <section class="styleguide-section">
        <h2 class="section-title">${ICON_COLLAGE} Système de design</h2>
        ${tileListMarkup([
        {
          title: "Typographie",
          desc: "Typographies et styles de texte",
          href: "#developer/typography",
          icon: "text",
        },
        {
          title: "Lien (Link)",
          desc: "Navigation secondaire vers d’autres contenus",
          href: "#developer/links",
          icon: "links",
        },
        {
          title: "Tuile (Tile)",
          desc: "Rediriger vers du contenu via des tuiles",
          href: "#developer/tiles",
          icon: "layout-grid",
        },
        {
          title: "Bouton (Button)",
          desc: "Déclenchement d’une action dans l’interface",
          href: "#developer/buttons",
          icon: "add",
        },
        {
          title: "Champ de saisie (Input)",
          desc: "Saisie de données dans l’interface",
          href: "#developer/fields",
          icon: "file-text-line",
        },
        {
          title: "Liste déroulante (Select)",
          desc: "Sélectionner une option dans une liste",
          href: "#developer/selects",
          icon: "arrow-down-s",
        },
        {
          title: "Curseur (Range)",
          desc: "Sélection d’une valeur sur une échelle",
          href: "#developer/sliders",
          icon: "equalizer",
        },
        {
          title: "Case à cocher (Checkbox)",
          desc: "Sélection multiple dans une liste",
          href: "#developer/checkboxes",
          icon: "checkbox",
        },
        {
          title: "Bouton radio (Radio)",
          desc: "Sélection d’une option unique",
          href: "#developer/radios",
          icon: "radio-button-line",
        },
        {
          title: "Sélecteur de couleur (Color)",
          desc: "Définir une couleur",
          href: "#developer/colors",
          icon: "palette",
        },
        {
          title: "Sélecteur d’image (Image)",
          desc: "Charger et paramétrer le cadrage d’une image",
          href: "#developer/images",
          icon: "upload",
        },
        {
          title: "Barre de recherche (Search)",
          desc: "Accès rapide à un contenu par mot clé",
          href: "#developer/search",
          icon: "search-line",
        },
        {
          title: "Modale (Modal)",
          desc: "Affichage focalisé d’un contenu",
          href: "#developer/modals",
          icon: "window",
        },
      ])}
      </section>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
