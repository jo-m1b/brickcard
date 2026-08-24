# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format s’inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Changed

- GitHub Release : les notes groupées n’affichent plus le préfixe `feat:` / `fix:` / `docs:` / `chore:`

### Fixed

- GitHub Release : le dernier commit entre deux tags est bien listé dans les notes

## [0.8.1] — 2026-08-24

### Added

- GitHub Releases : publication automatique (notes groupées + zip/tar.gz source) à chaque tag `vX.Y.Z`

### Fixed

- Accueil vide : sur petite hauteur (ex. téléphone paysage) le contenu défile ; la brique et « Bienvenue » ne passent plus sous le header
- Impression : les logos des thèmes par défaut (fichiers `data/theme-logo-…`) sont attendus avant `window.print()` — plus de dos avec seulement le logo Brickcard centré si l’image n’était pas encore chargée

## [0.8.0] — 2026-08-23

### Added

- Import de sauvegarde : modale `#import` (fichier ou URL, validation en mémoire, choix de fusion, recap live) ; l’écriture n’a lieu qu’au clic **Importer**
- Sauvegarde de démo : `data/backup-demo-jo.brickcard` ; tuile d’accueil **Charger la démonstration** (`ri-emotion-fill`) qui l’importe automatiquement (modale **Sauvegarde de démonstration**, sans étape de choix)
- Thèmes (par défaut et perso) : couleur secondaire optionnelle (`secondaryColor`) pour les textes, icônes de badge et logo Brickcard ; vide = noir ou blanc automatique
- Sauvegarde de la collection : modale `#backup` (type complète / personnalisée, recap live, poids estimé)
- Sauvegarde : raccourci Ctrl/Cmd+S pour ouvrir `#backup` (hors éditeur carte / thème / presets et hors `#import`)
- Espace développeur : galerie **Page de bienvenue** (`#developer/welcome`, `ri-home-smile-fill`) — modèle de l’accueil lorsque la collection est vide

### Changed

- Import : plus de dialogue Fusionner / Remplacer ; toujours une fusion, configurée dans `#import` (Paramètres et accueil vide ouvrent la modale)
- Import : messages d’erreur de sauvegarde invalide / version incompatible reformulés (« La sauvegarde chargée… »)
- Import URL : brique animée + « Chargement... » sous le champ pendant le téléchargement / parse
- Images / logos : même indicateur de chargement dans « Charger depuis une URL »
- Éditeur de thème : placeholder de la couleur secondaire = noir ou blanc auto (suit la couleur principale)
- Éditeur de thème : libellés « Couleur » / hints principale et secondaire
- Contraste auto des cartes (`contrastText`) : texte / logo noirs seulement sur un fond vraiment pâle (plus de noir sur les jaunes, oranges et limes saturés)
- Logo Brickcard des cartes (dos, face sans photo, tuiles thèmes sans logo) : masque CSS coloré par `--card-accent-fg` (plus de swap `brickcard-logo.svg` / `brickcard-logo-white.svg`)
- Sauvegarde `#backup` : le bouton **Sauvegarder** ferme la modale une fois le fichier lancé ; recap « Aucune carte à sauvegarder ! » (gras) si le bouton est désactivé
- Images SVG (cartes et logos) : conservées en vectoriel au chargement (fichier / URL) pour pouvoir les retélécharger ; scripts, `foreignObject` et gestionnaires `on*` retirés (y compris à l’import)
- Sauvegarde de la collection : modale `#backup` (complète ou personnalisée) avant le téléchargement ; version du fichier = version de l’app ; noms `brickcard-backup-…` ; import des anciens fichiers `version` 1–3 et des réglages d’apparence s’ils sont présents
- Titre de document : slogan par défaut (sans version) ; overlays `{modale} | {section si besoin} | {défaut}` ; nom de fichier PDF inchangé pendant l’impression
- Service worker : `service-worker.js` à la racine du site (scope `/` ; GitHub Pages ne permet pas de le placer dans `js/`)

### Fixed

- Service worker : l’install ne casse plus si le précache GitHub Pages échoue (`cache.addAll`) ; le script n’est plus intercepté ni remplacé par `index.html`

## [0.7.5] — 2026-08-22

### Added

- Espace développeur : section **Modèles** (`ri-pages-fill`) et galerie **Page de chargement** (`#developer/loading`, `ri-loader-4-fill`) — aperçus « Chargement en cours » (animé) et « Erreur de chargement » (message rouge, figé)
- Espace développeur hors local : inactif par défaut ; `#developer` (et sous-routes) propose une confirmation (Annuler / Activer) ; l’activation est persistée jusqu’à Réinitialiser, et affiche la section Paramètres « Options pour les développeurs »

### Changed

