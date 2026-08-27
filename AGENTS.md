# AGENTS.md — Brickcard

Guide pour les agents IA (Cursor, Copilot, etc.) qui travaillent sur ce dépôt.

## Qu’est-ce que c’est ?

**Brickcard** — SPA **statique** (pas de framework, pas de bundler) pour générer des *Brickcards* : cartes « poker » (63×88 mm) décrivant des sets LEGO. Objectif utilisateur : cartons plastifiés dans des pochettes avec les sets sans boîte.

Stack : HTML + CSS + JS modules ES (`type="module"`). UI en **français**.

Nom produit / marque UI : **Brickcard**.

## Publication

Site officiel : **https://brickcard.org** (domaine personnalisé). Déploiement **GitHub Pages** depuis `src/` (workflow `.github/workflows/pages.yml`, push sur `main`). Pas de sous-chemin : le site est à la racine du domaine (le service worker doit donc rester à la racine de `src/`).

## Où est le code ?

Tout le code applicatif est dans **`src/`**.

| Fichier | Rôle |
|---------|------|
| `src/index.html` | Coquille : `<title>` = `APP_DOCUMENT_TITLE`, topbar sticky, `#main`, `#modal-root`, `#toast-root`, `#print-root` ; import map (`?v=` sur `app.js` / `version.js`) |
| `src/manifest.webmanifest` | Manifest PWA (nom, icônes, `standalone`) |
| `src/service-worker.js` | Service worker à la racine du site (scope `/` ; GitHub Pages n’autorise pas un SW dans `js/`) ; `CACHE` = `APP_VERSION` ; fetch en ligne avec `cache: "reload"` ; précache install non bloquant ; pas d’interception de son propre script |
| `src/data/themes-presets.json` | Liste des thèmes LEGO par défaut (éditable sans toucher au JS) |
| `src/data/theme-logo-*` | Logos des thèmes par défaut (PNG / SVG / WebP / JPEG) |
| `src/data/backup-demo-jo.brickcard` | Sauvegarde de démo (accueil vide : tuile **Charger une démonstration** ; photos WebP ; URL : `data/backup-demo-jo.brickcard`) |
| `src/data/page-{{slug}}.md` | Pages Markdown en modale (`#page/:slug`, ex. `page-about.md`) ; `# Titre` → titre du dialog |
| `src/img/brickcard-logo.svg` | Logo app noir (brick outline — crédit Joko Sutrisno / Vecteezy) ; chrome UI : masque CSS ; cartes : SVG inline (`currentColor` / `--card-accent-fg`) |
| `src/img/brickcard-logo-white.svg` | Même logo, fill blanc (chrome UI si besoin ; plus utilisé sur les cartes) |
| `src/img/brickcard-favicon.svg` | Favicon SVG (clair `#141414` / sombre blanc via `prefers-color-scheme`) |
| `src/img/brickcard-favicon.ico` / `brickcard-favicon-96x96.png` | Favicon raster (onglet) |
| `src/img/brickcard-apple-touch-icon.png` | Icône iOS 180×180 |
| `src/img/brickcard-web-app-manifest-192x192.png` / `512x512.png` | Icônes PWA (any + maskable) |
| `src/fonts/` | Open Sans + Inter (woff2 variable, latin-ext) + licences SIL OFL |
| `src/js/app.js` | Hash routing (vues + historique) ; overlays et `#developer/…` chargés par `import()` |
| `src/js/hotkeys.js` | Raccourcis Ctrl/Cmd+P (impression) et Ctrl/Cmd+S (sauvegarde) |
| `src/js/modal-focus.js` | Focus initial + piège Tab des modales |
| `src/js/markdown.js` | Parser Markdown léger + `loadMarkdownPage(slug)` |
| `src/js/theme.js` | Thème **UI** system / light / dark |
| `src/js/card-design.js` | Design cartes (bordure face, arrondi coins / images, CSS vars) — localStorage |
| `src/js/list-layout.js` | Densité liste (cartes/ligne max) — localStorage |
| `src/js/image-optimize.js` | Optimiser les images (WebP à l’import) — localStorage |
| `src/js/telemetry.js` | Télémétrie d’usage anonyme (opt-out, localStorage) |
| `src/js/themes-data.js` | Charge le JSON des thèmes par défaut, `logoSrc`, accent par défaut |
| `src/js/storage.js` | IndexedDB cartes + thèmes **personnalisés**, import `.brickcard` |
| `src/js/backup.js` | Format / parse / migrations / export `.brickcard` (`version` = `APP_VERSION`) |
| `src/js/backup-dialog.js` | Modale de sauvegarde (`#backup`) |
| `src/js/import-dialog.js` | Modale d’import (`#import`) ; import auto de la démo (`openDemoBackupDialog`) |
| `src/js/card-export.js` | Téléchargement (photo Brickcard, blob, URL same-origin) ; noms photo de carte `brickcard-card-image-YYYY-MM-DD-…` ; logos de thème `brickcard-theme-logo-YYYY-MM-DD-…` |
| `src/js/preset-draft.js` | Brouillon isolé des thèmes par défaut (outil `#developer/theme-presets`) |
| `src/js/print.js` | Impression A4 (grille variable, faces/dos, miroir) ; chargé au clic **Lancer l’impression** |
| `src/js/print-menu.js` | Menu header impression (sélection, badge, lancer) |
| `src/js/print-qty.js` | Quantités d’impression — localStorage |
| `src/js/print-settings.js` | Réglages d’impression (grille, tracé de découpe, fond perdu, ordre d’impression, côté d’impression, assemblage des feuilles) — localStorage |
| `src/js/card-sort.js` | Comparaison ASC des cartes (liste d’accueil et impression) |
| `src/js/print-dialog.js` | Modale paramètres d’impression (`#print`) |
| `src/js/version.js` | Version SemVer (`APP_VERSION`), `APP_ID`, `APP_NAME`, `APP_DOCUMENT_TITLE` — source unique ; cache-bust via import map (`index.html`) |
| `src/js/document-title.js` | Titre d’onglet (`document.title`) : défaut, overlays, verrou pendant l’impression PDF |
| `src/js/icons.js` | Icônes UI ([Remix Icon](https://remixicon.com/)) — paths + helpers (`remixIconByName`, `modalTitleMarkup`) |
| `src/js/link.js` | Markup liens (`a.link` / externe / icône) |
| `src/js/tile.js` | Markup tuiles (`ul.tile-list` / `a.tile`) |
| `src/js/empty-view.js` | Markup états vides / chargement (`section.empty-view`, brique CSS, `welcomeViewMarkup`, `loadingViewMarkup`) |
| `src/js/includes-ci.js` | Comparaison de recherche (`includesCI`) : casse et accents ignorés |
| `src/js/confirm-dialog.js` | Dialogues `modal--sm` (`openConfirmDialog` / `confirmDialog` / `alertDialog`, `icon` optionnel) — pas de `alert()` / `confirm()` / `prompt()` |
| `src/js/toast.js` | Notifications empilables (toast) : types normal / succès / erreur, header/body, delay 7 s (15 s import/sauvegarde collection) ; `toast()` / `dismissToast()` |
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
| `src/js/views/developer/` | Espace développeur / styleguide UI en modale (`#developer`, `#developer/typography`, …) ; chaque galerie en `import()` ; outil thèmes par défaut `#developer/theme-presets` |
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
  imageDataUrl: string,     // photo data URL (JPEG/PNG/SVG/WebP) — optionnel
  imageBackgroundColor: string, // fond zone image (hex) ; vide = blanc à l’affichage
  imageZoom: number,        // cadrage photo, 1 = cover (100 %) ; < 1 = dézoom ; arrondi 2 décimales (`0.00` → 0)
  imageOffsetX: number,     // cadrage photo (fraction largeur) ; arrondi 2 décimales
  imageOffsetY: number,     // cadrage photo (fraction hauteur) ; arrondi 2 décimales
  updatedAt: string
}
```

Migration auto depuis les anciens noms (`setTitle` → `title`, `setImageDataUrl` → `imageDataUrl`, `legoThemeId` → `brickcardThemeId`, ainsi que `ref`, `image`, `zoom`, …). `createdAt` ignoré. Ancien id de thème par défaut `the-lord-of-the-rings` → `lord-of-the-rings`.

## Thèmes par défaut (`src/data/themes-presets.json`)

Éditer ce fichier pour ajouter / modifier les thèmes par défaut (pas besoin de toucher au JS).

Champs par entrée :
- `id` (obligatoire), `name` (obligatoire)
- `color` (hex, optionnel) — si omis → pas de couleur propre ; la carte utilise la couleur configurée puis le gris `#6e6e6e`
- `secondaryColor` (hex, optionnel) — textes, icônes de badge et logo Brickcard ; si omis → noir `#141414` ou blanc `#ffffff` selon la luminance de l’accent
- `logoSrc` (optionnel) — chemin depuis `src/` (ex. `data/theme-logo-….png`) ; sans logo / échec de chargement → affichage du **nom** du thème (pas de SVG généré)
- `logoZoom` / `logoOffsetX` / `logoOffsetY` (optionnels) — cadrage du logo (1 / 0 / 0 si omis) ; mêmes unités que les thèmes personnalisés ; export outil : arrondi 2 décimales, `0.00` → omis (`logoZoom` de `1` aussi)

Thèmes par défaut : **lecture seule** dans l’app (ni modification ni suppression). Les thèmes personnalisés ont un id UUID (`createId()`), sont stockés en IndexedDB, et s’éditent via `#themes/new` / `#themes/edit/:id`.

Outil développeur `#developer/theme-presets` : copie locale isolée (IndexedDB `brickcard-preset-draft`) pour éditer id/slug, nom, couleurs (accent + secondaire), logo et cadrage (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`), puis **sauvegarder** `themes-presets.json` + `theme-logo-{id}.{ext}` à placer soi-même dans `data/`. Ne lit/écrit jamais les stores `cards` / `themes` ni les réglages. Au premier chargement (ou après **Réinitialiser**) : seed depuis le JSON. Succès / erreurs **générales** (chargement, **Réinitialiser**, **Sauvegarder themes-presets.json**, **Sauvegarder les logos**, enregistrement / suppression dans l’éditeur) → `toast()` ; validation des champs Nom / Identifiant → `form-error` sous l’input. Reset local de la collection **ne** touche **pas** ce brouillon.

## Modèle thème LEGO (`LegoTheme`)

```js
{
  id: string,               // par défaut = slug JSON ; personnalisé = UUID (`createId()`)
  name: string,             // ex. "CITY"
  color: string,            // hex ; vide = pas de couleur propre (cascade carte)
  secondaryColor: string,   // hex ; vide = contraste auto (noir / blanc) sur l’accent
  logoDataUrl: string,      // JPEG/PNG/SVG/WebP (data URL ou chemin), optionnel
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

Textes / icônes / logo Brickcard (`resolveCardAccentFg`, `--card-accent-fg`) :
1. `theme.secondaryColor` si hex valide
2. sinon contraste auto (`contrastText`) : `#141414` seulement sur un fond vraiment pâle (gris clair / pastel) ; `#ffffff` sur les teintes saturées (même lumineuses) et les fonds sombres
Le logo Brickcard (dos, et face sans photo) est un **SVG inline** (`fill="currentColor"` / `--card-accent-fg`) — pas un masque CSS (Firefox rasterise `mask-image` à l’impression).

## Persistance

- IndexedDB : `brickcard` **v2** — stores `cards` + `themes` (**personnalisés seulement** ; les thèmes par défaut se lisent dans `themes-presets.json`) (après Reset local : nom `brickcard-<db-gen>`, clé `brickcard:db-gen`) ; le reload post-reset passe par `?{timestamp}` (cache HTTP / SW), puis la query est retirée au boot (`?_=` encore reconnu)
- IndexedDB outil presets : `brickcard-preset-draft` — brouillon `#developer/theme-presets` uniquement (indépendant du Reset local)
- Clé thème UI : `brickcard:ui-theme`
- Clé bordure face : `brickcard:card-face-border-mm` (défaut `3`)
- Clé arrondi coins : `brickcard:card-radius-mm` (défaut `2`, face + dos)
- Clé arrondi images : `brickcard:card-image-radius-mm` (défaut `1`, cadre photo)
- Clé couleur carte par défaut : `brickcard:card-default-color` (vide = gris d’usine `#6e6e6e`)
- Clé sélection impression : `brickcard:print-qty` (`{ [cardId]: qty }`)
- Clé réglages impression : `brickcard:print-settings` (`{ printGrid: 1–10, cardPrintOrder: "legoSetRef"|"title"|"releaseYear"|"pieceCount"|"figurineCount"|"updatedAt", printSide: "both"|"faceOnly"|"backOnly", sheetAssembly: "alternate"|"grouped", cutMarkFace: boolean, cutMarkBack: boolean, bleedFace: boolean, bleedBack: boolean }`, défaut `3` / `legoSetRef` / `both` / `alternate` / Face / pas Dos / pas face / Dos ; ordre toujours ASC, indépendant de `brickcard:list-sort`)
- Clé espace développeur : `brickcard:developer-enabled` (`"1"` si activé hors local ; toujours considéré actif sur localhost / `127.0.0.1` / `[::1]`) ; Reset local la retire
- Clés tri liste : `brickcard:list-sort`, `brickcard:list-sort-dir` (défaut `updatedAt` / `desc`) ; après **création** d’une carte : recherche vidée et tri remis sur date de modification décroissante ; après **modification** ou **suppression** : la grille n’est pas reconstruite (tuile mise à jour ou retirée, scroll / recherche / tri inchangés ; compteurs recherche et impression recalculés ; dernière carte → accueil vide) ; après **création** ou **modification** : focus clavier sur la tuile concernée (scroll dans la vue si besoin) ; fermeture de l’éditeur d’une carte existante (Échap / croix / Annuler / backdrop) : même focus sur la tuile éditée
- Clés tri thèmes : `brickcard:themes-sort`, `brickcard:themes-sort-dir` (défaut `cardCount` / `desc`) ; après **création** d’un thème perso : recherche vidée et tri remis sur date de modification décroissante (si ≥ 2 thèmes personnalisés ; sinon repli sur le défaut) ; après **modification** ou **suppression** : la grille n’est pas reconstruite (mini-carte mise à jour ou retirée, scroll / recherche / tri inchangés ; compteur recalculé ; plus aucun perso → section perso masquée) ; **Supprimer tous les thèmes personnalisés** (si plus de 2 perso) : section perso vidée ; cartes conservées, `brickcardThemeId` vidé ; après **création** ou **modification** : focus clavier sur la mini-carte ; fermeture de l’éditeur d’un thème existant (Échap / croix / Annuler / backdrop) : même focus. Même principe pour `#developer/theme-presets` (création : recherche vidée, tri date desc, scroll haut, focus ; modification : tuile in-place et focus ; fermeture éditeur d’un thème existant : focus ; dernier thème → empty « Aucun thème »)
- Clé colonnes liste max : `brickcard:list-cols-max` (défaut `4`, plage 2–10, ou `infinite`)
- Clé optimiser les images : `brickcard:optimize-images` (`"1"` / absente = coché, défaut ; `"0"` = décoché) ; Reset local la retire
- Clé télémétrie : `brickcard:telemetry` (`"1"` / absente = coché, défaut ; `"0"` = décoché) ; Reset local la retire ; case Paramètres et script hors local seulement
- Cascade accent carte : couleur du thème → couleur configurée → `#6e6e6e`
- Cascade textes / logo Brickcard : `secondaryColor` du thème → contraste auto sur l’accent
- Écran : filet 2 px `box-shadow: 0 0 0 2px var(--ink)` sur `.card` / `.card-back` / `.theme-tile-face` (silhouette vs le fond UI, suit `--card-radius`). Impression / aperçu A4 (papier blanc) : filet 1 px `#000000` en `border` sur `.print-slot::after` si **Tracé de découpe** Sur la face avant / Sur le dos (arrière) est coché (`.print-cut-mark-face` / `.print-cut-mark-back` ; un `outline` sur le slot passe dessous)
- Export (fichier `.brickcard`, JSON) : `{ version: APP_VERSION, app: "brickcard", cards, themes, settings? }` — `version` = SemVer de l’app (ex. `"0.8.0"`) même sans changement de structure ; `themes` = personnalisés uniquement (sans `isBuiltin`) ; `settings.cardAppearance` (4 clés : bordure, arrondis coins / images, couleur par défaut) omis si non inclus — route `#backup` (`modal--md` ; complète : toutes les cartes, tous les thèmes perso même vides, apparence ; personnalisée : images & logos, apparence, thèmes avec cartes (alpha) ; sans thème sélectionné ou sans carte : pas d’export ; sans images / logos, photo, fond, cadrage et logo sont omis du fichier). Recap dans le pied. Noms : `brickcard-backup-YYYY-MM-DD-{full|custom}-{n}-card(s)[-{n}-theme(s)][-{n}-image(s)][-{n}-logo(s)].brickcard` (segments thèmes / images / logos omis s’ils sont à 0)
- Import : route `#import` (`modal--md`) ; fichier `.brickcard` (ou URL http(s) / relative, extension optionnelle si le JSON est valide) chargé **en mémoire** puis choix de fusion (images & logos, apparence, cartes par thème — sections visibles seulement si le fichier en contient) ; écriture IndexedDB uniquement au clic **Importer** (fusion, valeurs remplacées ; images / logos locaux conservés si la case est décochée) ; pas de vider / remplacer la collection ; vérifie `app` / `version` / `cards` / `themes` (tableaux, éventuellement vides) ; `app` = `brickcard` ; refuse une `version` SemVer supérieure à `APP_VERSION` ; migrations de structure (`backup.js`, dont les anciens `version` entiers 1–3) avant normalisation ; ignore les thèmes par défaut (ids de preset / `isBuiltin`) ; applique `settings.cardAppearance` s’il est présent et sélectionné ; fichier sans cartes accepté s’il reste des thèmes et/ou des settings ; ne réécrit pas `themes-presets.json` ; accueil vide : tuile **Charger une démonstration** (`ri-emotion-fill`) ouvre une `modal--sm` **Sauvegarde de démonstration** (brique + « Chargement... ») qui charge `data/backup-demo-jo.brickcard` et fusionne tout sans étape de choix, puis ferme la modale ; toast **Démonstration chargée** (`ri-emotion-fill`, même recap que l’import)
- APIs async ; serveur HTTP obligatoire en local
- Au démarrage, `boot()` attend `loadCards()` + `loadThemes()` avant `route()` (écran « Chargement... » dans `#main`, animation CSS tant que `aria-busy`) ; échec de module / boot : message technique en rouge (`#boot-error`, `--form-error`) sous le titre, animation arrêtée, `ri-error-warning-line` au centre de la brique, bouton **Réessayer** (`#boot-retry`, `ri-refresh-fill`, centré sous le message ; clic → `?r={timestamp}` pour contourner le cache HTTP / SW, comme le reset `?{timestamp}` ; script inline hors module — un import cassé n’atteint pas `boot()`) ; pas de bouton sur les chargements d’image / import / démo
- Au démarrage, purge éventuelle de l’ancienne base `lego-set-cards` (plus utilisée)

## Vues

Hash = source de vérité (Précédent / Suivant). Accueil = URL sans hash (jeton interne `#`). Overlays = `#settings`, `#new-card`, … Croix / Échap / backdrop d’un overlay → accueil (`replace`). Hash inconnu → accueil. Anciennes URLs `#/…` acceptées et nettoyées.

Overlays de route (une à la fois, **swap** sans démonter la liste) : `#settings`, `#print`, `#backup`, `#import`, `#themes`, `#themes/new`, `#themes/edit/:id`, `#page/:slug`, `#new-card`, `#edit-card/:id`, `#developer/…` (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug`). Chaque overlay est chargé par `import()` à l’ouverture (échec → toast, l’accueil reste utilisable). Dialogues enfants (confirmations, URL d’image / de sauvegarde, démo d’accueil) : pas d’URL, second backdrop par-dessus la vue courante (sur l’accueil : seul backdrop).

- (sans hash) accueil (empty « Bienvenue ;) », liste, ou recherche sans résultat « Oups ! ») ; `#` et `#/` nettoyés
- `#new-card` `#edit-card/:id` éditeur de carte (modale) ; après création : recherche vidée, tri date desc, focus sur la tuile ; après modification : tuile mise à jour et focus (scroll / tri / recherche conservés) ; fermeture sans enregistrer (`#edit-card/:id`, Échap / croix / Annuler / backdrop) : focus sur la tuile éditée ; après suppression : tuile retirée (scroll / tri / recherche conservés)
- `#themes` gestion des thèmes (modale `lg`) ; `#themes/new` `#themes/edit/:id` éditeur de thème **personnalisé** (modale par-dessus la liste ; fermeture → `#themes`) ; après création : recherche vidée, tri date desc, focus sur la mini-carte ; après modification : tuile mise à jour et focus (scroll / tri / recherche conservés) ; fermeture sans enregistrer (`#themes/edit/:id`, Échap / croix / Annuler / backdrop) : focus sur la mini-carte éditée ; après suppression : tuile retirée (scroll / tri / recherche conservés) ; pied : **Nouveau thème** à droite ; si plus de 2 thèmes personnalisés, **Supprimer tous les thèmes personnalisés** (`ri-delete-bin-2-fill`, danger) à gauche (confirmation ; cartes conservées, `brickcardThemeId` vidé)
- `#settings` paramètres (modale `md`) ; barre de recherche (`search-bar--input-only`) : titres de section, tuiles (`title` / `desc` / `href`), `form-label` / `form-hint` ; insensible à la casse et aux accents ; si le titre d’une section matche, toute la section ; **Oups !** si aucun résultat
- `#print` paramètres d’impression (modale `md`) ; rien à imprimer → message à la place des options ; raccourci **Ctrl/Cmd+P** (hors éditeur carte / thème / presets, hors `#import` et hors dialogue enfant) ; déjà ouverte → lance l’impression
- `#backup` sauvegarde de la collection (modale `md`) ; complète ou personnalisée ; recap dans le pied (cartes, thèmes, paramètres, poids ; vide : **Aucune carte à sauvegarder !**) ; fermeture → accueil ; raccourci **Ctrl/Cmd+S** (hors éditeur carte / thème / presets, hors `#import` et hors dialogue enfant) ; export réussi → ferme la modale
- `#import` import de sauvegarde (modale `md`, titre **Importer une sauvegarde**) ; étape 1 : fichier ou URL (boutons centrés, validation en mémoire, erreurs sous les actions / dans la modale URL ; chargement URL : brique + « Chargement... » sous le champ ; pas de recap) ; étape 2 : nom du fichier ou URL (`a.link` `_blank`) centré, **Charger une autre sauvegarde** (`sm`) ; choisir images & logos, apparence, cartes (par thème, y compris thèmes perso vides) ; recap dans le pied (vide : **Rien à importer !**) ; fusion uniquement au clic **Importer** (modale `aria-busy` jusqu’à la fin) ; fermeture → accueil ; import réussi → ferme la modale ; accueil vide : tuile **Charger une démonstration** → `modal--sm` **Sauvegarde de démonstration** (`ri-emotion-fill`, brique + « Chargement... », sans pied) qui importe `data/backup-demo-jo.brickcard` en entier puis se ferme ; toast **Démonstration chargée** (`ri-emotion-fill`, même recap que l’import)
- `#page/:slug` page Markdown (`data/page-{{slug}}.md`, ex. `#page/about`)
- `#developer` `#developer/typography` `#developer/links` `#developer/tiles` `#developer/buttons` `#developer/fields` `#developer/selects` `#developer/sliders` `#developer/checkboxes` `#developer/radios` `#developer/colors` `#developer/images` `#developer/search` `#developer/modals` `#developer/notifications` `#developer/loading` `#developer/welcome` `#developer/theme-presets` `#developer/theme-presets/new` `#developer/theme-presets/edit/:slug` — espace développeur / styleguide en **modale** `md` (sauf `#developer/theme-presets` : `lg` ; extensible : `#developer/…`) ; chaque galerie / l’outil presets est chargé par `import()` à l’ouverture de la page ; en local : toujours actif ; hors local : inactif par défaut (section Paramètres « Options pour les développeurs » masquée) ; `#developer` / `#developer/…` sans flag → confirmation `modal--sm` (Annuler / Activer) à la place de l’espace ; Activer persiste le flag et ouvre la page demandée ; ensuite le lien Paramètres et `#developer` se comportent comme en local ; index : barre de recherche (`search-bar--input-only`, titres de section / tuiles (`title` / `desc` / `href`) ; insensible à la casse et aux accents ; si le titre d’une section matche, toutes ses tuiles ; **Oups !** si aucun résultat) ; **Aide au développement** (`ri-pencil-ruler-2-fill`) puis **Modèles** (`ri-pages-fill`) puis **Système de design** (`ri-collage-fill`) ; galeries / aide au développement / modèles (tuiles) : titre = lien `#developer` vers la section + `ri-arrow-right-wide-fill` + titre de page ; hover / focus du lien = primary hover (mêmes tokens inversés que Fermer) ; ≤ 640px (plein écran) : si le lien a une icône, texte masqué (icône seule) ; `#developer/loading` : modèle de la page de chargement (brique animée ; en cours, erreur sans bouton, erreur avec **Réessayer**) ; `#developer/welcome` : modèle de la page d’accueil vide (brique + tuiles) ; `#developer/theme-presets` : outil brouillon des thèmes par défaut (`#developer/theme-presets/new`, `#developer/theme-presets/edit/:slug` ; fermeture éditeur → liste ; après création : recherche vidée, tri date desc, scroll haut, focus sur la mini-carte ; après modification : tuile in-place et focus ; après suppression : tuile in-place ; fermeture sans enregistrer (`#developer/theme-presets/edit/:slug`) : focus sur la mini-carte ; pied de modale optionnel levé hors du corps)

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
2. **Hint / description** — `form-hint` (optionnel, toujours au-dessus du contrôle) ; pas de point final, sauf si le hint contient plusieurs phrases
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

Exceptions actuelles : alertes form-wide (`#error`, `#theme-error`) sous le bloc de champs (héritage ; pour une erreur générale, préférer un toast — voir **Notifications**) ; **cases à cocher** et **boutons radio** : contrôle à gauche du libellé / hint (`form-check`, voir ci-dessous).

## Listes déroulantes (design system — styleguide)

Markup&nbsp;: `select.form-control` (même look qu’un champ texte). Surcouche unobtrusive&nbsp;: `enhanceFormSelects()` / `enhanceFormSelect()` dans `form-select.js` — déclencheur stylé + liste custom (optgroup, clavier, états). Option placeholder (`value=""`) exclue de la liste ; reset `ri-close-circle-fill` (non focusable) pour y revenir. Icônes d’option&nbsp;: `data-icon-left` / `data-icon-right` (clés Remix de `icons.js`, ex. `printer`, `arrow-right`). Icône de champ (comme un input)&nbsp;: `form-control-wrap` + `form-control-icon` autour du `<select>`. Le `<select>` natif reste synchronisé. Appliqué : éditeur (thème + `ri-palette-fill`, groupes **Thèmes personnalisés** / **Thèmes par défaut** si personnalisés). Galerie&nbsp;: `#developer/selects`.

## Curseurs / range (design system)

Même ordre de champ. Contrôle&nbsp;: `form-range-row` (`input[type=range]` + `output` optionnel). Reset optionnel (`formRangeResetMarkup()` / `bindFormRange()` dans `form-range.js`)&nbsp;: bouton `ri-close-circle-fill` après l’input / output, non focusable, emplacement toujours réservé, icône visible seulement si la valeur diffère du défaut ; l’`output` passe alors en gras. Poignée carrée sans bordure ; focus sur la poignée seule ; erreur = message seulement (pas de teinte rouge sur le curseur). Appliqué : paramètres (colonnes, bordure, coins, images, grille d’impression) · impression (grille). Galerie&nbsp;: `#developer/sliders`.

## Cases à cocher (design system)

Exception d’ordre&nbsp;: la case est **à gauche** du libellé et du hint (hint sous le libellé), centrée verticalement sur le bloc texte. Contrôle&nbsp;: `label.form-check` (`input.form-check-input` masqué + `form-check-ui` + `form-check-text` avec `form-label` / `form-hint` optionnel). Erreur = message `form-error` seulement (pas de teinte rouge sur la case). Taille&nbsp;: `sm` (case plus petite). États&nbsp;: disabled (grisé, non soumis) · lecture seule (`aria-readonly="true"` — l’attribut HTML `readonly` est ignoré par les checkboxes ; `bindFormCheckboxes()` bloque le bascule, valeur toujours soumise). Pas d’état visuel obligatoire ni invalide. Groupes&nbsp;: `fieldset.form-check-group` + `legend.form-label` optionnelle + `form-check-list` (vertical) ou `form-check-list--row` (horizontal, wrap) ; la liste (et l’erreur de groupe) est indentée sous la légende. Module&nbsp;: `formCheckboxMarkup()` / `bindFormCheckboxes()` dans `form-checkbox.js`. Carré sans arrondi ; coche Remix `ri-check-fill` ; pas de hover ; focus sur la case. Galerie&nbsp;: `#developer/checkboxes`. Appliqué : paramètres / `#print` (**Tracé de découpe** / **Fond perdu**, horizontal).

## Boutons radio (design system)

Même principe d’affichage que les cases à cocher. Contrôle&nbsp;: `label.form-check.form-radio` (`input.form-check-input` `type="radio"` masqué + `form-check-ui` + `form-check-text`). Même hint, erreur (`form-error` seulement), taille `sm`, disabled, lecture seule (`aria-readonly="true"` — l’attribut HTML `readonly` est ignoré par les radios ; `bindFormRadios()` bloque le choix, y compris si une autre option du même `name` est cliquée alors que l’option cochée est figée ; valeur toujours soumise). Groupes&nbsp;: même `name` pour une option unique ; `fieldset.form-check-group` + `form-check-list` / `form-check-list--row`. Module&nbsp;: `formRadioMarkup()` / `bindFormRadios()` dans `form-radio.js`. Remix `ri-radio-button-line` (masque CSS) aux deux états ; au repos, le disque interne est retiré (même viewBox) ; pas de hover ; focus sur le rond. Appliqué : paramètres (mode d’affichage, vertical ; ordre d’impression des cartes, horizontal ; côté d’impression, horizontal ; assemblage des feuilles, vertical) · `#print` (ordre d’impression, côté d’impression / assemblage) · sauvegarde (`#backup`, type de sauvegarde). Galerie&nbsp;: `#developer/radios`.

## Couleurs (design system)

Même ordre de champ. Contrôle&nbsp;: `input.form-control` texte dans un wrapper `form-color`, avec pastille à gauche (`input[type=color]`) et bouton effacer (`ri-close-circle-fill`) en overlay à l’intérieur du champ. Clear visible seulement s’il y a une valeur (peut être omis / disabled) ; non focusable (`tabindex="-1"`). Pastille&nbsp;: uniquement si hex valide ; sinon couleur par défaut du champ (`fallback` / `fallbackColor`), sinon damier transparent. Placeholder = fallback (mis à jour par `setValue`). Module&nbsp;: `form-color.js`. Appliqué : paramètres · thèmes · champ image (fond). Galerie&nbsp;: `#developer/colors`.

## Images (design system)

Contrôle&nbsp;: wrapper `form-image` (`formImageMarkup()` / `bindFormImage()` dans `form-image.js`). `processFile(file) => Promise<dataUrl>` obligatoire (`compressImage` pour les cartes et les logos). SVG conservé en vectoriel (scripts / `foreignObject` / `on*` retirés au chargement et à l’import). Rasters : si **Optimiser les images** (Paramètres → Application, coché par défaut) → WebP (côté max 2000&nbsp;px ; repli PNG si l’encodage canvas échoue) ; sinon JPEG / WebP / PNG conservés s’ils tiennent en 2000&nbsp;px, sinon retaillés (même format) ; le reste → PNG. Deux vues&nbsp;:

- **Vide** — hint « Charger une nouvelle image pour la prévisualiser et la recadrer » (`form-hint`) + **Depuis mes fichiers** (`btn primary`, `ri-file-line`, `<input type="file">` caché) et **Depuis une URL** (`btn secondary sm`, `ri-link`). URL → modale enfant `modal--sm` sans route (titre « Charger depuis une URL » + `ri-link`, champ URL avec `ri-cloud-fill`, `form-error` sous l’input ; chargement : brique + « Chargement... » sous le champ) ; pied à droite **Annuler** `secondary sm` + **Charger** `primary` (`ri-upload-fill`, comme Importer) ; fermeture seulement si le chargement réussit (Échap / backdrop / X = dismiss). Pipeline : `fetchImageAsFile` puis `processFile` (l’URL n’est pas conservée).
- **Image** — champ **Fond de l’image** (`form-color`, sans hint) puis aperçu `.form-image-crop` (`tabindex="0"`). Overlays : 3 badges centrés (`btn primary sm`, apparence seulement : zoom `%`, alignements `%` signés ; `ri-zoom-in-fill` / `ri-align-item-horizontal-center-fill` / `ri-align-item-vertical-center-fill`) ; reset `btn ghost sm icon-only` (`ri-close-circle-fill`) en haut à droite si cadrage ≠ 100 % / 0 / 0 ; **Supprimer** (gauche, `ri-delete-bin-2-fill`) et **Sauvegarder** (droite, `ri-download-fill`, comme Sauvegarder la collection) `btn primary sm` (supprimer : `confirmDialog` ; sauvegarde réussie : toast **Image sauvegardée** ; cartes : nom `brickcard-card-image-YYYY-MM-DD-{ref-slug}-{titre-slug}.{ext}` — ref et/ou titre slugués ; sans les deux : id de la carte ; logos de thème : `brickcard-theme-logo-YYYY-MM-DD-{nom-slug}.{ext}` ; sans nom : id du thème). Tabulation aperçu : reset (s’il est visible) → Sauvegarder → Supprimer. Cadrage au focus (glisser / molette / flèches / `+` `−`). Ratio : `--form-image-aspect` (défaut `1 / 1`). Fond de l’aperçu = couleur du champ, live.

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

Appliqué : topbar liste · modale thèmes (compteur + tri : nombre de cartes, titre, date de modification si ≥ 2 thèmes personnalisés — thèmes par défaut non concernés ; défaut nombre de cartes décroissant) · accueil `#developer` et `#settings` (`search-bar--input-only`, sans compteur ni tri). Correspondance : `includesCI` (`includes-ci.js`), insensible à la casse et aux accents. Galerie&nbsp;: `#developer/search`.

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
| Dialog | `h1.view-title` (`aria-labelledby`) — titre **court** + **une** icône Remix max à gauche si le déclencheur en a une (`modalTitleMarkup`) : icône à gauche centrée verticalement, titre à côté (plusieurs lignes si besoin, comme les toasts) ; édition carte / thème : `ri-pencil-fill` ; confirmations : un peu plus long, avec le sujet ; galeries / aide au développement / modèles : section (lien `#developer`, icône optionnelle) + `ri-arrow-right-wide-fill` + titre (pas d’icône de tuile) ; `#page/about` : logo app (même look qu’une icône Remix) + `Brickcard v{{APP_VERSION}}` + `ri-arrow-right-wide-fill` + `À propos` | `h2.section-title` |
| Page Markdown en modale | `# Titre` → titre du dialog (retiré du corps) ; about : `# À propos`, version dans le titre, pas dans le corps | `##` → `h2`, `###` → `h3` dans `.md-content` |

Pas des headings&nbsp;: marque topbar, `form-label`, noms de cartes (grille thèmes, Brickcard). Galerie&nbsp;: `#developer/typography`.

Titre de document (`<title>` / `document.title`, `document-title.js`)&nbsp;: défaut **Brickcard - Imprimez de bien jolies cartes pour vos briques LEGO®** (`APP_DOCUMENT_TITLE` dans `version.js` et `src/index.html`, **pas** de version). Accueil = ce titre. Overlay / page&nbsp;: `{titre de la modale} | {titre de la section si elle existe (espace développeur)} | {titre par défaut}`. Dialogues enfants (confirmation, URL d’image / de sauvegarde, démo d’accueil, démo styleguide, éditeur presets) se superposent le temps de l’affichage. Pendant `window.print()`, le titre devient le nom de fichier PDF (voir **Impression**) ; le schéma overlay n’est pas appliqué.

États vides (`section.empty-view` / `.empty-view-body`, helper `emptyViewMarkup` dans `empty-view.js`)&nbsp;: titre + texte + tuiles centrés dans `#main` ou le `modal-body` ; brique CSS collée au-dessus (hors flux). Accueil sans carte&nbsp;: «&nbsp;Bienvenue ;)&nbsp;» + tuiles Nouvelle carte / Importer une sauvegarde / Charger une démonstration (`welcomeViewMarkup` ; galerie `#developer/welcome`, tuiles import et démo inertes) ; sur grand écran le bloc remonte d’une hauteur de header (header visuellement vide) ; sur petite hauteur (ex. téléphone paysage) le bloc s’aligne en haut, `#main` défile, et une réserve compte la brique hors flux. Recherche sans résultat (cartes, thèmes, paramètres, accueil espace développeur)&nbsp;: «&nbsp;Oups&nbsp;!&nbsp;». Premier affichage&nbsp;: «&nbsp;Chargement...&nbsp;» jusqu’à cartes + thèmes prêts ; échec de boot → message rouge (`#boot-error`), animation arrêtée, `ri-error-warning-line` au centre de la brique, **Réessayer** sous le message (`loadingViewMarkup` ; galerie `#developer/loading` : en cours, erreur, erreur avec Réessayer).

## Modales (design system)

Coquille&nbsp;: `modal-backdrop` + `modal` (`role="dialog"` / `aria-modal`). Bordure&nbsp;: `2px solid var(--ink)` (comme le focus des champs). Alignement vertical (sur le backdrop)&nbsp;: `modal-backdrop--top` · `modal-backdrop--middle` (**défaut**) · `modal-backdrop--bottom`. Header inversé (fond `ink` / texte `panel`)&nbsp;: titre (`h1.view-title`, court) + **une** icône Remix max à gauche (décorative, reprise du bouton / de la tuile qui ouvre ; exception édition carte / thème : `ri-pencil-fill` ; galeries développeur : icône de section sur le lien, pas d’icône de tuile ; `#page/about` : logo app en `currentColor` ; l’icône reste à gauche, centrée verticalement ; le titre à côté peut passer sur plusieurs lignes, comme `.toast-header`) + `btn primary icon-only modal-close` (même variante DS, tokens inversés comme le menu impression&nbsp;: repos fond `--bg` / hover fond `--ink` + bordure `--bg`). Bouton fermer centré verticalement, même inset haut / droite / bas ; `tabindex="-1"` (pas tabulable — fermeture : Échap / clic). Corps&nbsp;: `modal-body` (`tabindex="-1"` — Chrome rend les `overflow: auto` tabulables). À l’ouverture, focus sur `.modal` (`tabindex="-1"`) : Tab va au contenu, puis le pied ; Tab boucle dans la modale au premier plan. Scroll du backdrop et du `modal-body` remis en haut (y compris swap d’une galerie développeur). Pied optionnel&nbsp;: `modal-footer` avec `modal-footer-start` (gauche&nbsp;: sauvegarde / validation) et `modal-footer-end` (droite&nbsp;: danger) — boutons centrés verticalement (normal / `sm`). **Annuler**&nbsp;: `sm` s’il y a d’autres boutons d’action dans le pied, taille normale s’il est seul (`openConfirmDialog` l’applique tout seul). Exception `modal-footer--primary-first` (éditeur de carte, éditeur de thème, paramètres d’impression, sauvegarde `#backup`, import `#import`)&nbsp;: visuel Annuler puis action primaire à droite (éditeurs&nbsp;: Supprimer à gauche) ; ordre clavier (DOM) primaire → Annuler → Supprimer. Séparateur header&nbsp;: `2px solid var(--ink)` (pas de bordure haute sur le footer).

Tailles (3)&nbsp;: `modal--sm` (~640) · `modal--md` (~896, **défaut**) · `modal--lg` (~1152). Toujours bornées au **viewport** (`100vw` / `100dvh`). Responsive ≤&nbsp;640px&nbsp;: **plein écran**, overlay masqué.

Appliqué&nbsp;: paramètres / page MD / sauvegarde (`#backup`) / import (`#import`) / espace développeur / paramètres d’impression (`#print`) (`md`) · thèmes + éditeur carte + éditeur de thème personnalisé + `#developer/theme-presets` (`lg` ; thèmes, paramètres, accueil `#developer` et `#developer/theme-presets` : hauteur toujours `var(--modal-max-h)`, le corps défile) · confirmations / chargement d’image ou de sauvegarde depuis une URL / démo d’accueil (`sm`). Galerie&nbsp;: `#developer/modals`. Dialogues enfants (supprimer carte / thème / tous les thèmes perso / image, reset local, URL d’image / de sauvegarde, démo d’accueil) : second `modal-backdrop` dans le même host, sans route — helper `confirmDialog()` / `openConfirmDialog()` (`confirm-dialog.js`) ou `openDemoBackupDialog()` ; titre un peu plus long et explicite (ex. `Supprimer la carte « Saucer Centurien (#6939) » ?`). Pas de `alert()` / `confirm()` / `prompt()` natifs.

## Notifications (Toast)

Vocabulaire UI → classes CSS :

| Axe | Options |
|-----|---------|
| Pile | `#toast-root` / `.toast-root` (fixed, z-index 10000, au-dessus des modales) |
| Toast | `.toast` · `.toast--success` · `.toast--error` |
| Header | `.toast-header` : icône + `.toast-title` à gauche ; `.toast-secondary` (`small`) + croix à droite |
| Corps | `.toast-body` / `.toast-message` ; sans titre : `.toast-body--bare` (icône à gauche, croix à droite, centrés verticalement) |
| Croix | `btn primary icon-only sm toast-close` (tokens inversés comme `.modal-close`, tabulable) |
| Type | `normal` (défaut, noir / blanc dark, pas d’icône ni de titre) · `success` (vert, titre **Succès**, `ri-checkbox-circle-fill`) · `error` (rouge, titre **Erreur**, `ri-error-warning-fill`) |

API `toast()` / `dismissToast()` dans `toast.js`. Message obligatoire. Titre, icône, texte secondaire, croix optionnels (`title` / `icon` : `undefined` = défaut du type, `false` = masqué). `messageHtml` optionnel (HTML de confiance pour le corps, ex. taille en gras ; `message` reste le texte brut). `delay` 7000&nbsp;ms (défaut) ; import / sauvegarde de la collection (`TOAST_DELAY_BACKUP`) 15&nbsp;s ; `false` / `0` = pas d’auto-fermeture (croix alors forcément affichée). Plusieurs toasts empilés : le nouveau s’ajoute en bas, les précédents remontent. ≤&nbsp;640px&nbsp;: pleine largeur centrée (marge 1,25rem). Cadre 2&nbsp;px transparent ; séparateur header 2&nbsp;px <code>var(--bg)</code> (blanc clair / noir sombre). Pas d’animation. Galerie&nbsp;: `#developer/notifications`.

**Priorité** : pour un succès ou une erreur **générale** (chargement, enregistrement, suppression, téléchargement, reset…), utiliser `toast()` (`success` / `error`) plutôt qu’un statut / `form-error` dans le corps de la vue. Les erreurs de **champ** (`form-error` sous l’input, `is-invalid`) restent sous le contrôle — pas de toast pour la validation champ par champ.

## Impression

A4 portrait ; **grille** 1×1 à 10×10 (défaut **3×3** poker 63×88 mm). Écart 5 mm (horizontal et vertical). Autres tailles : échelle pour remplir la largeur (agrandir à 1–2, réduire à 4–10) ; cartes entières seulement. **Tracé de découpe** (cases Sur la face avant / Sur le dos (arrière), défaut face seulement) : filet 1 px `#000000` autour des cartes sur les côtés cochés (papier blanc ; overlay `.print-slot::after`) ; rien de coché → pas de filet. **Fond perdu** (cases Sur la face avant / Sur le dos (arrière), dos coché par défaut) : rectangle 2 mm des quatre côtés (`.print-bleed-face` / `.print-bleed-back`, scale avec la grille) ; case grisée / désactivée et pas de fond perdu si le tracé de découpe du même côté est coché. **Ordre d’impression des cartes** (indépendant de la liste) : référence (défaut) / titre / année de sortie / nombre de pièces / nombre de figurines / date de modification ; toujours croissant (ASC). **Côté d’impression** : les deux faces (défaut) / face uniquement / dos uniquement. **Assemblage des feuilles** A4 : alterner (défaut) ou regrouper (tous les rectos, puis tous les versos). Miroir horizontal au dos (flip bord long). Les mêmes réglages sont dans Paramètres (`#settings`, section Impression) et dans `#print` (menu « Lancer l’impression », reste ouverte pendant l’impression). Raccourci **Ctrl/Cmd+P** : ouvre `#print` (hors éditeur carte / thème / presets, hors `#import` et hors dialogue enfant) ; déjà ouverte → lance l’impression. Rien à imprimer : message à la place des options. Avant `window.print()`, attendre le décodage des photos et des logos de thème (fichiers des thèmes par défaut inclus, même encore `hidden` en attendant `onload`) — ne pas écraser les handlers d’image. Pendant `window.print()`, `document.title` = nom proposé du PDF (`brickcard-YYYY-MM-DD-grille-NxN-…`, sans `.pdf`) via `beginPrintDocumentTitle` / `endPrintDocumentTitle` (`document-title.js`) — posé **avant** de construire les feuilles (Gecko met `contentTitle` à jour en async). Firefox : `afterprint` = clone prêt, pas la fermeture du dialogue (ignorer pendant `print()` ; restaurer quand `print()` a bloqué, ou à `afterprint` côté Chrome). Le schéma overlay n’écrase pas le nom. Dos : label **Brickcard**.

## Conventions

- Garder le nom produit **Brickcard** dans l’UI et la doc.
- Garder les noms de champs **verbeux** sur les modèles Card / LegoTheme.
- UI française, design minimaliste (pas d’arrondis/ombres UI).
- **Typo** : Open Sans pour l’UI (`--font-ui`) ; Inter pour le texte des cartes (`--font-card`) — fichiers dans `src/fonts/`, pas de CDN. Titres : classe = look, tag = plan (voir **Titres**).
- **Icônes** : toujours partir de [Remix Icon](https://remixicon.com/) (style *fill* de préférence) avant d’inventer un SVG. Réutiliser / étendre `src/js/icons.js` ; en HTML, commenter le nom `ri-*`.
- Pas de `alert()` / `confirm()` / `prompt()` natifs : `confirmDialog()` / `openConfirmDialog()` / `alertDialog()` (`confirm-dialog.js`).
- **Notifications** : succès et erreurs **générales** → `toast()` en priorité (`success` / `error`). Validation de formulaire → `form-error` sous le champ concerné, pas de toast.
- Pas de dépendances npm sauf demande explicite.
- **Modules** : le boot charge la liste, le stockage et le chrome (dont le design system déjà tiré par le menu impression). Les overlays de route et les galeries `#developer/…` se chargent par `import()` natif au moment du besoin (`print.js` au clic **Lancer l’impression**). Pas de bundler ; pas de `?v=` hors import map `app.js` / `version.js`.
- **Git — commits** : commit dès qu’une intention (feature ou fix) est **terminée**, ou **avant** d’en commencer une autre. Un commit = une intention (un revert = une seule chose). Ne pas attendre « commit ». Ne pas tout coller en un dump de session. Ne jamais committer `.local/` ni `.cursor/`.
- **Git — version, tag et push** : **seulement sur demande explicite**. N’incrémenter `APP_VERSION` (ni le `?v=` de cache dans `index.html` : CSS et import map `app.js` / `version.js`, ni `CACHE` dans `service-worker.js`, ni une entrée datée dans `CHANGELOG.md`) que sur demande. Entre deux versions, noter les changements sous `## [Unreleased]`. Si le numéro n’est pas dit, demander (patch / mineure / majeure) — ne pas choisir. Cible acceptée **sans confirmation** : uniquement le prochain patch (`0.8.0` → `0.8.1`), la prochaine mineure (`0.8.0` → `0.9.0`) ou la prochaine majeure (`0.8.0` → `1.0.0`), d’après `APP_VERSION` actuelle. Tout le reste (saut `0.7.1` → `0.9.0`, downgrade, même numéro, SemVer invalide, tag `vX.Y.Z` déjà présent) : **s’arrêter et demander** avant bump / tag / push. Bump OK → commit `chore: bump to X.Y.Z` + tag annoté `vX.Y.Z`. Push (commits **et** tags) seulement si demandé. Le push du tag `vX.Y.Z` publie la GitHub Release (workflow `release.yml`, zip/tar.gz natifs) ; ne pas appeler `gh release create` en local.
- **Git — messages** : `feat` / `fix` / `docs` / `chore` + 1 phrase *pourquoi* (anglais) ; corps optionnel. `feat` = nouvelle capacité, `fix` = correctif, `docs` = AGENTS / README, `chore` = bump de version, CI, assets. Pas de scope (`feat(print):`), pas d’autre type.
