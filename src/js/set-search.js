/**
 * Set-catalog search combobox (`search-bar--suggest` + `form-select-list`).
 * Loads `sets-presets.json` on bind. Used by `#developer/search`; later `#new-card`.
 */

import {
  ICON_APPS_2,
  ICON_CALENDAR_TODO,
  ICON_HASHTAG,
  ICON_PALETTE,
  ICON_USER_3,
} from "./icons.js";
import { _t, getLocale } from "./i18n.js";
import { foldCI } from "./includes-ci.js";
import {
  catalogSetImageUrl,
  loadSetsPresets,
  searchCatalogSets,
} from "./sets-presets.js";
import { toast } from "./toast.js";

/** First paint + each scroll page. */
const SET_SEARCH_PAGE = 25;

/**
 * @typedef {object} SetSearchOptions
 * @property {number} [minChars=1]
 * @property {number} [maxResults] Cap on hits (omitted = no cap)
 * @property {(set: import("./sets-presets.js").CatalogSetMatch) => void} [onSelect]
 */

/**
 * @param {string} iso
 * @returns {string}
 */
export function formatCatalogGeneratedAt(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * @param {{ querying: boolean, matchCount: number, total: number, generatedAt: string }} state
 */
function trailLabel(state) {
  let count;
  if (!state.total) {
    count = _t("0 sets");
  } else if (state.querying) {
    count = _t("%(shown)s / %(total)s sets", {
      shown: state.matchCount,
      total: state.total,
    });
  } else {
    count = _t("%(total)s sets", { total: state.total });
  }
  const date = formatCatalogGeneratedAt(state.generatedAt);
  return date ? `${count} · ${date}` : count;
}

/**
 * Original [start, end) ranges for folded needle hits (accents/case ignored).
 * @param {string} text
 * @param {string[]} needles
 * @returns {[number, number][]}
 */
function highlightRanges(text, needles) {
  const src = String(text || "");
  if (!src || !needles.length) return [];
  /** @type {number[]} */
  const map = [];
  let folded = "";
  for (let i = 0; i < src.length; i++) {
    const chunk = foldCI(src[i]);
    for (let j = 0; j < chunk.length; j++) {
      folded += chunk[j];
      map.push(i);
    }
  }
  /** @type {[number, number][]} */
  const raw = [];
  for (const needle of needles) {
    if (!needle) continue;
    let from = 0;
    while (from <= folded.length - needle.length) {
      const at = folded.indexOf(needle, from);
      if (at < 0) break;
      const start = map[at];
      const end = map[at + needle.length - 1] + 1;
      raw.push([start, end]);
      from = at + 1;
    }
  }
  raw.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  /** @type {[number, number][]} */
  const merged = [];
  for (const r of raw) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

/**
 * @param {HTMLElement} host
 * @param {string} text
 * @param {string[]} needles
 */
function appendHighlighted(host, text, needles) {
  const src = String(text || "");
  const ranges = highlightRanges(src, needles);
  let i = 0;
  for (const [start, end] of ranges) {
    if (start > i) host.append(document.createTextNode(src.slice(i, start)));
    const b = document.createElement("b");
    b.textContent = src.slice(start, end);
    host.append(b);
    i = end;
  }
  if (i < src.length) host.append(document.createTextNode(src.slice(i)));
}
/**
 * @param {string} svg
 * @param {string|number} value
 * @param {string} title
 */
function metaBadge(svg, value, title) {
  const el = document.createElement("span");
  el.className = "form-select-option-badge";
  el.title = title;
  el.innerHTML = svg;
  const val = document.createElement("span");
  val.textContent = String(value);
  el.append(val);
  return el;
}

/**
 * @param {import("./sets-presets.js").CatalogSetMatch} set
 * @param {string} listId
 * @param {number} index
 * @param {string[]} needles
 * @param {string} [imageUrl]
 */
function makeOption(set, listId, index, needles, imageUrl = "") {
  const li = document.createElement("li");
  li.className = "form-select-option form-select-option--multiline";
  li.setAttribute("role", "option");
  li.id = `${listId}-opt-${index}`;
  li.dataset.setId = set.id;

  const media = document.createElement("span");
  media.className = "form-select-option-media";
  media.setAttribute("aria-hidden", "true");
  const src = String(imageUrl || "").trim();
  if (!src) {
    media.hidden = true;
  } else {
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.draggable = false;
    img.src = src;
    img.addEventListener("error", () => {
      img.remove();
    });
    media.append(img);
  }

  const body = document.createElement("span");
  body.className = "form-select-option-body";

  const row = document.createElement("span");
  row.className = "form-select-option-row";
  const idEl = document.createElement("span");
  idEl.className = "form-select-option-id";
  const idIcon = document.createElement("span");
  idIcon.className = "form-select-option-id-icon";
  idIcon.setAttribute("aria-hidden", "true");
  idIcon.innerHTML = ICON_HASHTAG;
  const idText = document.createElement("span");
  idText.className = "form-select-option-id-text";
  appendHighlighted(idText, set.id, needles);
  idEl.append(idIcon, idText);
  const meta = document.createElement("span");
  meta.className = "form-select-option-meta";
  const year = set.releaseYear;
  const pieces = set.numPieces;
  const figs = set.numFigurines;
  if (year != null && Number.isFinite(year)) {
    meta.append(metaBadge(ICON_CALENDAR_TODO, year, _t("Release year")));
  }
  if (pieces != null && Number.isFinite(pieces)) {
    meta.append(metaBadge(ICON_APPS_2, pieces, _t("Pieces")));
  }
  if (figs != null && Number.isFinite(figs)) {
    meta.append(metaBadge(ICON_USER_3, figs, _t("Figurines")));
  }
  row.append(idEl, meta);
  body.append(row);

  const themeName = String(set.themeName || "").trim();
  if (themeName) {
    const themeRow = document.createElement("span");
    themeRow.className = "form-select-option-theme";
    const icon = document.createElement("span");
    icon.className = "form-select-option-theme-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = ICON_PALETTE;
    const name = document.createElement("span");
    name.className = "form-select-option-theme-name";
    appendHighlighted(name, themeName, needles);
    themeRow.append(icon, name);
    body.append(themeRow);
  }

  const title = document.createElement("span");
  title.className = "form-select-option-name";
  appendHighlighted(title, set.name || "", needles);
  body.append(title);

  li.append(media, body);
  return li;
}

/**
 * Bind catalog autocomplete on a `.search-bar.search-bar--suggest`.
 * @param {HTMLElement} searchBar
 * @param {SetSearchOptions} [opts]
 * @returns {() => void}
 */
export function bindSetSearch(searchBar, opts = {}) {
  const input = searchBar.querySelector("input.form-control");
  const trailOut = searchBar.querySelector(".search-num-results");
  if (!(input instanceof HTMLInputElement)) return () => {};

  const minChars = Number.isFinite(Number(opts.minChars))
    ? Math.max(1, Math.round(Number(opts.minChars)))
    : 1;
  const maxResults = Number.isFinite(Number(opts.maxResults))
    ? Math.max(0, Math.round(Number(opts.maxResults)))
    : 0;
  const onSelect = opts.onSelect;

  const listId =
    `${input.id || `set-search-${Math.random().toString(36).slice(2, 9)}`}-list`;
  let list = searchBar.querySelector(":scope > .form-select-list");
  if (!(list instanceof HTMLElement)) {
    list = document.createElement("ul");
    list.className = "form-select-list";
    searchBar.append(list);
  }
  list.id = listId;
  list.setAttribute("role", "listbox");
  list.hidden = true;

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-haspopup", "listbox");

  /** @type {import("./sets-presets.js").CatalogSetMatch[]} */
  let items = [];
  /** @type {string[]} */
  let optionNeedles = [];
  /** @type {HTMLElement[]} */
  let optionEls = [];
  let activeIndex = -1;
  let total = 0;
  let generatedAt = "";
  let setsImageUrl = "";
  let ready = false;
  let cancelled = false;
  let seq = 0;
  let skipOpenUntilInput = false;

  function isOpen() {
    return !list.hidden;
  }

  function clearActive() {
    activeIndex = -1;
    optionEls.forEach((el) => el.classList.remove("is-active"));
    input.removeAttribute("aria-activedescendant");
  }

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    clearActive();
  }

  function open() {
    if (!optionEls.length) {
      close();
      return;
    }
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    list.scrollTop = 0;
    maybeLoadMore();
  }

  /**
   * @param {number} index
   * @param {boolean} [scroll]
   */
  function setActive(index, scroll = false) {
    if (!optionEls.length) return;
    let i = index;
    if (i < 0) i = optionEls.length - 1;
    if (i >= optionEls.length) i = 0;
    activeIndex = i;
    optionEls.forEach((el, n) => el.classList.toggle("is-active", n === i));
    const active = optionEls[i];
    if (active?.id) {
      input.setAttribute("aria-activedescendant", active.id);
      if (scroll) active.scrollIntoView({ block: "nearest" });
    }
  }

  /**
   * @param {{ querying: boolean, matchCount: number }} [state]
   */
  function syncTrail(state) {
    if (!(trailOut instanceof HTMLElement)) return;
    if (!ready) {
      trailOut.textContent = "";
      return;
    }
    trailOut.textContent = trailLabel({
      querying: Boolean(state?.querying),
      matchCount: state?.matchCount ?? 0,
      total,
      generatedAt,
    });
  }

  /** @param {import("./sets-presets.js").CatalogSetMatch} set @param {number} i */
  function addOption(set, i) {
    const li = makeOption(
      set,
      listId,
      i,
      optionNeedles,
      catalogSetImageUrl(set.id, setsImageUrl)
    );
    li.addEventListener("pointerenter", () => {
      if (!isOpen()) return;
      setActive(i);
    });
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });
    li.addEventListener("click", (e) => {
      e.preventDefault();
      choose(set);
    });
    list.append(li);
    optionEls.push(li);
  }

  /** Next page of already-found hits. @returns {boolean} */
  function loadMore() {
    if (optionEls.length >= items.length) return false;
    const to = Math.min(items.length, optionEls.length + SET_SEARCH_PAGE);
    for (let i = optionEls.length; i < to; i++) addOption(items[i], i);
    return true;
  }

  /** Prefetch when less than one viewport remains (or the list does not overflow). */
  function maybeLoadMore() {
    if (!isOpen() || optionEls.length >= items.length) return;
    if (list.clientHeight === 0) return;
    const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
    if (remaining > list.clientHeight) return;
    if (!loadMore()) return;
    maybeLoadMore();
  }

  /** @param {import("./sets-presets.js").CatalogSetMatch[]} next @param {string[]} [needles] */
  function renderOptions(next, needles = []) {
    items = next;
    optionNeedles = needles;
    list.replaceChildren();
    optionEls = [];
    loadMore();
    clearActive();
    list.scrollTop = 0;
  }

  /** @param {import("./sets-presets.js").CatalogSetMatch} set */
  function choose(set) {
    skipOpenUntilInput = true;
    input.value = set.name;
    close();
    onSelect?.(set);
    void refresh({ openList: false });
  }

  /**
   * @param {{ openList: boolean }} [flags]
   */
  async function refresh(flags = { openList: true }) {
    if (!ready || cancelled) return;
    const raw = input.value;
    const q = raw.trim();
    if (q.length < minChars) {
      renderOptions([]);
      close();
      syncTrail({ querying: false, matchCount: 0 });
      return;
    }
    const token = ++seq;
    const result = await searchCatalogSets(
      raw,
      maxResults ? { limit: maxResults } : {}
    );
    if (cancelled || token !== seq) return;
    total = result.total;
    generatedAt = result.generatedAt;
    setsImageUrl = result.setsImageUrl;
    renderOptions(result.items, result.needles);
    syncTrail({ querying: true, matchCount: result.matchCount });
    if (flags.openList && result.items.length && !skipOpenUntilInput) open();
    else close();
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      skipOpenUntilInput = false;
      const go = () => {
        if (!optionEls.length) return;
        if (e.key === "ArrowDown") {
          if (activeIndex < 0) {
            setActive(0, true);
          } else if (activeIndex >= optionEls.length - 1) {
            if (loadMore()) setActive(activeIndex + 1, true);
            else setActive(0, true);
          } else {
            setActive(activeIndex + 1, true);
          }
        } else {
          setActive(activeIndex < 0 ? optionEls.length - 1 : activeIndex - 1, true);
        }
      };
      if (!isOpen()) {
        void refresh({ openList: true }).then(go);
        return;
      }
      go();
    } else if (e.key === "Enter") {
      if (isOpen() && optionEls[activeIndex]) {
        e.preventDefault();
        const set = items[activeIndex];
        if (set) choose(set);
      }
    } else if (e.key === "Escape") {
      if (isOpen()) {
        e.preventDefault();
        close();
      }
    } else if (e.key === "Home" && isOpen()) {
      e.preventDefault();
      setActive(0, true);
    } else if (e.key === "End" && isOpen()) {
      e.preventDefault();
      setActive(optionEls.length - 1, true);
    }
  }

  function onInput() {
    skipOpenUntilInput = false;
    void refresh({ openList: true });
  }

  function onFocus() {
    skipOpenUntilInput = false;
    void refresh({ openList: true });
  }

  /** @param {FocusEvent} e */
  function onFocusOut(e) {
    if (e.relatedTarget instanceof Node && searchBar.contains(e.relatedTarget)) return;
    close();
  }

  function onListScroll() {
    maybeLoadMore();
  }

  /** @param {PointerEvent} e */
  function onDocPointer(e) {
    if (!isOpen()) return;
    if (e.target instanceof Node && searchBar.contains(e.target)) return;
    close();
  }

  loadSetsPresets()
    .then((catalog) => {
      if (cancelled) return;
      ready = true;
      total = catalog.sets.size;
      generatedAt = catalog.generatedAt;
      setsImageUrl = catalog.setsImageUrl;
      void refresh({
        openList: document.activeElement === input,
      });
    })
    .catch((err) => {
      if (cancelled) return;
      toast(err instanceof Error ? err.message : String(err), "error");
    });

  input.addEventListener("input", onInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("focusout", onFocusOut);
  input.addEventListener("keydown", onKeydown);
  list.addEventListener("scroll", onListScroll);
  document.addEventListener("pointerdown", onDocPointer);

  return () => {
    cancelled = true;
    close();
    input.removeEventListener("input", onInput);
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("focusout", onFocusOut);
    input.removeEventListener("keydown", onKeydown);
    list.removeEventListener("scroll", onListScroll);
    document.removeEventListener("pointerdown", onDocPointer);
    input.removeAttribute("role");
    input.removeAttribute("aria-autocomplete");
    input.removeAttribute("aria-expanded");
    input.removeAttribute("aria-controls");
    input.removeAttribute("aria-haspopup");
    input.removeAttribute("aria-activedescendant");
    list.remove();
  };
}
