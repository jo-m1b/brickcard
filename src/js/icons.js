/**
 * Icônes UI — [Remix Icon](https://remixicon.com/) (fill), toujours carrées (24×24).
 * Préférer ces glyphes (ou un autre Remix Icon) avant d’inventer un SVG.
 * Ne pas omettre `width`/`height` : un SVG sans taille intrinsèque vaut 300×150.
 *
 * @param {string} d Attribut `d` du path Remix
 * @returns {string} Markup SVG inline
 */
export function remixIcon(d) {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
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
  /** ri-arrow-right-wide-fill */
  arrowRightWide:
    "m15.632 12l-4.748-8.968l-1.768.936L13.368 12l-4.252 8.032l1.768.936z",
  /** ri-collage-fill */
  collage:
    "m11.189 13.264l1.383 7.842H4a1 1 0 0 1-1-1V14.71zM20 3.107a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1l-5.398-.001l-3.174-18zM9.398 3.106l1.444 8.188L3 12.679V4.107a1 1 0 0 1 1-1z",
  /** ri-pencil-ruler-2-fill */
  pencilRuler2:
    "m5.636 12.707l1.829 1.829l1.414-1.415l-1.829-1.828l1.415-1.414l1.828 1.828l1.414-1.414L9.88 8.464l1.414-1.414l1.828 1.829l1.415-1.415l-1.829-1.828l2.829-2.828a1 1 0 0 1 1.414 0l4.243 4.242a1 1 0 0 1 0 1.414L8.465 21.192a1 1 0 0 1-1.415 0L2.808 16.95a1 1 0 0 1 0-1.414zm8.485 5.656l4.243-4.242L21 16.756V21h-4.242zM5.636 9.878L2.808 7.05a1 1 0 0 1 0-1.415l2.828-2.828a1 1 0 0 1 1.414 0l2.83 2.828z",
  /** ri-pencil-fill */
  pencil:
    "m12.9 6.855l4.242 4.242l-9.9 9.9H3v-4.243zm1.414-1.415l2.121-2.121a1 1 0 0 1 1.414 0l2.829 2.828a1 1 0 0 1 0 1.415l-2.122 2.121z",
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
  /** ri-calendar-todo-fill — badge année de carte */
  calendarTodo:
    "M17 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3ZM4 9V19H20V9H4ZM6 11H8V13H6V11ZM11 11H13V13H11V11ZM16 11H18V13H16V11Z",
  /** ri-apps-2-fill — badge nombre de pièces */
  apps2:
    "M5 5V11H11V5H5ZM5 13V19H11V13H5ZM13 5V11H19V5H13ZM13 13V19H19V13H13ZM7 7H9V9H7V7ZM7 15H9V17H7V15ZM15 7H17V9H15V7ZM15 15H17V17H15V15Z",
  /** ri-user-3-fill — badge nombre de figurines */
  user3:
    "M12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2ZM12 10C16.4183 10 20 12.2386 20 15V20H4V15C4 12.2386 7.58172 10 12 10Z",
  /** ri-file-text-line */
  fileTextLine:
    "M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995zm-2 1h-5V4H5v16h14zM8 7h3v2H8zm0 4h8v2H8zm0 4h8v2H8z",
  /** ri-sort-asc */
  sortAsc: "m19 3l4 5h-3v12h-2V8h-3zm-5 15v2H3v-2zm0-7v2H3v-2zm-2-7v2H3V4z",
  /** ri-sort-desc */
  sortDesc: "M20 4v12h3l-4 5l-4-5h3V4zm-8 14v2H3v-2zm2-7v2H3v-2zm0-7v2H3V4z",
  /** ri-external-link-fill */
  externalLink:
    "M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z",
  /** ri-links-fill */
  links:
    "M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 0 0-7.071-7.071L9.878 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 0 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z",
  /** ri-layout-grid-fill */
  layoutGrid:
    "M22 13v7a1 1 0 0 1-1 1h-8v-8h9zm-11 0v8H3a1 1 0 0 1-1-1v-7h9zM11 3v8H2V4a1 1 0 0 1 1-1h8zm10 0a1 1 0 0 1 1 1v7h-9V3h8z",
  /** ri-window-fill */
  window:
    "M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 8H4v8h16z",
  /** ri-pages-fill */
  pages:
    "M20 22H4C3.44772 22 3 21.5523 3 21V8H21V21C21 21.5523 20.5523 22 20 22ZM21 6H3V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V6ZM7 11V15H11V11H7ZM7 17V19H17V17H7ZM13 12V14H17V12H13Z",
  /** ri-loader-4-fill */
  loader4:
    "M18.364 5.63604L16.9497 7.05025C15.683 5.7835 13.933 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12H21C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.4853 3 16.7353 4.00736 18.364 5.63604Z",
  /** ri-home-smile-fill */
  homeSmile:
    "M20 20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V11H1L11.3273 1.6115C11.7087 1.26475 12.2913 1.26475 12.6727 1.6115L23 11H20V20ZM7.5 13C7.5 15.4853 9.51472 17.5 12 17.5C14.4853 17.5 16.5 15.4853 16.5 13H14.5C14.5 14.3807 13.3807 15.5 12 15.5C10.6193 15.5 9.5 14.3807 9.5 13H7.5Z",
  /** ri-emotion-fill */
  emotion:
    "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM7 12C7 14.2091 8.79086 16 11 16H13C15.2091 16 17 14.2091 17 12H15C15 13.1046 14.1046 14 13 14H11C9.89543 14 9 13.1046 9 12H7ZM8 10C8.82843 10 9.5 9.32843 9.5 8.5C9.5 7.67157 8.82843 7 8 7C7.17157 7 6.5 7.67157 6.5 8.5C6.5 9.32843 7.17157 10 8 10ZM16 10C16.8284 10 17.5 9.32843 17.5 8.5C17.5 7.67157 16.8284 7 16 7C15.1716 7 14.5 7.67157 14.5 8.5C14.5 9.32843 15.1716 10 16 10Z",
  /** ri-error-warning-line */
  errorWarningLine:
    "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z",
  /** ri-error-warning-fill */
  errorWarningFill:
    "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 15V17H13V15H11ZM11 7V13H13V7H11Z",
  /** ri-notification-line */
  notificationLine:
    "M5 18H19V11.0314C19 7.14806 15.866 4 12 4C8.13401 4 5 7.14806 5 11.0314V18ZM12 2C16.9706 2 21 6.04348 21 11.0314V20H3V11.0314C3 6.04348 7.02944 2 12 2ZM9.5 21H14.5C14.5 22.3807 13.3807 23.5 12 23.5C10.6193 23.5 9.5 22.3807 9.5 21Z",
  /** ri-checkbox-circle-fill */
  checkboxCircleFill:
    "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM17.4571 9.45711L16.0429 8.04289L10.5 13.5858L7.95711 11.0429L6.54289 12.4571L10.5 16.4142L17.4571 9.45711Z",
  /** ri-palette-fill */
  palette:
    "M12 2C17.5222 2 22 5.97778 22 10.8889C22 13.9556 19.5111 16.4444 16.4444 16.4444H14.4778C13.5556 16.4444 12.8111 17.1889 12.8111 18.1111C12.8111 18.5333 12.9778 18.9222 13.2333 19.2111C13.5 19.5111 13.6667 19.9 13.6667 20.3333C13.6667 21.2556 12.9 22 12 22C6.47778 22 2 17.5222 2 12C2 6.47778 6.47778 2 12 2ZM10.8111 18.1111C10.8111 16.0843 12.451 14.4444 14.4778 14.4444H16.4444C18.4065 14.4444 20 12.851 20 10.8889C20 7.1392 16.4677 4 12 4C7.58235 4 4 7.58235 4 12C4 16.19 7.2226 19.6285 11.324 19.9718C10.9948 19.4168 10.8111 18.7761 10.8111 18.1111ZM7.5 12C6.67157 12 6 11.3284 6 10.5C6 9.67157 6.67157 9 7.5 9C8.32843 9 9 9.67157 9 10.5C9 11.3284 8.32843 12 7.5 12ZM16.5 12C15.6716 12 15 11.3284 15 10.5C15 9.67157 15.6716 9 16.5 9C17.3284 9 18 9.67157 18 10.5C18 11.3284 17.3284 12 16.5 12ZM12 9C11.1716 9 10.5 8.32843 10.5 7.5C10.5 6.67157 11.1716 6 12 6C12.8284 6 13.5 6.67157 13.5 7.5C13.5 8.32843 12.8284 9 12 9Z",
  /** ri-equalizer-fill */
  equalizer:
    "M6.17 18a3.001 3.001 0 0 1 5.66 0H22v2H11.83a3.001 3.001 0 0 1-5.66 0H2v-2zm6-7a3.001 3.001 0 0 1 5.66 0H22v2h-4.17a3.001 3.001 0 0 1-5.66 0H2v-2zm-6-7a3.001 3.001 0 0 1 5.66 0H22v2H11.83a3.001 3.001 0 0 1-5.66 0H2V4z",
  /** ri-checkbox-fill */
  checkbox:
    "M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm7.003 13l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z",
  /** ri-radio-button-line */
  radioButtonLine:
    "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17Z",
  /** ri-cloud-fill */
  cloud:
    "M17 7C13.5705 7 10.6449 9.15804 9.50734 12.1903L11.3805 12.8927C12.2337 10.6185 14.4278 9 17 9C17.6983 9 18.3687 9.11928 18.992 9.33857C21.3265 10.16 23 12.3846 23 15C23 18.3137 20.3137 21 17 21H7C3.68629 21 1 18.3137 1 15C1 12.3846 2.67346 10.16 5.00804 9.33857C5.0027 9.22639 5 9.11351 5 9C5 5.13401 8.13401 2 12 2C15.242 2 17.9693 4.20399 18.7652 7.19539C18.1973 7.0675 17.6065 7 17 7Z",
  /** ri-download-fill */
  download: "M13 10h5l-6 6-6-6h5V3h2v7zm-9 9h16v2H4v-2z",
  /** ri-upload-fill */
  upload: "M11 11H6l6-6 6 6h-5v8h-2v-8zM4 20h16v2H4v-2z",
  /** ri-delete-bin-fill */
  deleteBin:
    "M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM9 11V17H11V11H9ZM13 11V17H15V11H13ZM9 4V6H15V4H9Z",
  /** ri-delete-bin-2-fill */
  deleteBin2:
    "M7 6V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5Zm6.414 8l1.768-1.768l-1.414-1.414L12 12.586l-1.768-1.768l-1.414 1.414L10.586 14l-1.768 1.768l1.414 1.414L12 15.414l1.768 1.768l1.414-1.414L13.414 14ZM9 4v2h6V4H9Z",
  /** ri-save-fill */
  save:
    "M18 21v-8H6v8H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h13l4 4v13a1 1 0 0 1-1 1h-2Zm-2 0H8v-6h8v6Z",
  /** ri-file-line */
  fileLine:
    "M9 2.003V2h10.995C20.55 2 21 2.455 21 2.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 20.993V8l6-5.997zM5.83 8H9V4.83L5.83 8zM11 4v5a1 1 0 0 1-1 1H5v10h14V4z",
  /** ri-link */
  link:
    "M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 0 0-7.071-7.071L9.878 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 0 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z",
  /** ri-zoom-in-fill */
  zoomIn:
    "M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM10 10H7V12H10V15H12V12H15V10H12V7H10V10Z",
  /** ri-align-item-horizontal-center-fill */
  alignItemHorizontalCenter:
    "M11 4V2H13V4H19C19.5523 4 20 4.44772 20 5V10C20 10.5523 19.5523 11 19 11H13V13H17C17.5523 13 18 13.4477 18 14V19C18 19.5523 17.5523 20 17 20H13V22H11V20H7C6.44772 20 6 19.5523 6 19V14C6 13.4477 6.44772 13 7 13H11V11H5C4.44772 11 4 10.5523 4 10V5C4 4.44772 4.44772 4 5 4H11Z",
  /** ri-align-item-vertical-center-fill */
  alignItemVerticalCenter:
    "M4 19C4 19.5523 4.44772 20 5 20H10C10.5523 20 11 19.5523 11 19V13H13V17C13 17.5523 13.4477 18 14 18H19C19.5523 18 20 17.5523 20 17V13H22V11H20V7C20 6.44772 19.5523 6 19 6L14 6C13.4477 6 13 6.44772 13 7V11H11V5C11 4.44771 10.5523 4 10 4H5C4.44771 4 4 4.44772 4 5L4 11H2V13H4L4 19Z",
};

