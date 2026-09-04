/** i18n: gettext `.po` catalogs, English source, no compiler. */

const LOCALE_KEY = "brickcard:ui-locale";
const LOCALES_URL = "i18n/locales.json";
const DEFAULT_LOCALE = "en";

/**
 * @typedef {{ code: string, name: string }} LocaleInfo
 */

/** @type {LocaleInfo[]} */
let locales = [{ code: DEFAULT_LOCALE, name: "English" }];

/** @type {Map<string, string>} */
let catalog = new Map();

/** @type {string} */
let currentLocale = DEFAULT_LOCALE;

/** @param {string} raw */
function unescapePo(raw) {
  return raw.replace(/\\([\\ntr"])/g, (_, ch) => {
    if (ch === "n") return "\n";
    if (ch === "t") return "\t";
    if (ch === "r") return "\r";
    return ch;
  });
}

/**
 * Minimal gettext parser: msgid / msgstr, concatenated strings, `#` comments.
 * Ignores the `msgid ""` header. No msgctxt or plural forms.
 * @param {string} text
 * @returns {Map<string, string>}
 */
export function parsePo(text) {
  /** @type {Map<string, string>} */
  const map = new Map();
  let msgid = /** @type {string|null} */ (null);
  let msgstr = /** @type {string|null} */ (null);
  let field = /** @type {null|"msgid"|"msgstr"} */ (null);

  const flush = () => {
    if (msgid != null && msgstr != null && msgid !== "") {
      map.set(msgid, msgstr);
    }
    msgid = null;
    msgstr = null;
    field = null;
  };

  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      if (!trimmed) flush();
      continue;
    }
    const start = trimmed.match(/^(msgid|msgstr)\s+"(.*)"\s*$/);
    if (start) {
      if (start[1] === "msgid") {
        flush();
        field = "msgid";
        msgid = unescapePo(start[2]);
        msgstr = null;
      } else {
        field = "msgstr";
        msgstr = unescapePo(start[2]);
      }
      continue;
    }
    const cont = trimmed.match(/^"(.*)"\s*$/);
    if (cont && field === "msgid" && msgid != null) {
      msgid += unescapePo(cont[1]);
      continue;
    }
    if (cont && field === "msgstr" && msgstr != null) {
      msgstr += unescapePo(cont[1]);
    }
  }
  flush();
  return map;
}

