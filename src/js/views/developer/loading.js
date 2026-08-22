import { linkMarkup } from "../../link.js";
import { loadingViewMarkup } from "../../empty-view.js";

/** Phrase de démo (l’app affiche le message technique réel). */
const SAMPLE_BOOT_ERROR = "Message de l’erreur ayant provoqué l’arrêt du chargement !";

/**
 * Modèle de la page de chargement (démarrage de l’application).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperLoading(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Page de chargement</p>
        <h1 class="view-title">Page de chargement</h1>
      </header>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Chargement en cours</h2>
        ${loadingViewMarkup({ titleTag: "p" })}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Erreur de chargement</h2>
        ${loadingViewMarkup({
          titleTag: "p",
          busy: false,
          error: SAMPLE_BOOT_ERROR,
        })}
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