export const ICON_ADD = remixIcon(RI.add);
export const ICON_SUBTRACT = remixIcon(RI.subtract);
export const ICON_CLOSE = remixIcon(RI.close);
export const ICON_CLOSE_CIRCLE = remixIcon(RI.closeCircle);
export const ICON_SETTINGS = remixIcon(RI.settings);
export const ICON_TOOLS = remixIcon(RI.tools);
export const ICON_PRINTER = remixIcon(RI.printer);
export const ICON_ARROW_RIGHT = remixIcon(RI.arrowRight);
export const ICON_ARROW_RIGHT_WIDE = remixIcon(RI.arrowRightWide);
export const ICON_COLLAGE = remixIcon(RI.collage);
export const ICON_PENCIL_RULER_2 = remixIcon(RI.pencilRuler2);
export const ICON_PENCIL = remixIcon(RI.pencil);
export const ICON_FILTER_3 = remixIcon(RI.filter3);
export const ICON_ARROW_DOWN_S_LINE = remixIcon(RI.arrowDownSLine);
export const ICON_SEARCH_LINE = remixIcon(RI.searchLine);
export const ICON_TEXT = remixIcon(RI.text);
export const ICON_HASHTAG = remixIcon(RI.hashtag);
export const ICON_CALENDAR_LINE = remixIcon(RI.calendarLine);
export const ICON_CALENDAR_TODO = remixIcon(RI.calendarTodo);
export const ICON_APPS_2 = remixIcon(RI.apps2);
export const ICON_USER_3 = remixIcon(RI.user3);
export const ICON_FILE_TEXT_LINE = remixIcon(RI.fileTextLine);
export const ICON_SORT_ASC = remixIcon(RI.sortAsc);
export const ICON_SORT_DESC = remixIcon(RI.sortDesc);
export const ICON_EXTERNAL_LINK = remixIcon(RI.externalLink);
export const ICON_LINKS = remixIcon(RI.links);
export const ICON_LINK = remixIcon(RI.link);
export const ICON_LAYOUT_GRID = remixIcon(RI.layoutGrid);
export const ICON_WINDOW = remixIcon(RI.window);
export const ICON_PAGES = remixIcon(RI.pages);
export const ICON_LOADER_4 = remixIcon(RI.loader4);
export const ICON_HOME_SMILE = remixIcon(RI.homeSmile);
export const ICON_EMOTION = remixIcon(RI.emotion);
export const ICON_ERROR_WARNING_LINE = remixIcon(RI.errorWarningLine);
export const ICON_ERROR_WARNING = remixIcon(RI.errorWarningFill);
export const ICON_NOTIFICATION_LINE = remixIcon(RI.notificationLine);
export const ICON_CHECKBOX_CIRCLE = remixIcon(RI.checkboxCircleFill);
export const ICON_PALETTE = remixIcon(RI.palette);
export const ICON_EQUALIZER = remixIcon(RI.equalizer);
export const ICON_CHECKBOX = remixIcon(RI.checkbox);
export const ICON_RADIO_BUTTON_LINE = remixIcon(RI.radioButtonLine);
export const ICON_ARROW_DOWN_S = remixIcon(RI.arrowDownS);
export const ICON_CLOUD = remixIcon(RI.cloud);
export const ICON_DOWNLOAD = remixIcon(RI.download);
export const ICON_UPLOAD = remixIcon(RI.upload);
export const ICON_DELETE_BIN = remixIcon(RI.deleteBin);
export const ICON_DELETE_BIN_2 = remixIcon(RI.deleteBin2);
export const ICON_SAVE = remixIcon(RI.save);
export const ICON_FILE_LINE = remixIcon(RI.fileLine);
export const ICON_ZOOM_IN = remixIcon(RI.zoomIn);
export const ICON_ALIGN_ITEM_HORIZONTAL_CENTER = remixIcon(RI.alignItemHorizontalCenter);
export const ICON_ALIGN_ITEM_VERTICAL_CENTER = remixIcon(RI.alignItemVerticalCenter);

/**
 * Résout une clé d’icône (`printer`, `arrow-right`, `pencil-ruler-2`, `closeCircle`…) vers le path `d`.
 * @param {string|null|undefined} name
 * @returns {string|null}
 */
export function resolveRemixPath(name) {
  const raw = String(name || "").trim();
  if (!raw) return null;
  if (RI[raw]) return RI[raw];
  const camel = raw.replace(/-([a-z0-9])/gi, (_, c) => c.toUpperCase());
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

/**
 * Titre de modale : icône Remix optionnelle à gauche (décorative), puis le texte.
 * @param {string} text
 * @param {string|false|null|undefined} icon Clé Remix ou markup SVG
 * @returns {string}
 */
export function modalTitleMarkup(text, icon) {
  const raw = icon == null || icon === false || icon === "" ? "" : String(icon);
  const svg = raw.includes("<svg") ? raw : remixIconByName(raw);
  const label = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const title = `<span>${label}</span>`;
  if (!svg) return title;
  return `${svg}${title}`;
}
