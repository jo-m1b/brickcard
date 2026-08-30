import { ICON_COLLAGE, ICON_PAGES, ICON_PENCIL_RULER_2, ICON_SEARCH_LINE } from "../../icons.js";
import { emptyViewMarkup } from "../../empty-view.js";
import { includesCI } from "../../includes-ci.js";
import { tileListMarkup } from "../../tile.js";

let rememberedQuery = "";

/**
 * Styleguide index / UI test pages.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperIndex(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">Styleguide</p>
        <h1 class="view-title">Developer space</h1>
      </header>
      <div class="themes-toolbar">
        <div class="search-bar search-bar--input-only" id="developer-index-search-bar">
          <span class="form-control-icon" aria-hidden="true">${ICON_SEARCH_LINE}</span>
          <input
            class="form-control"
            type="search"
            id="developer-index-search"
            placeholder="Search…"
            autocomplete="off"
            aria-label="Search"
          />
        </div>
      </div>
      <section class="styleguide-section">
        <h2 class="section-title">${ICON_PENCIL_RULER_2} Development help</h2>
        ${tileListMarkup([
        {
          title: "Default themes",
          desc: "Configure and export themes-presets.json",
          href: "#developer/theme-presets",
          icon: "palette",
        },
      ])}
      </section>
      <section class="styleguide-section">
        <h2 class="section-title">${ICON_PAGES} Templates</h2>
        ${tileListMarkup([
        {
          title: "Loading page",
          desc: "Template of the loading page shown while the app starts",
          href: "#developer/loading",
          icon: "loader-4",
        },
        {
          title: "Welcome page",
          desc: "Template of the home page when the collection is empty",
          href: "#developer/welcome",
          icon: "home-smile",
        },
      ])}
      </section>
      <section class="styleguide-section">
        <h2 class="section-title">${ICON_COLLAGE} Design system</h2>
        ${tileListMarkup([
        {
          title: "Typography",
          desc: "Typefaces and text styles",
          href: "#developer/typography",
          icon: "text",
        },
        {
          title: "Link",
          desc: "Secondary navigation to other content",
          href: "#developer/links",
          icon: "links",
        },
        {
          title: "Tile",
          desc: "Redirect to content with tiles",
          href: "#developer/tiles",
          icon: "layout-grid",
        },
        {
          title: "Button",
          desc: "Trigger an action in the interface",
          href: "#developer/buttons",
          icon: "add",
        },
        {
          title: "Input",
          desc: "Enter data in the interface",
          href: "#developer/fields",
          icon: "file-text-line",
        },
        {
          title: "Select",
          desc: "Pick an option from a list",
          href: "#developer/selects",
          icon: "arrow-down-s",
        },
        {
          title: "Range",
          desc: "Pick a value on a scale",
          href: "#developer/sliders",
          icon: "equalizer",
        },
        {
          title: "Checkbox",
          desc: "Multiple selection in a list",
          href: "#developer/checkboxes",
          icon: "checkbox",
        },
        {
          title: "Radio",
          desc: "Pick a single option",
          href: "#developer/radios",
          icon: "radio-button-line",
        },
        {
          title: "Color",
          desc: "Set a color",
          href: "#developer/colors",
          icon: "palette",
        },
        {
          title: "Image",
          desc: "Load an image and adjust its crop",
          href: "#developer/images",
          icon: "upload",
        },
        {
          title: "Search",
          desc: "Quick access to content by keyword",
          href: "#developer/search",
          icon: "search-line",
        },
        {
          title: "Modal",
          desc: "Focused display of content",
          href: "#developer/modals",
          icon: "window",
        },
        {
          title: "Toast",
          desc: "Notify important information",
          href: "#developer/notifications",
          icon: "notification-line",
        },
      ])}
      </section>
      ${emptyViewMarkup({
        id: "developer-index-empty-filter",
        hidden: true,
        titleTag: "p",
        title: "Oops!",
        text: "No pages match the search.",
      })}
    </section>
  `;

  const searchInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#developer-index-search")
  );
  const emptyFilter = host.querySelector("#developer-index-empty-filter");
  const sections = host.querySelectorAll(".styleguide-section");

  if (searchInput) searchInput.value = rememberedQuery;

  function applyFilter() {
    const needle = (searchInput?.value || "").trim();
    let any = false;
    sections.forEach((section) => {
      const titleMatch =
        !needle || includesCI(section.querySelector(".section-title")?.textContent || "", needle);
      let anyTile = false;
      section.querySelectorAll(".tile-list > li").forEach((li) => {
        const href = li.querySelector("a.tile")?.getAttribute("href") || "";
        const show =
          titleMatch ||
          includesCI(li.querySelector(".tile-title")?.textContent || "", needle) ||
          includesCI(li.querySelector(".tile-desc")?.textContent || "", needle) ||
          includesCI(href, needle);
        li.hidden = !show;
        if (show) anyTile = true;
      });
      section.hidden = !anyTile;
      if (anyTile) any = true;
    });
    if (emptyFilter) emptyFilter.hidden = any;
  }

  function onSearchInput() {
    rememberedQuery = searchInput?.value || "";
    applyFilter();
  }

  searchInput?.addEventListener("input", onSearchInput);
  applyFilter();

  return () => {
    searchInput?.removeEventListener("input", onSearchInput);
    host.innerHTML = "";
  };
}
