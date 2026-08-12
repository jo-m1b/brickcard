# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format s’inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

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