- Chargement (erreur) : icône `ri-error-warning-line` au centre de la brique ; header inchangé (marque seule, comme en cours)
- Chargement : titre centré hors des points ; points en séquence `.` / `..` / `...` / vide ; clignotement des plots seulement (plus le corps de la brique)
- Accueil vide : « Bienvenue ;) », « votre collection » ; bloc remonte d’une hauteur de header (grand écran)
- Pied de modale : « Annuler » en `sm` s’il y a d’autres actions ; taille normale s’il est seul
- Sauvegarde de la collection : fichier `.brickcard` (JSON) au lieu de `.json` ; import limité à `*.brickcard`
- Import : refus des fichiers qui ne sont pas une sauvegarde Brickcard (`app`, `version`, `cards` / `themes`)
- Paramètres : tuile Sauvegarder désactivée si la collection est vide
- Espace développeur / thèmes par défaut : boutons « Sauvegarder themes-presets.json » et « Sauvegarder les logos » (au lieu de « Télécharger… »)
- Accueil (liste ou vue vide) : URL sans hash (jeton interne `#`)
- Routes : overlays en `#settings`, `#new-card`, `#developer/…` (plus de `/` juste après `#`) ; anciennes URLs `#/…` nettoyées
- Paramètres d’impression : route `#print` (comme les autres overlays) ; rien à imprimer → message à la place des options
- Reset local : rechargement en `?{timestamp}` (plus de `?_=`) ; la query est retirée une fois l’app relancée
- Header : bouton « Nouvelle carte » en icône seule seulement sous 540px (libellé visible plus longtemps, nom d’app plus court)
- Nom produit et identifiants techniques : **Brickcard** (`APP_ID`, IndexedDB, localStorage, cache SW, images app)
- Captures README : `docs/screenshots/brickcard-liste.png` et `brickcard-editor.png` (sans version dans le nom, mises à jour pour l’UI actuelle)
- Logos de thèmes SVG : nettoyage SVGO (comme SVGOMG : preset + `viewBox` conservé) — ~1,3 Mo → ~0,95 Mo ; `indiana-jones` inchangé (SVGO l’alourdissait)

### Fixed

- Espace développeur / thèmes par défaut : routes `#developer/theme-presets/new` et `#developer/theme-presets/edit/{slug}` (Précédent revient à la liste)
- Chargement : si un module ou `boot()` échoue, le message technique s’affiche en rouge sous « Chargement... » (plus d’écran bloqué sans explication)
- Service worker : revalidation réseau (`cache: "reload"`) pour ne pas resservir un JS périmé (ex. export manquant)

## [0.7.4] — 2026-08-20

### Added

- Curseurs (`form-range-row`) : bouton reset (valeur par défaut, `ri-close-circle-fill`, non focusable), emplacement toujours réservé, icône visible si ≠ défaut ; `output` gras dans ce cas ; module `form-range.js` ; galerie `#/developer/sliders`
- Cases à cocher (`form-check`) : libellé, hint, sm, états (disabled, lecture seule, erreur), groupes (colonne / rangée, légende) ; module `form-checkbox.js` ; galerie `#/developer/checkboxes`
- Boutons radio (`form-check form-radio`) : même affichage que les cases à cocher, glyphe `ri-radio-button-line` (repos sans le disque interne), sélection exclusive ; module `form-radio.js` ; galerie `#/developer/radios`
- Paramètres et impression : restaurer le défaut des curseurs (colonnes, bordure, coins, images, grille)
- Paramètres → Apparence des cartes : arrondi des images (0–8 mm, pas 0,5, défaut 1 mm), indépendant de l’arrondi des coins

### Fixed

- Modales : scroll remis en haut à l’affichage (backdrop + corps), y compris en swapant une galerie de l’espace développeur
- Impression dos : fond perdu aligné sur la grille (plus de décalage haut / droite)

### Changed

- Boutons **Enregistrer** : `ri-save-fill` ; **Supprimer** : `ri-delete-bin-2-fill` (y compris titres de confirmation) ; chargement d’image : **Depuis mes fichiers** `ri-file-line`, **Depuis une URL** `ri-link` ; modale URL : champ avec `ri-cloud-fill`, **Charger** `ri-upload-fill` ; image chargée : **Sauvegarder** `ri-download-fill` (comme Sauvegarder la collection)
- Éditeur de carte : icônes de champ (référence `#`, année / pièces / figurines des badges, thème palette)
- Page À propos : logo app + `Brickcard v…` + `ri-arrow-right-wide-fill` + `À propos` ; plus de version dans le corps
- Paramètres : descriptions des tuiles collection / développeurs (Importer, Sauvegarder, Supprimer les cartes, Espace développeur, Réinitialiser)
- Espace développeur : libellés des tuiles (titre + description) et titres de galeries (singulier + nom anglais)
- Modales : une icône Remix max à gauche du titre (déclencheur : tuile / bouton ; édition carte / thème : `ri-pencil-fill` ; galeries développeur : icône de section seulement)
- Espace développeur : titre des galeries / aide au développement = nom de section (lien `#/developer`, icône `ri-collage-fill` / `ri-pencil-ruler-2-fill`) + `ri-arrow-right-wide-fill` + titre de page ; hover / focus du lien = bouton primary (tokens du Fermer)
- Espace développeur : plus de liens retour en pied de galerie ; index : **Aide au développement** en premier, icônes sur les titres de section
- Modales plein écran (≤ 640px) : lien de section dans le titre réduit à l’icône si présente (texte masqué)
- Champ image : pas de zoom molette / `+` `−` à 1 % (au lieu de 8 %)
- Paramètres : « Arrondi des coins » ne s’applique plus aux photos (réglage dédié) ; défaut 2 mm (au lieu de 1,5 mm)
- Paramètres → Apparence des cartes : couleur par défaut en premier
- Impression : label « Impression recto-verso des feuilles » (modale et paramètres)
- Impression dos : fond perdu 1 mm gauche / droite, 2 mm haut / bas (scale avec la grille)
- Logos des thèmes par défaut : 70 fichiers minifiés (~6,6 Mo) ; SVG Indiana Jones, SpongeBob SquarePants et Teenage Mutant Ninja Turtles nettoyés (métadonnées Inkscape)

## [0.7.3] — 2026-08-18

### Added

