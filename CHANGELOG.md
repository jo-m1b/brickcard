# Changelog

Notable changes to the Brickcard app.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### ✏️ Changed

- Settings: **Télémétrie** checkbox hidden locally (the script is not loaded there)
- About (`#page/about`): title is **À propos** only (no logo / version); body follows the French README (no badges, screenshots, or getting-started)
- Header: brand name and version stay visible on small screens (ellipsis if the bar is extremely narrow)

### 🔧 Fixed

- Telemetry: page views send the full payload (no more 400 / CORS error on the collector)

## [0.8.5] — 2026-08-27

### ➕ Added

- Home: **Réessayer** button under the load-error message (cache-bust refresh `?r=`; `#developer/loading` gallery)
- Settings: **Télémétrie** checkbox (checked by default) to send anonymous usage telemetry

### ✏️ Changed

- JS loading: route overlays and `#developer/…` galleries `import()` on open (boot = list + storage + chrome)
- Notifications: in-app toasts only (no HTML5 Notification / browser permission)

## [0.8.4] — 2026-08-25

### ➕ Added

- Print: **Tracé de découpe** setting (Sur la face avant / Sur le dos (arrière) checkboxes, face on by default) in `#settings` and `#print`; the 1 px `#000000` hairline appears only on checked sides
- Print: **Fond perdu** setting (Sur la face avant / Sur le dos (arrière) checkboxes, back on by default) in `#settings` and `#print`; 2 mm on all four sides, including the face; disabled and ignored if cut marks are on for the same side
- Cards (face, back) and theme tiles: 2 px `--ink` hairline on screen so the edge reads on light or dark UI

### 🔧 Fixed

- Print PDF: filename stays `brickcard-…` even with many cards (Firefox: `afterprint` fires too early on the clone; no more `127.0.0.1.pdf` fallback)
- Print: Brickcard logo (back / faceless photo) stays sharp (inline SVG instead of a CSS mask rasterized at print)

### ✏️ Changed

- Cache-bust `app.js` and `version.js` via an import map in `index.html` (no more `?v=` on JS imports)
- Print back: 2 mm bleed on all four sides (no more 1 mm L/R)
- Print: 5 mm horizontal card gap (same as vertical; no more bleed overlap)
- Demo backup: last PNG photo converted to WebP (~4.6 MB → ~2.9 MB)
- Settings: **Interface** section renamed **Application**
- Empty home: **Démonstration chargée** toast (instead of **Démonstration importée**)
- Print (`#print`): fronts-then-backs detail separator is a midpoint `·` (same as backup recap)
- Print: **Tracé de découpe** hint “Imprimer un tracé technique pour faciliter la découpe des cartes”; **Sur la face avant** / **Sur le dos (arrière)** checkboxes
- Print: **Ordre d’impression des cartes**, **Côté d’impression** (Les deux faces / Face uniquement / Dos uniquement), **Assemblage des feuilles**
- Print: `brickcard:print-settings` keys aligned with the UI (`cardPrintOrder`, `printSide`/`both`, `sheetAssembly`); no migration of old keys

## [0.8.3] — 2026-08-25

### ➕ Added

- Print: **Tri des cartes** setting (reference by default, always ascending) in `#settings` and `#print`; the printed document follows that choice
- Developer home (`#developer`) and settings (`#settings`): search bar (`search-bar--input-only`); filter sections / tiles / `href` (settings: also labels and hints); accent-insensitive; **Oups !** when nothing matches
- Themes (`#themes`): **Supprimer tous les thèmes personnalisés** button (when more than 2 custom themes); confirmation; kept cards lose their theme association

### ✏️ Changed

- Search (cards, themes, default themes, settings, developer home): accent-insensitive (`Sel` finds “Sélecteur”)
- Default themes: catalog cut from 119 to 65 (SVG / WebP, Aquazone as PNG); added Botanicals, Braille Bricks, BrickHeadz, Creator 3in1, DC, Marvel, Nike; `the-lord-of-the-rings` → `lord-of-the-rings`; logos and crops updated
- `form-hint`: no trailing period on a single sentence (several sentences: periods kept)
- Settings: **Gestion de votre collection** section; Import / Backup / Themes / Delete all cards tile descriptions reworded (“votre collection”)
- Settings → Interface: **Mode d’affichage** as radio buttons (Thème clair / Thème sombre / Système), vertical group
- Checkboxes / radios: in a group, the option list (vertical or horizontal) is indented under the legend
- Settings and `#print`: **Côtés des cartes à imprimer** as radios (horizontal); **Impression recto-verso des feuilles** as radios (vertical, hint under each option)
- List: after creating or editing a card, keyboard focus lands on that tile; closing an existing-card editor (Escape / close / Cancel): same focus, so keyboard navigation can resume
- Themes (`#themes` and `#developer/theme-presets`): same keyboard focus on the mini-card after create / edit, and when closing an existing-theme editor
- Developer `#developer/theme-presets`: general success and errors as toasts (load, **Réinitialiser**, **Sauvegarder themes-presets.json**, **Sauvegarder les logos**, save / delete in the editor); Name / Id validation still under the field
- Modals: Settings, developer space, and print settings unified as `modal--md`; `modal--lg` kept for themes (`#themes`, `#developer/theme-presets`) and card / theme editors

### 🔧 Fixed

- Settings (`#settings`) and developer home (`#developer`): modal height stays fixed while searching (no more yoyo as results change)

## [0.8.2] — 2026-08-24

### ➕ Added

