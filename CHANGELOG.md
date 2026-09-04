# Changelog

Notable changes to the Brickcard app.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.9.3] — 2026-09-04

### ✏️ Changed

- Set catalog `data/sets-presets.json`: `meta.numThemes` / `meta.themesKeys` / `meta.numSets` / `meta.setsKeys`; rows no longer include `brickcardThemeId` (map from Rebrickable `themeId` later)
- Card fields `pieceCount` / `figurineCount` renamed `numPieces` / `numFigurines` (editor ids `num-pieces` / `num-figurines`; list and print sort keys; old names still read from IndexedDB / `.brickcard` / localStorage)
- Theme sort key `cardCount` renamed `numCards` (old localStorage value still read); backup / import recap fields `numCards` / `numThemes` / `numSettings` / `numImages` / `numLogos`; search trail class `search-num-results`; theme tile caption `.theme-tile-num-cards` (preset id uses `.theme-tile-id`); print qty badge is the `span` inside `.print-qty`

## [0.9.2] — 2026-09-03

### ➕ Added

- Draft editors (`#new-card`, `#edit-card`, `#themes/new`, `#themes/edit`, `#developer/theme-presets/new`, `#developer/theme-presets/edit`): if a field changed, closing via Escape / close / backdrop asks **Save?** (**Close without saving**, **Cancel**, **Save**) instead of discarding silently; footer **Cancel** still closes immediately
- Offline set catalog `data/sets-presets.json` (Rebrickable dumps, no images): piece count, figurines, year, theme id — precached by the service worker for a future card-editor autocomplete; optional `rebrickableThemeId` on a default theme maps to `brickcardThemeId`; positional rows (`meta.themeKeys` / `meta.setKeys`) to keep the file small; card `legoSetRef` / `title` are derived later; Database Sets (theme `746`) and empty theme names are omitted; missing / `0` counts are `null` or trailing-omitted

### 🔧 Fixed

- Offline PWA: after the first online visit, the service worker background-precache every app file (lazy overlay modules, i18n, About pages, default-theme logos, demo) so **New card**, **About**, themes, and the rest work without having opened them beforehand

## [0.9.1] — 2026-08-31

### ➕ Added

- GitHub Pages 404 (`404.html`): English empty-view (same look as boot **Load error — retry**); title **Brickcard**, message **404 - page not found**, **Reload the app** link to `/`; `noindex`; no i18n
- SEO and social previews: English `meta description`, canonical, Open Graph, Twitter Card, and JSON-LD (`WebApplication`) in `index.html`; `robots.txt` and a one-URL `sitemap.xml`; share image `img/brickcard-og-1200x630.png`. Print menu and topbar actions use `data-nosnippet` so Google does not recycle chrome copy as the search snippet.

## [0.9.0] — 2026-08-30

### ➕ Added

- Interface language: English is the source language (`_t('…')`); catalogs live in `i18n/{de,es,fr,it,pt}.po` (gettext, loaded and parsed in JS, no compiler) — German, Spanish, French, Italian, and Portuguese (Brazilian). Settings → Application starts with a language dropdown (`DE · Deutsch`, `EN · English`…, sorted by ISO code); the choice is stored as `brickcard:ui-locale`. First visit uses the browser language when a catalog exists, otherwise English. HTML and the web manifest stay `lang="en"` for crawlers; the document language is updated in JS.
- Print PDF filename: localized words (`grid`, `front`, `duplex`…) are translated then slugified (`brickcard-…-grille-3x3-face-et-dos-…` in French).
- Markdown pages (`#page/:slug`): English file `data/page-{{slug}}.md`, locale file `data/page-{{slug}}.{{locale}}.md` (About: `page-about.de.md`, `page-about.es.md`, `page-about.fr.md`, `page-about.it.md`, `page-about.pt.md`); missing locale falls back to English.

### ✏️ Changed