- Espace développeur : outil **Thèmes par défaut** (`#/developer/theme-presets`) — brouillon IndexedDB isolé de `themes-presets.json` (recherche, CRUD, logo / cadrage, id/slug), téléchargement du JSON et des logos `theme-logo-{id}.{ext}` ; n’écrit pas la collection
- Thèmes par défaut : champs optionnels `logoZoom`, `logoOffsetX`, `logoOffsetY` dans `themes-presets.json` (lus au chargement)

### Changed

- Logos des thèmes par défaut : déplacés de `src/img/` vers `src/data/` (`logoSrc` = `data/theme-logo-…`) ; `src/img/` réservé aux assets UI
- Thèmes par défaut : logos retravaillés ; Alien Conquest en WebP ; cadrage (Avatar: The Last Airbender, Friends, Space, Star Wars) ; couleurs Avatar et The Angry Birds Movie
- Espace développeur / thèmes par défaut : hauteur de modale fixe (`var(--modal-max-h)`) ; plus de kicker ni lien retour styleguide
- Thèmes : après enregistrement d’un thème, recherche vidée et tri sur date de modification (récent d’abord)
- Thèmes : compteur de cartes masqué sur les tuiles à 0 carte
- Modales : `modal-body` plus tabulable ; à l’ouverture, focus sur la modale (Tab → Fermer, contenu, actions ; Tab ne sort plus vers l’arrière-plan)
- Espace développeur : intro retirée ; tuiles regroupées sous « Système de design »
- Éditeurs carte / thème : aperçu plus sticky en une colonne (suit le scroll)
- Éditeur de carte : aperçu face et dos côte à côte entre 540px et 840px
- Mobile : plus de pull-to-refresh ni de swipe précédent/suivant (overscroll contenu dans `.app`)

### Removed

- Thèmes par défaut : 4 Juniors, Games, Homemaker, Make & Create, Xtra

## [0.7.2] — 2026-08-17

### Added

- Champ image (design system) : `form-image` (fichier / URL, fond, cadrage au focus : glisser, molette, flèches, `+`/`−`) ; galerie `#/developer/images`
- Thèmes personnalisés : taille / position du logo (`logoZoom`, `logoOffsetX`, `logoOffsetY`) ; dos de carte splité (branding haut / logo bas) ; mini-cartes

### Changed

- Dos : cadre du logo (moitié basse, inset 3 mm fixe) ; logo à 75 % de la largeur de carte (zoom 100 %, max 250 %), centré, décalage X/Y, rogné s’il dépasse
- Mini-cartes thèmes : même affichage logo que le dos (75 % × zoom, décalage X/Y, rogné par le cadre)
- Éditeur de carte et logos de thèmes personnalisés : champ `form-image` (thèmes : pas de fond personnalisable, aperçu sur la couleur du thème)
- Éditeur de thème : aperçu du dos à gauche (`.preview-wrap`) ; modale `lg` (comme l’éditeur de carte)
- Éditeur de thème : libellés couleur ; erreur du nom sous le champ ; pied comme l’éditeur de carte (Supprimer à gauche, Annuler / Enregistrer à droite)
- Thèmes : champ `themeName` renommé en `name` (import / IndexedDB encore acceptés)
- Cartes et thèmes : champ `createdAt` retiré (`updatedAt` suffit ; import encore accepté comme repli)
- Polices : Open Sans et Inter auto-hébergées (`src/fonts/`, woff2 variable) ; plus de CDN Google Fonts
- Accueil vide : plus que « Aucune carte pour l'instant dans la collection ! »
- États vides : padding réduit ; plus de scroll vertical dû à la brique hors flux
- Chargement : header réduit à la marque (logo + nom + version)
- Cartes : champ `description` retiré (modèle, IndexedDB à l’enregistrement, export / import)
- Logos thèmes (raster → WebP) : Adventurers, Alpha Team, Art, DOTS, Dreamzzz, Power Miners, Speed Racer, The Lord of the Rings, Trolls World Tour, Wicked
- Logos thèmes (raster → SVG) : Avatar, Bluey, Education, Mindstorms, Minions: The Rise of Gru, Pokémon, Star Trek, Stranger Things, Studios, Teenage Mutant Ninja Turtles, The Legend of Zelda, Transformers, Vidiyo
- Logos thèmes mis à jour : Avatar: The Last Airbender, DUPLO, Rock Raiders, SpongeBob SquarePants
- Thème Xtra : logo retiré (affichage du nom)
- Logo thème Batman : recadré (brique LEGO retirée)
- Logo thème Disney : recadré (brique LEGO retirée)
- Logo thème Fortnite : recadré (brique LEGO retirée)
- Logo thème Hero Factory : recadré (brique LEGO retirée)
- Logo thème Mixels : recadré (brique LEGO retirée)
- Éditeur de carte : titre selon titre/ref (`Modifier la carte` / `Modifier « #ref »` / `Modifier « titre »` / `Modifier « titre (#ref) »`) ; aperçu à gauche, formulaire à droite ; footer visuel Supprimer à gauche, Annuler puis Enregistrer à droite ; tabulation Enregistrer → Annuler → Supprimer
- Impression : modale paramètres, tabulation Lancer l’impression → Annuler (visuel inchangé)
- Thèmes : titre de modale « Thèmes » ; bouton Nouveau thème à droite
- Paramètres : tuile Thèmes (« Gérer et personnaliser les thèmes disponibles »)
- Images app : préfixe `brickcard-` (logo, favicon, apple-touch, manifeste PWA)
- Logos thèmes : préfixe `theme-logo-` (ex. `theme-logo-unikitty.png`)

## [0.7.1] — 2026-08-16

### Added

