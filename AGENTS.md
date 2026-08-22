# AGENTS.md — Brickcard

Guide pour les agents IA (Cursor, Copilot, etc.) qui travaillent sur ce dépôt.

## Qu’est-ce que c’est ?

**Brickcard** — SPA **statique** (pas de framework, pas de bundler) pour générer des *Brickcards* : cartes « poker » (63×88 mm) décrivant des sets LEGO. Objectif utilisateur : cartons plastifiés dans des pochettes avec les sets sans boîte.

Stack : HTML + CSS + JS modules ES (`type="module"`). UI en **français**.

Nom produit / marque UI : **Brickcard**.

## Où est le code ?

Tout le code applicatif est dans **`src/`**.

| Fichier | Rôle |
|---------|------|
| `src/index.html` | Coquille : topbar sticky, `#main`, `#modal-root`, `#print-root` |
| `src/manifest.webmanifest` | Manifest PWA (nom, icônes, `standalone`) |
| `src/sw.js` | Service worker (cache same-origin ; `CACHE` = `APP_VERSION`) |
| `src/data/themes-presets.json` | Liste des thèmes LEGO par défaut (éditable sans toucher au JS) |
| `src/data/theme-logo-*` | Logos des thèmes par défaut (PNG / SVG / WebP / JPEG) |
| `src/data/page-{{slug}}.md` | Pages Markdown en modale (`#page/:slug`, ex. `page-about.md`) ; `# Titre` → titre du dialog |
| `src/img/brickcard-logo.svg` | Logo app noir (brick outline — crédit Joko Sutrisno / Vecteezy) |
| `src/img/brickcard-logo-white.svg` | Même logo, fill blanc (cartes / thèmes à fond coloré) |
| `src/img/brickcard-favicon.svg` | Favicon SVG (clair `#141414` / sombre blanc via `prefers-color-scheme`) |
| `src/img/brickcard-favicon.ico` / `brickcard-favicon-96x96.png` | Favicon raster (onglet) |
| `src/img/brickcard-apple-touch-icon.png` | Icône iOS 180×180 |
| `src/img/brickcard-web-app-manifest-192x192.png` / `512x512.png` | Icônes PWA (any + maskable) |
| `src/fonts/` | Open Sans + Inter (woff2 variable, latin-ext) + licences SIL OFL |
| `src/js/app.js` | Hash routing (vues + historique), import/export |
| `src/js/modal-focus.js` | Focus initial + piège Tab des modales |
| `src/js/markdown.js` | Parser Markdown léger + `loadMarkdownPage(slug)` |
| `src/js/theme.js` | Thème **UI** system / light / dark |
| `src/js/card-design.js` | Design cartes (bordure face, arrondi coins / images, CSS vars) — localStorage |
| `src/js/list-layout.js` | Densité liste (cartes/ligne max) — localStorage |
| `src/js/themes-data.js` | Charge le JSON des thèmes par défaut, `logoSrc`, accent par défaut |
| `src/js/storage.js` | IndexedDB cartes + thèmes **personnalisés**, export/import `.brickcard` |
| `src/js/card-export.js` | Téléchargement (photo Brickcard, blob, URL same-origin) |
| `src/js/preset-draft.js` | Brouillon isolé des thèmes par défaut (outil `#developer/theme-presets`) |
| `src/js/print.js` | Impression A4 (grille variable, faces/dos, miroir) |
| `src/js/print-menu.js` | Menu header impression (sélection, badge, lancer) |
| `src/js/print-qty.js` | Quantités d’impression — localStorage |
| `src/js/print-settings.js` | Réglages d’impression (grille, côtés, recto-verso) — localStorage |
| `src/js/print-dialog.js` | Modale paramètres d’impression (`#print`) |
| `src/js/version.js` | Version SemVer (`APP_VERSION`), `APP_ID`, `APP_NAME` — source unique |
| `src/js/icons.js` | Icônes UI ([Remix Icon](https://remixicon.com/)) — paths + helpers (`remixIconByName`, `modalTitleMarkup`) |
| `src/js/link.js` | Markup liens (`a.link` / externe / icône) |
| `src/js/tile.js` | Markup tuiles (`ul.tile-list` / `a.tile`) |
| `src/js/empty-view.js` | Markup états vides / chargement (`section.empty-view`, brique CSS) |
| `src/js/confirm-dialog.js` | Dialogues `modal--sm` (`openConfirmDialog` / `confirmDialog` / `alertDialog`, `icon` optionnel) — pas de `alert()` / `confirm()` / `prompt()` |
| `src/js/developer-access.js` | Accès espace développeur (toujours en local ; hors local, flag `localStorage` après confirmation `#developer`) |
| `src/js/form-color.js` | Champ couleur (`form-color` / pastille / clear) |
| `src/js/form-image.js` | Champ image (`form-image` / fichier, URL, fond, cadrage) |
| `src/js/form-range.js` | Curseur (`form-range-row` / output / reset valeur par défaut) |
| `src/js/form-checkbox.js` | Case à cocher (`form-check` / hint / groupes / lecture seule) |
| `src/js/form-radio.js` | Bouton radio (`form-check form-radio` / hint / groupes / lecture seule) |
| `src/js/form-select.js` | Surcouche select (`form-select` / liste custom) |
| `src/js/views/list.js` | Grille d’aperçus + recherche (barre topbar) |
| `src/js/views/editor.js` | Éditeur de carte |
| `src/js/views/themes.js` | Modale gestion thèmes (mini-cartes, recherche) |
| `src/js/views/theme-editor.js` | Modale création / édition d’un thème personnalisé |
| `src/js/views/page.js` | Modale page Markdown |
| `src/js/views/settings.js` | Modale paramètres (interface, cartes, impression, collection) |
| `src/js/views/developer/` | Espace développeur / styleguide UI en modale (`#developer`, `#developer/typography`, …) ; outil thèmes par défaut `#developer/theme-presets` |
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
  imageZoom: number,        // cadrage photo, 1 = cover (100 %) ; < 1 = dézoom ; arrondi 2 décimales (`0.00` → 0)
  imageOffsetX: number,     // cadrage photo (fraction largeur) ; arrondi 2 décimales
  imageOffsetY: number,     // cadrage photo (fraction hauteur) ; arrondi 2 décimales
  updatedAt: string
}
```

Migration auto depuis les anciens noms (`setTitle` → `title`, `setImageDataUrl` → `imageDataUrl`, `legoThemeId` → `brickcardThemeId`, ainsi que `ref`, `image`, `zoom`, …). `createdAt` ignoré.

## Thèmes par défaut (`src/data/themes-presets.json`)

Éditer ce fichier pour ajouter / modifier les thèmes par défaut (pas besoin de toucher au JS).

Champs par entrée :
- `id` (obligatoire), `name` (obligatoire)
- `color` (hex, optionnel) — si omis → pas de couleur propre ; la carte utilise la couleur configurée puis le gris `#6e6e6e`
- `logoSrc` (optionnel) — chemin depuis `src/` (ex. `data/theme-logo-….png`) ; sans logo / échec de chargement → affichage du **nom** du thème (pas de SVG généré)
- `logoZoom` / `logoOffsetX` / `logoOffsetY` (optionnels) — cadrage du logo (1 / 0 / 0 si omis) ; mêmes unités que les thèmes personnalisés ; export outil : arrondi 2 décimales, `0.00` → omis (`logoZoom` de `1` aussi)

Thèmes par défaut : **lecture seule** dans l’app (ni modification ni suppression). Les thèmes personnalisés ont un id UUID (`createId()`), sont stockés en IndexedDB, et s’éditent via `#themes/new` / `#themes/edit/:id`.

Outil développeur `#developer/theme-presets` : copie locale isolée (IndexedDB `brickcard-preset-draft`) pour éditer id/slug, nom, couleur, logo et cadrage (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`), puis **sauvegarder** `themes-presets.json` + `theme-logo-{id}.{ext}` à placer soi-même dans `data/`. Ne lit/écrit jamais les stores `cards` / `themes` ni les réglages. Au premier chargement (ou après « Supprimer le brouillon ») : seed depuis le JSON. Reset local de la collection **ne** touche **pas** ce brouillon.

## Modèle thème LEGO (`LegoTheme`)

```js
{
  id: string,               // par défaut = slug JSON ; personnalisé = UUID (`createId()`)
  name: string,             // ex. "CITY"
  color: string,            // hex ; vide = pas de couleur propre (cascade carte)
  logoDataUrl: string,      // SVG ou PNG transparent (data URL ou chemin), optionnel
  logoZoom: number,         // largeur du logo, 1 = 75 % de la carte (max 2.5 = 250 %) ; arrondi 2 décimales ; le cadre (moitié basse, inset 3 mm) recadre si dépassement
  logoOffsetX: number,      // décalage logo (fraction largeur de la moitié basse) ; arrondi 2 décimales (`0.00` → 0)
  logoOffsetY: number,      // décalage logo (fraction hauteur de la moitié basse) ; arrondi 2 décimales
  isBuiltin: boolean,       // par défaut = lecture seule, non supprimable
  updatedAt: string         // ISO (personnalisés) ; vide pour les thèmes par défaut
}
```

Migration auto depuis l’ancien champ `themeName` → `name`. `createdAt` ignoré.

Ne pas confondre avec le thème **UI** (`theme.js` : clair/sombre).

Accent d’une Brickcard (`resolveCardAccent`) :
1. `theme.color` si hex valide
2. sinon couleur configurée (`card-design.js`)
3. sinon gris d’usine `DEFAULT_THEME_COLOR` (`#6e6e6e`)

## Persistance

- IndexedDB : `brickcard` **v2** — stores `cards` + `themes` (**personnalisés seulement** ; les thèmes par défaut se lisent dans `themes-presets.json`) (après Reset local : nom `brickcard-<db-gen>`, clé `brickcard:db-gen`) ; le reload post-reset passe par `?{timestamp}` (cache HTTP / SW), puis la query est retirée au boot (`?_=` encore reconnu)
- IndexedDB outil presets : `brickcard-preset-draft` — brouillon `#developer/theme-presets` uniquement (indépendant du Reset local)
- Clé thème UI : `brickcard:ui-theme`
- Clé bordure face : `brickcard:card-face-border-mm` (défaut `3`)
- Clé arrondi coins : `brickcard:card-radius-mm` (défaut `2`, face + dos)
- Clé arrondi images : `brickcard:card-image-radius-mm` (défaut `1`, cadre photo)
- Clé couleur carte par défaut : `brickcard:card-default-color` (vide = gris d’usine `#6e6e6e`)
- Clé sélection impression : `brickcard:print-qty` (`{ [cardId]: qty }`)
- Clé réglages impression : `brickcard:print-settings` (`{ printGrid: 1–10, cardSidesToPrint: "faceAndBack"|"faceOnly"|"backOnly", sheetRectoVerso: "alternate"|"grouped" }`, défaut `3` / `faceAndBack` / `alternate`)
- Clé espace développeur : `brickcard:developer-enabled` (`"1"` si activé hors local ; toujours considéré actif sur localhost / `127.0.0.1` / `[::1]`) ; Reset local la retire
- Clés tri liste : `brickcard:list-sort`, `brickcard:list-sort-dir` (défaut `updatedAt` / `desc`) ; après enregistrement d’une carte : recherche vidée et tri remis sur date de modification décroissante
- Clés tri thèmes : `brickcard:themes-sort`, `brickcard:themes-sort-dir` (défaut `cardCount` / `desc`) ; après enregistrement d’un thème : recherche vidée et tri remis sur date de modification décroissante (si ≥ 2 thèmes personnalisés ; sinon repli sur le défaut)
- Clé colonnes liste max : `brickcard:list-cols-max` (défaut `4`, plage 2–10, ou `infinite`)
- Cascade accent carte : couleur du thème → couleur configurée → `#6e6e6e`
- Export **v3** (fichier `.brickcard`, JSON) : `{ version: 3, app: "brickcard", cards, themes }` — `themes` = personnalisés uniquement — fichier `brickcard-export-YYYY-MM-DD.brickcard`
- Import : fichier `.brickcard` uniquement ; vérifie `app` / `version` / `cards` / `themes` (tableaux) ; `app` = `brickcard` (l’ancien `brickcard-generator` est encore accepté) ; refuse une `version` supérieure à celle de l’app ; ignore les thèmes par défaut (ids de preset / `isBuiltin`) ; ne réécrit pas `themes-presets.json`
- APIs async ; serveur HTTP obligatoire en local
- Au démarrage, `boot()` attend `loadCards()` + `loadThemes()` avant `route()` (écran « Chargement... » dans `#main`, animation CSS tant que `aria-busy`)
- Au démarrage, purge éventuelle des anciennes bases `lego-set-cards` et `brickcard-generator` (plus utilisées)

## Vues

Hash = source de vérité (Précédent / Suivant). Accueil = URL sans hash (jeton interne `#`). Overlays = `#settings`, `#new-card`, … Croix / Échap / backdrop d’un overlay → accueil (`replace`). Hash inconnu → accueil. Anciennes URLs `#/…` acceptées et nettoyées.

Overlays de route (une à la fois, **swap** sans démonter la liste) : `#settings`, `#print`, `#themes`, `#themes/new`, `#themes/edit/:id`, `#page/:slug`, `#new-card`, `#edit-card/:id`, `#developer/…` (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`). Dialogues enfants (confirmations, URL d’image) : pas d’URL, second backdrop par-dessus la vue courante.

- (sans hash) accueil (empty « Bienvenue ;) », liste, ou recherche sans résultat « Oups ! ») ; `#` et `#/` nettoyés
- `#new-card` `#edit-card/:id` éditeur de carte (modale)
- `#themes` gestion des thèmes (modale) ; `#themes/new` `#themes/edit/:id` éditeur de thème **personnalisé** (modale ; fermeture → `#themes`)
- `#settings` paramètres (modale)
- `#print` paramètres d’impression (modale) ; rien à imprimer → message à la place des options
- `#page/:slug` page Markdown (`data/page-{{slug}}.md`, ex. `#page/about`)
- `#developer` `#developer/typography` `#developer/links` `#developer/tiles` `#developer/buttons` `#developer/fields` `#developer/selects` `#developer/sliders` `#developer/checkboxes` `#developer/radios` `#developer/colors` `#developer/images` `#developer/search` `#developer/modals` `#developer/theme-presets` `#developer/theme-presets/new` `#developer/theme-presets/edit/:slug` — espace développeur / styleguide en **modale** (extensible : `#developer/…`) ; en local : toujours actif ; hors local : inactif par défaut (section Paramètres « Options pour les développeurs » masquée) ; `#developer` / `#developer/…` sans flag → confirmation `modal--sm` (Annuler / Activer) à la place de l’espace ; Activer persiste le flag et ouvre la page demandée ; ensuite le lien Paramètres et `#developer` se comportent comme en local ; index : **Aide au développement** (`ri-pencil-ruler-2-fill`) puis **Système de design** (`ri-collage-fill`) ; galeries / aide au développement (tuiles) : titre = lien `#developer` vers la section + `ri-arrow-right-wide-fill` + titre de page ; hover / focus du lien = primary hover (mêmes tokens inversés que Fermer) ; ≤ 640px (plein écran) : si le lien a une icône, texte masqué (icône seule) ; `#developer/theme-presets` : outil brouillon des thèmes par défaut (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug` ; fermeture éditeur → liste ; pied de modale optionnel levé hors du corps)

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
Ne pas créer de classes one-shot — réutiliser ce vocabulaire. Appliqué : **Enregistrer** = `ri-save-fill` ; **Supprimer** = `ri-delete-bin-2-fill` (y compris titres de confirmation de suppression). Galerie : `#developer/buttons`.

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
Ne pas styler `.topbar-brand` ni `.tile` avec `link`. Galerie : `#developer/links`.

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
Helper : `tileMarkup()` / `tileListMarkup()` dans `tile.js`. Appliqué : index espace développeur, paramètres (collection / styleguide), état vide. Galerie : `#developer/tiles`.

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

Hover : **aucun**. Repos = trait bas inset 2px ; focus = `outline` 2px + `outline-offset` 1px (`ink`, inchangé en erreur). Couleur erreur : `--form-error` (`#ce0000` clair / `#ff5555` dark). Galerie : `#developer/fields`. Appliqué : éditeur de carte (référence `ri-hashtag`, année / pièces / figurines = badges de carte, thème `ri-palette-fill`).

Exceptions actuelles : alertes form-wide (`#error`, `#theme-error`) sous le bloc de champs ; impression (Impression recto-verso des feuilles) : `form-hint` sous les boutons, texte selon le choix ; **cases à cocher** et **boutons radio** : contrôle à gauche du libellé / hint (`form-check`, voir ci-dessous).

## Listes déroulantes (design system — styleguide)

Markup&nbsp;: `select.form-control` (même look qu’un champ texte). Surcouche unobtrusive&nbsp;: `enhanceFormSelects()` / `enhanceFormSelect()` dans `form-select.js` — déclencheur stylé + liste custom (optgroup, clavier, états). Option placeholder (`value=""`) exclue de la liste ; reset `ri-close-circle-fill` (non focusable) pour y revenir. Icônes d’option&nbsp;: `data-icon-left` / `data-icon-right` (clés Remix de `icons.js`, ex. `printer`, `arrow-right`). Icône de champ (comme un input)&nbsp;: `form-control-wrap` + `form-control-icon` autour du `<select>`. Le `<select>` natif reste synchronisé. Appliqué : éditeur (thème + `ri-palette-fill`, groupes **Thèmes personnalisés** / **Thèmes par défaut** si personnalisés). Galerie&nbsp;: `#developer/selects`.

## Curseurs / range (design system)

Même ordre de champ. Contrôle&nbsp;: `form-range-row` (`input[type=range]` + `output` optionnel). Reset optionnel (`formRangeResetMarkup()` / `bindFormRange()` dans `form-range.js`)&nbsp;: bouton `ri-close-circle-fill` après l’input / output, non focusable, emplacement toujours réservé, icône visible seulement si la valeur diffère du défaut ; l’`output` passe alors en gras. Poignée carrée sans bordure ; focus sur la poignée seule ; erreur = message seulement (pas de teinte rouge sur le curseur). Appliqué : paramètres (colonnes, bordure, coins, images, grille d’impression) · impression (grille). Galerie&nbsp;: `#developer/sliders`.

## Cases à cocher (design system)

Exception d’ordre&nbsp;: la case est **à gauche** du libellé et du hint (hint sous le libellé), centrée verticalement sur le bloc texte. Contrôle&nbsp;: `label.form-check` (`input.form-check-input` masqué + `form-check-ui` + `form-check-text` avec `form-label` / `form-hint` optionnel). Erreur = message `form-error` seulement (pas de teinte rouge sur la case). Taille&nbsp;: `sm` (case plus petite). États&nbsp;: disabled (grisé, non soumis) · lecture seule (`aria-readonly="true"` — l’attribut HTML `readonly` est ignoré par les checkboxes ; `bindFormCheckboxes()` bloque le bascule, valeur toujours soumise). Pas d’état visuel obligatoire ni invalide. Groupes&nbsp;: `fieldset.form-check-group` + `legend.form-label` optionnelle + `form-check-list` (colonne) ou `form-check-list--row` (rangée, wrap) ; erreur de groupe sous la liste. Module&nbsp;: `formCheckboxMarkup()` / `bindFormCheckboxes()` dans `form-checkbox.js`. Carré sans arrondi ; coche Remix `ri-check-fill` ; pas de hover ; focus sur la case. Galerie&nbsp;: `#developer/checkboxes`.

## Boutons radio (design system)

Même principe d’affichage que les cases à cocher. Contrôle&nbsp;: `label.form-check.form-radio` (`input.form-check-input` `type="radio"` masqué + `form-check-ui` + `form-check-text`). Même hint, erreur (`form-error` seulement), taille `sm`, disabled, lecture seule (`aria-readonly="true"` — l’attribut HTML `readonly` est ignoré par les radios ; `bindFormRadios()` bloque le choix, y compris si une autre option du même `name` est cliquée alors que l’option cochée est figée ; valeur toujours soumise). Groupes&nbsp;: même `name` pour une option unique ; `fieldset.form-check-group` + `form-check-list` / `form-check-list--row`. Module&nbsp;: `formRadioMarkup()` / `bindFormRadios()` dans `form-radio.js`. Remix `ri-radio-button-line` (masque CSS) aux deux états ; au repos, le disque interne est retiré (même viewBox) ; pas de hover ; focus sur le rond. Galerie&nbsp;: `#developer/radios`.

## Couleurs (design system)

Même ordre de champ. Contrôle&nbsp;: `input.form-control` texte dans un wrapper `form-color`, avec pastille à gauche (`input[type=color]`) et bouton effacer (`ri-close-circle-fill`) en overlay à l’intérieur du champ. Clear visible seulement s’il y a une valeur (peut être omis / disabled) ; non focusable (`tabindex="-1"`). Pastille&nbsp;: uniquement si hex valide ; sinon couleur par défaut du champ (`fallback` / `fallbackColor`), sinon damier transparent. Module&nbsp;: `form-color.js`. Appliqué : paramètres · thèmes · champ image (fond). Galerie&nbsp;: `#developer/colors`.

## Images (design system)

Contrôle&nbsp;: wrapper `form-image` (`formImageMarkup()` / `bindFormImage()` dans `form-image.js`). `processFile(file) => Promise<dataUrl>` obligatoire (`compressImage` pour les cartes, `compressThemeImage` pour les logos). Deux vues&nbsp;:

- **Vide** — texte « Aucune image ! Charger une nouvelle image : » + **Depuis mes fichiers** (`btn primary`, `ri-file-line`, `<input type="file">` caché) et **Depuis une URL** (`btn secondary sm`, `ri-link`). URL → modale enfant `modal--sm` sans route (titre « Charger depuis une URL » + `ri-link`, champ URL avec `ri-cloud-fill`, `form-error` sous l’input) ; pied à droite **Annuler** `secondary sm` + **Charger** `primary` (`ri-upload-fill`, comme Importer) ; fermeture seulement si le chargement réussit (Échap / backdrop / X = dismiss). Pipeline : `fetchImageAsFile` puis `processFile` (l’URL n’est pas conservée).
- **Image** — champ **Fond de l’image** (`form-color`, sans hint) puis aperçu `.form-image-crop` (`tabindex="0"`). Overlays : 3 badges centrés (`btn primary sm`, apparence seulement : zoom `%`, alignements `%` signés ; `ri-zoom-in-fill` / `ri-align-item-horizontal-center-fill` / `ri-align-item-vertical-center-fill`) ; reset `btn ghost sm icon-only` (`ri-close-circle-fill`) en haut à droite si cadrage ≠ 100 % / 0 / 0 ; **Supprimer** (gauche, `ri-delete-bin-2-fill`) et **Sauvegarder** (droite, `ri-download-fill`, comme Sauvegarder la collection) `btn primary sm` (supprimer : `confirmDialog`). Tabulation aperçu : reset (s’il est visible) → Sauvegarder → Supprimer. Cadrage au focus (glisser / molette / flèches / `+` `−`). Ratio : `--form-image-aspect` (défaut `1 / 1`). Fond de l’aperçu = couleur du champ, live.

Option `withBackgroundColor: false` : pas de champ fond ; l’aperçu utilise `previewBackground` / `setPreviewBackground()` (thèmes : couleur du thème, live). Option `fit: "logo"` : le zoom règle la **largeur** du logo (1 = 75 % de la largeur de carte, max 250 %), pas un cover. Enregistré sur le thème (`logoZoom` / `logoOffsetX` / `logoOffsetY`) et appliqué au dos et aux mini-cartes (centré dans le cadre ; décalage = fraction du cadre ; rogné s’il dépasse). Ratio thème : `--form-image-aspect: 63 / 44`.

Appliqué : éditeur de carte · éditeur de thème personnalisé · outil thèmes par défaut (`#developer/theme-presets`). Galerie&nbsp;: `#developer/images`.

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

Appliqué : topbar liste · modale thèmes (compteur + tri : nombre de cartes, titre, date de modification si ≥ 2 thèmes personnalisés — thèmes par défaut non concernés ; défaut nombre de cartes décroissant). Galerie&nbsp;: `#developer/search`.

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
| Dialog | `h1.view-title` (`aria-labelledby`) — titre **court** + **une** icône Remix max à gauche si le déclencheur en a une (`modalTitleMarkup`) ; édition carte / thème : `ri-pencil-fill` ; confirmations : un peu plus long, avec le sujet ; galeries / aide au développement : section (lien `#developer`, icône optionnelle) + `ri-arrow-right-wide-fill` + titre (pas d’icône de tuile) ; `#page/about` : logo app (même look qu’une icône Remix) + `Brickcard v{{APP_VERSION}}` + `ri-arrow-right-wide-fill` + `À propos` | `h2.section-title` |
| Page Markdown en modale | `# Titre` → titre du dialog (retiré du corps) ; about : `# À propos`, version dans le titre, pas dans le corps | `##` → `h2`, `###` → `h3` dans `.md-content` |

Pas des headings&nbsp;: marque topbar, `form-label`, noms de cartes (grille thèmes, Brickcard). Galerie&nbsp;: `#developer/typography`.

États vides (`section.empty-view` / `.empty-view-body`, helper `emptyViewMarkup` dans `empty-view.js`)&nbsp;: titre + texte + tuiles centrés dans `#main` ou le `modal-body` ; brique CSS collée au-dessus (hors flux). Accueil sans carte&nbsp;: «&nbsp;Bienvenue ;)&nbsp;» + tuiles Nouvelle carte / Importer une sauvegarde ; sur grand écran le bloc remonte d’une hauteur de header (header visuellement vide). Recherche sans résultat (cartes ou thèmes)&nbsp;: «&nbsp;Oups&nbsp;!&nbsp;». Premier affichage&nbsp;: «&nbsp;Chargement...&nbsp;» jusqu’à cartes + thèmes prêts.

## Modales (design system)

Coquille&nbsp;: `modal-backdrop` + `modal` (`role="dialog"` / `aria-modal`). Bordure&nbsp;: `2px solid var(--ink)` (comme le focus des champs). Alignement vertical (sur le backdrop)&nbsp;: `modal-backdrop--top` · `modal-backdrop--middle` (**défaut**) · `modal-backdrop--bottom`. Header inversé (fond `ink` / texte `panel`)&nbsp;: titre (`h1.view-title`, court) + **une** icône Remix max à gauche (décorative, reprise du bouton / de la tuile qui ouvre ; exception édition carte / thème : `ri-pencil-fill` ; galeries développeur : icône de section sur le lien, pas d’icône de tuile ; `#page/about` : logo app en `currentColor`) + `btn primary icon-only modal-close` (même variante DS, tokens inversés comme le menu impression&nbsp;: repos fond `--bg` / hover fond `--ink` + bordure `--bg`). Bouton fermer centré verticalement, même inset haut / droite / bas ; `tabindex="-1"` (pas tabulable — fermeture : Échap / clic). Corps&nbsp;: `modal-body` (`tabindex="-1"` — Chrome rend les `overflow: auto` tabulables). À l’ouverture, focus sur `.modal` (`tabindex="-1"`) : Tab va au contenu, puis le pied ; Tab boucle dans la modale au premier plan. Scroll du backdrop et du `modal-body` remis en haut (y compris swap d’une galerie développeur). Pied optionnel&nbsp;: `modal-footer` avec `modal-footer-start` (gauche&nbsp;: sauvegarde / validation) et `modal-footer-end` (droite&nbsp;: danger) — boutons centrés verticalement (normal / `sm`). **Annuler**&nbsp;: `sm` s’il y a d’autres boutons d’action dans le pied, taille normale s’il est seul (`openConfirmDialog` l’applique tout seul). Exception `modal-footer--primary-first` (éditeur de carte, éditeur de thème, paramètres d’impression)&nbsp;: visuel Annuler puis action primaire à droite (éditeurs&nbsp;: Supprimer à gauche) ; ordre clavier (DOM) primaire → Annuler → Supprimer. Séparateur header&nbsp;: `2px solid var(--ink)` (pas de bordure haute sur le footer).

Tailles (3)&nbsp;: `modal--sm` (~640) · `modal--md` (~896, **défaut**) · `modal--lg` (~1152). Toujours bornées au **viewport** (`100vw` / `100dvh`). Responsive ≤&nbsp;640px&nbsp;: **plein écran**, overlay masqué.

Appliqué&nbsp;: paramètres / page MD (`md`) · thèmes + éditeur carte + éditeur de thème personnalisé + espace développeur (`lg` ; thèmes et `#developer/theme-presets` : hauteur toujours `var(--modal-max-h)`, le corps défile) · confirmations / paramètres d’impression (`#print`) / chargement d’image depuis une URL (`sm`). Galerie&nbsp;: `#developer/modals`. Dialogues enfants (supprimer carte / thème / image, reset local, import, URL d’image) : second `modal-backdrop` dans le même host, sans route — helper `confirmDialog()` / `openConfirmDialog()` (`confirm-dialog.js`) ; titre un peu plus long et explicite (ex. `Supprimer la carte "Saucer Centurien" (#6939) ?`). Pas de `alert()` / `confirm()` / `prompt()` natifs.

## Impression

A4 portrait ; **grille** 1×1 à 10×10 (défaut **3×3** poker 63×88 mm). Autres tailles : échelle pour remplir la largeur (agrandir à 1–2, réduire à 4–10) ; cartes entières seulement. Côtés des cartes : face+dos (défaut) / face / dos. Recto-verso des feuilles A4 : alterner (défaut) ou regrouper (tous les rectos, puis tous les versos). Miroir horizontal au dos (flip bord long). Les mêmes réglages sont dans Paramètres (`#settings`, section Impression) et dans `#print` (menu « Lancer l’impression », reste ouverte pendant l’impression). Rien à imprimer : message à la place des options. Pendant `window.print()`, `document.title` = nom proposé du PDF (`brickcard-YYYY-MM-DD-grille-NxN-…`, sans `.pdf`). Dos : label **Brickcard**.

## Conventions

- Garder le nom produit **Brickcard** dans l’UI et la doc.
- Garder les noms de champs **verbeux** sur les modèles Card / LegoTheme.
- UI française, design minimaliste (pas d’arrondis/ombres UI).
- **Typo** : Open Sans pour l’UI (`--font-ui`) ; Inter pour le texte des cartes (`--font-card`) — fichiers dans `src/fonts/`, pas de CDN. Titres : classe = look, tag = plan (voir **Titres**).
- **Icônes** : toujours partir de [Remix Icon](https://remixicon.com/) (style *fill* de préférence) avant d’inventer un SVG. Réutiliser / étendre `src/js/icons.js` ; en HTML, commenter le nom `ri-*`.
- Pas de `alert()` / `confirm()` / `prompt()` natifs : `confirmDialog()` / `openConfirmDialog()` / `alertDialog()` (`confirm-dialog.js`).
- Pas de dépendances npm sauf demande explicite.
- **Version** : n’incrémenter `APP_VERSION` (ni le `?v=` de cache, ni `CACHE` dans `sw.js`, ni une entrée datée dans `CHANGELOG.md`) **que sur demande explicite**. Entre deux versions, noter les changements sous `## [Unreleased]`.