- Card list and print order: title and set-number sort use the UI locale (`localeCompare` + `getLocale()`), like themes and backups
- Developer space (`#developer/…`): styleguide copy is English (hardcoded, no `_t`). The default-themes tool reuses existing `_t` strings for shared actions (Save, Delete, Close, search, empty states…)
- Telemetry: URLs stay language-stable (English hashes; `#edit-card/:id` → `#edit-card`, `#themes/edit/:id` → `#themes/edit`); titles use the UI language with an ISO prefix (`fr · Accueil`, `en · Home`, `fr · Modifier la carte`, `en · Edit card`); `#developer/…` titles stay English (`page | section`) but still get the locale prefix; views are tracked after the overlay and document title are set
- About (`#page/about`): disclaimer wording **une marque de LEGO Group** / **par LEGO Group** (no article **du** / **le**); intro uses **petite application** and **de bien jolies cartes pour vos briques LEGO®**
- Demo backup (`data/backup-demo-jo.brickcard`): re-exported at 0.8.6; the **jo** card photo is now WebP (pink background, new crop)

## [0.8] — 2026-08-29

### ➕ Added

- Collection backup (`#backup`) and import (`#import`): full / custom export, file or URL import, in-memory validation, merge choices, live recap; writes only on **Import**; Ctrl/Cmd+S / Ctrl/Cmd+P (print) shortcuts
- Demo backup: `data/backup-demo-jo.brickcard` (WebP photos); empty-home **Load a demo** tile (`ri-emotion-fill`)
- Themes: optional `secondaryColor`; read-only default-theme viewer (`#themes/view/:id`); **Delete all custom themes** (when more than 2)
- Print: card order, print side, sheet assembly, cut marks, 2 mm bleed, A4 folio; 2 px `--ink` hairline on screen
- Toasts (normal / success / error, stacking); **Optimize images** (WebP by default); anonymous telemetry (off-local); boot **Retry**
- Settings / developer-home search; `#developer/welcome` and `#developer/notifications` galleries
- GitHub Releases on each `vX.Y.Z` tag; color `disabled` and image `readOnly` field options

### ✏️ Changed

- Import is always a merge configured in `#import` (no more Merge / Replace); backup version = app SemVer; `.brickcard` names `brickcard-backup-…`
- Default themes: catalog 65 entries (SVG / WebP); added Botanicals, Braille Bricks, BrickHeadz, Creator 3in1, DC, Marvel, Nike; `the-lord-of-the-rings` → `lord-of-the-rings`
- List / themes / preset draft: in-place tile update after edit or delete; after create, search cleared and sort by date; keyboard focus on the tile
- Search: accent-insensitive; settings **Application** section; display mode as radios
- Image field: one `compressImage` pipeline; SVG kept as vectors; download names `brickcard-card-image-…` / `brickcard-theme-logo-…`
- Overlays and `#developer/…` galleries `import()` on open; `app.js` / `version.js` cache-bust via import map
- Document title: tagline (no version), overlay scheme; Brickcard logo on cards is inline SVG (`--card-accent-fg`)
- Service worker at the site root (scope `/`); auto contrast only uses black on a truly pale accent
- Card editor: one-side preview below 550px; About follows the product README (brand + Ko-fi)

### 🔧 Fixed

- Print: wait for photos and default-theme logos; sharp Brickcard logo; PDF name stays `brickcard-…` (Firefox `afterprint`)
- Empty home: short viewports scroll; boot error can retry without a stuck cache
- Settings / developer search: modal height no longer yo-yos; toast / telemetry collector payloads
- Service worker: install survives a failed precache; WebP **Download** saves the file

## [0.7] — 2026-08-22

### ➕ Added

- PWA: manifest, install icons (192/512, apple-touch), service worker
- Home: loading screen (brick + “Chargement...”) until IndexedDB is ready; empty home “Bienvenue” and tiles; no-search-results “Oups !”
- Print: settings modal (1×1–10×10 grid, card sides, duplex); Settings section; suggested PDF filename
- Developer space: **Thèmes par défaut** tool (`#developer/theme-presets`, isolated IndexedDB draft); **Modèles** section and **Page de chargement** gallery; enable off-localhost (persisted confirmation)
- Image field (`form-image`: file / URL, background, crop); checkboxes, radios, slider reset; related galleries
- Custom themes: logo size / position (`logoZoom`, `logoOffsetX`, `logoOffsetY`); same optional fields on default themes
- Settings → Card appearance: image corner radius (independent of card corner radius)