- PWA : manifest, icônes d’install (192/512, apple-touch), service worker (HTTPS / localhost)

## [0.7.0] — 2026-08-16

### Added

- Accueil : écran de chargement (brique + « Chargement... ») jusqu’à IndexedDB cartes + thèmes
- Chargement : animation CSS (pulse brique, plots, points) ; respect de `prefers-reduced-motion`
- Accueil vide : « Bienvenue », texte, tuiles Nouvelle carte / Importer une sauvegarde
- Recherche sans résultat (cartes et thèmes) : état vide brique + « Oups ! »
- Impression : nom de fichier PDF proposé via `document.title` (`brickcard-YYYY-MM-DD-grille-…`)
- Impression : modale de paramètres (grille 1×1–10×10, côtés des cartes, recto-verso) ; récapitulatif ; réglages persistés
- Paramètres : section Impression (grille, côtés des cartes, recto-verso)

### Changed

- Accueil : plus d’affichage empty optimiste pendant l’ouverture IndexedDB
- Accueil vide : texte en deux lignes ; descriptions des tuiles sur une seule ligne (retour à la ligne si l’écran est trop étroit)
- États vides / chargement : centrage vertical sur le texte (brique collée au-dessus)
- Thèmes : hauteur de modale fixe (plus de yoyo selon la recherche)
- Impression : titre de modale « Paramètres d’impression » ; champ « Grille d’impression » ; Recto-verso en 2 boutons (Alterner / Regrouper)
- Impression : réglage de grille 1×1 à 10×10 ; récap menu et modale alignés ; la modale reste ouverte pendant l’impression
- Impression : côtés des cartes en 3 boutons Face / Dos (recto / verso réservés aux feuilles A4) ; Annuler à droite, à gauche de Lancer l’impression
- Impression : clés persistées `printGrid` / `cardSidesToPrint` / `sheetRectoVerso` (pas de migration de l’ancien format)
- Menu Impression : description « Grille N×N » puis nombre de feuilles
- Modales : plus de sous-titre dans le header ; bouton fermer en `primary` icône seule (couleurs inversées sur le header ink)
- Confirmations : titre explicite (carte, thème, import, reset) à la place d’un sous-titre
- Pages Markdown : `# Titre` seul ; la version À propos passe dans le premier paragraphe

### Fixed

- Impression : logo Brickcard blanc net (fichier SVG dédié, plus de filtre `invert`)

## [0.6.0] — 2026-08-15

### Added

- Thèmes : tri dans la barre de recherche (nombre de cartes, titre, date de modification si ≥ 2 thèmes personnalisés ; défaut nombre de cartes décroissant)
- Thèmes : mini-cartes au look Brickcard (fond couleur, coins `--card-radius`, titre contrasté en haut ; logo Brickcard si le thème n’en a pas)
- Thèmes : routes `#/themes/new` et `#/themes/edit/:id` (vraie modale d’édition des thèmes personnalisés)
- Paramètres : tuile danger pour supprimer toutes les cartes (thèmes et réglages conservés)
- Thèmes par défaut : 113 thèmes Brickipedia ajoutés (id + nom, tri alphabétique)
- Thèmes par défaut : couleur d’accent pour chaque thème (hex uniques)
- Thèmes par défaut : logos officiels (`img/logo-theme-{{id}}`, SVG privilégié puis WebP / PNG / JPG) pour 121 thèmes ; Games, Homemaker et Make & Create n’ont pas de logo distinct trouvé

### Fixed

- Liste : le focus clavier n’entoure plus que la carte ; léger zoom au survol et au focus
- Liste : le focus reste sur + / − / l’icône d’impression après un clic (quantité)

### Changed

- Thèmes par défaut : lecture seule (plus de modification ni de réinitialisation)
- Thèmes personnalisés : id UUID ; IndexedDB et export JSON ne conservent que les thèmes personnalisés
- Éditeur de carte : liste des thèmes en groupes (Thèmes personnalisés / Thèmes par défaut)
- Thèmes : titre et description de la modale alignés sur la tuile Paramètres
- Thèmes : bouton « Nouveau thème » dans le pied (gauche), avec icône +

### Removed

- Accueil : plus de focus automatique dans la recherche (clavier virtuel sur mobile)

## [0.5.55] — 2026-08-13

### Changed

- Menu Impression : bouton d’ajout aussi pour une seule carte manquante

## [0.5.54] — 2026-08-13

### Changed

- Menu Impression : « manquantes » sur le bouton d’ajout si une partie du lot est déjà dans la file

## [0.5.53] — 2026-08-13

### Changed

- Menu Impression : bouton d’ajout selon le nombre réellement ajoutable (≥ 2) et la recherche

## [0.5.52] — 2026-08-13

### Changed

- Menu Impression : bouton « Vider l’impression »

## [0.5.51] — 2026-08-13

### Changed

- Menu Impression : bouton « Lancer l’impression »

## [0.5.50] — 2026-08-13

### Changed

- Menu Impression : pas de point final sur la description ; espace au-dessus des boutons

## [0.5.49] — 2026-08-13

### Changed

- Menu Impression : libellés du titre et de la description (vide / sélection)

## [0.5.48] — 2026-08-13

### Changed

- Menu Impression : titre, description optionnelle (feuilles A4) et boutons DS inversés sur le fond de l’encart

## [0.5.47] — 2026-08-13

### Changed

- Header : menu Impression toujours collé à droite, aligné sur le bouton Paramètres

## [0.5.46] — 2026-08-13

### Fixed

- Carte : badges (année, pièces, figurines) alignés à droite même sans référence

