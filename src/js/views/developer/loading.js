import { linkMarkup } from "../../link.js";
import { loadingViewMarkup } from "../../empty-view.js";

/** Demo sentence (the app shows the real technical message). */
const SAMPLE_BOOT_ERROR = "Message of the error that stopped loading!";

/**
 * Loading page template (application startup).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperLoading(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Loading page</p>
        <h1 class="view-title">Loading page</h1>
      </header>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Loading</h2>
        ${loadingViewMarkup({ titleTag: "p" })}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Load error</h2>
        ${loadingViewMarkup({
          titleTag: "p",
          busy: false,
          error: SAMPLE_BOOT_ERROR,
        })}
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Load error — retry</h2>
        ${loadingViewMarkup({
          titleTag: "p",
          busy: false,
          error: SAMPLE_BOOT_ERROR,
          retry: true,
          retryId: false,
        })}
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
