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
| `src/data/themes-presets.json` | Liste des thèmes LEGO prédéfinis (éditable sans toucher au JS) |
| `src/data/page-{{slug}}.md` | Pages Markdown affichées en modale (ex. `page-about.md`) |
| `src/img/logo-brickcard-generator.svg` | Logo app (brick outline — crédit Joko Sutrisno / Vecteezy) |
| `src/css/styles.css` | Styles écran + `@media print` |
| `src/js/app.js` | Hash routing, import/export, ouverture pages MD |
| `src/js/markdown.js` | Parser Markdown léger + `loadMarkdownPage(slug)` |
| `src/js/theme.js` | Thème **UI** system / light / dark |
| `src/js/card-design.js` | Design cartes (bordure face, CSS vars) — localStorage |
| `src/js/list-layout.js` | Densité liste (cartes/ligne max) — localStorage |
| `src/js/themes-data.js` | Charge le JSON, logos SVG générés, accent par défaut |
| `src/js/storage.js` | IndexedDB cartes + thèmes LEGO, export/import JSON |
| `src/js/card-export.js` | Téléchargement de la photo d’une Brickcard |
| `src/js/print.js` | Impression A4 3×3 + dos miroir |
| `src/js/version.js` | Version SemVer (`APP_VERSION`) — source unique |
| `src/js/icons.js` | Icônes UI ([Remix Icon](https://remixicon.com/)) — paths + helpers |
| `src/js/form-color.js` | Champ couleur (`form-color` / pastille / clear) |
| `src/js/form-select.js` | Surcouche select (`form-select` / liste custom) |
| `src/js/views/list.js` | Grille d’aperçus + recherche (barre topbar) |
| `src/js/views/editor.js` | Éditeur de carte |
| `src/js/views/themes.js` | Modale gestion thèmes LEGO |
| `src/js/views/page.js` | Modale page Markdown |
| `src/js/views/settings.js` | Modale paramètres |
| `src/js/views/test/` | Styleguide / pages de test UI (`#/test`, `#/test/buttons`, …) |
| `CHANGELOG.md` | Historique des versions (Keep a Changelog) |

## Modèle carte (`Card`)

Noms volontaires verbeux (lisibles sans doc) :

```js
{
  id: string,
  legoSetRef: string,       // ex. "6140/6109"
  title: string,            // titre de la Brickcard (`\n` = saut de ligne)
  description: string,      // legacy / import ; plus exposé dans l’UI
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

## Thèmes prédéfinis (`src/data/themes-presets.json`)

Éditer ce fichier pour ajouter / modifier les thèmes d’usine (pas besoin de toucher au JS).

Champs par entrée :
- `id` (obligatoire), `themeName` (obligatoire)
- `color` (hex, optionnel) — si omis → pas de couleur propre ; la carte utilise la couleur configurée puis le gris `#6e6e6e`
- `logoSrc` (optionnel) — chemin depuis `src/` (ex. `img/logo-theme-….png`) ; sans logo / échec de chargement → affichage du **nom** du thème (pas de SVG généré)

## Modèle thème LEGO (`LegoTheme`)

```js
{
  id: string,
  themeName: string,        // ex. "CITY"
  color: string,            // hex ; vide = pas de couleur propre (cascade carte)
  logoDataUrl: string,      // SVG ou PNG transparent (data URL ou chemin), optionnel
  isBuiltin: boolean        // prédéfini = réinitialisable, non supprimable
}
```

Ne pas confondre avec le thème **UI** (`theme.js` : clair/sombre).

Accent d’une Brickcard (`resolveCardAccent`) :
1. `theme.color` si hex valide
2. sinon couleur configurée (`card-design.js`)
3. sinon gris d’usine `DEFAULT_THEME_COLOR` (`#6e6e6e`)

## Persistance

- IndexedDB : `brickcard-generator` **v2** — stores `cards` + `themes` (après Reset local : nom `brickcard-generator-<db-gen>`, clé `brickcard-generator:db-gen`)
- Clé thème UI : `brickcard-generator:ui-theme`
- Clé bordure face : `brickcard-generator:card-face-border-mm` (défaut `3`)
- Clé arrondi coins : `brickcard-generator:card-radius-mm` (défaut `1.5`, face + dos)
- Clé couleur carte par défaut : `brickcard-generator:card-default-color` (vide = gris d’usine `#6e6e6e`)
- Clé sélection impression : `brickcard-generator:print-qty` (`{ [cardId]: qty }`)
- Clés tri liste : `brickcard-generator:list-sort`, `brickcard-generator:list-sort-dir`
- Clé colonnes liste max : `brickcard-generator:list-cols-max` (défaut `4`, plage 2–10, ou `infinite`)
- Cascade accent carte : couleur du thème → couleur configurée → `#6e6e6e`
- Export JSON **v3** : `{ version: 3, app: "brickcard-generator", cards, themes }` — fichier `brickcard-export-YYYY-MM-DD.json`
- APIs async ; serveur HTTP obligatoire en local
- Au démarrage, purge éventuelle de l’ancienne base `lego-set-cards` (plus utilisée)

## Vues

- `#/` `#/list` `#/new` `#/edit/:id` `#/themes` (modale thèmes)
- `#/test` `#/test/buttons` `#/test/fields` `#/test/selects` `#/test/sliders` `#/test/colors` `#/test/search` `#/test/modals` — styleguide UI (extensible : `#/test/…`) ; lien Paramètres en local uniquement

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
Ne pas créer de classes one-shot — réutiliser ce vocabulaire. Galerie : `#/test/buttons`.

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

Hover : **aucun**. Repos = trait bas inset 2px ; focus = `outline` 2px + `outline-offset` 1px (`ink`, inchangé en erreur). Couleur erreur : `--form-error` (`#ce0000` clair / `#ff5555` dark). Galerie : `#/test/fields`.

Exceptions actuelles : alertes form-wide (`#error`, `#theme-error`) sous le bloc de champs.

## Listes déroulantes (design system — styleguide)

Markup&nbsp;: `select.form-control` (même look qu’un champ texte). Surcouche unobtrusive&nbsp;: `enhanceFormSelects()` / `enhanceFormSelect()` dans `form-select.js` — déclencheur stylé + liste custom (optgroup, clavier, états). Option placeholder (`value=""`) exclue de la liste ; reset `ri-close-circle-fill` (non focusable) pour y revenir. Icônes d’option&nbsp;: `data-icon-left` / `data-icon-right` (clés Remix de `icons.js`, ex. `printer`, `arrow-right`). Le `<select>` natif reste synchronisé. Appliqué : éditeur (thème). Galerie&nbsp;: `#/test/selects`.

## Curseurs / range (design system)

Même ordre de champ. Contrôle&nbsp;: `form-range-row` (`input[type=range]` + `output` optionnel). Poignée carrée sans bordure ; focus sur la poignée seule ; erreur = message seulement (pas de teinte rouge sur le curseur). Appliqué : paramètres (colonnes, bordure, coins) · éditeur (zoom). Galerie&nbsp;: `#/test/sliders`.

## Couleurs (design system)

Même ordre de champ. Contrôle&nbsp;: `input.form-control` texte dans un wrapper `form-color`, avec pastille à gauche (`input[type=color]`) et bouton effacer (`ri-close-circle-fill`) en overlay à l’intérieur du champ. Clear visible seulement s’il y a une valeur (peut être omis / disabled) ; non focusable (`tabindex="-1"`). Pastille&nbsp;: uniquement si hex valide ; sinon couleur par défaut du champ (`fallback` / `fallbackColor`), sinon damier transparent. Module&nbsp;: `form-color.js`. Appliqué : paramètres · éditeur (fond image) · thèmes. Galerie&nbsp;: `#/test/colors`.

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

Appliqué : topbar liste. Galerie&nbsp;: `#/test/search`.

## Modales (design system)

Coquille&nbsp;: `modal-backdrop` + `modal` (`role="dialog"` / `aria-modal`). Bordure&nbsp;: `2px solid var(--ink)` (comme le focus des champs). Alignement vertical (sur le backdrop)&nbsp;: `modal-backdrop--top` · `modal-backdrop--middle` (**défaut**) · `modal-backdrop--bottom`. Header inversé (fond `ink` / texte `panel`)&nbsp;: titre (`view-title`) + desc optionnelle (`view-desc`) + `btn ghost icon-only modal-close`. Corps&nbsp;: `modal-body`. Pied optionnel&nbsp;: `modal-footer` avec `modal-footer-start` (gauche&nbsp;: sauvegarde / validation) et `modal-footer-end` (droite&nbsp;: danger) — boutons centrés verticalement (normal / `sm`). Séparateur header&nbsp;: `2px solid var(--ink)` (pas de bordure haute sur le footer).

Tailles (3)&nbsp;: `modal--sm` (~640) · `modal--md` (~896, **défaut**) · `modal--lg` (~1152). Toujours bornées au **viewport** (`100vw` / `100dvh`). Responsive ≤&nbsp;640px&nbsp;: **plein écran**, overlay masqué.

Appliqué&nbsp;: paramètres / page MD (`md`) · thèmes + éditeur carte (`lg`) · éditeur de thème (`sm`). Galerie&nbsp;: `#/test/modals`.

## Impression

9 cartes / A4 ; face puis dos ; miroir horizontal (flip bord long). Dos : label **Brickcard**.

## Conventions

- Garder le nom produit **Brickcard Generator** / marque **Brickcard** dans l’UI et la doc.
- Garder les noms de champs **verbeux** sur les modèles Card / LegoTheme.
- UI française, design minimaliste (pas d’arrondis/ombres UI).
- **Icônes** : toujours partir de [Remix Icon](https://remixicon.com/) (style *fill* de préférence) avant d’inventer un SVG. Réutiliser / étendre `src/js/icons.js` ; en HTML, commenter le nom `ri-*`.
- Pas de dépendances npm sauf demande explicite.
