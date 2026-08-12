/**
 * Icônes UI — [Remix Icon](https://remixicon.com/) (fill), viewBox 24×24.
 * Préférer ces glyphes (ou un autre Remix Icon) avant d’inventer un SVG.
 *
 * @param {string} d Attribut `d` du path Remix
 * @returns {string} Markup SVG inline
 */
export function remixIcon(d) {
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
}

/** Path `d` seuls (HTML inline, commentaires `ri-*`) */
export const RI = {
  /** ri-add-fill */
  add: "M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z",
  /** ri-subtract-fill */
  subtract: "M19 11H5v2h14z",
  /** ri-close-fill */
  close:
    "m12 10.587l4.95-4.95l1.414 1.414l-4.95 4.95l4.95 4.95l-1.415 1.414l-4.95-4.95l-4.949 4.95l-1.414-1.415l4.95-4.95l-4.95-4.95L7.05 5.638z",
  /** ri-close-circle-fill */
  closeCircle:
    "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 10.5858L9.17157 7.75736L7.75736 9.17157L10.5858 12L7.75736 14.8284L9.17157 16.2426L12 13.4142L14.8284 16.2426L16.2426 14.8284L13.4142 12L16.2426 9.17157L14.8284 7.75736L12 10.5858Z",
  /** ri-settings-fill */
  settings:
    "m12 1l9.5 5.5v11L12 23l-9.5-5.5v-11zm0 14a3 3 0 1 0 0-6a3 3 0 0 0 0 6",
  /** ri-tools-fill */
  tools:
    "M5.33 3.272a3.5 3.5 0 0 1 4.472 4.473L20.647 18.59l-2.122 2.122L7.68 9.867a3.5 3.5 0 0 1-4.472-4.474L5.444 7.63a1.5 1.5 0 0 0 2.121-2.121zm10.367 1.883l3.182-1.768l1.414 1.415l-1.768 3.182l-1.768.353l-2.12 2.121l-1.415-1.414l2.121-2.121zm-7.071 7.778l2.121 2.122l-4.95 4.95A1.5 1.5 0 0 1 3.58 17.99l.097-.107z",
  /** ri-printer-fill */
  printer:
    "M7 17h10v5H7zm12 3v-5H5v5H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM5 10v2h3v-2zm2-8h10a1 1 0 0 1 1 1v3H6V3a1 1 0 0 1 1-1",
  /** ri-arrow-right-fill */
  arrowRight: "M12 13H4v-2h8V4l8 8l-8 8z",
  /** ri-filter-3-fill */
  filter3: "M10 18h4v-2h-4zM3 6v2h18V6zm3 7h12v-2H6z",
  /** ri-arrow-up-s-fill */
  arrowUpS: "m12 8l6 6H6z",
  /** ri-arrow-down-s-fill */
  arrowDownS: "m12 16l-6-6h12z",
  /** ri-arrow-down-s-line */
  arrowDownSLine:
    "M12 13.1717L16.95 8.22192L18.364 9.63614L12 16L5.636 9.63612L7.0502 8.22192L12 13.1717Z",
  /** ri-search-line */
  searchLine:
    "M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z",
  /** ri-text */
  text: "M13 6v15h-2V6H5V4h14v2z",
  /** ri-hashtag */
  hashtag:
    "m7.784 14l.42-4H4V8h4.415l.525-5h2.011l-.525 5h3.989l.525-5h2.011l-.525 5H20v2h-3.784l-.42 4H20v2h-4.415l-.525 5h-2.011l.525-5H9.585l-.525 5H7.049l.525-5H4v-2zm2.011 0h3.99l.42-4h-3.99z",
  /** ri-calendar-line */
  calendarLine:
    "M9 1v2h6V1h2v2h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1zm11 10H4v8h16zM7 5H4v4h16V5h-3v2h-2V5H9v2H7z",
  /** ri-file-text-line */
  fileTextLine:
    "M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995zm-2 1h-5V4H5v16h14zM8 7h3v2H8zm0 4h8v2H8zm0 4h8v2H8z",
  /** ri-sort-asc */
  sortAsc: "m19 3l4 5h-3v12h-2V8h-3zm-5 15v2H3v-2zm0-7v2H3v-2zm-2-7v2H3V4z",
  /** ri-sort-desc */
  sortDesc: "M20 4v12h3l-4 5l-4-5h3V4zm-8 14v2H3v-2zm2-7v2H3v-2zm0-7v2H3V4z",
};

export const ICON_ADD = remixIcon(RI.add);
export const ICON_SUBTRACT = remixIcon(RI.subtract);
export const ICON_CLOSE = remixIcon(RI.close);
export const ICON_CLOSE_CIRCLE = remixIcon(RI.closeCircle);
export const ICON_SETTINGS = remixIcon(RI.settings);
export const ICON_TOOLS = remixIcon(RI.tools);
export const ICON_PRINTER = remixIcon(RI.printer);
export const ICON_ARROW_RIGHT = remixIcon(RI.arrowRight);
export const ICON_FILTER_3 = remixIcon(RI.filter3);
export const ICON_ARROW_DOWN_S_LINE = remixIcon(RI.arrowDownSLine);
export const ICON_SEARCH_LINE = remixIcon(RI.searchLine);
export const ICON_TEXT = remixIcon(RI.text);
export const ICON_HASHTAG = remixIcon(RI.hashtag);
export const ICON_CALENDAR_LINE = remixIcon(RI.calendarLine);
export const ICON_FILE_TEXT_LINE = remixIcon(RI.fileTextLine);
export const ICON_SORT_ASC = remixIcon(RI.sortAsc);
export const ICON_SORT_DESC = remixIcon(RI.sortDesc);

/**
 * Résout une clé d’icône (`printer`, `arrow-right`, `closeCircle`…) vers le path `d`.
 * @param {string|null|undefined} name
 * @returns {string|null}
 */
export function resolveRemixPath(name) {
  const raw = String(name || "").trim();
  if (!raw) return null;
  if (RI[raw]) return RI[raw];
  const camel = raw.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return RI[camel] || null;
}

/**
 * Markup SVG pour une clé Remix connue, ou chaîne vide.
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function remixIconByName(name) {
  const d = resolveRemixPath(name);
  return d ? remixIcon(d) : "";
}
