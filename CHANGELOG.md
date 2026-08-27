# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format s’inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).
Les versions antérieures à 0.8 sont regroupées par mineure ; le détail patch par patch est dans l’historique git.

## [Unreleased]

## [0.8.5] — 2026-08-27

### Added

- Accueil : bouton **Réessayer** sous le message d’erreur de chargement (refresh cache-bust `?r=` ; galerie `#developer/loading`)
- Paramètres : case **Télémétrie** (cochée par défaut) pour envoyer des données de télémétrie d’utilisation anonyme

### Changed

- Chargement JS : overlays de route et galeries `#developer/…` en `import()` à l’ouverture (boot = liste + stockage + chrome)
- Notifications : toasts in-app seulement (plus de Notification HTML5 / permission navigateur)

## [0.8.4] — 2026-08-25

### Added

- Impression : paramètre **Tracé de découpe** (cases Sur la face avant / Sur le dos (arrière), face cochée par défaut) dans `#settings` et `#print` ; le filet 1 px `#000000` n’apparaît que sur les côtés cochés
- Impression : paramètre **Fond perdu** (cases Sur la face avant / Sur le dos (arrière), dos coché par défaut) dans `#settings` et `#print` ; 2 mm des quatre côtés, y compris sur la face ; désactivé et ignoré si le tracé de découpe du même côté est coché
- Cartes (face, dos) et mini-cartes : filet 2 px `--ink` à l’écran pour lire le bord sur fond clair ou sombre

### Fixed

- Impression PDF : le nom de fichier reste `brickcard-…` même avec beaucoup de cartes (Firefox : `afterprint` trop tôt au clone ; plus de repli `127.0.0.1.pdf`)
- Impression : le logo Brickcard (dos / face sans photo) reste net (SVG inline au lieu d’un masque CSS rasterisé)

### Changed

- Cache-bust des modules `app.js` et `version.js` via une import map dans `index.html` (plus de `?v=` sur les imports JS)
- Impression dos : fond perdu 2 mm des quatre côtés (plus de 1 mm L/R)
- Impression : écart horizontal des cartes 5 mm (comme le vertical ; plus de chevauchement du fond perdu)
- Sauvegarde de démo : dernière photo PNG convertie en WebP (~4,6 Mo → ~2,9 Mo)
- Paramètres : section **Interface** renommée **Application**
- Accueil vide : toast **Démonstration chargée** (à la place de **Démonstration importée**)
- Impression (`#print`) : séparateur du détail « rectos puis versos » en point médian `·` (comme le recap des sauvegardes)
- Impression : hint **Tracé de découpe** « Imprimer un tracé technique pour faciliter la découpe des cartes » ; cases **Sur la face avant** / **Sur le dos (arrière)**
- Impression : **Ordre d’impression des cartes**, **Côté d’impression** (Les deux faces / Face uniquement / Dos uniquement), **Assemblage des feuilles**
- Impression : clés `brickcard:print-settings` alignées sur l’UI (`cardPrintOrder`, `printSide`/`both`, `sheetAssembly`) ; pas de migration des anciennes clés

## [0.8.3] — 2026-08-25

### Added

- Impression : paramètre **Tri des cartes** (référence par défaut, toujours croissant) dans `#settings` et `#print` ; l’ordre du document imprimé suit ce choix
- Accueil espace développeur (`#developer`) et paramètres (`#settings`) : barre de recherche (`search-bar--input-only`) ; filtrage des sections / tuiles / `href` (paramètres : aussi labels et hints) ; insensible aux accents ; **Oups !** si aucun résultat
- Thèmes (`#themes`) : bouton **Supprimer tous les thèmes personnalisés** (si plus de 2 thèmes perso) ; confirmation ; les cartes conservées perdent leur association de thème

### Changed

