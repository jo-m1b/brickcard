# Brickcard

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/img/brickcard-logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="src/img/brickcard-logo.svg">
    <img width="100" alt="Logo Brickcard" src="src/img/brickcard-logo.svg">
</picture>

[![README](https://img.shields.io/badge/EN-README-f9f9f9?style=flat-square)](README.md) [![MIT license](https://img.shields.io/github/license/jo-m1b/brickcard?style=flat-square&color=f9f9f9)](https://github.com/jo-m1b/brickcard/blob/main/LICENSE) [![Try it live](https://img.shields.io/badge/Essayez%20en%20ligne-brickcard.org-ff6699?style=flat-square)](https://brickcard.org)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/I5P825YXAH)

> LEGO® est une marque du LEGO Group. Ceci est un projet personnel, non affilié ni sponsorisé par le LEGO Group.

Brickcard est une petite appli pour créer et imprimer des cartes format carte à jouer qui décrivent des sets LEGO® (référence, photo, titre, thème, année et nombre de pièces).

Créez des cartes, imprimez-les, plastifiez-les et glissez-les dans une pochette transparente avec un set dont la boîte a disparu. Mes enfants les adorent — et ça évite de déballer le mauvais set par erreur :P

[<img src="screenshots/brickcard-screenshot-cards.webp" width="250" alt="Capture de la liste des cartes Brickcard.">](screenshots/brickcard-screenshot-cards.webp) [<img src="screenshots/brickcard-screenshot-cards-dark-mode.webp" width="250" alt="Capture de la liste des cartes Brickcard en thème sombre.">](screenshots/brickcard-screenshot-cards-dark-mode.webp) [<img src="screenshots/brickcard-screenshot-cards-creation.webp" width="250" alt="Capture de la création d’une carte Brickcard.">](screenshots/brickcard-screenshot-cards-creation.webp) [<img src="screenshots/brickcard-screenshot-cards-editor.webp" width="250" alt="Capture de l’éditeur de carte Brickcard.">](screenshots/brickcard-screenshot-cards-editor.webp) [<img src="screenshots/brickcard-screenshot-themes.webp" width="250" alt="Capture des thèmes Brickcard.">](screenshots/brickcard-screenshot-themes.webp) [<img src="screenshots/brickcard-screenshot-print-dialog-and-settings.webp" width="250" alt="Capture des paramètres d’impression Brickcard.">](screenshots/brickcard-screenshot-print-dialog-and-settings.webp)

## Fonctionnalités

- **Créer et modifier des cartes** : référence, photo, titre, thème, année, nombre de pièces…
- **Prêt à imprimer** : grilles A4 de 1×1 à 10×10, face + dos alignés pour le recto-verso
- **Thèmes** : thèmes par défaut (nom, logo, couleur) + vos thèmes personnalisés
- **Sauvegarde automatique** : tout est stocké dans le navigateur (IndexedDB)
- **Export / import** : fichiers `.brickcard` (cartes + thèmes perso) pour sauvegarder et partager votre collection
- **Liste filtrable** : retrouvez vite une carte et sélectionnez-la pour l’impression
- **Installable** : fonctionne comme PWA sur téléphone ou ordinateur

## Pour commencer

Utilisez directement la version en ligne sur [brickcard.org](https://brickcard.org), ou lancez un petit serveur local (pas de compilation, pas besoin de Node — mais les modules ES ont besoin d’un serveur) :

```bash
cd src
python3 -m http.server 3615
```

Puis ouvrez http://127.0.0.1:3615/

## Aide et discussion

Merci de chercher d’abord dans les issues et discussions existantes. Je fais de mon mieux pour répondre, mais je n’ai pas toujours le temps. Comment contribuer : [CONTRIBUTING.md](CONTRIBUTING.md).

### Bugs et demandes de fonctionnalités

Merci de les poster sur [GitHub Issues](https://github.com/jo-m1b/brickcard/issues).

### Support et discussion générale

Merci d’utiliser [GitHub Discussions](https://github.com/jo-m1b/brickcard/discussions).

## Crédits

- **Logo de l’app Brickcard** : icône brick outline par [Joko Sutrisno](https://www.vecteezy.com/members/108458460840346680378) sur [Vecteezy](https://www.vecteezy.com/vector-art/12802525-brick-outline-icon).
- **Certains logos de thèmes par défaut** : issus de [Brickipedia](https://brickipedia.fandom.com/wiki/List_of_themes) et [Logopedia](https://logos.fandom.com/fr/wiki/Logopedia).
- **Police Open Sans** : conçue par [Steve Matteson](https://mattesontypographics.com), maintenue par [The Open Sans Project Authors](https://github.com/googlefonts/opensans).
- **Police Inter** : (texte des cartes) conçue par [Rasmus Andersson](https://rsms.me), dépôt [github.com/rsms/inter](https://github.com/rsms/inter)

## Licence

Brickcard est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour le détail.
