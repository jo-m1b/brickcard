# Contribuer

Merci de ton intérêt pour Brickcard Generator.

## Ajouter ou modifier des thèmes prédéfinis

1. Mets le logo dans `src/img/` (ex. `logo-theme-mon-theme.png` / `.webp` / `.svg`)
2. Déclare le thème dans `src/data/themes-presets.json` (`id`, `themeName`, `logoSrc` optionnel et/ou `color` — sans couleur → gris `#6e6e6e` ; sans logo → le nom s’affiche sur la carte)
3. En local : un thème **déjà** en IndexedDB n’est pas réécrit au refresh (tes couleurs / logos restent). Pour un nouveau thème JSON, recharge la page. Pour forcer le retour usine d’un préréglage : bouton **Réinitialiser** sur le thème, ou reset dev dans Paramètres.

## Crédits & sources

Quand tu ajoutes des assets, documente leur provenance ici et dans le [README](README.md#crédits) si besoin.

### Logos de thèmes

Une grande partie des logos de thèmes prédéfinis provient de :

**[Brickipedia — List of themes](https://brickipedia.fandom.com/wiki/List_of_themes)**

Brickipedia est un wiki communautaire hébergé par Fandom. Les logos et marques LEGO® restent la propriété de The LEGO Group. Ce projet est un outil fan / personnel, **non officiel**, non affilié ni sponsorisé par The LEGO Group.

### Logo de l’application

Icône *brick outline* par [Joko Sutrisno](https://www.vecteezy.com/members/108458460840346680378) via [Vecteezy](https://www.vecteezy.com/vector-art/12802525-brick-outline-icon).

## Pull requests

- Garde le périmètre petit et ciblé
- Pas de bundler / framework sauf discussion préalable
- UI en français