- Recherches (cartes, thèmes, thèmes par défaut, paramètres, accueil espace développeur) : insensibles aux accents (`Sel` trouve « Sélecteur »)
- Thèmes par défaut : catalogue passé de 119 à 65 thèmes (SVG / WebP, Aquazone en PNG) ; ajouts Botanicals, Braille Bricks, BrickHeadz, Creator 3in1, DC, Marvel, Nike ; `the-lord-of-the-rings` → `lord-of-the-rings` ; logos et cadrages mis à jour
- `form-hint` : plus de point final s’il n’y a qu’une phrase (plusieurs phrases : points conservés)
- Paramètres : section **Gestion de votre collection** ; descriptions des tuiles Importer / Sauvegarder / Thèmes / Supprimer toutes les cartes reformulées (« votre collection »)
- Paramètres → Interface : **Mode d’affichage** en boutons radio (Thème clair / Thème sombre / Système), groupe vertical
- Cases à cocher / radios : dans un groupe, la liste d’options (vertical ou horizontal) est indentée sous la légende
- Paramètres et `#print` : **Côtés des cartes à imprimer** en radios (horizontal) ; **Impression recto-verso des feuilles** en radios (vertical, hint sous chaque option)
- Liste : après création ou modification d’une carte, le focus clavier est placé sur la tuile concernée ; fermeture de l’éditeur d’une carte existante (Échap / croix / Annuler) : même focus, pour reprendre la navigation clavier
- Thèmes (`#themes` et `#developer/theme-presets`) : même focus clavier sur la mini-carte après création / modification, et à la fermeture de l’éditeur d’un thème existant
- Espace développeur `#developer/theme-presets` : succès et erreurs générales en toast (chargement, **Réinitialiser**, **Sauvegarder themes-presets.json**, **Sauvegarder les logos**, enregistrement / suppression dans l’éditeur) ; validation Nom / Identifiant toujours sous le champ
- Modales : Paramètres, espace développeur et paramètres d’impression unifiés en `modal--md` ; `modal--lg` réservé aux thèmes (`#themes`, `#developer/theme-presets`) et aux éditeurs de carte / thème

### Fixed

- Paramètres (`#settings`) et accueil espace développeur (`#developer`) : hauteur de modale fixe pendant la recherche (plus de yoyo selon les résultats)

## [0.8.2] — 2026-08-24

### Added

- Notifications (Toast) : types normal / succès / erreur, empilement, fermeture manuelle, notification système HTML5 ; galerie `#developer/notifications`
- Paramètres → Interface : case **Optimiser les images** (cochée par défaut) ; convertit les nouveaux rasters en WebP au chargement
- Impression : raccourci Ctrl/Cmd+P pour ouvrir `#print` (hors éditeur carte / thème / presets et hors `#import`) ; déjà ouverte → lance l’impression

### Changed

- Accueil vide : tuile **Charger une démonstration** (« Importer une sauvegarde de la collection de cartes des briques de Jo »)
- Accueil vide : après **Charger une démonstration**, toast **Démonstration importée** (`ri-emotion-fill`) ; recap inchangé
- Paramètres → Interface : hint **Optimiser les images** (« Convertir automatiquement les nouvelles images ajoutées à la collection dans un format optimisé. »)
- Liste : après **modification** ou **suppression** d’une carte, la grille n’est plus reconstruite (tuile mise à jour ou retirée, scroll / recherche / tri conservés ; compteurs recherche et impression recalculés) ; après **création**, recherche vidée et tri sur date de modification (récent d’abord)
- Thèmes (`#themes` et `#developer/theme-presets`) : après **modification** ou **suppression**, la grille n’est plus reconstruite (mini-carte mise à jour ou retirée, scroll / recherche / tri conservés) ; après **création**, recherche vidée, tri date desc et scroll en haut
- Confirmations de suppression (carte / thème) : guillemets français « » comme les titres d’édition ; titre + référence de carte encadrés ensemble
- Champ image vide : « Charger une nouvelle image pour la prévisualiser et la recadrer. » (style `form-hint`)
- Toasts d’action (enregistrement, suppression, import, sauvegarde, photo) : type succès ; délai 7 s (15 s pour l’import / la sauvegarde de la collection) ; les notifications s’empilent au lieu de se remplacer
- Toasts métier : titres et icônes spécifiques (thème, carte, image, sauvegarde) ; recap sauvegarde/import aligné sur le pied des modales ; erreur de sélection d’impression
- GitHub Release : les notes groupées n’affichent plus le préfixe `feat:` / `fix:` / `docs:` / `chore:`
- Image de carte : le bouton **Sauvegarder** télécharge `brickcard-card-image-YYYY-MM-DD-…` (ref, titre, les deux, ou id de la carte)
- Logo de thème : le bouton **Sauvegarder** télécharge `brickcard-theme-logo-YYYY-MM-DD-…` (slug du nom, ou id du thème)
- Champ image : un seul pipeline (`compressImage`) pour les photos de cartes et les logos de thèmes ; JPEG / WebP / PNG conservés (retaille canvas au-delà de 2000 px de côté) ; le reste → PNG ; logos : plus de plafond 400 px ni conversion systématique en PNG
- Sauvegarde de démo (`data/backup-demo-jo.brickcard`) : photos converties en WebP (~41 Mo → ~4,6 Mo)

