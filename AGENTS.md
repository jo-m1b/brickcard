# AGENTS.md — Brickcard

Guide for AI agents (Cursor, Copilot, etc.) working on this repository.

## What is this?

**Brickcard** — **static** SPA (no framework, no bundler) to generate *Brickcards*: poker-size cards (63×88 mm) that describe LEGO sets. User goal: laminated cards in sleeves with box-less sets.

Stack: HTML + CSS + JS ES modules (`type="module"`). UI **i18n**: English source (`_t('…')`); catalogs in `src/i18n/{de,es,fr,it,pt}.po`.

Product / UI brand name: **Brickcard**.

## Publishing

Official site: **https://brickcard.org** (custom domain). **GitHub Pages** deploy from `src/` (workflow `.github/workflows/pages.yml`, push to `main`). No subpath: the site is at the domain root (so the service worker must stay at the root of `src/`).

## Where is the code?

All app code lives in **`src/`**.

| File | Role |
|------|------|
| `src/index.html` | Shell: `<title>` = `APP_DOCUMENT_TITLE`; English SEO (`description`, canonical, Open Graph, Twitter Card, JSON-LD — not updated with the UI locale); sticky topbar, `#main`, `#modal-root`, `#toast-root`, `#print-root`; import map (`?v=` on `app.js` / `version.js`) |
| `src/404.html` | GitHub Pages 404 (unknown paths, not hash routes); English, no i18n; empty-view like boot **Load error — retry**; `<base href="/">`; CSS `?v=` aligned with `index.html` |
| `src/robots.txt` | Crawlers: allow `/`; sitemap URL (do not block `js/` / `css/`) |
| `src/sitemap.xml` | One URL (`https://brickcard.org/`); hash routes omitted |
| `src/manifest.webmanifest` | PWA manifest (name, `description`, icons, `standalone`); `lang` = `en` (source / SEO; static file, not updated with the UI locale) |
| `src/service-worker.js` | Service worker at the site root (scope `/`; GitHub Pages does not allow a SW in `js/`); `CACHE` = `APP_VERSION`; online fetch with `cache: "reload"`; install precaches the app shell only (non-blocking); after activate (and on a `precache-offline` message from the page) background-precache all app files (JS including lazy overlays / `#developer/…`, i18n, markdown pages, `themes-presets.json` + logos from that JSON, fonts, PWA icons, demo) so unused `import()` routes work offline; does not intercept its own script. Adding a JS file, markdown page, or locale catalog: add it to `OFFLINE_ASSETS` |
| `src/data/themes-presets.json` | Default LEGO themes (editable without touching JS) |
| `src/data/theme-logo-*` | Default theme logos (PNG / SVG / WebP / JPEG) |
| `src/data/backup-demo-jo.brickcard` | Demo backup (empty home: **Load a demo** tile; WebP photos; URL: `data/backup-demo-jo.brickcard`) |
| `src/data/page-{{slug}}.md` | Markdown pages in a modal (`#page/:slug`): English source; translation `page-{{slug}}.{{locale}}.md` (e.g. `page-about.de.md`, `page-about.fr.md`); 404 → English file; `# Title` → dialog title; raw HTML like GitHub (trusted `data/` pages); `#page/about`: header brand (logo + name + version) injected at the top; Ko-fi in markdown at the bottom |
| `src/img/brickcard-logo.svg` | Black app logo (brick outline — credit Joko Sutrisno / Vecteezy); UI chrome: CSS mask; cards: inline SVG (`currentColor` / `--card-accent-fg`) |
| `src/img/brickcard-logo-white.svg` | Same logo, white fill (UI chrome if needed; no longer used on cards) |
| `src/img/brickcard-favicon.svg` | SVG favicon (light `#141414` / dark white via `prefers-color-scheme`) |
| `src/img/brickcard-favicon.ico` / `brickcard-favicon-96x96.png` | Raster favicon (tab) |
| `src/img/brickcard-apple-touch-icon.png` | iOS icon 180×180 |
| `src/img/brickcard-web-app-manifest-192x192.png` / `512x512.png` | PWA icons (any + maskable) |
| `src/img/brickcard-og-1200x630.png` | Open Graph / Twitter share image (1200×630 PNG; absolute URL in `index.html`) |
| `src/fonts/` | Open Sans + Inter (woff2 variable, latin-ext) + SIL OFL licenses |
| `src/i18n/README.md` | Translator guide (add a language, `.po` structure, ISO codes) |
| `src/i18n/locales.json` | Supported locales (`code` ISO + `name` in that language) |
| `src/i18n/{de,es,fr,it,pt}.po` | UI catalogs (`msgid` English = source) |
| `src/js/i18n.js` | `.po` parser, `_t()`, locale (`brickcard:ui-locale`), `index.html` chrome |
| `src/js/app.js` | Hash routing (views + history); overlays and `#developer/…` loaded with `import()` |
| `src/js/hotkeys.js` | Ctrl/Cmd+P (print) and Ctrl/Cmd+S (backup) shortcuts |
| `src/js/modal-focus.js` | Initial focus + Tab trap for modals |
| `src/js/markdown.js` | Light Markdown parser + `loadMarkdownPage(slug)`; raw HTML blocks (trusted `data/` pages, like GitHub) |
| `src/js/theme.js` | **UI** theme system / light / dark |
| `src/js/card-design.js` | Card design (face border, corner / image radius, CSS vars) — localStorage |
| `src/js/list-layout.js` | List density (max cards per row) — localStorage |
| `src/js/image-optimize.js` | Optimize images (WebP on import) — localStorage |
| `src/js/telemetry.js` | Anonymous usage telemetry (opt-out, localStorage) |
| `src/js/themes-data.js` | Loads the default-themes JSON, `logoSrc`, default accent |
| `src/js/storage.js` | IndexedDB cards + **custom** themes, `.brickcard` import |
| `src/js/backup.js` | `.brickcard` format / parse / migrations / export (`version` = `APP_VERSION`) |
| `src/js/backup-dialog.js` | Backup modal (`#backup`) |
| `src/js/import-dialog.js` | Import modal (`#import`); auto demo import (`openDemoBackupDialog`) |
| `src/js/card-export.js` | Download (Brickcard photo, blob, same-origin URL); card photo names `brickcard-card-image-YYYY-MM-DD-…`; theme logos `brickcard-theme-logo-YYYY-MM-DD-…` |
| `src/js/preset-draft.js` | Isolated default-themes draft (`#developer/theme-presets` tool) |
| `src/js/print.js` | A4 print (variable grid, faces/backs, mirror); loaded on **Start printing** |
| `src/js/print-menu.js` | Header print menu (selection, badge, start) |
| `src/js/print-qty.js` | Print quantities — localStorage |
| `src/js/print-settings.js` | Print settings (grid, cut marks, bleed, print order, print side, sheet assembly) — localStorage |
| `src/js/card-sort.js` | ASC card comparison (home list and print); title / reference: `localeCompare(..., getLocale())` |
| `src/js/print-dialog.js` | Print settings modal (`#print`) |
| `src/js/version.js` | SemVer (`APP_VERSION`), `APP_ID`, `APP_NAME`, `APP_DOCUMENT_TITLE` — single source; cache-bust via import map (`index.html`) |
| `src/js/document-title.js` | Tab title (`document.title`): default, overlays, lock during PDF print |
| `src/js/icons.js` | UI icons ([Remix Icon](https://remixicon.com/)) — paths + helpers (`remixIconByName`, `modalTitleMarkup`) |
| `src/js/link.js` | Link markup (`a.link` / external / icon) |
| `src/js/tile.js` | Tile markup (`ul.tile-list` / `a.tile`) |
| `src/js/empty-view.js` | Empty / loading markup (`section.empty-view`, CSS brick, `welcomeViewMarkup`, `loadingViewMarkup`) |
| `src/js/includes-ci.js` | Search comparison (`includesCI`): case and accents ignored |
| `src/js/confirm-dialog.js` | `modal--sm` dialogs (`openConfirmDialog` / `confirmDialog` / `alertDialog`, optional `icon`) — no `alert()` / `confirm()` / `prompt()` |
| `src/js/toast.js` | Stackable toasts: normal / success / error, header/body, 7 s delay (15 s collection import/backup); `toast()` / `dismissToast()` |
| `src/js/developer-access.js` | Developer space access (always on locally; off-local, `localStorage` flag after `#developer` confirmation) |
| `src/js/form-color.js` | Color field (`form-color` / swatch / clear) |
| `src/js/form-image.js` | Image field (`form-image` / file, URL, background, crop) |
| `src/js/form-range.js` | Slider (`form-range-row` / output / reset to default) |
| `src/js/form-checkbox.js` | Checkbox (`form-check` / hint / groups / read-only) |
| `src/js/form-radio.js` | Radio (`form-check form-radio` / hint / groups / read-only) |
| `src/js/form-select.js` | Select overlay (`form-select` / custom list) |
| `src/js/views/list.js` | Preview grid + search (topbar) |
| `src/js/views/editor.js` | Card editor |
| `src/js/views/themes.js` | Theme manager modal (mini-cards, search) |
| `src/js/views/theme-editor.js` | Create / edit a custom theme; read-only view of a default theme (`#themes/view/:id`) |
| `src/js/views/page.js` | Markdown page modal |
| `src/js/views/settings.js` | Settings modal (language, interface, cards, print, collection) |
| `src/js/views/developer/` | Developer space / UI styleguide in a modal (`#developer`, `#developer/typography`, …); each gallery via `import()`; default-themes tool `#developer/theme-presets` |
| `README.md` | GitHub landing (EN); shields.io **FR / Lisez-moi** badge to `README.fr.md`; screenshots in `screenshots/` |
| `README.fr.md` | Same landing in French; shields.io **EN / README** badge to `README.md` (GitHub does not auto-pick the language) |
| `screenshots/` | README screenshots (WebP); no `docs/` folder (no doc site) |
| `CHANGELOG.md` | Version history (Keep a Changelog, **English**); **app code only** (`src/`) — not README, CONTRIBUTING, GitHub templates, Ko-fi, etc. |
| `CONTRIBUTING.md` | Contributor conventions (EN, KISS): issues, PRs, no bundler |
| `.github/CODEOWNERS` | GitHub owners: `* @jo-m1b` (auto-review on PRs if the project grows) |
| `.github/FUNDING.yml` | GitHub Sponsor button → Ko-fi (`jom1b`) |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Bug issue form (What happened / expected / reproduce, version, environment, device, browser) |
| `.github/ISSUE_TEMPLATE/config.yml` | Issue chooser: no empty tickets; Discussions link for questions |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Enhancement issue form (What would you like / Why; link to existing `enhancement` issues) |
| `.github/pull_request_template.md` | PR template (description, changelog Added/Changed/Fixed/Removed, UI screenshots) |

## Card model (`Card`)

Field names are intentionally verbose (readable without docs):

```js
{
  id: string,
  legoSetRef: string,       // e.g. "6140/6109"
  title: string,            // Brickcard title (`\n` = line break)
  brickcardThemeId: string, // Brickcard theme id
  pieceCount: number|null,
  figurineCount: number|null, // figurine count, optional
  releaseYear: number|null, // release year, optional
  imageDataUrl: string,     // photo data URL (JPEG/PNG/SVG/WebP) — optional
  imageBackgroundColor: string, // image-area background (hex); empty = white on screen
  imageZoom: number,        // photo crop, 1 = cover (100%); < 1 = zoom out; 2 decimal places (`0.00` → 0)
  imageOffsetX: number,     // photo crop (width fraction); 2 decimal places
  imageOffsetY: number,     // photo crop (height fraction); 2 decimal places
  updatedAt: string
}
```

Auto-migration from old names (`setTitle` → `title`, `setImageDataUrl` → `imageDataUrl`, `legoThemeId` → `brickcardThemeId`, plus `ref`, `image`, `zoom`, …). `createdAt` ignored. Old default theme id `the-lord-of-the-rings` → `lord-of-the-rings`.

## Default themes (`src/data/themes-presets.json`)

Edit this file to add / change default themes (no JS change needed).

Fields per entry:
- `id` (required), `name` (required)
- `color` (hex, optional) — if omitted → no own color; the card uses the configured color then gray `#6e6e6e`
- `secondaryColor` (hex, optional) — texts, badge icons, and the Brickcard logo; if omitted → black `#141414` or white `#ffffff` from accent luminance
- `logoSrc` (optional) — path from `src/` (e.g. `data/theme-logo-….png`); no logo / load failure → show the theme **name** (no generated SVG)
- `logoZoom` / `logoOffsetX` / `logoOffsetY` (optional) — logo crop (1 / 0 / 0 if omitted); same units as custom themes; tool export: 2 decimal places, `0.00` omitted (`logoZoom` of `1` too)

Default themes are **read-only** in the app (no edit, no delete); focusable / clickable tiles → `#themes/view/:id` (identifier, name, colors, downloadable logo). Custom themes have a UUID id (`createId()`), live in IndexedDB, and are edited via `#themes/new` / `#themes/edit/:id`.

Developer tool `#developer/theme-presets`: isolated local copy (IndexedDB `brickcard-preset-draft`) to edit id/slug, name, colors (accent + secondary), logo and crop (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`), then **save** `themes-presets.json` + `theme-logo-{id}.{ext}` to drop into `data/` yourself. Never reads/writes the `cards` / `themes` stores or settings. On first load (or after **Reset**): seed from the JSON. **General** success / errors (load, **Reset**, **Save themes-presets.json**, **Save logos**, save / delete in the editor) → `toast()`; Name / Identifier field validation → `form-error` under the input. Local collection reset does **not** touch this draft.

## LEGO theme model (`LegoTheme`)

```js
{
  id: string,               // default = JSON slug; custom = UUID (`createId()`)
  name: string,             // e.g. "CITY"
  color: string,            // hex; empty = no own color (card cascade)
  secondaryColor: string,   // hex; empty = auto contrast (black / white) on the accent
  logoDataUrl: string,      // JPEG/PNG/SVG/WebP (data URL or path), optional
  logoZoom: number,         // logo width, 1 = 75% of the card (max 2.5 = 250%); 2 decimal places; the frame (lower half, 3 mm inset) crops overflow
  logoOffsetX: number,      // logo offset (width fraction of the lower half); 2 decimal places (`0.00` → 0)
  logoOffsetY: number,      // logo offset (height fraction of the lower half); 2 decimal places
  isBuiltin: boolean,       // default = read-only, not deletable
  updatedAt: string         // ISO (custom); empty for default themes
}
```

Auto-migration from the old `themeName` field → `name`. `createdAt` ignored.

Do not confuse with the **UI** theme (`theme.js`: light/dark).

Brickcard accent (`resolveCardAccent`):
1. `theme.color` if valid hex
2. else configured color (`card-design.js`)
3. else factory gray `DEFAULT_THEME_COLOR` (`#6e6e6e`)

Texts / icons / Brickcard logo (`resolveCardAccentFg`, `--card-accent-fg`):
1. `theme.secondaryColor` if valid hex
2. else auto contrast (`contrastText`): `#141414` only on a truly pale background (light gray / pastel); `#ffffff` on saturated hues (even bright ones) and dark backgrounds
The Brickcard logo (back, and face with no photo) is an **inline SVG** (`fill="currentColor"` / `--card-accent-fg`) — not a CSS mask (Firefox rasterizes `mask-image` when printing).

## Persistence

- IndexedDB: `brickcard` **v2** — `cards` + `themes` stores (**custom only**; default themes are read from `themes-presets.json`) (after local Reset: name `brickcard-<db-gen>`, key `brickcard:db-gen`); post-reset reload uses `?{timestamp}` (HTTP / SW cache), then the query is stripped at boot (`?_=` still recognized)
- Preset-tool IndexedDB: `brickcard-preset-draft` — `#developer/theme-presets` draft only (independent of local Reset)
- UI theme key: `brickcard:ui-theme`
- UI locale key: `brickcard:ui-locale` (`de` / `en` / `es` / `fr` / `it` / `pt`; missing = browser language if a `.po` exists, else English); local Reset removes it; change in Settings → reload
- i18n: `_t('English msgid')` / `_t('… %(name)s …', { name })`; fallback = msgid; no compiler or lib; `en` has no `.po`; `index.html` / manifest: `lang="en"` (SEO / crawler default); SEO meta (`description`, canonical, Open Graph, Twitter Card, JSON-LD) stay English in `index.html` (not updated with the UI locale); `document.documentElement.lang` updated in JS from the locale; Markdown pages: `data/page-{{slug}}.md` (English) / `page-{{slug}}.{{locale}}.md` (English fallback); `#developer/…` copy is **hardcoded English** (no `.po`); `#developer/theme-presets` reuses existing `_t` strings (Save, Delete, Close…); **Brickcard** brand is not translated; PDF filenames: `_t` strings then slugified (`filenameSlug`)
- Face border key: `brickcard:card-face-border-mm` (default `3`)
- Corner radius key: `brickcard:card-radius-mm` (default `2`, face + back)
- Image radius key: `brickcard:card-image-radius-mm` (default `1`, photo frame)
- Default card color key: `brickcard:card-default-color` (empty = factory gray `#6e6e6e`)
- Print selection key: `brickcard:print-qty` (`{ [cardId]: qty }`)
- Print settings key: `brickcard:print-settings` (`{ printGrid: 1–10, cardPrintOrder: "legoSetRef"|"title"|"releaseYear"|"pieceCount"|"figurineCount"|"updatedAt", printSide: "both"|"faceOnly"|"backOnly", sheetAssembly: "alternate"|"grouped", cutMarkFace: boolean, cutMarkBack: boolean, bleedFace: boolean, bleedBack: boolean }`, default `3` / `legoSetRef` / `both` / `alternate` / Face / not Back / not face / Back; order always ASC, independent of `brickcard:list-sort`)
- Developer space key: `brickcard:developer-enabled` (`"1"` if enabled off-local; always treated as on on localhost / `127.0.0.1` / `[::1]`); local Reset removes it
- List sort keys: `brickcard:list-sort`, `brickcard:list-sort-dir` (default `updatedAt` / `desc`); after **creating** a card: search cleared and sort reset to date modified descending; after **edit** or **delete**: the grid is not rebuilt (tile updated or removed, scroll / search / sort unchanged; search and print counters recalculated; last card → empty home); after **create** or **edit**: keyboard focus on the affected tile (scroll into view if needed); closing the editor of an existing card (Escape / close / Cancel / backdrop): same focus on the edited tile
- Theme sort keys: `brickcard:themes-sort`, `brickcard:themes-sort-dir` (default `cardCount` / `desc`); after **creating** a custom theme: search cleared and sort reset to date modified descending (if ≥ 2 custom themes; else fall back to the default); after **edit** or **delete**: the grid is not rebuilt (mini-card updated or removed, scroll / search / sort unchanged; counter recalculated; no custom left → custom section hidden); **Delete all custom themes** (if more than 2 custom): custom section emptied; cards kept, `brickcardThemeId` cleared; after **create** or **edit**: keyboard focus on the mini-card; closing the editor of an existing theme (Escape / close / Cancel / backdrop) or the default-theme view (`#themes/view/:id`): same focus. Same idea for `#developer/theme-presets` (create: search cleared, date desc sort, scroll top, focus; edit: in-place tile and focus; closing the editor of an existing theme: focus; last theme → empty “No theme”)
- Max list columns key: `brickcard:list-cols-max` (default `4`, range 2–10, or `infinite`)
- Optimize images key: `brickcard:optimize-images` (`"1"` / missing = checked, default; `"0"` = unchecked); local Reset removes it
- Telemetry key: `brickcard:telemetry` (`"1"` / missing = checked, default; `"0"` = unchecked); local Reset removes it; Settings checkbox and script off-local only; views = pathname + hash (`data-auto-track` off); stable Umami URL (English hashes, `#edit-card/:id` → `#edit-card`, `#themes/edit/:id` → `#themes/edit`; not other ids / slugs); title = `{locale} · ` + UI label (`getLocale()`, middle dot): home → `_t("Home")`, `#edit-card/…` → `_t("Edit card")`, `#themes/edit/…` → `_t("Edit theme")`; `#developer/…` = before the 2nd `|` (`page | section`, EN titles); other views = segment before `|` (not the SEO suffix); track at the end of `route()` (after title / overlay)
- Card accent cascade: theme color → configured color → `#6e6e6e`
- Texts / Brickcard logo cascade: theme `secondaryColor` → auto contrast on the accent
- Screen: 2 px `box-shadow: 0 0 0 2px var(--ink)` hairline on `.card` / `.card-back` / `.theme-tile-face` (silhouette vs the UI background, follows `--card-radius`). Print / A4 preview (white paper): 1 px `#000000` `border` on `.print-slot::after` if **Cut marks** On the front / On the back is checked (`.print-cut-mark-face` / `.print-cut-mark-back`; an `outline` on the slot sits underneath)
- Export (`.brickcard` file, JSON): `{ version: APP_VERSION, app: "brickcard", cards, themes, settings? }` — `version` = app SemVer (e.g. `"0.8.0"`) even with no structure change; `themes` = custom only (no `isBuiltin`); `settings.cardAppearance` (4 keys: border, corner / image radii, default color) omitted if not included — route `#backup` (`modal--md`; full: all cards, all custom themes even empty, appearance; custom: images & logos, appearance, themes with cards (alpha); no theme selected or no card: no export; without images / logos, photo, background, crop and logo are omitted from the file). Recap in the footer. Names: `brickcard-backup-YYYY-MM-DD-{full|custom}-{n}-card(s)[-{n}-theme(s)][-{n}-image(s)][-{n}-logo(s)].brickcard` (theme / image / logo segments omitted when 0)
- Import: route `#import` (`modal--md`); `.brickcard` file (or http(s) / relative URL, extension optional if the JSON is valid) loaded **in memory** then merge choices (images & logos, appearance, cards by theme — sections shown only if the file has them); IndexedDB write only on **Import** (merge, values replaced; local images / logos kept if the checkbox is unchecked); no wipe / replace of the collection; checks `app` / `version` / `cards` / `themes` (arrays, possibly empty); `app` = `brickcard`; rejects a SemVer `version` higher than `APP_VERSION`; structure migrations (`backup.js`, including old integer `version` 1–3) before normalize; ignores default themes (preset ids / `isBuiltin`); applies `settings.cardAppearance` if present and selected; file with no cards accepted if themes and/or settings remain; does not rewrite `themes-presets.json`; empty home: **Load a demo** tile (`ri-emotion-fill`) opens a `modal--sm` **Demo backup** (brick + “Loading”) that loads `data/backup-demo-jo.brickcard` and merges everything with no choice step, then closes the modal; toast **Demo loaded** (`ri-emotion-fill`, same recap as import)
- Async APIs; a local HTTP server is required
- At startup, `boot()` waits for `loadCards()` + `loadThemes()` before `route()` (“Loading” screen in `#main`, CSS animation while `aria-busy`); module / boot failure: red technical message (`#boot-error`, `--form-error`) under the title, animation stopped, `ri-error-warning-line` in the brick center, **Retry** button (`#boot-retry`, `ri-refresh-fill`, centered under the message; click → `?r={timestamp}` to bypass HTTP / SW cache, like reset `?{timestamp}`; inline script outside the module — a broken import never reaches `boot()`); no button on image / import / demo loads
- At startup, optional purge of the old `lego-set-cards` database (no longer used)

## Views

Hash is the source of truth (Back / Forward). Home = URL with no hash (internal `#` token). Overlays = `#settings`, `#new-card`, … Close / Escape / overlay backdrop → home (`replace`). Unknown hash → home. Old `#/…` URLs are accepted and cleaned.

Route overlays (one at a time, **swap** without tearing down the list): `#settings`, `#print`, `#backup`, `#import`, `#themes`, `#themes/new`, `#themes/edit/:id`, `#themes/view/:id`, `#page/:slug`, `#new-card`, `#edit-card/:id`, `#developer/…` (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`). Each overlay is loaded with `import()` on open (failure → toast, home stays usable). Child dialogs (confirmations including unsaved-close **Save?**, image / backup URL, home demo): no URL, second backdrop on top of the current view (on home: only backdrop).

- (no hash) home (empty “Welcome ;)”, list, or search with no results “Oops!”); `#` and `#/` cleaned
- `#new-card` `#edit-card/:id` card editor (modal); face + back preview; < 550px: one side visible (face first), click / Enter / Space to flip; after create: search cleared, date desc sort, focus on the tile; after edit: tile updated and focused (scroll / sort / search kept); close without saving (`#edit-card/:id`, Escape / close / Cancel / backdrop): focus on the edited tile; if a persistable field changed, Escape / close / backdrop show **Save?** first (`confirmUnsavedClose`: **Close without saving** / **Cancel** keeps the editor / **Save** same persist as the footer); footer **Cancel** and an unchanged form close immediately; after delete: tile removed (scroll / sort / search kept)
- `#themes` theme manager (`lg` modal); custom and **default** tiles focusable / clickable; `#themes/new` `#themes/edit/:id` **custom** theme editor (modal over the list; close → `#themes`); `#themes/view/:id` read-only view of a **default** theme (same layout: identifier, name, colors, logo; `readonly` / `disabled` fields; **Download** the logo; footer **Close**; `#themes/edit/{preset}` → view, `#themes/view/{custom}` → edit); after create: search cleared, date desc sort, focus on the mini-card; after edit: tile updated and focused (scroll / sort / search kept); close without saving (`#themes/edit/:id` / `#themes/view/:id`, Escape / close / Cancel or Close / backdrop): focus on the mini-card; `#themes/new` / `#themes/edit/:id` if a persistable field changed: Escape / close / backdrop show **Save?** first (`confirmUnsavedClose`; **Save** creates or updates); footer **Cancel** closes immediately; `#themes/view/:id` has no prompt; after delete: tile removed (scroll / sort / search kept); footer: **New theme** on the right; if more than 2 custom themes, **Delete all custom themes** (`ri-delete-bin-2-fill`, danger) on the left (confirmation; cards kept, `brickcardThemeId` cleared)
- `#settings` settings (`md` modal); Application section: **Language** first (`select` `DE · Deutsch` / `EN · English` / …, ISO code ASC, `brickcard:ui-locale`); search bar (`search-bar--input-only`): section titles, tiles (`title` / `desc` / `href`), `form-label` / `form-hint`; case- and accent-insensitive; if a section title matches, the whole section; **Oops!** if no results
- `#print` print settings (`md` modal); nothing to print → message instead of options; **Ctrl/Cmd+P** shortcut (outside card / theme / presets editor, outside `#import` and outside a child dialog); already open → starts printing
- `#backup` collection backup (`md` modal); full or custom; recap in the footer (cards, themes, settings, size; empty: **No cards to save!**); close → home; **Ctrl/Cmd+S** shortcut (outside card / theme / presets editor, outside `#import` and outside a child dialog); successful export → closes the modal
- `#import` backup import (`md` modal, title **Import a backup**); step 1: file or URL (centered buttons, in-memory validation, errors under the actions / in the URL modal; URL load: brick + “Loading” under the field; no recap); step 2: file name or URL (`a.link` `_blank`) centered, **Load another backup** (`sm`); choose images & logos, appearance, cards (by theme, including empty custom themes); recap in the footer (empty: **Nothing to import!**); merge only on **Import** (modal `aria-busy` until done); close → home; successful import → closes the modal; empty home: **Load a demo** tile → `modal--sm` **Demo backup** (`ri-emotion-fill`, brick + “Loading”, no footer) that imports all of `data/backup-demo-jo.brickcard` then closes; toast **Demo loaded** (`ri-emotion-fill`, same recap as import)
- `#page/:slug` Markdown page (`data/page-{{slug}}.md` English, `data/page-{{slug}}.{{locale}}.md` if the locale is not `en`; 404 → English); about: JS injection (header brand at the top); Ko-fi in markdown at the bottom
- `#developer` `#developer/typography` `#developer/links` `#developer/tiles` `#developer/buttons` `#developer/fields` `#developer/selects` `#developer/sliders` `#developer/checkboxes` `#developer/radios` `#developer/colors` `#developer/images` `#developer/search` `#developer/modals` `#developer/notifications` `#developer/loading` `#developer/welcome` `#developer/theme-presets` `#developer/theme-presets/new` `#developer/theme-presets/edit/:slug` — developer space / styleguide in an **`md` modal** (except `#developer/theme-presets`: `lg`; extensible: `#developer/…`); each gallery / the presets tool is loaded with `import()` when the page opens; locally: always on; off-local: off by default (Settings “Developer options” section hidden); `#developer` / `#developer/…` without the flag → `modal--sm` confirmation (Cancel / Enable) instead of the space; Enable persists the flag and opens the requested page; then the Settings link and `#developer` behave like locally; index: search bar (`search-bar--input-only`, section titles / tiles (`title` / `desc` / `href`); case- and accent-insensitive; if a section title matches, all its tiles; **Oops!** if no results); **Development help** (`ri-pencil-ruler-2-fill`) then **Templates** (`ri-pages-fill`) then **Design system** (`ri-collage-fill`); galleries / development help / templates (tiles): title = `#developer` link to the section + `ri-arrow-right-wide-fill` + page title; link hover / focus = primary hover (same inverted tokens as Close); ≤ 640px (full screen): if the link has an icon, text hidden (icon only); `#developer/loading`: loading-page template (animated brick; in progress, error with no button, error with **Retry**); `#developer/welcome`: empty-home template (brick + tiles); `#developer/theme-presets`: default-themes draft tool (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`; close editor → list; after create: search cleared, date desc sort, scroll top, focus on the mini-card; after edit: in-place tile and focus; after delete: in-place tile; close without saving (`#developer/theme-presets/edit/:slug`): focus on the mini-card; `#developer/theme-presets/new` / `edit/:slug` if a persistable field changed: Escape / close / backdrop show **Save?** first (`confirmUnsavedClose`; **Save** creates or updates); footer **Cancel** closes immediately; optional modal footer lifted out of the body)

## Buttons (design system)

UI vocabulary → CSS classes:

| Axis | Options |
|------|---------|
| Variant | `btn primary` (default) · `secondary` · `ghost` · `danger` |
| Content | text only · text + icon (`svg` + `span`) · `icon-only` |
| Layout (text+icon) | icon on the left (default) · `icon-right` |
| Size | (default) · `sm` |
| Badge | `span.btn-badge` (overlay, `aria-hidden`) |
| State | (active) · `disabled` |

Icon only: label in `span.visually-hidden`, SVG `aria-hidden="true"`.
Badge: overlay counter (top-right); the button stays in its type (including `icon-only`). Accessible name on the button, not the badge.
Hover and `:focus-visible` share the same style (no dedicated outline on buttons).
Ghost: text = secondary; hover/focus = resting primary (accent background / contrast text).
Do not invent one-off classes — reuse this vocabulary. Applied: **Save** = `ri-save-fill`; **Delete** = `ri-delete-bin-2-fill` (including delete-confirmation titles). Gallery: `#developer/buttons`.

## Links (design system)

UI vocabulary → CSS classes:

| Axis | Options |
|------|---------|
| Class | `link` |
| Content | text only · text + icon (`svg` + `span`) |
| Layout (text+icon) | icon on the left (default) · `icon-right` |
| Size | (default) · `sm` |
| State | (active) · `disabled` / `aria-disabled` |
| `href` | address |
| `target` | `_blank` by default if external (`https://`) |

Color = text (`--ink`; inverted header: `inherit`). Always underlined. `:visited` = same color (no browser purple).
Disabled: no underline, `--muted` color, `tabindex="-1"`, not clickable.
External: `rel="noopener noreferrer"` + Remix `ri-external-link-fill` icon on the right by default (no icon if the label is an image, e.g. badge `[![alt](src)](url)`).
Helper: `linkMarkup()` in `link.js`. Markdown (`[text](url)`) already emits `class="link"`.
In a modal, every content link goes through `linkMarkup()` / `a.link` (no bare `<a>`).
Do not style `.topbar-brand` or `.tile` with `link`. Gallery: `#developer/links`.

## Tiles (design system)

UI vocabulary → CSS classes:

| Axis | Options |
|------|---------|
| List | `ul.tile-list` |
| Tile | `a.tile` (link) · `button.tile` (action) |
| Title | `strong.tile-title` (optional) |
| Description | `span.tile-desc` (optional) |
| Icon | Remix on the left, vertically centered (optional) |
| Variant | (default) · `danger` |
| State | (active) · `disabled` / `aria-disabled` |
| `href` | address (links) |
| `tag` | `a` (default) · `button` |

1 px frame (`--line`); 2 px inset bottom stroke `var(--ink-soft)` (like fields, no bevel). Hover and `:focus-visible`: invert (background `--ink` / text `--panel`), bottom stroke hidden, no dedicated outline.
`danger`: text and stroke `--danger-line`; hover / focus background `--danger-bg`, frame and bottom stroke `--danger-line` (like `btn danger`).
Disabled: `--muted` color, `tabindex="-1"`, not clickable.
Title = appearance (`strong`), not a heading.
Helper: `tileMarkup()` / `tileListMarkup()` in `tile.js`. Applied: developer-space index, settings (collection / styleguide), empty state. Gallery: `#developer/tiles`.

## Text fields (design system)

Standard field order (unless a documented exception):

1. **Label** — `form-label` (+ `form-label--required` if needed)
2. **Hint / description** — `form-hint` (optional, always above the control); no trailing period unless the hint has several sentences
3. **Control** — `form-control` (text / number / textarea) or input group (color, photo…)
4. **Error / validation** — `form-error` (under the control, only when shown)

Vocabulary:

| Axis | Options |
|------|---------|
| Block | `form-field` |
| Label | `form-label` (+ `form-label--required`) |
| Help | `form-hint` |
| Control | `form-control` (text / number / textarea) |
| Icon | optional — `form-control-wrap` + `form-control-icon` (Remix, decorative) |
| Error | `form-error` + `is-invalid` / `aria-invalid` on the control |
| Size | (default) · `sm` |

Hover: **none**. Rest = 2px inset bottom stroke; focus = 2px `outline` + 1px `outline-offset` (`ink`, unchanged on error). Error color: `--form-error` (`#ce0000` light / `#ff5555` dark). Gallery: `#developer/fields`. Applied: card editor (reference `ri-hashtag`, year / pieces / figurines = card badges, theme `ri-palette-fill`).

Current exceptions: form-wide alerts (`#error`, `#theme-error`) under the field block (legacy; for a general error, prefer a toast — see **Notifications**); **checkboxes** and **radios**: control to the left of the label / hint (`form-check`, see below).

## Selects (design system — styleguide)

Markup: `select.form-control` (same look as a text field). Unobtrusive overlay: `enhanceFormSelects()` / `enhanceFormSelect()` in `form-select.js` — styled trigger + custom list (optgroup, keyboard, states). Placeholder option (`value=""`) excluded from the list; reset `ri-close-circle-fill` (not focusable) to go back to it. Option icons: `data-icon-left` / `data-icon-right` (Remix keys from `icons.js`, e.g. `printer`, `arrow-right`). Field icon (like an input): `form-control-wrap` + `form-control-icon` around the `<select>`. The native `<select>` stays in sync. Applied: editor (theme + `ri-palette-fill`, **Custom themes** / **Default themes** groups if custom exist). Gallery: `#developer/selects`.

## Sliders / range (design system)

Same field order. Control: `form-range-row` (`input[type=range]` + optional `output`). Optional reset (`formRangeResetMarkup()` / `bindFormRange()` in `form-range.js`): `ri-close-circle-fill` button after the input / output, not focusable, slot always reserved, icon visible only when the value differs from the default; the `output` then goes bold. Square thumb, no border; focus on the thumb only; error = message only (no red tint on the slider). Applied: settings (columns, border, corners, images, print grid) · print (grid). Gallery: `#developer/sliders`.

## Checkboxes (design system)

Order exception: the box is **to the left** of the label and hint (hint under the label), vertically centered on the text block. Control: `label.form-check` (hidden `input.form-check-input` + `form-check-ui` + `form-check-text` with optional `form-label` / `form-hint`). Error = `form-error` message only (no red tint on the box). Size: `sm` (smaller box). States: disabled (grayed, not submitted) · read-only (`aria-readonly="true"` — the HTML `readonly` attribute is ignored on checkboxes; `bindFormCheckboxes()` blocks the toggle, value still submitted). No required or invalid visual state. Groups: `fieldset.form-check-group` + optional `legend.form-label` + `form-check-list` (vertical) or `form-check-list--row` (horizontal, wrap); the list (and group error) is indented under the legend. Module: `formCheckboxMarkup()` / `bindFormCheckboxes()` in `form-checkbox.js`. Square, no radius; Remix `ri-check-fill` check; no hover; focus on the box. Gallery: `#developer/checkboxes`. Applied: settings / `#print` (**Cut marks** / **Bleed**, horizontal).

## Radios (design system)

Same display idea as checkboxes. Control: `label.form-check.form-radio` (`input.form-check-input` `type="radio"` hidden + `form-check-ui` + `form-check-text`). Same hint, error (`form-error` only), `sm` size, disabled, read-only (`aria-readonly="true"` — the HTML `readonly` attribute is ignored on radios; `bindFormRadios()` blocks the choice, including if another option of the same `name` is clicked while the checked option is frozen; value still submitted). Groups: same `name` for a single choice; `fieldset.form-check-group` + `form-check-list` / `form-check-list--row`. Module: `formRadioMarkup()` / `bindFormRadios()` in `form-radio.js`. Remix `ri-radio-button-line` (CSS mask) in both states; at rest, the inner disc is removed (same viewBox); no hover; focus on the circle. Applied: settings (display mode, vertical; card print order, horizontal; print side, horizontal; sheet assembly, vertical) · `#print` (print order, print side / assembly) · backup (`#backup`, backup type). Gallery: `#developer/radios`.

## Colors (design system)

Same field order. Control: text `input.form-control` in a `form-color` wrapper, with a swatch on the left (`input[type=color]`) and a clear button (`ri-close-circle-fill`) overlaid inside the field. Clear visible only when there is a value (may be omitted / disabled); not focusable (`tabindex="-1"`). Swatch: only if valid hex; else the field default color (`fallback` / `fallbackColor`), else a transparent checkerboard. Placeholder = fallback (updated by `setValue`). `disabled` option: hex + swatch frozen, clear hidden. Module: `form-color.js`. Applied: settings · themes · image field (background) · default-theme view. Gallery: `#developer/colors`.

## Images (design system)

Control: `form-image` wrapper (`formImageMarkup()` / `bindFormImage()` in `form-image.js`). `processFile(file) => Promise<dataUrl>` required outside `readOnly` (`compressImage` for cards and logos). SVG kept as vectors (scripts / `foreignObject` / `on*` stripped on load and import). Rasters: if **Optimize images** (Settings → Application, checked by default) → WebP (max side 2000 px; PNG fallback if canvas encoding fails); else JPEG / WebP / PNG kept if they fit in 2000 px, otherwise resized (same format); everything else → PNG. Two views:

- **Empty** — hint “Load a new image to preview and crop it” (`form-hint`) + **From my files** (`btn primary`, `ri-file-line`, hidden `<input type="file">`) and **From a URL** (`btn secondary sm`, `ri-link`). URL → child `modal--sm` with no route (title “Load from a URL” + `ri-link`, URL field with `ri-cloud-fill`, `form-error` under the input; loading: brick + “Loading” under the field); footer on the right **Cancel** `secondary sm` + **Load** `primary` (`ri-upload-fill`, like Import); close only if the load succeeds (Escape / backdrop / X = dismiss). Pipeline: `fetchImageAsFile` then `processFile` (the URL is not kept).
- **Image** — **Image background** field (`form-color`, no hint) then `.form-image-crop` preview (`tabindex="0"`). Overlays: 3 centered badges (`btn primary sm`, appearance only: zoom `%`, signed alignment `%`; `ri-zoom-in-fill` / `ri-align-item-horizontal-center-fill` / `ri-align-item-vertical-center-fill`); reset `btn ghost sm icon-only` (`ri-close-circle-fill`) top-right if crop ≠ 100% / 0 / 0; **Delete** (left, `ri-delete-bin-2-fill`) and **Download** (right, `ri-download-fill`, like Save the collection) `btn primary sm` (delete: `confirmDialog`; successful save: toast **Image saved**; cards: name `brickcard-card-image-YYYY-MM-DD-{ref-slug}-{title-slug}.{ext}` — slugged ref and/or title; without both: card id; theme logos: `brickcard-theme-logo-YYYY-MM-DD-{name-slug}.{ext}`; without a name: theme id). Preview tab order: reset (if visible) → Download → Delete. Crop when focused (drag / wheel / arrows / `+` `−`). Ratio: `--form-image-aspect` (default `1 / 1`). Preview background = field color, live.

`withBackgroundColor: false` option: no background field; the preview uses `previewBackground` / `setPreviewBackground()` (themes: theme color, live). `fit: "logo"` option: zoom sets the logo **width** (1 = 75% of the card width, max 250%), not a cover. Stored on the theme (`logoZoom` / `logoOffsetX` / `logoOffsetY`) and applied on the back and mini-cards (centered in the frame; offset = frame fraction; cropped if it overflows). Theme ratio: `--form-image-aspect: 63 / 44`. `readOnly` option: frozen preview (info badges, no crop / reset / delete / load); **Download** stays active; empty → “No logo” hint; `form-color` background then `disabled`.

Applied: card editor · custom theme editor · default-theme view (`#themes/view/:id`) · default-themes tool (`#developer/theme-presets`). Gallery: `#developer/images`.

## Search (design system)

Center bar (list): `search-bar` block in the `topbar-search` slot.

| Axis | Options |
|------|---------|
| Block | `search-bar` (+ `search-bar--input-only` if no trail) |
| Icon | optional — `form-control-icon` (default search: `ri-search-line`) |
| Control | `input.form-control` `type="search"` (same look as a text field) |
| Trail | `search-bar-trail` (absolute, right) — visible only if ≥ 2 items (`[hidden]` otherwise) |
| Count | `search-count` (empty → hidden) |
| Sort | `search-sort` + `btn ghost sm icon-only` (`ri-filter-3-fill`) + `search-sort-menu form-select-list` menu (child of `search-bar`, no top border, aligned to the focus frame) / `form-select-option` options; right icon `ri-sort-asc` / `ri-sort-desc` on the active option |

Opening the sort menu: **click** only (not hover or focus alone); once the button is focused, keyboard like `form-select` (↑↓ Enter/Space Home/End Escape, `aria-activedescendant`). The menu **stays open** after a criterion choice or direction flip (close: outside click, Escape, or click the button again).

Applied: list topbar · themes modal (count + sort: card count, title, date modified if ≥ 2 custom themes — default themes not involved; default card count descending) · `#developer` home and `#settings` (`search-bar--input-only`, no count or sort). Matching: `includesCI` (`includes-ci.js`), case- and accent-insensitive. Gallery: `#developer/search`.

## Titles (design system)

Class = look. Tag = document outline. **One rank-1 per view** (page or dialog). Do not skip ranks.

| Visual role | Class | Size |
|-------------|-------|------|
| View / dialog title | `view-title` | 1.7rem (1.35rem in `.modal-header`) · 700 |
| Section | `section-title` | 1.25rem · 700 |
| Description | `view-desc` | 0.95rem · ink-soft — **not** a heading; **short** (one line). Not in the modal header. Detail → paragraph in the body |

| Context | Title | Rest |
|---------|-------|------|
| Page (`#main`) | `h1.view-title` | `h2.section-title` |
| List | `h1.visually-hidden` “Cards” | — |
| Empty state (home, loading) | `h1.view-title` | CSS brick; optional text / tiles |
| Empty state (list / themes search) | `p.view-title` | `h1` already on the view / dialog |
| Dialog | `h1.view-title` (`aria-labelledby`) — **short** title + **one** Remix icon max on the left if the trigger has one (`modalTitleMarkup`): icon on the left vertically centered, title beside it (several lines if needed, like toasts); card / theme edit: `ri-pencil-fill`; default-theme view: `ri-palette-fill` (like **Themes**); confirmations: a bit longer, with the subject; galleries / development help / templates: section (`#developer` link, optional icon) + `ri-arrow-right-wide-fill` + title (no tile icon); `#page/about`: title only (from the markdown `#`, no icon or version) | `h2.section-title` |
| Markdown page in a modal | `# Title` → dialog title (removed from the body); about: `# About` / `# Über` / `# Acerca de` / `# À propos` / `# Informazioni` / `# Sobre` by language; body: brand (logo + name + version like the header) injected, Markdown, Ko-fi markdown at the bottom | `##` → `h2`, `###` → `h3` in `.md-content` |

Not headings: topbar brand, `form-label`, card names (themes grid, Brickcard). Gallery: `#developer/typography`.

Document title (`<title>` / `document.title`, `document-title.js`): default **Brickcard - Print lovely cards for your LEGO® bricks** (`APP_DOCUMENT_TITLE` in `version.js` and `src/index.html`, **no** version). Home = that title. Overlay / page: `{modal title} | {section title if it exists (developer space)} | {default title}`. Child dialogs (confirmation, image / backup URL, home demo, styleguide demo, presets editor) stack on top while shown. During `window.print()`, the title becomes the proposed PDF filename (see **Print**); the overlay scheme is not applied.

Empty states (`section.empty-view` / `.empty-view-body`, `emptyViewMarkup` helper in `empty-view.js`): title + text + tiles centered in `#main` or `modal-body`; CSS brick stuck above (out of flow). Home with no cards: “Welcome ;)” + New card / Import a backup / Load a demo tiles (`welcomeViewMarkup`; `#developer/welcome` gallery, import and demo tiles inert); on a large screen the block moves up by one header height (header looks empty); on a short height (e.g. phone landscape) the block aligns to the top, `#main` scrolls, and a reserve accounts for the out-of-flow brick. Search with no results (cards, themes, settings, developer-space home): “Oops!”. First paint: “Loading” until cards + themes are ready; boot failure → red message (`#boot-error`), animation stopped, `ri-error-warning-line` in the brick center, **Retry** under the message (`loadingViewMarkup`; `#developer/loading` gallery: in progress, error, error with Retry).

## Modals (design system)

Shell: `modal-backdrop` + `modal` (`role="dialog"` / `aria-modal`). Border: `2px solid var(--ink)` (like field focus). Vertical alignment (on the backdrop): `modal-backdrop--top` · `modal-backdrop--middle` (**default**) · `modal-backdrop--bottom`. Inverted header (background `ink` / text `panel`): title (`h1.view-title`, short) + **one** Remix icon max on the left (decorative, taken from the opening button / tile; card / theme edit exception: `ri-pencil-fill`; default-theme view: `ri-palette-fill`; developer galleries: section icon on the link, no tile icon; `#page/about`: no icon; the icon stays on the left, vertically centered; the title beside it may wrap, like `.toast-header`) + `btn primary icon-only modal-close` (same DS variant, inverted tokens like the print menu: rest background `--bg` / hover background `--ink` + border `--bg`). Close button vertically centered, same top / right / bottom inset; `tabindex="-1"` (not tabbable — close: Escape / click). Body: `modal-body` (`tabindex="-1"` — Chrome makes `overflow: auto` tabbable). On open, focus on `.modal` (`tabindex="-1"`): Tab goes to the content, then the footer; Tab loops in the frontmost modal. Backdrop and `modal-body` scroll reset to the top (including a developer-gallery swap). Optional footer: `modal-footer` with `modal-footer-start` (left: save / confirm) and `modal-footer-end` (right: danger) — buttons vertically centered (normal / `sm`). **Cancel**: `sm` if there are other action buttons in the footer, normal size if it is alone (`openConfirmDialog` applies this by itself). `modal-footer--primary-first` exception (card editor, theme editor, print settings, `#backup` backup, `#import` import): visual Cancel then primary action on the right (editors: Delete on the left); keyboard (DOM) order primary → Cancel → Delete. Header separator: `2px solid var(--ink)` (no top border on the footer).

Sizes (3): `modal--sm` (~640) · `modal--md` (~896, **default**) · `modal--lg` (~1152). Always clamped to the **viewport** (`100vw` / `100dvh`). Responsive ≤ 640px: **full screen**, overlay hidden.

Applied: settings / MD page / backup (`#backup`) / import (`#import`) / developer space / print settings (`#print`) (`md`) · themes + card editor + theme editor / view + `#developer/theme-presets` (`lg`; themes, settings, `#developer` home and `#developer/theme-presets`: height always `var(--modal-max-h)`, body scrolls) · confirmations / image or backup load from a URL / home demo (`sm`). Gallery: `#developer/modals`. Child dialogs (delete card / theme / all custom themes / image, unsaved-close **Save?** on draft editors, local reset, image / backup URL, home demo): second `modal-backdrop` in the same host, no route — `confirmDialog()` / `openConfirmDialog()` / `confirmUnsavedClose()` helper (`confirm-dialog.js`) or `openDemoBackupDialog()`; title a bit longer and explicit (e.g. `Delete the card “Saucer Centurien (#6939)”?`); unsaved-close: title **Save?** + `ri-save-fill`, **Close without saving** (danger, left) / **Cancel** `sm` + **Save** (right). No native `alert()` / `confirm()` / `prompt()`. Browser Back / hash change does not show the unsaved-close confirm.

## Notifications (Toast)

UI vocabulary → CSS classes:

| Axis | Options |
|------|---------|
| Stack | `#toast-root` / `.toast-root` (fixed, z-index 10000, above modals) |
| Toast | `.toast` · `.toast--success` · `.toast--error` |
| Header | `.toast-header`: icon + `.toast-title` on the left; `.toast-secondary` (`small`) + close on the right |
| Body | `.toast-body` / `.toast-message`; no title: `.toast-body--bare` (icon on the left, close on the right, vertically centered) |
| Close | `btn primary icon-only sm toast-close` (inverted tokens like `.modal-close`, tabbable) |
| Type | `normal` (default, black / white dark, no icon or title) · `success` (green, **Success** title, `ri-checkbox-circle-fill`) · `error` (red, **Error** title, `ri-error-warning-fill`) |

`toast()` / `dismissToast()` API in `toast.js`. Message required. Title, icon, secondary text, close optional (`title` / `icon`: `undefined` = type default, `false` = hidden). Optional `messageHtml` (trusted HTML for the body, e.g. bold size; `message` stays the plain text). `delay` 7000 ms (default); collection import / backup (`TOAST_DELAY_BACKUP`) 15 s; `false` / `0` = no auto-close (close then always shown). Several stacked toasts: the new one is added at the bottom, previous ones move up. ≤ 640px: full centered width (1.25rem margin). 2 px transparent frame; header separator 2 px <code>var(--bg)</code> (white light / black dark). No animation. Gallery: `#developer/notifications`.

**Priority**: for a **general** success or error (load, save, delete, download, reset…), use `toast()` (`success` / `error`) rather than a status / `form-error` in the view body. **Field** errors (`form-error` under the input, `is-invalid`) stay under the control — no toast for field-by-field validation.

## Print

A4 portrait; **grid** 1×1 to 10×10 (default **3×3** poker 63×88 mm). 5 mm gap (horizontal and vertical). Other sizes: scale to fill the width (enlarge at 1–2, shrink at 4–10); whole cards only. Folio at the top / bottom of each sheet (`Brickcard · n / total`, 7 pt, centered, under the cards — hidden if a card covers it). **Cut marks** (On the front / On the back checkboxes, default face only): 1 px `#000000` hairline around cards on the checked sides (white paper; `.print-slot::after` overlay); nothing checked → no hairline. **Bleed** (On the front / On the back checkboxes, back checked by default): 2 mm rectangle on all four sides (`.print-bleed-face` / `.print-bleed-back`, scales with the grid); checkbox grayed / disabled and no bleed if cut marks on the same side are checked. **Card print order** (independent of the list): reference (default) / title / release year / piece count / figurine count / date modified; always ascending (ASC). **Print side**: both sides (default) / front only / back only. A4 **sheet assembly**: alternate (default) or group (all fronts, then all backs). Horizontal mirror on the back (long-edge flip). The same settings are in Settings (`#settings`, Print section) and in `#print` (“Start printing” menu, stays open during print). **Ctrl/Cmd+P** shortcut: opens `#print` (outside card / theme / presets editor, outside `#import` and outside a child dialog); already open → starts printing. Nothing to print: message instead of options. Before `window.print()`, wait for card photos and theme logos to decode (default-theme files included, even still `hidden` waiting for `onload`) — do not overwrite image handlers. During `window.print()`, `document.title` = proposed PDF name (`brickcard-YYYY-MM-DD-{slugged grid}-NxN-…`, no `.pdf`; segments from `_t` then `filenameSlug`) via `beginPrintDocumentTitle` / `endPrintDocumentTitle` (`document-title.js`) — set **before** building the sheets (Gecko updates `contentTitle` asynchronously). Firefox: `afterprint` = clone ready, not the dialog closing (ignore during `print()`; restore when `print()` blocked, or on `afterprint` in Chrome). The overlay scheme does not overwrite the name. Back: **Brickcard** label.

## Conventions

- Keep the product name **Brickcard** in the UI and the docs.
- Keep **verbose** field names on the Card / LegoTheme models.
- **Language**: this file, the changelog, commit messages, and source comments / JSDoc are **English**. When you edit a file, translate comments you touch; do not mass-rewrite French comments in unrelated files. UI copy stays i18n (`_t`, English source). Personal notes (`.local/`, `.cursor/`) may stay in any language.
- UI i18n (`_t`, English source), minimalist design (no UI radii/shadows).
- **Type**: Open Sans for the UI (`--font-ui`); Inter for card text (`--font-card`) — files in `src/fonts/`, no CDN. Titles: class = look, tag = outline (see **Titles**).
- **Icons**: always start from [Remix Icon](https://remixicon.com/) (*fill* style preferred) before inventing an SVG. Reuse / extend `src/js/icons.js`; in HTML, comment the `ri-*` name.
- No native `alert()` / `confirm()` / `prompt()`: `confirmDialog()` / `openConfirmDialog()` / `alertDialog()` (`confirm-dialog.js`).
- **Notifications**: **general** success and errors → `toast()` first (`success` / `error`). Form validation → `form-error` under the field, not a toast.
- No npm dependencies unless explicitly asked.
- **Modules**: boot loads the list, storage, and chrome (including the design system already pulled by the print menu). Route overlays and `#developer/…` galleries load with native `import()` when needed (`print.js` on **Start printing**). No bundler; no `?v=` outside the `app.js` / `version.js` import map.
- **Git — commits**: commit as soon as an intent (feature or fix) is **done**, or **before** starting another. One commit = one intent (a revert = one thing). Do not wait to be told “commit”. Do not dump a whole session. Never commit `.local/` or `.cursor/`.
- **Git — version, tag, and push**: **only on an explicit request**. Bump `APP_VERSION` (and the cache `?v=` in `index.html` and `404.html`: CSS and `app.js` / `version.js` import map, `CACHE` in `service-worker.js`, and a dated `CHANGELOG.md` entry) only when asked. Between versions, record **app code** (`src/`) changes under `## [Unreleased]` **in English** (not README, CONTRIBUTING, CI, GitHub templates, Ko-fi). If the number is not given, ask (patch / minor / major) — do not pick. Accepted **without confirmation**: only the next patch (`0.8.0` → `0.8.1`), next minor (`0.8.0` → `0.9.0`), or next major (`0.8.0` → `1.0.0`), from the current `APP_VERSION`. Anything else (jump `0.7.1` → `0.9.0`, downgrade, same number, invalid SemVer, `vX.Y.Z` tag already present): **stop and ask** before bump / tag / push. Bump OK → `chore: bump to X.Y.Z` commit + annotated `vX.Y.Z` tag. Push (commits **and** tags) only if asked. Pushing the `vX.Y.Z` tag publishes the GitHub Release (`release.yml` workflow, native zip/tar.gz); do not call `gh release create` locally.
- **Git — messages**: `feat` / `fix` / `docs` / `chore` + 1 *why* sentence (English); optional body. `feat` = new capability, `fix` = bugfix, `docs` = AGENTS / README, `chore` = version bump, CI, assets. No scope (`feat(print):`), no other type.
