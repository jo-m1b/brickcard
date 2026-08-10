# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format s’inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

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
- UI : libellés « Brickcard(s) » → « carte(s) » (logo / marque Brickcard Generator inchangés)
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

- Première version publique de Brickcard Generator
- Cartes face / dos format poker, impression A4 3×3
- Thèmes LEGO prédéfinis + thèmes personnalisés
- Persistance IndexedDB, export / import JSON
- Affichage du numéro de version (SemVer) dans l’en-tête et À propos