### Fixed

- Titre de modale avec icône : le texte reste à droite de l’icône (plusieurs lignes si besoin) au lieu de passer dessous sur petit écran
- GitHub Release : le dernier commit entre deux tags est bien listé dans les notes
- Champ image : **Sauvegarder** un WebP télécharge le fichier (plus d’ouverture dans un nouvel onglet)

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

## [0.7] — 2026-08-22

### Added

- PWA : manifest, icônes d’install (192/512, apple-touch), service worker
- Accueil : écran de chargement (brique + « Chargement... ») jusqu’à IndexedDB ; accueil vide « Bienvenue » et tuiles ; recherche sans résultat « Oups ! »
- Impression : modale de paramètres (grille 1×1–10×10, côtés des cartes, recto-verso) ; section Paramètres ; nom de fichier PDF proposé
- Espace développeur : outil **Thèmes par défaut** (`#developer/theme-presets`, brouillon IndexedDB isolé) ; section **Modèles** et galerie **Page de chargement** ; activation hors local (confirmation persistée)
- Champ image (`form-image` : fichier / URL, fond, cadrage) ; cases à cocher, boutons radio, reset des curseurs ; galeries associées
- Thèmes personnalisés : taille / position du logo (`logoZoom`, `logoOffsetX`, `logoOffsetY`) ; mêmes champs optionnels sur les thèmes par défaut
- Paramètres → Apparence des cartes : arrondi des images (indépendant de l’arrondi des coins)

### Changed

- Nom produit et identifiants techniques : **Brickcard**
- Routes : overlays en `#settings`, `#new-card`, `#developer/…` (plus de `/` juste après `#`) ; accueil = URL sans hash
- Sauvegarde de la collection : fichier `.brickcard` (JSON) ; import limité à ce format
- Polices Open Sans et Inter auto-hébergées (`src/fonts/`) ; champs `createdAt` et `description` retirés du modèle
- Logos des thèmes par défaut : déplacés vers `src/data/`, retravaillés / minifiés
- Modales : icône Remix à gauche du titre, focus à l’ouverture, pied « Annuler » en `sm` s’il y a d’autres actions
- Éditeurs carte / thème : aperçu à gauche, pied visuel Supprimer / Annuler / Enregistrer
- Reset local : rechargement en `?{timestamp}`

### Fixed

- Chargement : message technique si un module ou `boot()` échoue
- Service worker : revalidation réseau (`cache: "reload"`)
- Impression dos : fond perdu aligné sur la grille
- Modales : scroll remis en haut à l’affichage
- Espace développeur / thèmes par défaut : routes new / edit (Précédent revient à la liste)

### Removed

- Thèmes par défaut : 4 Juniors, Games, Homemaker, Make & Create, Xtra

## [0.6] — 2026-08-15

### Added