## [0.5.45] — 2026-08-13

### Removed

- Header : tooltip du bouton Paramètres

## [0.5.44] — 2026-08-13

### Added

- Accueil : focus automatique dans la recherche si la barre est visible ; Tab / clic sur la barre ciblent le champ

## [0.5.43] — 2026-08-13

### Changed

- Header ≤420px : marque réduite à l’icône (nom et version masqués visuellement)

## [0.5.42] — 2026-08-13

### Changed

- Header ≤840px : bouton « Nouvelle carte » en icône seule (le libellé reste accessible)

## [0.5.41] — 2026-08-13

### Fixed

- Avertissement Firefox « Layout was forced before the page was fully loaded » : CSS applicatif avant le script de thème

## [0.5.40] — 2026-08-13

### Changed

- Confirmation du reset local : sous-titre et message alignés sur les tuiles Paramètres

## [0.5.39] — 2026-08-13

### Changed

- Espace développeur : sous-titre « Système de design, exemples et documentation »

## [0.5.38] — 2026-08-13

### Changed

- Paramètres : libellés des tuiles (Importer, Sauvegarder, thèmes, espace dev, Réinitialiser)

## [0.5.37] — 2026-08-13

### Fixed

- Favicon SVG : XML invalide (caractère de contrôle dans le commentaire) — l’icône ne s’affichait pas

### Changed

- Favicon renommé `favicon-brickcard.svg` (comme le logo)

## [0.5.36] — 2026-08-13

### Added

- Favicon SVG (brique du logo) : noir en clair, blanc en dark mode (`prefers-color-scheme`)

## [0.5.35] — 2026-08-13

### Added

- Helper `confirm-dialog.js` : confirmations en `modal--sm` (`confirmDialog` / `openConfirmDialog` / `alertDialog`)

### Changed

- Reset des données locales, import (fusionner / remplacer), suppression de carte et thèmes : plus de `confirm()` natif

## [0.5.34] — 2026-08-13

### Fixed

- Icône palette (tuile Couleurs) : path Remix officiel (`ri-palette-fill`, avec le trou interne)
- Icônes Remix : taille intrinsèque 24×24 et `aspect-ratio: 1` pour ne plus les aplatir

## [0.5.33] — 2026-08-13

### Changed

- Espace développeur : sous-titres (`view-desc`) courts ; le détail passe dans le corps des galeries

## [0.5.32] — 2026-08-13

### Added

- Tuiles : variante `danger` (couleurs des boutons danger) ; reset local en tuile danger

## [0.5.31] — 2026-08-13

### Changed

- Tuiles : look figé (inversion hover/focus, trait bas inset) ; appliquées aux paramètres, à l’état vide, et aux actions (`button.tile`)

### Removed

- CSS `.settings-actions` (remplacé par `ul.tile-list`)

## [0.5.30] — 2026-08-13

### Added

- Design system : tuiles (`a.tile` / `ul.tile-list`, titre, description, icône, disabled) et galerie `#/developer/tiles`

### Changed

- Index de l’espace développeur : navigation par tuiles (plus de `styleguide-nav-link`)

## [0.5.29] — 2026-08-13

### Fixed

- Espace développeur : Précédent / Suivant suivent les galeries (`#/developer` → `#/developer/links`, etc.) au lieu de sauter l’index

## [0.5.28] — 2026-08-13

### Added

- Design system : liens (`a.link`, tailles, disabled, icône Remix, externe) et galerie `#/developer/links`

### Changed

- Markdown et liens de contenu : couleur texte + underline (plus de bleu / violet visité ni accent rouge)

## [0.5.27] — 2026-08-13

### Changed

- Croix / Échap / backdrop d’un overlay : retour à l’accueil (`replace`), plus de `history.back()`
- Styleguide : liens internes `#/developer/…` en `replace` (une seule entrée d’historique)

## [0.5.26] — 2026-08-13

### Changed

- Navigation overlay → overlay : swap du contenu sans fermer/rouvrir (liste et `modal-open` conservés)
- Espace développeur : changement de galerie sans remonter la coquille
- Thèmes : suppression / réinit en dialogue enfant (`modal--sm`), plus de `confirm()` natif

## [0.5.25] — 2026-08-13

### Changed

- Espace développeur : modale overlay (`modal--lg`) comme les pages Markdown ; fermeture = Précédent / bouton close

### Removed

- Liens « Retour à l’app » du styleguide (la modale suffit)

## [0.5.24] — 2026-08-13

### Changed

- Routes hash unifiées : `#/` (accueil liste ou empty), `#/new-card`, `#/edit-card/:id`, `#/themes`, `#/settings`, `#/page/:slug` ; fermeture de modale = Précédent navigateur

### Removed

- `#/list`, `#/new`, `#/edit/:id` ; redirections `#/test…` → `#/developer…`

## [0.5.23] — 2026-08-13

### Added

- Pages Markdown : `# Titre | Sous-titre` (premier ` | `) remplit le `view-desc` de la modale ; gras/italique conservés

## [0.5.22] — 2026-08-13

### Changed

- Titres : classe = apparence (`view-title`, `section-title`) ; un `h1` par vue (page ou dialog) ; pages Markdown : `#` = titre de modale, `##` / `###` dans le corps

### Removed

- CSS mort : `settings-panel-title`, `.settings-panel > h4.form-label`, `.empty-view h2`, `.md-content h1`, `.theme-card-body h3`

## [0.5.21] — 2026-08-13

### Changed