### ✏️ Changed

- Product name and technical ids: **Brickcard**
- Routes: overlays as `#settings`, `#new-card`, `#developer/…` (no `/` right after `#`); home = URL without hash
- Collection backup: `.brickcard` file (JSON); import limited to that format
- Open Sans and Inter self-hosted (`src/fonts/`); `createdAt` and `description` fields dropped from the model
- Default theme logos: moved to `src/data/`, reworked / minified
- Modals: Remix icon left of the title, focus on open, footer **Annuler** is `sm` when there are other actions
- Card / theme editors: preview on the left, visual footer Delete / Cancel / Save
- Local reset: reload with `?{timestamp}`

### 🔧 Fixed

- Boot: technical message if a module or `boot()` fails
- Service worker: network revalidation (`cache: "reload"`)
- Print back: bleed aligned to the grid
- Modals: scroll reset to top on show
- Developer / default themes: new / edit routes (Back returns to the list)

### 🗑️ Removed

- Default themes: 4 Juniors, Games, Homemaker, Make & Create, Xtra

## [0.6] — 2026-08-15

### ➕ Added

- Themes: sort in the search bar (card count, title, modification date if ≥ 2 custom themes; default card count descending)
- Themes: Brickcard-look mini-cards (color background, `--card-radius` corners, contrasted title on top; Brickcard logo if the theme has none)
- Themes: `#/themes/new` and `#/themes/edit/:id` routes (real editor modal for custom themes)
- Settings: danger tile to delete all cards (themes and settings kept)
- Default themes: 113 Brickipedia themes added (id + name, alphabetical)
- Default themes: accent color for each theme (unique hex)
- Default themes: official logos (`img/logo-theme-{{id}}`, SVG preferred then WebP / PNG / JPG) for 121 themes; Games, Homemaker, and Make & Create had no distinct logo found

### ✏️ Changed

- Default themes: read-only (no more edit or reset)
- Custom themes: UUID id; IndexedDB and JSON export keep custom themes only
- Card editor: theme list in groups (Thèmes personnalisés / Thèmes par défaut)
- Themes: modal title and description aligned with the Settings tile
- Themes: **Nouveau thème** button in the footer (left), with + icon

### 🔧 Fixed

- List: keyboard focus outlines the card only; slight zoom on hover and focus
- List: focus stays on + / − / the print icon after a click (quantity)

### 🗑️ Removed

- Home: no more autofocus in search (virtual keyboard on mobile)

## [0.5] — 2026-08-13

### ➕ Added

- **Modals** design system: 3 sizes (`modal--sm|md|lg`), backdrop alignment, inverted header, two-zone footer
- Design system: tiles, links, confirmations (`confirm-dialog.js`); developer galleries (typography, fields, etc.)
- SVG favicon (logo brick): black in light mode, white in dark mode
- Home: autofocus in search when the bar is visible

### ✏️ Changed

- Unified hash routes (`#/`, `#/new-card`, `#/edit-card/:id`, `#/themes`, `#/settings`, `#/page/:slug`); overlay → overlay swap; close (X / Escape / backdrop) = home
- Developer space: `#/developer` route (was `#/test`) as an overlay modal; Settings: “Options pour les développeurs” (localhost)
- Type: **Open Sans** for UI, **Inter** for cards
- Settings: Interface / Card appearance / Collection management sections
- Responsive header: **Nouvelle carte** icon-only, brand reduced to the icon
- Print menu: summary inset, DS buttons (start, clear, add from selection)
- Delete a card: modal (`modal--sm`) instead of native `confirm()`

### 🔧 Fixed

- SVG favicon: invalid XML (the icon did not show)
- Remix icons: official path and 24×24 size
- Firefox “Layout was forced before the page was fully loaded” warning
- Card: badges right-aligned even without a reference
- Developer space: Back / Forward follow the galleries
- Search sort: listeners correctly removed when leaving the list

### 🗑️ Removed

