import { ICON_ARROW_RIGHT_WIDE, ICON_CLOSE, ICON_TOOLS, modalTitleMarkup } from "../../icons.js";
import { linkMarkup } from "../../link.js";

/**
 * Galerie typographie du design system (2 polices max).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperTypography(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Typographie</p>
        <h1 class="view-title">Typographie</h1>
      </header>

      <p class="styleguide-intro">
        Open Sans pour l’UI, Inter pour les cartes.
        Classe = apparence&nbsp;; tag <code>h1</code>–<code>h3</code> = plan du document.
        Un rang 1 par vue, ne pas sauter de rang.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Polices</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr>
                <th>Police</th>
                <th>Variable</th>
                <th>Rôle</th>
                <th>Graisses</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Open Sans</strong></td>
                <td><code>--font-ui</code></td>
                <td>Toute l’app (texte, titres, forms, boutons, brand, code…)</td>
                <td>400 · 500 · 600 · 700 (+ italique 400)</td>
              </tr>
              <tr>
                <td><strong>Inter</strong></td>
                <td><code>--font-card</code></td>
                <td>Cartes uniquement (aperçu &amp; impression)</td>
                <td>400 · 500 · 600 · 700</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="styleguide-type-specimens" aria-label="Spécimens de police">
          <p class="styleguide-type-specimen styleguide-type-specimen--ui">
            <span class="styleguide-type-specimen-label">Open Sans — UI</span>
            Brickcard — Aa Bb Cc 0123456789
          </p>
          <p class="styleguide-type-specimen styleguide-type-specimen--card">
            <span class="styleguide-type-specimen-label">Inter — cartes</span>
            Brickcard — Aa Bb Cc 0123456789
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Couleurs de texte</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Jeton</th><th>Usage</th><th>Exemple</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>--ink</code></td>
                <td>Texte principal</td>
                <td><span style="color: var(--ink)">Texte ink</span></td>
              </tr>
              <tr>
                <td><code>--ink-soft</code></td>
                <td>Descriptions, hints, méta</td>
                <td><span style="color: var(--ink-soft)">Texte ink-soft</span></td>
              </tr>
              <tr>
                <td><code>--muted</code></td>
                <td>Secondaire atténué</td>
                <td><span style="color: var(--muted)">Texte muted</span></td>
              </tr>
              <tr>
                <td><code>--form-error</code></td>
                <td>Messages d’erreur</td>
                <td><span class="form-error" style="margin:0">Texte erreur</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Titres — apparence</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          Spécimens en <code>p</code> (cette galerie a déjà son <code>h1</code>).
          En prod, le tag suit le tableau «&nbsp;plan&nbsp;» plus bas.
        </p>
        <div class="styleguide-type-demo">
          <p class="view-title">Titre de vue (view-title)</p>
          <p class="view-desc">Description de vue (view-desc) — ink-soft, 0.95rem. Pas un heading, pas dans le header de modale.</p>
          <p class="section-title">Section (section-title)</p>
          <p class="styleguide-hint" style="margin-top: 0">
            <code>view-title</code> 1.7rem / 700 (1.35rem dans <code>.modal-header</code>)
            · <code>section-title</code> 1.25rem / 700
            · <code>styleguide-section-title</code> 1rem — interne galerie seulement.
          </p>
          <div class="empty-view" style="padding: 4.5rem 1.5rem 1.75rem; border: 1px dashed var(--line); margin-top: 1rem">
            <div class="empty-view-body">
              <div class="brick" aria-hidden="true"></div>
              <p class="view-title">État vide</p>
              <p>Même classe <code>view-title</code> (c’est le titre de la vue).</p>
            </div>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Titres — plan (quel tag)</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          Un rang 1 par vue (page ou dialog). Ne pas sauter de rang. Pas des headings&nbsp;:
          marque topbar, <code>form-label</code>, noms de cartes (grille thèmes, Brickcard).
        </p>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Contexte</th><th>Titre</th><th>Suite</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Page (<code>#main</code>)</td>
                <td><code>h1.view-title</code></td>
                <td><code>h2.section-title</code></td>
              </tr>
              <tr>
                <td>Liste</td>
                <td><code>h1.visually-hidden</code> «&nbsp;Cartes&nbsp;»</td>
                <td>—</td>
              </tr>
              <tr>
                <td>État vide (accueil, chargement)</td>
                <td><code>h1.view-title</code></td>
                <td>brique CSS ; texte / tuiles optionnels</td>
              </tr>
              <tr>
                <td>État vide (recherche liste / thèmes)</td>
                <td><code>p.view-title</code></td>
                <td><code>h1</code> déjà sur la vue / dialog</td>
              </tr>
              <tr>
                <td>Dialog</td>
                <td><code>h1.view-title</code> + <code>aria-labelledby</code> (titre court ; confirmations un peu plus longues)</td>
                <td><code>h2.section-title</code></td>
              </tr>
              <tr>
                <td>Page Markdown en modale</td>
                <td><code># Titre</code> → logo app + nom + version + <code>ri-arrow-right-wide-fill</code> + titre (<code>#page/about</code>)</td>
                <td><code>##</code> → <code>h2</code> · <code>###</code> → <code>h3</code> dans <code>.md-content</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Dialog — chrome</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          Le titre du spécimen est un <code>p.view-title</code> (éviter un second <code>h1</code> dans la galerie).
          En prod&nbsp;: <code>h1.view-title</code>.
        </p>
        <div class="styleguide-dialog-demo">
          <div class="modal-header">
            <div>
              <p class="view-title">${modalTitleMarkup("Paramètres", ICON_TOOLS)}</p>
            </div>
            <button type="button" class="btn primary icon-only modal-close" tabindex="-1">
              ${ICON_CLOSE}
              <span class="visually-hidden">Fermer</span>
            </button>
          </div>
          <div class="modal-body" tabindex="-1">
            <h2 class="section-title">Interface</h2>
            <p class="form-label">Mode d’affichage</p>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Dialog — Markdown (<code>md-content</code>)</h2>
        <p class="form-hint" style="margin-bottom: 0.75rem">
          Fichier&nbsp;: <code># Titre</code>, puis <code>##</code> / <code>###</code>.
          Pas de <code>h1</code> dans le corps. À propos&nbsp;: logo app + nom + version + flèche + titre. Intertitres plus petits que le header (1.2rem / 1.05rem).
        </p>
        <div class="styleguide-dialog-demo">
          <div class="modal-header">
            <div>
              <p class="view-title"><span class="modal-title-lead"><span class="modal-title-brand" aria-hidden="true"></span><span>Brickcard v0.x.x</span></span>${ICON_ARROW_RIGHT_WIDE}<span>À propos</span></p>
            </div>
            <button type="button" class="btn primary icon-only modal-close" tabindex="-1">
              ${ICON_CLOSE}
              <span class="visually-hidden">Fermer</span>
            </button>
          </div>
          <div class="modal-body" tabindex="-1">
            <article class="md-content">
              <p>Paragraphe de contenu. Texte avec <strong>gras</strong>, <em>italique</em>,
                un ${linkMarkup("lien", { href: "#developer" })} et du <code>code inline</code>.</p>
              <h2>Fonctionnalités</h2>
              <ul>
                <li>Liste à puces — premier élément</li>
                <li>Deuxième élément</li>
                <li>Troisième avec <strong>emphasis</strong></li>
              </ul>
              <h3>Détail</h3>
              <ol>
                <li>Liste numérotée — étape une</li>
                <li>Étape deux</li>
              </ol>
              <blockquote>
                Citation (blockquote) — bordure gauche ink, texte ink-soft.
              </blockquote>
              <pre><code>// Bloc de code (Open Sans)
const APP_ID = "brickcard";</code></pre>
              <hr />
              <p>Après un séparateur <code>hr</code>.</p>
            </article>
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Marque (topbar)</h2>
        <div class="styleguide-type-demo">
          <div class="brand-text">
            <span class="brand-name">Brickcard</span>
            <span class="brand-version">0.x.x</span>
          </div>
          <p class="styleguide-hint">
            Pas un heading. <code>brand-name</code> Open Sans 1.15rem / 700 · <code>brand-version</code> 0.8rem / 500 ink-soft.
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Formulaire</h2>
        <div class="styleguide-type-demo styleguide-fields">
          <div class="form-field">
            <label class="form-label form-label--required" for="typo-demo-input">Label de champ</label>
            <p class="form-hint" id="typo-demo-hint">Hint / description au-dessus du contrôle (0.8rem, ink-soft)</p>
            <input class="form-control" id="typo-demo-input" type="text" value="Valeur d’exemple" aria-describedby="typo-demo-hint typo-demo-error" />
            <p class="form-error" id="typo-demo-error" role="alert">Message d’erreur (form-error).</p>
          </div>
          <p class="styleguide-hint">
            <code>form-label</code> n’est pas un heading. 0.82rem / 600 · <code>form-label--required</code> ajoute un astérisque.
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Corps &amp; inline</h2>
        <div class="styleguide-type-demo">
          <p style="margin: 0 0 0.75rem">
            Paragraphe UI en <strong>Open Sans</strong> (héritée du <code>body</code>).
            Emphase <em>italique</em>, <strong>gras</strong>,
            ${linkMarkup("lien", { href: "#developer" })} et <code>code inline</code> (même police, graisse 600).
          </p>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Récap des rôles (UI)</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Classe / contexte</th><th>Taille / graisse</th></tr>
            </thead>
            <tbody>
              <tr><td><code>body</code></td><td>héritée · 400</td></tr>
              <tr><td><code>view-title</code></td><td>1.7rem · 700 (1.35rem en header de modale)</td></tr>
              <tr><td><code>view-desc</code></td><td>0.95rem · ink-soft (vues, pas le header de modale)</td></tr>
              <tr><td><code>section-title</code></td><td>1.25rem · 700</td></tr>
              <tr><td><code>styleguide-section-title</code></td><td>1rem · 700 (galerie)</td></tr>
              <tr><td><code>a.link</code></td><td>héritée · underline · voir galerie Liens</td></tr>
              <tr><td><code>form-label</code></td><td>0.82rem · 600</td></tr>
              <tr><td><code>form-hint</code> / <code>form-error</code></td><td>0.8rem / 0.82rem</td></tr>
              <tr><td><code>brand-name</code></td><td>1.15rem · 700</td></tr>
              <tr><td><code>.md-content h2</code> / <code>h3</code></td><td>1.2rem / 1.05rem · 700</td></tr>
              <tr><td><code>.md-content</code> corps</td><td>0.98rem · lh 1.55</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  return () => {
    host.innerHTML = "";
  };
}
