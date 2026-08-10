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
| `src/js/views/list.js` | Grille d’aperçus + recherche (barre topbar) |
| `src/js/views/editor.js` | Éditeur de carte |
| `src/js/views/themes.js` | Modale gestion thèmes LEGO |
| `src/js/views/page.js` | Modale page Markdown |
| `src/js/views/settings.js` | Modale paramètres |
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

- IndexedDB : `brickcard-generator` **v2** — stores `cards` + `themes`
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

## Impression

9 cartes / A4 ; face puis dos ; miroir horizontal (flip bord long). Dos : label **Brickcard**.

## Conventions

- Garder le nom produit **Brickcard Generator** / marque **Brickcard** dans l’UI et la doc.
- Garder les noms de champs **verbeux** sur les modèles Card / LegoTheme.
- UI française, design minimaliste (pas d’arrondis/ombres UI).
- Pas de dépendances npm sauf demande explicite.