- Native `confirm()` (reset, import, delete card / themes)
- Old `#/list`, `#/new`, `#/edit/:id` routes; `#/test…` redirects → `#/developer…`
- One-shot CSS classes for modals, tiles, and settings

## [0.4] — 2026-08-12

### ➕ Added

- Header: Print menu (icon + count, summary inset / select all / deselect / print)
- Settings → Display: max cards per row (2–10 or ∞)
- Design system: buttons, fields, selects, colors, sliders, search bar; `#/test` styleguide
- List: full width; inverted text selection (black background / white text)

### ✏️ Changed

- LEGO themes: managed in an overlay modal (like Settings)
- UI: white background (dark in dark mode), unified buttons (`primary` / `secondary` / `ghost` / `danger`, icon-only, `sm`)
- UI icons: [Remix Icon](https://remixicon.com/) via `src/js/icons.js`
- List: edit only by clicking the card; fixed horizontal gap between cards

### 🔧 Fixed

- Local reset: new IndexedDB (`db-gen`) instead of a stuck `deleteDatabase`
- Boot: no more broken import that prevented the app from starting
- List: print selection kept after the editor and persisted in localStorage
- Header: logo / brand no longer stretches full width
- Empty home: welcome page shown immediately after a reset
- Custom select: no more “ghost” highlight after reset

### 🗑️ Removed

- Dead CSS: `list-toolbar`, `search` styles outside `form-control`, `btn-icon` (replaced by `icon-only`)

## [0.3] — 2026-08-10

### ➕ Added

- Card title: line breaks with Enter (textarea; 3 lines max on display)
- Editor: “Télécharger la photo” button
- List: print quantity per model (− / count / +)
- List: count + sort in the search field (date, reference, title, year, pieces, figurines); sort direction togglable

### ✏️ Changed

- Print back: 0.5 mm rectangular bleed (card color, corners without white)
- List: checkbox replaced by a print-quantity stepper
- UI: “Brickcard(s)” labels → “carte(s)” (Brickcard logo / brand unchanged)
- UI: red accent replaced by black / near-black (light) or light (dark)

### 🔧 Fixed

- Print: photo crop (zoom / pan) applied correctly (off-screen layout before measure)
- Print: no more toast / UI over the cards (sheets only)
- Dark mode: readable text / icons on light-background buttons (primary, Browse, etc.)

## [0.2] — 2026-08-09

### ➕ Added

- Settings → Card design: face border size (0–10 mm, 0.5 step, default 3 mm)
- Settings → Card design: face + back corner radius (0–8 mm, 0.5 step, default 1.5 mm)
- Settings → Card design: default color (theme → config → `#6e6e6e` gray cascade)
- Card field `imageBackgroundColor` (background behind transparent images, default `#ffffff`)
- Card field `figurineCount` (figurine count, optional)
- All card fields are optional (blank card allowed)

### ✏️ Changed

- Face: theme-color border; reference on top, title at the bottom; Brickcard logo hidden as soon as a photo is present; no more theme logo on the face
- Back: theme logo (or name) between Brickcard branding and the bottom; no more black border or yellow pinstripe
- Blank face / back: accent-color fill, Brickcard logo + “Brickcard” label centered
- Editor: photo zoom from 25% to 400% (100% = “cover” crop)
- Theme on the card: logo **or** name (XOR); accent with no automatic detection from the logo (default gray `#6e6e6e`)
- Card field `legoThemeId` renamed `brickcardThemeId` (IndexedDB v2 migration + backward-compatible JSON import)
- Card fields `setTitle` → `title`, `setImageDataUrl` → `imageDataUrl`; theme field `accentColor` → `color`
- Card type: Inter font (Google Fonts)

### 🔧 Fixed

- Preset theme color / logo: no longer overwritten on local refresh (seed only adds missing themes)

### 🗑️ Removed

- Brickcard description field (editor, face render, search) — still accepted on JSON import

## [0.1] — 2026-08-05

### ➕ Added

- First public Brickcard release
- Poker-size face / back cards, A4 3×3 print
- Built-in LEGO themes + custom themes
- IndexedDB persistence, JSON export / import
- SemVer version number in the header and About