- Thèmes : tri dans la barre de recherche (nombre de cartes, titre, date de modification si ≥ 2 thèmes personnalisés ; défaut nombre de cartes décroissant)
- Thèmes : mini-cartes au look Brickcard (fond couleur, coins `--card-radius`, titre contrasté en haut ; logo Brickcard si le thème n’en a pas)
- Thèmes : routes `#/themes/new` et `#/themes/edit/:id` (vraie modale d’édition des thèmes personnalisés)
- Paramètres : tuile danger pour supprimer toutes les cartes (thèmes et réglages conservés)
- Thèmes par défaut : 113 thèmes Brickipedia ajoutés (id + nom, tri alphabétique)
- Thèmes par défaut : couleur d’accent pour chaque thème (hex uniques)
- Thèmes par défaut : logos officiels (`img/logo-theme-{{id}}`, SVG privilégié puis WebP / PNG / JPG) pour 121 thèmes ; Games, Homemaker et Make & Create n’ont pas de logo distinct trouvé

### Changed

- Thèmes par défaut : lecture seule (plus de modification ni de réinitialisation)
- Thèmes personnalisés : id UUID ; IndexedDB et export JSON ne conservent que les thèmes personnalisés
- Éditeur de carte : liste des thèmes en groupes (Thèmes personnalisés / Thèmes par défaut)
- Thèmes : titre et description de la modale alignés sur la tuile Paramètres
- Thèmes : bouton « Nouveau thème » dans le pied (gauche), avec icône +

### Fixed

- Liste : le focus clavier n’entoure plus que la carte ; léger zoom au survol et au focus
- Liste : le focus reste sur + / − / l’icône d’impression après un clic (quantité)

### Removed

- Accueil : plus de focus automatique dans la recherche (clavier virtuel sur mobile)

## [0.5] — 2026-08-13

### Added

- Design system **modales** : 3 tailles (`modal--sm|md|lg`), alignement backdrop, header inversé, footer à deux zones
- Design system : tuiles, liens, confirmations (`confirm-dialog.js`) ; galeries espace développeur (typographie, champs, etc.)
- Favicon SVG (brique du logo) : noir en clair, blanc en dark mode
- Accueil : focus automatique dans la recherche si la barre est visible

### Changed

- Routes hash unifiées (`#/`, `#/new-card`, `#/edit-card/:id`, `#/themes`, `#/settings`, `#/page/:slug`) ; overlay → overlay en swap ; fermeture (croix / Échap / backdrop) = accueil
- Espace développeur : route `#/developer` (ex-`#/test`) en modale overlay ; Paramètres : « Options pour les développeurs » (localhost)
- Typo : **Open Sans** pour l’UI, **Inter** pour les cartes
- Paramètres : sections Interface / Apparence des cartes / Gestion de la collection
- Header responsive : « Nouvelle carte » en icône seule, marque réduite à l’icône
- Menu Impression : encart résumé, boutons DS (lancer, vider, ajout selon la sélection)
- Suppression d’une carte : modale (`modal--sm`) à la place de `confirm()` natif

### Fixed

- Favicon SVG : XML invalide (l’icône ne s’affichait pas)
- Icônes Remix : path officiel et taille 24×24
- Avertissement Firefox « Layout was forced before the page was fully loaded »
- Carte : badges alignés à droite même sans référence
- Espace développeur : Précédent / Suivant suivent les galeries
- Tri recherche : listeners correctement retirés au quit de la liste

### Removed

- `confirm()` natif (reset, import, suppression carte / thèmes)
- Anciennes routes `#/list`, `#/new`, `#/edit/:id` ; redirections `#/test…` → `#/developer…`
- Classes CSS one-shot des modales, tuiles et paramètres

## [0.4] — 2026-08-12

### Added

- En-tête : menu Impression (icône + compteur, encart résumé / tout sélectionner / désélectionner / imprimer)
- Paramètres → Affichage : cartes par ligne max (2–10 ou ∞)
- Design system : boutons, champs, listes déroulantes, couleurs, curseurs, barre de recherche ; styleguide `#/test`
- Liste : largeur pleine ; sélection de texte inversée (fond noir / texte blanc)

### Changed