/** @param {string} code */
function normalizeLocaleCode(code) {
  return String(code || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

/** @param {string} code */
function localeBase(code) {
  return normalizeLocaleCode(code).split("-")[0];
}

/** @param {string} code */
function isKnownLocale(code) {
  const n = normalizeLocaleCode(code);
  return locales.some((loc) => loc.code === n);
}

/** @returns {string[]} */
function browserLanguageTags() {
  try {
    const list = navigator.languages;
    if (Array.isArray(list) && list.length) return list.map(String);
    if (navigator.language) return [navigator.language];
  } catch {
    /* ignore */
  }
  return [];
}

/** Browser locale if translated, otherwise English. */
function detectBrowserLocale() {
  for (const tag of browserLanguageTags()) {
    const full = normalizeLocaleCode(tag);
    const base = localeBase(tag);
    if (full && isKnownLocale(full)) return full;
    if (base && isKnownLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

function readStoredLocale() {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && isKnownLocale(stored)) return normalizeLocaleCode(stored);
  } catch {
    /* ignore */
  }
  return "";
}

function applyDocumentLang(code) {
  document.documentElement.lang = code || DEFAULT_LOCALE;
}

/**
 * @param {string} msgid
 * @param {Record<string, string|number>|void} [vars]
 */
export function _t(msgid, vars) {
  const key = String(msgid ?? "");
  let out = catalog.get(key);
  if (out == null || out === "") out = key;
  if (vars && typeof vars === "object") {
    out = out.replace(/%\((\w+)\)s/g, (_, name) => {
      const v = vars[name];
      return v == null ? "" : String(v);
    });
  }
  return out;
}

export function getLocale() {
  return currentLocale;
}

export function getDefaultLocale() {
  return DEFAULT_LOCALE;
}

/**
 * Select label: `EN · English`.
 * @param {LocaleInfo} loc
 */
export function localeDisplayName(loc) {
  const code = String(loc?.code || "").toUpperCase();
  const name = String(loc?.name || "").trim();
  return name ? `${code} · ${name}` : code;
}

/** @returns {LocaleInfo[]} sorted by ISO code ASC */
export function listLocales() {
  return locales.slice().sort((a, b) => a.code.localeCompare(b.code, "en"));
}

/** @param {string} suffix */
export function catalogUrl(locale, suffix = "") {
  return `i18n/${locale}${suffix}.po`;
}

/** @param {string} code */
export function setLocale(code) {
  const next = isKnownLocale(code) ? normalizeLocaleCode(code) : DEFAULT_LOCALE;
  try {
    localStorage.setItem(LOCALE_KEY, next);
  } catch {
    /* ignore */
  }
  location.reload();
}

async function loadLocalesJson() {
  try {
    const res = await fetch(LOCALES_URL, { cache: "reload" });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return;
    /** @type {LocaleInfo[]} */
    const next = [];
    for (const item of data) {
      const code = normalizeLocaleCode(item?.code);
      const name = String(item?.name || "").trim();
      if (!code || !name) continue;
      if (next.some((loc) => loc.code === code)) continue;
      next.push({ code, name });
    }
    if (next.length) locales = next;
    if (!isKnownLocale(DEFAULT_LOCALE)) {
      locales.unshift({ code: DEFAULT_LOCALE, name: "English" });
    }
  } catch {
    /* fallback: English only */
  }
}

/** @param {string} locale @param {string} [suffix] */
async function loadCatalog(locale, suffix = "") {
  if (locale === DEFAULT_LOCALE) {
    catalog = new Map();
    return;
  }
  try {
    const res = await fetch(catalogUrl(locale, suffix), { cache: "reload" });
    if (!res.ok) {
      catalog = new Map();
      return;
    }
    catalog = parsePo(await res.text());
  } catch {
    catalog = new Map();
  }
}

/** Load locales, resolve the language, load the `.po` if needed. */
export async function initI18n() {
  await loadLocalesJson();
  currentLocale = readStoredLocale() || detectBrowserLocale();
  applyDocumentLang(currentLocale);
  await loadCatalog(currentLocale);
}

/**
 * Static chrome copy (`index.html`) after the catalog is loaded.
 */
export function applyChromeI18n() {
  const search = document.getElementById("global-search");
  if (search instanceof HTMLInputElement) {
    search.placeholder = _t("Search for a card…");
    search.setAttribute("aria-label", _t("Search (reference, title, theme, year)"));
  }

  const sortBtn = document.getElementById("search-sort-btn");
  const sortBtnLabel = sortBtn?.querySelector(".visually-hidden");
  if (sortBtnLabel) sortBtnLabel.textContent = _t("Sort cards");

  const sortLabels = {
    updatedAt: _t("Date modified"),
    legoSetRef: _t("Reference"),
    title: _t("Title"),
    releaseYear: _t("Release year"),
    numPieces: _t("Number of pieces"),
    numFigurines: _t("Number of figurines"),
  };
  for (const [key, label] of Object.entries(sortLabels)) {
    const el = document.querySelector(`#search-sort-opt-${key} .form-select-option-label`);
    if (el) el.textContent = label;
  }

  const newCardLabel = document.querySelector("#btn-new-card span:not(.visually-hidden)");
  if (newCardLabel) newCardLabel.textContent = _t("New card");

  const printBtn = document.getElementById("btn-print-menu");
  const printHidden = printBtn?.querySelector(".visually-hidden");
  if (printHidden) printHidden.textContent = _t("Print");

  const printTitle = document.getElementById("print-menu-title");
  if (printTitle) printTitle.textContent = _t("No cards to print!");

  const printDesc = document.getElementById("print-menu-desc");
  if (printDesc) {
    printDesc.textContent = _t(
      "Select at least one card to print from your collection."
    );
  }

  const selectAll = document.getElementById("print-select-all-label");
  if (selectAll) selectAll.textContent = _t("Add the cards");

  const selectNone = document.querySelector("#btn-print-select-none span:not(.visually-hidden)");
  if (selectNone) selectNone.textContent = _t("Clear print selection");

  const printRun = document.querySelector("#btn-print-run span:not(.visually-hidden)");
  if (printRun) printRun.textContent = _t("Start printing");

  const settingsHidden = document.querySelector("#btn-settings .visually-hidden");
  if (settingsHidden) settingsHidden.textContent = _t("Settings");

  const loadingTitle = document.querySelector("#main[aria-busy] .view-title");
  if (loadingTitle) {
    loadingTitle.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        node.textContent = _t("Loading");
      }
    });
  }

  const retryLabel = document.querySelector("#boot-retry span:not(.visually-hidden)");
  if (retryLabel) retryLabel.textContent = _t("Retry");
}