- Typo KISS : **Open Sans** pour toute l’UI (`--font-ui`) ; **Inter** réservé aux cartes (`--font-card`) — DM Sans / Bebas Neue retirés

## [0.5.20] — 2026-08-13

### Added

- Espace développeur : page typographie `#/developer/typography` (polices, chrome UI, Markdown)

## [0.5.19] — 2026-08-13

### Changed

- Espace développeur : route `#/developer` (ex-`#/test`) ; dossier `views/developer/` ; anciennes URLs `#/test…` redirigées

## [0.5.18] — 2026-08-13

### Changed

- Paramètres : libellé du bouton styleguide → « Espace développeur »

## [0.5.17] — 2026-08-13

### Changed

- Paramètres : Styleguide + Reset local réunis dans « Options pour les développeurs » (localhost uniquement)

### Removed

- CSS mort `.settings-panel-desc`

## [0.5.16] — 2026-08-13

### Changed

- Paramètres / Gestion de la collection : libellés import/export ; bouton thèmes intégré (section Thèmes retirée)

## [0.5.15] — 2026-08-12

### Changed

- Paramètres : Import / Sauvegarde réunis dans « Gestion de la collection »

## [0.5.14] — 2026-08-12

### Changed

- Paramètres : plus d’espace sous les titres de section `h3`

## [0.5.13] — 2026-08-12

### Changed

- Paramètres : hint de la couleur par défaut des cartes

## [0.5.12] — 2026-08-12

### Changed

- Paramètres / Apparence des cartes : description retirée ; libellés bordure et coins

## [0.5.11] — 2026-08-12

### Changed

- Paramètres : libellé du curseur de densité de liste ; titre / hint redondants retirés

## [0.5.10] — 2026-08-12

### Removed

- Paramètres : wrappers `settings-subblock` (et séparateurs / indentation associés)

## [0.5.9] — 2026-08-12

### Changed

- Paramètres : titres `h4` alignés sur `form-label` ; indentation des `settings-subblock`

## [0.5.8] — 2026-08-12

### Changed

- Paramètres : titres de section « Interface » et « Apparence des cartes »

## [0.5.7] — 2026-08-12

### Removed

- Paramètres / Affichage : descriptions redondantes sous le titre et « Mode d’affichage »

## [0.5.6] — 2026-08-12

### Changed

- Paramètres : sections sans bordure ; titres `h3` plus grands pour se distinguer des `h4`

## [0.5.5] — 2026-08-12

### Changed

- Éditeur / paramètres : libellés et descriptions allégés (numéro d’ensemble, image, aperçus sans légendes Face/Dos)

### Fixed

- Éditeur : `aria-describedby` orphelins retirés après suppression des hints thème / photo

### Removed

- CSS mort `.preview-label` / `.preview-hint`

## [0.5.4] — 2026-08-12

### Changed

- Modale suppression carte : nouveau texte d’avertissement

## [0.5.3] — 2026-08-12

### Changed

- Modale suppression carte : texte de confirmation plus explicite

## [0.5.2] — 2026-08-12

### Changed

- Modale suppression carte : titre « Supprimer ? », sous-titre `#réf titre` (ou id), message générique centré

## [0.5.1] — 2026-08-12

### Changed

- Suppression d’une carte : `confirm()` remplacé par une modale (`modal--sm`) — Annuler / Supprimer à droite

## [0.5.0] — 2026-08-12


### Added

- Design system **modales** : 3 tailles (`modal--sm|md|lg`), alignement backdrop, header inversé, footer à deux zones ; styleguide `#/test/modals`

### Changed

- App migrée sur ce vocabulaire (paramètres / pages MD `md`, thèmes + éditeur carte `lg`, éditeur de thème `sm`) ; actions principales en pied de modale

### Fixed

- Tri recherche : listeners correctement retirés au quit de la liste (plus de double-clic fantôme après styleguide / retour)

### Removed

- Classes CSS one-shot des modales (`modal-sm`, `modal-settings`, `modal-page`, `modal-themes`)

## [0.4.30] — 2026-08-12

### Changed

- Menu de tri recherche : reste ouvert après changement de critère ou de sens (fermeture : clic extérieur / Échap / bouton)

## [0.4.29] — 2026-08-12

### Fixed

- Reset local : bascule sur une **nouvelle** base IndexedDB (`db-gen`) au lieu d’attendre `deleteDatabase` (qui restait bloqué et empêchait toute ouverture)

## [0.4.28] — 2026-08-12

### Fixed

- Reset local (dev) : plus de blocage IndexedDB après reset (connexion fermée correctement, `deleteDatabase` attendu pour de vrai, `onversionchange`) — nouvelle carte / thèmes / import / styleguide redeviennent utilisables

## [0.4.27] — 2026-08-12

### Changed

- Recherche topbar : vocabulaire design system `search-bar` finalisé (liste + styleguide `#/test/search`)

### Removed

- CSS mort : `list-toolbar` / `toolbar-row` / `selection-count`, styles `search` hors `form-control`

## [0.4.26] — 2026-08-12

### Changed

- Menu de tri : sans bordure haute, aligné sur le cadre focus du champ (comme `form-select`)

## [0.4.25] — 2026-08-12

### Fixed

- Recherche : cadre focus du champ conservé quand le menu de tri est ouvert / focus sur le bouton

### Added

- Menu de tri : navigation clavier (↑↓, Entrée/Espace, Home/End, Échap) comme les listes déroulantes

## [0.4.24] — 2026-08-12

### Changed

- Menu de tri recherche : look `form-select-list` ; sens via `ri-sort-asc` / `ri-sort-desc` à droite de l’option active (recliquer pour inverser)