- Thèmes LEGO : gestion en modale overlay (comme Paramètres)
- UI : fond blanc (sombre en dark), boutons unifiés (`primary` / `secondary` / `ghost` / `danger`, icône seule, `sm`)
- Icônes UI : [Remix Icon](https://remixicon.com/) via `src/js/icons.js`
- Liste : édition au clic sur la carte uniquement ; espacement horizontal fixe entre cartes

### Fixed

- Reset local : nouvelle base IndexedDB (`db-gen`) au lieu d’un `deleteDatabase` bloqué
- Boot : plus d’import cassé qui empêchait l’app de démarrer
- Liste : sélection d’impression conservée après l’éditeur et persistée en localStorage
- Header : le logo / marque ne s’étend plus sur toute la largeur
- Accueil vide : page de bienvenue affichée immédiatement après un reset
- Select custom : plus de surbrillance « fantôme » après reset

### Removed

- CSS mort : `list-toolbar`, styles `search` hors `form-control`, `btn-icon` (remplacé par `icon-only`)

## [0.3] — 2026-08-10

### Added

- Titre de carte : sauts de ligne avec Entrée (textarea ; 3 lignes max à l’affichage)
- Éditeur : bouton « Télécharger la photo »
- Liste : quantité de cartes à imprimer par modèle (− / compteur / +)
- Liste : compteur + tri dans le champ de recherche (date, référence, titre, année, pièces, figurines) ; sens de tri inversable

### Changed

- Impression dos : fond perdu 0,5 mm rectangulaire (couleur de la carte, coins sans blanc)
- Liste : case à cocher remplacée par un sélecteur de quantité d’impression
- UI : libellés « Brickcard(s) » → « carte(s) » (logo / marque Brickcard inchangés)
- UI : accent rouge remplacé par noir / proche noir (clair) ou clair (sombre)

### Fixed

- Impression : cadrage photo (zoom / pan) correctement appliqué (layout hors écran avant calcul)
- Impression : plus de toast / UI par-dessus les cartes (uniquement les feuilles)
- Dark mode : texte / icônes lisibles sur boutons à fond clair (primary, Parcourir, etc.)

## [0.2] — 2026-08-09

### Added

- Paramètres → Design des cartes : taille de la bordure face (0–10 mm, pas 0,5, défaut 3 mm)
- Paramètres → Design des cartes : coins arrondis face + dos (0–8 mm, pas 0,5, défaut 1,5 mm)
- Paramètres → Design des cartes : couleur par défaut (cascade thème → config → gris `#6e6e6e`)
- Champ carte `imageBackgroundColor` (fond derrière images transparentes, défaut `#ffffff`)
- Champ carte `figurineCount` (nombre de figurines, optionnel)
- Tous les champs carte sont optionnels (carte vierge autorisée)

### Changed

- Face : bordure couleur du thème ; référence en haut, titre en bas ; logo Brickcard masqué dès qu’une photo est présente ; plus de logo de thème sur la face
- Dos : logo de thème (ou nom) entre le branding Brickcard et le bas ; plus de bordure noire ni de liseret jaune
- Face / dos vierges : fond couleur (accent), logo Brickcard + libellé « Brickcard » centrés
- Éditeur : zoom photo de 25 % à 400 % (100 % = cadrage « cover »)
- Thème sur la carte : logo **ou** nom (XOR) ; accent sans détection automatique depuis le logo (défaut gris `#6e6e6e`)
- Champ carte `legoThemeId` renommé en `brickcardThemeId` (migration IndexedDB v2 + import JSON rétrocompatible)
- Champs carte `setTitle` → `title`, `setImageDataUrl` → `imageDataUrl` ; champ thème `accentColor` → `color`
- Typo cartes : police Inter (Google Fonts)

### Fixed

- Couleur / logo d’un thème prédéfini : plus écrasés au refresh en local (seed n’ajoute que les thèmes manquants)

### Removed

- Champ description des Brickcards (éditeur, rendu face, recherche) — encore accepté à l’import JSON

## [0.1] — 2026-08-05

### Added

- Première version publique de Brickcard
- Cartes face / dos format poker, impression A4 3×3
- Thèmes LEGO prédéfinis + thèmes personnalisés
- Persistance IndexedDB, export / import JSON
- Affichage du numéro de version (SemVer) dans l’en-tête et À propos
