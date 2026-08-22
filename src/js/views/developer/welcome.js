import { linkMarkup } from "../../link.js";
import { welcomeViewMarkup } from "../../empty-view.js";

/**
 * Modèle de la page de bienvenue (accueil lorsque la collection est vide).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperWelcome(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Page de bienvenue</p>
        <h1 class="view-title">Page de bienvenue</h1>
      </header>

      <div class="styleguide-section">
        ${welcomeViewMarkup({ titleTag: "p", importId: false })}
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