## [0.4.23] — 2026-08-12

### Fixed

- Recherche : bouton de tri recentré dans le champ ; compteur seul avec `padding-right` (pas collé au bord)

## [0.4.22] — 2026-08-12

### Fixed

- Recherche : bouton de tri recentré dans le champ (marges égales autour du fond au survol / focus, au-dessus du trait bas)

## [0.4.21] — 2026-08-12

### Added

- Champs texte / nombre / textarea : icône gauche optionnelle (`form-control-wrap` / `form-control-icon`) — galerie `#/test/fields`

### Changed

- Recherche : icône via `form-control-icon` (optionnelle ; défaut `ri-search-line`)

## [0.4.20] — 2026-08-12

### Added

- Barre de recherche : icône `ri-search-line` à gauche du champ

## [0.4.19] — 2026-08-12

### Changed

- Compteur recherche : libellé toujours « cartes » (pluriel du total)

## [0.4.18] — 2026-08-12

### Changed

- Recherche : compteur et tri visibles seulement s’il y a au moins 2 cartes

## [0.4.17] — 2026-08-12

### Changed

- Barre de recherche : `input.form-control` (fond + trait bas inset, comme un champ texte)

## [0.4.16] — 2026-08-12

### Added

- Styleguide recherche : `#/test/search` (`search-bar` — champ, compteur, menu de tri)

### Changed

- Topbar liste : classes `search-bar` / `search-bar-trail` (vocabulaire design system) ; styles legacy `search-field` retirés

## [0.4.15] — 2026-08-11

### Fixed

- Header : le logo / marque ne s’étend plus sur toute la largeur (hover limité au contenu)
- Accueil vide : page de bienvenue affichée immédiatement après un reset (load cartes découplé du seed thèmes)
- Boot : plus d’import cassé qui empêchait l’app de démarrer (modales `#/new`, thèmes, styleguide)

## [0.4.14] — 2026-08-11

### Fixed

- Select custom : plus de surbrillance « fantôme » sur la 1ʳᵉ option après reset (highlight suit le pointeur ; aucune option active si rien n’est sélectionné)

## [0.4.13] — 2026-08-11

### Changed

- Select custom `form-select` appliqué au choix du thème dans l’éditeur ; styles legacy `filter-select` / `theme-select` retirés

## [0.4.12] — 2026-08-11

### Added

- Styleguide selects : surcouche unobtrusive `form-select.js` (déclencheur type champ texte + liste stylable) sur `#/test/selects`

## [0.4.11] — 2026-08-11

### Changed

- Champs couleur `form-color` appliqués aux paramètres, à l’éditeur et aux thèmes ; styles legacy `color-row` retirés
- Pastille couleur : affiche le défaut du champ si la valeur est vide (damier seulement sans défaut)

## [0.4.10] — 2026-08-11

### Added

- Styleguide champs couleur : `#/test/colors` (`form-control` texte + pastille / `ri-close-circle-fill` en overlay)

## [0.4.9] — 2026-08-11

### Changed

- Curseurs `form-range-row` appliqués aux paramètres et au zoom éditeur ; styles legacy `settings-control-row` / `slider-row` retirés

## [0.4.8] — 2026-08-11

### Added

- Styleguide curseurs : `#/test/sliders` (`form-range-row` — label → hint → range → erreur ; poignée carrée, focus sur la poignée seule)

## [0.4.7] — 2026-08-11

### Changed

- Schéma de champ standardisé : label → hint → contrôle → erreur (`form-field` / `form-label` / `form-hint` / `form-error`)
- Champs texte / nombre / textarea : design system `form-control` dans l’éditeur (référence, titre, année, pièces, figurines) et le nom de thème
- Styles legacy `.field` / `.required` retirés

## [0.4.6] — 2026-08-11

### Added

- Styleguide champs de saisie : `#/test/fields` (`form-field` / `form-control` — text, number, textarea)
- Styleguide listes déroulantes : `#/test/selects`

## [0.4.5] — 2026-08-11

### Changed

