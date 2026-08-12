/**
 * Index du styleguide / pages de test UI.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderTestIndex(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">Styleguide</p>
        <h1 class="view-title">Pages de test UI</h1>
        <p class="view-desc">
          Galeries pour vérifier le design system sans Storybook.
          Accessibles via <code>#/test</code> (et sous-routes).
        </p>
      </header>
      <ul class="styleguide-nav">
        <li>
          <a class="styleguide-nav-link" href="#/test/buttons">
            <strong>Boutons</strong>
            <span>primary, secondary, ghost, danger, icon, badge, tailles</span>
          </a>
        </li>
        <li>
          <a class="styleguide-nav-link" href="#/test/fields">
            <strong>Champs de saisie</strong>
            <span>text, number, textarea — icônes, états, sm</span>
          </a>
        </li>
        <li>
          <a class="styleguide-nav-link" href="#/test/selects">
            <strong>Listes déroulantes</strong>
            <span>select — icônes, reset, groupes, états</span>
          </a>
        </li>
        <li>
          <a class="styleguide-nav-link" href="#/test/sliders">
            <strong>Curseurs</strong>
            <span>range — hint, valeur, états, sm</span>
          </a>
        </li>
        <li>
          <a class="styleguide-nav-link" href="#/test/colors">
            <strong>Couleurs</strong>
            <span>color — pastille, hex, effacer</span>
          </a>
        </li>
        <li>
          <a class="styleguide-nav-link" href="#/test/search">
            <strong>Recherche</strong>
            <span>search-bar — champ, compteur, tri</span>
          </a>
        </li>
        <li>
          <a class="styleguide-nav-link" href="#/test/modals">
            <strong>Modales</strong>
            <span>backdrop, tailles, header, scroll, footer</span>
          </a>
        </li>
      </ul>
      <p class="styleguide-back">
        <a href="#/list">← Retour à l’app</a>
      </p>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
