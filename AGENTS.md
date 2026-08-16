# AGENTS.md — Brickcard Generator

Guide pour les agents IA (Cursor, Copilot, etc.) qui travaillent sur ce dépôt.

## Qu’est-ce que c’est ?

**Brickcard Generator** — SPA **statique** (pas de framework, pas de bundler) pour générer des *Brickcards* : cartes « poker » (63×88 mm) décrivant des sets LEGO. Objectif utilisateur : cartons plastifiés dans des pochettes avec les sets sans boîte.

Stack : HTML + CSS + JS modules ES (`type="module"`). UI en **français**.

Nom produit : **Brickcard Generator** (marque courte UI : **Brickcard**).

## Où est le code ?

Tout le code applicatif est dans **`src/`**.

| Fichier | Rôle |
|---------|------|
| `src/index.html` | Coquille : topbar sticky, `#main`, `#modal-root`, `#print-root` |
| `src/manifest.webmanifest` | Manifest PWA (nom, icônes, `standalone`) |
| `src/sw.js` | Service worker (cache same-origin ; `CACHE` = `APP_VERSION`) |
| `src/data/themes-presets.json` | Liste des thèmes LEGO par défaut (éditable sans toucher au JS) |
| `src/data/page-{{slug}}.md` | Pages Markdown en modale (`#/page/:slug`, ex. `page-about.md`) ; `# Titre` → titre du dialog |
| `src/img/logo-brickcard-generator.svg` | Logo app noir (brick outline — crédit Joko Sutrisno / Vecteezy) |
| `src/img/logo-brickcard-generator-white.svg` | Même logo, fill blanc (cartes / thèmes à fond coloré) |
| `src/img/favicon-brickcard-generator.svg` | Favicon SVG (clair `#141414` / sombre blanc via `prefers-color-scheme`) |
| `src/img/favicon.ico` / `favicon-96x96.png` | Favicon raster (onglet) |
| `src/img/apple-touch-icon.png` | Icône iOS 180×180 |
| `src/img/web-app-manifest-192x192.png` / `512x512.png` | Icônes PWA (any + maskable) |
| `src/fonts/` | Open Sans + Inter (woff2 variable, latin-ext) + licences SIL OFL |
| `src/js/app.js` | Hash routing (vues + historique), import/export |
| `src/js/markdown.js` | Parser Markdown léger + `loadMarkdownPage(slug)` |
| `src/js/theme.js` | Thème **UI** system / light / dark |
| `src/js/card-design.js` | Design cartes (bordure face, CSS vars) — localStorage |
| `src/js/list-layout.js` | Densité liste (cartes/ligne max) — localStorage |
| `src/js/themes-data.js` | Charge le JSON des thèmes par défaut, `logoSrc`, accent par défaut |
| `src/js/storage.js` | IndexedDB cartes + thèmes **personnalisés**, export/import JSON |
| `src/js/card-export.js` | Téléchargement de la photo d’une Brickcard |
| `src/js/print.js` | Impression A4 (grille variable, faces/dos, miroir) |
| `src/js/print-menu.js` | Menu header impression (sélection, badge, lancer) |
| `src/js/print-qty.js` | Quantités d’impression — localStorage |
| `src/js/print-settings.js` | Réglages d’impression (grille, côtés, recto-verso) — localStorage |
| `src/js/print-dialog.js` | Modale paramètres d’impression (sans route) |
| `src/js/version.js` | Version SemVer (`APP_VERSION`) — source unique |
| `src/js/icons.js` | Icônes UI ([Remix Icon](https://remixicon.com/)) — paths + helpers |
| `src/js/link.js` | Markup liens (`a.link` / externe / icône) |
| `src/js/tile.js` | Markup tuiles (`ul.tile-list` / `a.tile`) |
| `src/js/empty-view.js` | Markup états vides / chargement (`section.empty-view`, brique CSS) |
| `src/js/confirm-dialog.js` | Dialogues `modal--sm` (`openConfirmDialog` / `confirmDialog` / `alertDialog`) — pas de `alert()` / `confirm()` / `prompt()` |
| `src/js/form-color.js` | Champ couleur (`form-color` / pastille / clear) |
| `src/js/form-select.js` | Surcouche select (`form-select` / liste custom) |
| `src/js/views/list.js` | Grille d’aperçus + recherche (barre topbar) |
| `src/js/views/editor.js` | Éditeur de carte |
| `src/js/views/themes.js` | Modale gestion thèmes (mini-cartes, recherche) |
| `src/js/views/theme-editor.js` | Modale création / édition d’un thème personnalisé |
| `src/js/views/page.js` | Modale page Markdown |
| `src/js/views/settings.js` | Modale paramètres (interface, cartes, impression, collection) |
| `src/js/views/developer/` | Espace développeur / styleguide UI en modale (`#/developer`, `#/developer/typography`, …) |
| `CHANGELOG.md` | Historique des versions (Keep a Changelog) |

## Modèle carte (`Card`)

Noms volontaires verbeux (lisibles sans doc) :

```js
{
  id: string,
  legoSetRef: string,       // ex. "6140/6109"
  title: string,            // titre de la Brickcard (`\n` = saut de ligne)
  brickcardThemeId: string, // id du thème Brickcard
  pieceCount: number|null,
  figurineCount: number|null, // nombre de figurines, optionnel
  releaseYear: number|null, // année de sortie, optionnel
  imageDataUrl: string,     // photo data URL (JPEG/PNG) — optionnel
  imageBackgroundColor: string, // fond zone image (hex) ; vide = blanc à l’affichage
  imageZoom: number,        // cadrage photo, 1 = cover (100 %) ; < 1 = dézoom
  imageOffsetX: number,     // cadrage photo (fraction largeur)
  imageOffsetY: number,     // cadrage photo (fraction hauteur)
  createdAt: string,
  updatedAt: string
}
```

Migration auto depuis les anciens noms (`setTitle` → `title`, `setImageDataUrl` → `imageDataUrl`, `legoThemeId` → `brickcardThemeId`, ainsi que `ref`, `image`, `zoom`, …).

## Thèmes par défaut (`src/data/themes-presets.json`)

Éditer ce fichier pour ajouter / modifier les thèmes par défaut (pas besoin de toucher au JS).

Champs par entrée :
- `id` (obligatoire), `themeName` (obligatoire)
- `color` (hex, optionnel) — si omis → pas de couleur propre ; la carte utilise la couleur configurée puis le gris `#6e6e6e`
- `logoSrc` (optionnel) — chemin depuis `src/` (ex. `img/logo-theme-….png`) ; sans logo / échec de chargement → affichage du **nom** du thème (pas de SVG généré)

Thèmes par défaut : **lecture seule** (ni modification ni suppression). Les thèmes personnalisés ont un id UUID (`createId()`), sont stockés en IndexedDB, et s’éditent via `#/themes/new` / `#/themes/edit/:id`.

## Modèle thème LEGO (`LegoTheme`)

```js
{
  id: string,               // par défaut = slug JSON ; personnalisé = UUID (`createId()`)
  themeName: string,        // ex. "CITY"
  color: string,            // hex ; vide = pas de couleur propre (cascade carte)
  logoDataUrl: string,      // SVG ou PNG transparent (data URL ou chemin), optionnel
  isBuiltin: boolean,       // par défaut = lecture seule, non supprimable
  createdAt: string,        // ISO (personnalisés) ; vide pour les thèmes par défaut
  updatedAt: string         // ISO (personnalisés) ; vide pour les thèmes par défaut
}
```

Ne pas confondre avec le thème **UI** (`theme.js` : clair/sombre).

Accent d’une Brickcard (`resolveCardAccent`) :
1. `theme.color` si hex valide
2. sinon couleur configurée (`card-design.js`)
3. sinon gris d’usine `DEFAULT_THEME_COLOR` (`#6e6e6e`)

## Persistance

- IndexedDB : `brickcard-generator` **v2** — stores `cards` + `themes` (**personnalisés seulement** ; les thèmes par défaut se lisent dans `themes-presets.json`) (après Reset local : nom `brickcard-generator-<db-gen>`, clé `brickcard-generator:db-gen`)
- Clé thème UI : `brickcard-generator:ui-theme`
- Clé bordure face : `brickcard-generator:card-face-border-mm` (défaut `3`)
- Clé arrondi coins : `brickcard-generator:card-radius-mm` (défaut `1.5`, face + dos)
- Clé couleur carte par défaut : `brickcard-generator:card-default-color` (vide = gris d’usine `#6e6e6e`)
- Clé sélection impression : `brickcard-generator:print-qty` (`{ [cardId]: qty }`)
- Clé réglages impression : `brickcard-generator:print-settings` (`{ printGrid: 1–10, cardSidesToPrint: "faceAndBack"|"faceOnly"|"backOnly", sheetRectoVerso: "alternate"|"grouped" }`, défaut `3` / `faceAndBack` / `alternate`)
- Clés tri liste : `brickcard-generator:list-sort`, `brickcard-generator:list-sort-dir`
- Clés tri thèmes : `brickcard-generator:themes-sort`, `brickcard-generator:themes-sort-dir` (défaut `cardCount` / `desc`)
- Clé colonnes liste max : `brickcard-generator:list-cols-max` (défaut `4`, plage 2–10, ou `infinite`)
- Cascade accent carte : couleur du thème → couleur configurée → `#6e6e6e`
- Export JSON **v3** : `{ version: 3, app: "brickcard-generator", cards, themes }` — `themes` = personnalisés uniquement — fichier `brickcard-export-YYYY-MM-DD.json`
- Import : ignore les thèmes par défaut (ids de preset / `isBuiltin`) ; ne réécrit pas le JSON
- APIs async ; serveur HTTP obligatoire en local
- Au démarrage, `boot()` attend `loadCards()` + `loadThemes()` avant `route()` (écran « Chargement... » dans `#main`, animation CSS tant que `aria-busy`)
- Au démarrage, purge éventuelle de l’ancienne base `lego-set-cards` (plus utilisée)

## Vues

Hash = source de vérité (Précédent / Suivant). Croix / Échap / backdrop d’un overlay → `#/` (`replace`). Hash inconnu → `#/`. Pas d’alias.

Overlays de route (une à la fois, **swap** sans démonter la liste) : `#/settings`, `#/themes`, `#/themes/new`, `#/themes/edit/:id`, `#/page/:slug`, `#/new-card`, `#/edit-card/:id`, `#/developer/…`. Dialogues enfants (confirmations, paramètres d’impression) : pas d’URL, second backdrop par-dessus la vue courante.

- `#/` accueil (empty « Bienvenue », liste, ou recherche sans résultat « Oups ! »)
- `#/new-card` `#/edit-card/:id` éditeur de carte (modale)
- `#/themes` gestion des thèmes (modale) ; `#/themes/new` `#/themes/edit/:id` éditeur de thème **personnalisé** (modale ; fermeture → `#/themes`)
- `#/settings` paramètres (modale)
- `#/page/:slug` page Markdown (`data/page-{{slug}}.md`, ex. `#/page/about`)
- `#/developer` `#/developer/typography` `#/developer/links` `#/developer/tiles` `#/developer/buttons` `#/developer/fields` `#/developer/selects` `#/developer/sliders` `#/developer/colors` `#/developer/search` `#/developer/modals` — espace développeur / styleguide en **modale** (extensible : `#/developer/…`) ; lien Paramètres en local uniquement

## Boutons (design system)

Vocabulaire UI → classes CSS :

| Axe | Options |
|-----|---------|
| Variante | `btn primary` (défaut) · `secondary` · `ghost` · `danger` |
| Contenu | texte seul · texte + icône (`svg` + `span`) · `icon-only` |
| Disposition (texte+icône) | icône à gauche (défaut) · `icon-right` |
| Taille | (défaut) · `sm` |
| Badge | `span.btn-badge` (overlay, `aria-hidden`) |
| État | (actif) · `disabled` |

Icône seule : label dans `span.visually-hidden`, SVG en `aria-hidden="true"`.
Badge : compteur en overlay (coin haut-droit) ; le bouton reste dans son type (y compris `icon-only`). Nom accessible sur le bouton, pas sur le badge.
Hover et `:focus-visible` partagent le même style (pas d’outline dédié sur les boutons).
Ghost : texte = secondary ; hover/focus = primary au repos (fond accent / texte contraste).
Ne pas créer de classes one-shot — réutiliser ce vocabulaire. Galerie : `#/developer/buttons`.

## Liens (design system)

Vocabulaire UI → classes CSS :

| Axe | Options |
|-----|---------|
| Classe | `link` |
| Contenu | texte seul · texte + icône (`svg` + `span`) |
| Disposition (texte+icône) | icône à gauche (défaut) · `icon-right` |
| Taille | (défaut) · `sm` |
| État | (actif) · `disabled` / `aria-disabled` |
| `href` | adresse |
| `target` | `_blank` par défaut si externe (`https://`) |

Couleur = texte (`--ink` ; header inversé : `inherit`). Toujours souligné. `:visited` = même couleur (pas de violet navigateur).
Disabled : plus d’underline, couleur `--muted`, `tabindex="-1"`, non cliquable.
Externe : `rel="noopener noreferrer"` + icône Remix `ri-external-link-fill` à droite par défaut.
Helper : `linkMarkup()` dans `link.js`. Markdown (`[texte](url)`) émet déjà `class="link"`.
Dans une modale, tout lien de contenu passe par `linkMarkup()` / `a.link` (pas d’`<a>` nu).
Ne pas styler `.topbar-brand` ni `.tile` avec `link`. Galerie : `#/developer/links`.

## Tuiles (design system)

Vocabulaire UI → classes CSS :

| Axe | Options |
|-----|---------|
| Liste | `ul.tile-list` |
| Tuile | `a.tile` (lien) · `button.tile` (action) |
| Titre | `strong.tile-title` (optionnel) |
| Description | `span.tile-desc` (optionnel) |
| Icône | Remix à gauche, centrée verticalement (optionnel) |
| Variante | (défaut) · `danger` |
| État | (actif) · `disabled` / `aria-disabled` |
| `href` | adresse (liens) |
| `tag` | `a` (défaut) · `button` |

Encadrement 1&nbsp;px (`--line`) ; trait bas inset 2&nbsp;px `var(--ink-soft)` (comme les champs, pas de biseau). Hover et `:focus-visible` : inversion (fond `--ink` / texte `--panel`), trait bas masqué, pas d’outline dédié.
`danger` : texte et trait `--danger-line` ; hover / focus fond `--danger-bg`, cadre et trait bas `--danger-line` (comme `btn danger`).
Disabled : couleur `--muted`, `tabindex="-1"`, non cliquable.
Titre = apparence (`strong`), pas un heading.
Helper : `tileMarkup()` / `tileListMarkup()` dans `tile.js`. Appliqué : index espace développeur, paramètres (collection / styleguide), état vide. Galerie : `#/developer/tiles`.

## Champs de saisie (design system)

Ordre standard d’un champ (sauf exception documentée)&nbsp;:

1. **Label** — `form-label` (+ `form-label--required` si besoin)
2. **Hint / description** — `form-hint` (optionnel, toujours au-dessus du contrôle)
3. **Contrôle** — `form-control` (text / number / textarea) ou groupe de saisie (couleur, photo…)
4. **Erreur / validation** — `form-error` (sous le contrôle, seulement si affiché)

Vocabulaire :

| Axe | Options |
|-----|---------|
| Bloc | `form-field` |
| Label | `form-label` (+ `form-label--required`) |
| Aide | `form-hint` |
| Contrôle | `form-control` (text / number / textarea) |
| Icône | optionnelle — `form-control-wrap` + `form-control-icon` (Remix, décoratif) |
| Erreur | `form-error` + `is-invalid` / `aria-invalid` sur le contrôle |
| Taille | (défaut) · `sm` |

Hover : **aucun**. Repos = trait bas inset 2px ; focus = `outline` 2px + `outline-offset` 1px (`ink`, inchangé en erreur). Couleur erreur : `--form-error` (`#ce0000` clair / `#ff5555` dark). Galerie : `#/developer/fields`.

Exceptions actuelles : alertes form-wide (`#error`, `#theme-error`) sous le bloc de champs ; impression (Recto-verso) : `form-hint` sous les boutons, texte selon le choix.

## Listes déroulantes (design system — styleguide)

Markup&nbsp;: `select.form-control` (même look qu’un champ texte). Surcouche unobtrusive&nbsp;: `enhanceFormSelects()` / `enhanceFormSelect()` dans `form-select.js` — déclencheur stylé + liste custom (optgroup, clavier, états). Option placeholder (`value=""`) exclue de la liste ; reset `ri-close-circle-fill` (non focusable) pour y revenir. Icônes d’option&nbsp;: `data-icon-left` / `data-icon-right` (clés Remix de `icons.js`, ex. `printer`, `arrow-right`). Le `<select>` natif reste synchronisé. Appliqué : éditeur (thème, groupes **Thèmes personnalisés** / **Thèmes par défaut** si personnalisés). Galerie&nbsp;: `#/developer/selects`.

## Curseurs / range (design system)

Même ordre de champ. Contrôle&nbsp;: `form-range-row` (`input[type=range]` + `output` optionnel). Poignée carrée sans bordure ; focus sur la poignée seule ; erreur = message seulement (pas de teinte rouge sur le curseur). Appliqué : paramètres (colonnes, bordure, coins, grille d’impression) · éditeur (zoom) · impression (grille). Galerie&nbsp;: `#/developer/sliders`.

## Couleurs (design system)

Même ordre de champ. Contrôle&nbsp;: `input.form-control` texte dans un wrapper `form-color`, avec pastille à gauche (`input[type=color]`) et bouton effacer (`ri-close-circle-fill`) en overlay à l’intérieur du champ. Clear visible seulement s’il y a une valeur (peut être omis / disabled) ; non focusable (`tabindex="-1"`). Pastille&nbsp;: uniquement si hex valide ; sinon couleur par défaut du champ (`fallback` / `fallbackColor`), sinon damier transparent. Module&nbsp;: `form-color.js`. Appliqué : paramètres · éditeur (fond image) · thèmes. Galerie&nbsp;: `#/developer/colors`.

## Recherche (design system)

Barre centrale (liste)&nbsp;: bloc `search-bar` dans le slot `topbar-search`.

| Axe | Options |
|-----|---------|
| Bloc | `search-bar` (+ `search-bar--input-only` si pas de trail) |
| Icône | optionnelle — `form-control-icon` (défaut recherche : `ri-search-line`) |
| Contrôle | `input.form-control` `type="search"` (même look qu’un champ texte) |
| Trail | `search-bar-trail` (absolute, droite) — visible seulement si ≥ 2 éléments (`[hidden]` sinon) |
| Compteur | `search-count` (vide → masqué) |
| Tri | `search-sort` + `btn ghost sm icon-only` (`ri-filter-3-fill`) + menu `search-sort-menu form-select-list` (enfant de `search-bar`, sans bordure haute, aligné cadre focus) / options `form-select-option` ; icône droite `ri-sort-asc` / `ri-sort-desc` sur l’option active |

Ouverture du menu de tri&nbsp;: **clic** uniquement (pas au hover ni au seul focus) ; une fois le bouton focusé, clavier comme `form-select` (↑↓ Entrée/Espace Home/End Échap, `aria-activedescendant`). Le menu **reste ouvert** après un choix de critère ou l’inversion du sens (fermeture : clic extérieur, Échap, ou reclic sur le bouton).

Appliqué : topbar liste · modale thèmes (compteur + tri : nombre de cartes, titre, date de modification si ≥ 2 thèmes personnalisés — thèmes par défaut non concernés ; défaut nombre de cartes décroissant). Galerie&nbsp;: `#/developer/search`.

## Titres (design system)

Classe = apparence. Tag = plan du document. **Un rang 1 par vue** (page ou dialog). Ne pas sauter de rang.

| Rôle visuel | Classe | Taille |
|-------------|--------|--------|
| Titre de vue / dialog | `view-title` | 1.7rem (1.35rem dans `.modal-header`) · 700 |
| Section | `section-title` | 1.25rem · 700 |
| Description | `view-desc` | 0.95rem · ink-soft — **pas** un heading ; **court** (une ligne). Pas dans le header de modale. Détail → paragraphe dans le corps |

| Contexte | Titre | Suite |
|----------|-------|-------|
| Page (`#main`) | `h1.view-title` | `h2.section-title` |
| Liste | `h1.visually-hidden` « Cartes » | — |
| État vide (accueil, chargement) | `h1.view-title` | brique CSS ; texte / tuiles optionnels |
| État vide (recherche liste / thèmes) | `p.view-title` | `h1` déjà sur la vue / dialog |
| Dialog | `h1.view-title` (`aria-labelledby`) — titre **court** ; confirmations : un peu plus long, avec le sujet | `h2.section-title` |
| Page Markdown en modale | `# Titre` → titre du dialog (retiré du corps) | `##` → `h2`, `###` → `h3` dans `.md-content` |

Pas des headings&nbsp;: marque topbar, `form-label`, noms de cartes (grille thèmes, Brickcard). Galerie&nbsp;: `#/developer/typography`.

États vides (`section.empty-view` / `.empty-view-body`, helper `emptyViewMarkup` dans `empty-view.js`)&nbsp;: titre + texte + tuiles centrés dans `#main` ou le `modal-body` ; brique CSS collée au-dessus (hors flux). Accueil sans carte&nbsp;: «&nbsp;Bienvenue&nbsp;» + tuiles Nouvelle carte / Importer une sauvegarde. Recherche sans résultat (cartes ou thèmes)&nbsp;: «&nbsp;Oups&nbsp;!&nbsp;». Premier affichage&nbsp;: «&nbsp;Chargement...&nbsp;» jusqu’à cartes + thèmes prêts.

## Modales (design system)

Coquille&nbsp;: `modal-backdrop` + `modal` (`role="dialog"` / `aria-modal`). Bordure&nbsp;: `2px solid var(--ink)` (comme le focus des champs). Alignement vertical (sur le backdrop)&nbsp;: `modal-backdrop--top` · `modal-backdrop--middle` (**défaut**) · `modal-backdrop--bottom`. Header inversé (fond `ink` / texte `panel`)&nbsp;: titre (`h1.view-title`, court) + `btn primary icon-only modal-close` (même variante DS, tokens inversés comme le menu impression&nbsp;: repos fond `--bg` / hover fond `--ink` + bordure `--bg`). Bouton fermer centré verticalement, même inset haut / droite / bas. Corps&nbsp;: `modal-body`. Pied optionnel&nbsp;: `modal-footer` avec `modal-footer-start` (gauche&nbsp;: sauvegarde / validation) et `modal-footer-end` (droite&nbsp;: danger) — boutons centrés verticalement (normal / `sm`). Séparateur header&nbsp;: `2px solid var(--ink)` (pas de bordure haute sur le footer).

Tailles (3)&nbsp;: `modal--sm` (~640) · `modal--md` (~896, **défaut**) · `modal--lg` (~1152). Toujours bornées au **viewport** (`100vw` / `100dvh`). Responsive ≤&nbsp;640px&nbsp;: **plein écran**, overlay masqué.

Appliqué&nbsp;: paramètres / page MD (`md`) · thèmes + éditeur carte + espace développeur (`lg` ; thèmes : hauteur toujours `var(--modal-max-h)`, le corps défile) · éditeur de thème personnalisé / confirmations / paramètres d’impression (`sm`). Galerie&nbsp;: `#/developer/modals`. Dialogues enfants (supprimer carte / thème, reset local, import, impression) : second `modal-backdrop` dans le même host, sans route — helper `confirmDialog()` / `openConfirmDialog()` (`confirm-dialog.js`) ou `openPrintDialog()` (`print-dialog.js`) ; titre un peu plus long et explicite (ex. `Supprimer la carte "Saucer Centurien" (#6939) ?`). Pas de `alert()` / `confirm()` / `prompt()` natifs.

## Impression

A4 portrait ; **grille** 1×1 à 10×10 (défaut **3×3** poker 63×88 mm). Autres tailles : échelle pour remplir la largeur (agrandir à 1–2, réduire à 4–10) ; cartes entières seulement. Côtés des cartes : face+dos (défaut) / face / dos. Recto-verso des feuilles A4 : alterner (défaut) ou regrouper (tous les rectos, puis tous les versos). Miroir horizontal au dos (flip bord long). Les mêmes réglages sont dans Paramètres (`#/settings`, section Impression) et dans la modale au clic « Lancer l’impression » (`print-dialog.js`, reste ouverte pendant l’impression). Pendant `window.print()`, `document.title` = nom proposé du PDF (`brickcard-YYYY-MM-DD-grille-NxN-…`, sans `.pdf`). Dos : label **Brickcard**.

## Conventions

- Garder le nom produit **Brickcard Generator** / marque **Brickcard** dans l’UI et la doc.
- Garder les noms de champs **verbeux** sur les modèles Card / LegoTheme.
- UI française, design minimaliste (pas d’arrondis/ombres UI).
- **Typo** : Open Sans pour l’UI (`--font-ui`) ; Inter pour le texte des cartes (`--font-card`) — fichiers dans `src/fonts/`, pas de CDN. Titres : classe = look, tag = plan (voir **Titres**).
- **Icônes** : toujours partir de [Remix Icon](https://remixicon.com/) (style *fill* de préférence) avant d’inventer un SVG. Réutiliser / étendre `src/js/icons.js` ; en HTML, commenter le nom `ri-*`.
- Pas de `alert()` / `confirm()` / `prompt()` natifs : `confirmDialog()` / `openConfirmDialog()` / `alertDialog()` (`confirm-dialog.js`).
- Pas de dépendances npm sauf demande explicite.
- **Version** : n’incrémenter `APP_VERSION` (ni le `?v=` de cache, ni `CACHE` dans `sw.js`, ni une entrée datée dans `CHANGELOG.md`) **que sur demande explicite**. Entre deux versions, noter les changements sous `## [Unreleased]`.