- Notifications (Toast): normal / success / error types, stacking, manual dismiss, HTML5 system notification; `#developer/notifications` gallery
- Settings → Interface: **Optimiser les images** checkbox (checked by default); converts new rasters to WebP on load
- Print: Ctrl/Cmd+P shortcut opens `#print` (except card / theme / preset editors and `#import`); already open → starts printing

### ✏️ Changed

- Empty home: **Charger une démonstration** tile (“Importer une sauvegarde de la collection de cartes des briques de Jo”)
- Empty home: after **Charger une démonstration**, **Démonstration importée** toast (`ri-emotion-fill`); recap unchanged
- Settings → Interface: **Optimiser les images** hint (“Convertir automatiquement les nouvelles images ajoutées à la collection dans un format optimisé.”)
- List: after **editing** or **deleting** a card, the grid is no longer rebuilt (tile updated or removed, scroll / search / sort kept; search and print counts recalculated); after **creating**, search is cleared and sort is modification date (newest first)
- Themes (`#themes` and `#developer/theme-presets`): after **editing** or **deleting**, the grid is no longer rebuilt (mini-card updated or removed, scroll / search / sort kept); after **creating**, search is cleared, sort is date desc, scroll to top
- Delete confirmations (card / theme): French « » quotes like edit titles; card title + reference wrapped together
- Empty image field: “Charger une nouvelle image pour la prévisualiser et la recadrer.” (`form-hint` style)
- Action toasts (save, delete, import, backup, photo): success type; 7 s delay (15 s for collection import / backup); notifications stack instead of replacing each other
- Product toasts: specific titles and icons (theme, card, image, backup); backup/import recap aligned with modal footers; print-selection error
- GitHub Release: grouped notes no longer show the `feat:` / `fix:` / `docs:` / `chore:` prefix
- Card image: **Sauvegarder** downloads `brickcard-card-image-YYYY-MM-DD-…` (ref, title, both, or card id)
- Theme logo: **Sauvegarder** downloads `brickcard-theme-logo-YYYY-MM-DD-…` (name slug, or theme id)
- Image field: one pipeline (`compressImage`) for card photos and theme logos; JPEG / WebP / PNG kept (canvas resize past 2000 px on a side); everything else → PNG; logos: no more 400 px cap or systematic PNG conversion
- Demo backup (`data/backup-demo-jo.brickcard`): photos converted to WebP (~41 MB → ~4.6 MB)

### 🔧 Fixed

- Modal title with icon: text stays to the right of the icon (wraps if needed) instead of dropping below on small screens
- GitHub Release: the last commit between two tags is listed in the notes
- Image field: **Sauvegarder** a WebP downloads the file (no more opening in a new tab)

## [0.8.1] — 2026-08-24

### ➕ Added

- GitHub Releases: automatic publish (grouped notes + source zip/tar.gz) on each `vX.Y.Z` tag

### 🔧 Fixed

- Empty home: on a short viewport (e.g. phone landscape) the content scrolls; the brick and “Bienvenue” no longer sit under the header
- Print: default-theme logos (`data/theme-logo-…` files) are awaited before `window.print()` — no more backs with only the centered Brickcard logo if the image had not loaded yet

## [0.8.0] — 2026-08-23

### ➕ Added

- Backup import: `#import` modal (file or URL, in-memory validation, merge choices, live recap); writes only on **Importer**
- Demo backup: `data/backup-demo-jo.brickcard`; home tile **Charger la démonstration** (`ri-emotion-fill`) that imports it automatically (**Sauvegarde de démonstration** modal, no choice step)
- Themes (default and custom): optional secondary color (`secondaryColor`) for texts, badge icons, and the Brickcard logo; empty = automatic black or white
- Collection backup: `#backup` modal (full / custom, live recap, estimated size)
- Backup: Ctrl/Cmd+S shortcut opens `#backup` (except card / theme / preset editors and `#import`)
- Developer space: **Page de bienvenue** gallery (`#developer/welcome`, `ri-home-smile-fill`) — empty-collection home mock

### ✏️ Changed

- Import: no more Merge / Replace dialog; always a merge, configured in `#import` (Settings and empty home open the modal)
- Import: invalid-backup / incompatible-version errors reworded (“La sauvegarde chargée…”)
- Import URL: animated brick + “Chargement...” under the field during download / parse
- Images / logos: same loading indicator in “Charger depuis une URL”
- Theme editor: secondary color placeholder = auto black or white (follows the main color)
- Theme editor: “Couleur” labels / primary and secondary hints
- Auto card contrast (`contrastText`): black text / logo only on a truly pale background (no more black on saturated yellows, oranges, and limes)
- Card Brickcard logo (back, faceless photo, themeless theme tiles): CSS mask tinted with `--card-accent-fg` (no more `brickcard-logo.svg` / `brickcard-logo-white.svg` swap)
- Backup `#backup`: **Sauvegarder** closes the modal once the file is started; “Aucune carte à sauvegarder !” recap (bold) if the button is disabled
- SVG images (cards and logos): kept as vectors on load (file / URL) so they can be re-downloaded; scripts, `foreignObject`, and `on*` handlers stripped (including on import)
- Collection backup: `#backup` modal (full or custom) before download; file version = app version; `brickcard-backup-…` names; import of old `version` 1–3 files and appearance settings when present
- Document title: default tagline (no version); overlays `{modal} | {section if any} | {default}`; PDF filename unchanged during print
- Service worker: `service-worker.js` at the site root (scope `/`; GitHub Pages cannot host it in `js/`)

### 🔧 Fixed

- Service worker: install no longer fails if GitHub Pages precache fails (`cache.addAll`); the script is no longer intercepted or replaced by `index.html`

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
