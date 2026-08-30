import { linkMarkup } from "../../link.js";
import { welcomeViewMarkup } from "../../empty-view.js";

/**
 * Welcome page template (home when the collection is empty).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperWelcome(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Welcome page</p>
        <h1 class="view-title">Welcome page</h1>
      </header>

      <div class="styleguide-section">
        ${welcomeViewMarkup({ titleTag: "p", importId: false, demoId: false })}
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