- Icônes UI : [Remix Icon](https://remixicon.com/) via `src/js/icons.js` (convention AGENTS.md)

## [0.4.4] — 2026-08-11

### Added

- Badge bouton (`btn-badge`) dans le design system + exemples styleguide (variantes, icônes, `sm`)

### Changed

- Compteur impression header : utilise `btn-badge`

## [0.4.3] — 2026-08-11

### Changed

- Boutons de l’app alignés sur le design system (header, liste, paramètres, éditeur, modales)
- Tri header : `btn ghost sm icon-only` ; sélection impression liste : ghost icon-only (+/− en `sm`)
- Paramètres : modes d’affichage secondary/primary ; actions import/export/thèmes/styleguide en primary
- CSS one-shot retiré (`print-qty-btn`, `theme-mode-btn`, `search-sort-btn` custom, etc.)

## [0.4.2] — 2026-08-11

### Changed

- Boutons : modèle unifié (4 variantes × texte / texte+icône / icône seule, `icon-right`, `sm`)
- Icône seule : `btn … icon-only` + label `visually-hidden` (remplace `btn-icon`)
- Hover et focus clavier : même style (plus d’outline dédié sur les boutons)
- Ghost : texte comme secondary ; hover/focus = style du primary au repos

## [0.4.1] — 2026-08-11

### Added

- Design system boutons formalisé (`primary` / `secondary` / `ghost` / `danger` / `btn-icon` / `btn-icon--ghost` / `sm`)
- Styleguide UI : `#/test`, `#/test/buttons` (lien Paramètres en local)

### Changed

- Bouton primary : survol en inversion fond / texte (dont « Nouvelle carte »)
- Icônes topbar et croix de modale : classe partagée `btn-icon--ghost`

## [0.4.0] — 2026-08-10

### Added

- En-tête : menu Impression (icône + compteur, encart résumé / tout sélectionner / désélectionner / imprimer)
- Paramètres → Affichage : cartes par ligne max (2–10 ou ∞), sans scroll horizontal
- Liste : largeur pleine (plus de `max-width` sur l’app)
- Sélection de texte : fond noir / texte blanc (inversé en dark mode)

### Changed

- Thèmes LEGO : gestion en modale overlay (comme Paramètres), plus en page pleine largeur
- Paramètres : encart Affichage (mode clair/sombre/système + densité de liste)
- UI : fond blanc (sombre en dark), panneaux / header / barre sélection sans boîtes grises
- UI : boutons icône (paramètres, croix, impression liste) — fond au survol uniquement
- Liste : édition au clic sur la carte uniquement ; titre / texte d’aide d’impression retirés
- Liste : espacement horizontal fixe entre cartes, lignes centrées

### Fixed

- Liste : la sélection d’impression est conservée après ouverture / fermeture de l’éditeur
- Liste : sélection d’impression persistée en localStorage (survît au rechargement)
- Liste : plafond de colonnes (plus de décalage d’une carte par rapport au réglage)

## [0.3.0] — 2026-08-10

### Added

- Titre de carte : sauts de ligne avec Entrée (textarea ; 3 lignes max à l’affichage)
- Éditeur : bouton « Télécharger la photo »
- Liste : quantité de cartes à imprimer par modèle (− / compteur / +)
- Liste : compteur + tri dans le champ de recherche (date, référence, titre, année, pièces, figurines) ; sens de tri inversable

### Fixed

- Impression : cadrage photo (zoom / pan) correctement appliqué (layout hors écran avant calcul)
- Impression : plus de toast / UI par-dessus les cartes (uniquement les feuilles)
- Dark mode : texte / icônes lisibles sur boutons à fond clair (primary, Parcourir, etc.)

### Changed

- Impression dos : fond perdu 0,5 mm rectangulaire (couleur de la carte, coins sans blanc)
- Liste : case à cocher remplacée par un sélecteur de quantité d’impression
- UI : libellés « Brickcard(s) » → « carte(s) » (logo / marque Brickcard inchangés)
- UI : accent rouge remplacé par noir / proche noir (clair) ou clair (sombre)

## [0.2.0] — 2026-08-09

### Fixed

- Couleur / logo d’un thème prédéfini : plus écrasés au refresh en local (seed n’ajoute que les thèmes manquants)

### Removed

- Champ description des Brickcards (éditeur, rendu face, recherche) — encore accepté à l’import JSON

### Added

- Paramètres → Design des cartes : taille de la bordure face (0–10 mm, pas 0,5, défaut 3 mm)
- Paramètres → Design des cartes : coins arrondis face + dos (0–8 mm, pas 0,5, défaut 1,5 mm)
- Paramètres → Design des cartes : couleur par défaut (cascade thème → config → gris `#6e6e6e`)
- Champ carte `imageBackgroundColor` (fond derrière images transparentes, défaut `#ffffff`)
- Champ carte `figurineCount` (nombre de figurines, optionnel)
- Tous les champs carte sont optionnels (carte vierge autorisée)

### Changed

- Dos : logo de thème centré verticalement entre le branding Brickcard et le bas de la carte (`max-height: 10mm`)
- Face : plus de logo de thème
- Face / dos : logo Brickcard à 90 % d’opacité (effet incrusté)
- Éditeur : zoom photo de 25 % à 400 % (dézoom possible ; 100 % = cadrage « cover »)
- Face : zone photo aux coins arrondis (clip fiable) ; couleur d’accent visible sous les arrondis
- Face : logo Brickcard masqué dès qu’une photo est présente (plus visible au dézoom / décalage)
- Face : logo / nom de thème retirés de la face (logo thème sur le dos)
- Badges méta header : sans padding ni fond ; gap `0.5mm`
- Typo cartes : police Inter (Google Fonts)
- Face : référence en haut à gauche (header 1 ligne) ; titre centré en bas (footer)
- Face / dos vierges : fond couleur (accent), logo Brickcard + libellé « Brickcard » centrés ; dos sans autre contenu
- Face : en-tête titre (gauche) + `#référence` (droite) ; logo / nom de thème en bas
- Face : bordure couleur du thème (défaut 3 mm / gris) ; suppression bordure noire et liseret jaune
- Dos : suppression bordure noire et liseret jaune
- Thème sur la carte : logo **ou** nom (XOR) ; plus de SVG généré ni de libellé « LEGO » de secours si le logo manque / échoue
- Couleur d’accent des thèmes : plus de détection automatique depuis le logo ; défaut gris neutre (`#6e6e6e`) si non définie
- Champ carte `legoThemeId` renommé en `brickcardThemeId` (migration IndexedDB v2 + import JSON rétrocompatible)
- Champs carte `setTitle` → `title`, `setImageDataUrl` → `imageDataUrl`
- Champ thème `accentColor` → `color`

## [0.1.0] — 2026-08-05

### Added

- Première version publique de Brickcard
- Cartes face / dos format poker, impression A4 3×3
- Thèmes LEGO prédéfinis + thèmes personnalisés
- Persistance IndexedDB, export / import JSON
- Affichage du numéro de version (SemVer) dans l’en-tête et À propos
