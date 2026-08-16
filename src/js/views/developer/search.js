import {
  ICON_FILTER_3,
  ICON_SEARCH_LINE,
  ICON_SORT_ASC,
  ICON_SORT_DESC,
} from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * @param {string} svg
 * @returns {string}
 */
function controlIconMarkup(svg) {
  return `<span class="form-control-icon" aria-hidden="true">${svg}</span>`;
}
/**
 * Galerie de la barre de recherche (design system — test uniquement).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperSearch(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#/developer" })} / Recherche</p>
        <h1 class="view-title">Barre de recherche</h1>
      </header>

      <p class="styleguide-intro">
        Bloc <code>search-bar</code>&nbsp;: <code>input.form-control</code>
        (<code>type="search"</code>) + trail optionnel (<code>search-count</code>,
        menu <code>search-sort</code>).
        Icône&nbsp;: <code>form-control-icon</code> <strong>optionnelle</strong>
        (défaut recherche&nbsp;: <code>ri-search-line</code>).
        Même look qu’un champ texte (fond <code>--form-control-bg</code>,
        trait bas inset, focus cadre <code>ink</code>).
        Slot topbar&nbsp;: <code>topbar-search</code> centre le bloc.
        Compteur + tri&nbsp;: visibles seulement s’il y a <strong>au moins 2</strong>
        éléments. Libellé toujours «&nbsp;cartes&nbsp;».
        Appliqué : liste des cartes (topbar) · modale thèmes (compteur + tri).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Champ seul</h2>
        <div class="styleguide-fields" style="max-width: 36rem">
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">Avec icône (défaut recherche)</p>
            <div class="styleguide-search-demo">
              <div class="search-bar search-bar--input-only">
                ${controlIconMarkup(ICON_SEARCH_LINE)}
                <input class="form-control" type="search" id="demo-search-plain" placeholder="Rechercher…" autocomplete="off" aria-label="Recherche avec icône" />
              </div>
            </div>
          </div>
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">Sans icône</p>
            <div class="styleguide-search-demo">
              <div class="search-bar search-bar--input-only">
                <input class="form-control" type="search" id="demo-search-plain-noicon" placeholder="Rechercher…" autocomplete="off" aria-label="Recherche sans icône" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Avec compteur</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Tape pour voir le compteur se mettre à jour (démo locale).</p>
        <div class="styleguide-search-demo">
          <div class="search-bar">
            ${controlIconMarkup(ICON_SEARCH_LINE)}
            <input class="form-control" type="search" id="demo-search-count" placeholder="Rechercher une carte…" autocomplete="off" aria-label="Recherche avec compteur" aria-describedby="demo-search-count-out" />
            <div class="search-bar-trail">
              <span class="search-count" id="demo-search-count-out" aria-live="polite">12 cartes</span>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Complet (compteur + tri)</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Même composition que le topbar liste. Menu style <code>form-select</code> ; ↑↓ / Entrée / Échap ; recliquer l’option active inverse le sens (<code>ri-sort-asc</code> / <code>ri-sort-desc</code>).</p>
        <div class="styleguide-search-demo">
          <div class="search-bar" data-demo-sort>
            ${controlIconMarkup(ICON_SEARCH_LINE)}
            <input class="form-control" type="search" id="demo-search-full" placeholder="Rechercher une carte…" autocomplete="off" aria-label="Recherche complète" />
            <div class="search-bar-trail">
              <span class="search-count" id="demo-search-full-count" aria-live="polite">3 / 12 cartes</span>
              <div class="search-sort">
                <button
                  type="button"
                  class="btn ghost sm icon-only search-sort-btn"
                  id="demo-search-sort-btn"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="demo-search-sort-menu"
                >
                  ${ICON_FILTER_3}
                  <span class="visually-hidden">Trier les cartes</span>
                </button>
              </div>
            </div>
            <div class="search-sort-menu form-select-list" id="demo-search-sort-menu" role="listbox" hidden>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-updatedAt" data-sort="updatedAt" aria-selected="true">
                <span class="form-select-option-label">Date de modification</span>
                <span class="form-select-icon form-select-icon--right"></span>
              </div>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-legoSetRef" data-sort="legoSetRef" aria-selected="false">
                <span class="form-select-option-label">Référence</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-title" data-sort="title" aria-selected="false">
                <span class="form-select-option-label">Titre</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
              <div class="form-select-option" role="option" id="demo-search-sort-opt-releaseYear" data-sort="releaseYear" aria-selected="false">
                <span class="form-select-option-label">Année de sortie</span>
                <span class="form-select-icon form-select-icon--right" hidden></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Moins de 2 éléments</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Trail masqué (<code>hidden</code>) — même rendu qu’un champ texte seul.</p>
        <div class="styleguide-search-demo">
          <div class="search-bar">
            ${controlIconMarkup(ICON_SEARCH_LINE)}
            <input class="form-control" type="search" placeholder="Rechercher une carte…" autocomplete="off" aria-label="Recherche sans trail" />
            <div class="search-bar-trail" hidden>
              <span class="search-count">12 cartes</span>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">États</h2>
        <div class="styleguide-fields">
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">Compteur vide (masqué)</p>
            <div class="styleguide-search-demo">
              <div class="search-bar">
                ${controlIconMarkup(ICON_SEARCH_LINE)}
                <input class="form-control" type="search" placeholder="Rechercher…" autocomplete="off" aria-label="Recherche sans compteur" disabled />
                <div class="search-bar-trail">
                  <span class="search-count"></span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p class="form-hint" style="margin-bottom: 0.5rem">Désactivé</p>
            <div class="styleguide-search-demo">
              <div class="search-bar search-bar--input-only">
                ${controlIconMarkup(ICON_SEARCH_LINE)}
                <input class="form-control" type="search" placeholder="Indisponible" value="City" autocomplete="off" aria-label="Recherche désactivée" disabled />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="styleguide-back">
        ${linkMarkup("← Styleguide", { href: "#/developer" })}
      </p>
    </section>
  `;

  const TOTAL = 12;
  const countInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#demo-search-count")
  );
  const countOut = host.querySelector("#demo-search-count-out");
  const fullInput = /** @type {HTMLInputElement|null} */ (
    host.querySelector("#demo-search-full")
  );
  const fullCount = host.querySelector("#demo-search-full-count");

  function syncDemoCount(input, out) {
    if (!input || !out) return;
    const q = input.value.trim();
    if (!q) {
      out.textContent = `${TOTAL} cartes`;
      return;
    }
    const shown = Math.max(0, TOTAL - Math.min(TOTAL, q.length));
    out.textContent = `${shown} / ${TOTAL} cartes`;
  }

  const onCountInput = () => syncDemoCount(countInput, countOut);
  const onFullInput = () => syncDemoCount(fullInput, fullCount);
  countInput?.addEventListener("input", onCountInput);
  fullInput?.addEventListener("input", onFullInput);

  const sortRoot = host.querySelector("[data-demo-sort]");
  const sortBtn = /** @type {HTMLButtonElement|null} */ (
    host.querySelector("#demo-search-sort-btn")
  );
  const sortMenu = host.querySelector("#demo-search-sort-menu");
  let sortKey = "updatedAt";
  let sortDir = /** @type {"asc"|"desc"} */ ("desc");
  let sortActiveIndex = -1;

  /** @returns {HTMLElement[]} */
  function sortOptionEls() {
    if (!sortMenu) return [];
    return /** @type {HTMLElement[]} */ ([
      ...sortMenu.querySelectorAll("[data-sort]"),
    ]);
  }

  function clearSortActive() {
    sortActiveIndex = -1;
    sortOptionEls().forEach((el) => el.classList.remove("is-active"));
    sortBtn?.removeAttribute("aria-activedescendant");
  }

  /** @param {number} index @param {boolean} [scroll] */
  function setSortActive(index, scroll = false) {
    const opts = sortOptionEls();
    if (!opts.length || !sortBtn) return;
    let i = index;
    if (i < 0) i = opts.length - 1;
    if (i >= opts.length) i = 0;
    sortActiveIndex = i;
    opts.forEach((el, n) => el.classList.toggle("is-active", n === i));
    const active = opts[i];
    if (active?.id) {
      sortBtn.setAttribute("aria-activedescendant", active.id);
      if (scroll) active.scrollIntoView({ block: "nearest" });
    }
  }

  function isSortOpen() {
    return Boolean(sortMenu && !sortMenu.hidden);
  }

  function syncSortMenu() {
    if (!sortMenu) return;
    sortOptionEls().forEach((el) => {
      const key = el.getAttribute("data-sort");
      const on = key === sortKey;
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.classList.toggle("is-selected", on);
      const iconSlot = el.querySelector(".form-select-icon--right");
      if (!(iconSlot instanceof HTMLElement)) return;
      if (on) {
        iconSlot.hidden = false;
        iconSlot.innerHTML = sortDir === "asc" ? ICON_SORT_ASC : ICON_SORT_DESC;
        iconSlot.title = sortDir === "asc" ? "Croissant" : "Décroissant";
      } else {
        iconSlot.hidden = true;
        iconSlot.innerHTML = "";
        iconSlot.removeAttribute("title");
      }
    });
  }

  /**
   * @param {boolean} open
   * @param {{ focusBtn?: boolean }} [opts]
   */
  function setSortOpen(open, opts = {}) {
    if (!sortMenu || !sortBtn) return;
    sortMenu.hidden = !open;
    sortBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      syncSortMenu();
      const selectedIdx = sortOptionEls().findIndex((el) =>
        el.classList.contains("is-selected")
      );
      if (selectedIdx >= 0) setSortActive(selectedIdx, true);
      else clearSortActive();
    } else {
      clearSortActive();
    }
    if (opts.focusBtn) sortBtn.focus();
  }

  /** @param {string} key */
  function applySortKey(key) {
    if (key === sortKey) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = key === "title" || key === "legoSetRef" ? "asc" : "desc";
    }
    syncSortMenu();
    const idx = sortOptionEls().findIndex(
      (el) => el.getAttribute("data-sort") === sortKey
    );
    if (idx >= 0) setSortActive(idx);
  }

  const onSortBtn = (e) => {
    e.preventDefault();
    setSortOpen(!isSortOpen());
  };

  /** @param {KeyboardEvent} e */
  const onSortBtnKey = (e) => {
    const open = isSortOpen();
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault();
      if (!open) {
        setSortOpen(true);
        if (e.key === "ArrowUp") {
          setSortActive(sortOptionEls().length - 1, true);
        }
        return;
      }
      if (e.key === "ArrowDown") setSortActive(sortActiveIndex + 1, true);
      else if (e.key === "ArrowUp") setSortActive(sortActiveIndex - 1, true);
      else if (e.key === "Enter" || e.key === " ") {
        const opt = sortOptionEls()[sortActiveIndex];
        const key = opt?.getAttribute("data-sort");
        if (key) applySortKey(key);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setSortOpen(false, { focusBtn: true });
      }
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setSortActive(0, true);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setSortActive(sortOptionEls().length - 1, true);
    }
  };

  const onSortClick = (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const opt = t.closest?.("[data-sort]");
    if (!opt || !sortMenu?.contains(opt)) return;
    const key = opt.getAttribute("data-sort");
    if (key) applySortKey(key);
  };

  /** @param {PointerEvent} e */
  const onSortPointer = (e) => {
    if (!isSortOpen() || !sortMenu) return;
    const t = /** @type {HTMLElement} */ (e.target);
    const opt = t.closest?.(".form-select-option");
    if (!opt || !sortMenu.contains(opt)) return;
    const idx = sortOptionEls().indexOf(/** @type {HTMLElement} */ (opt));
    if (idx >= 0) setSortActive(idx);
  };

  /** @param {MouseEvent} e */
  const onDocClick = (e) => {
    if (!isSortOpen() || !sortRoot) return;
    if (sortRoot.contains(/** @type {Node} */ (e.target))) return;
    setSortOpen(false);
  };

  /** @param {KeyboardEvent} e */
  const onDocKey = (e) => {
    if (e.key === "Escape" && isSortOpen()) {
      e.preventDefault();
      setSortOpen(false, { focusBtn: true });
    }
  };

  syncSortMenu();
  sortBtn?.addEventListener("click", onSortBtn);
  sortBtn?.addEventListener("keydown", onSortBtnKey);
  sortMenu?.addEventListener("click", onSortClick);
  sortMenu?.addEventListener("pointerenter", onSortPointer, true);
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onDocKey);

  return () => {
    countInput?.removeEventListener("input", onCountInput);
    fullInput?.removeEventListener("input", onFullInput);
    sortBtn?.removeEventListener("click", onSortBtn);
    sortBtn?.removeEventListener("keydown", onSortBtnKey);
    sortMenu?.removeEventListener("click", onSortClick);
    sortMenu?.removeEventListener("pointerenter", onSortPointer, true);
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onDocKey);
    host.innerHTML = "";
  };
}
