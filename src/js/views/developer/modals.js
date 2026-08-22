import { ICON_CLOSE, ICON_DELETE_BIN_2, ICON_SAVE, ICON_WINDOW, modalTitleMarkup } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { focusTopModal } from "../../modal-focus.js";

/**
 * @typedef {"sm"|"md"|"lg"} ModalSize
 * @typedef {"top"|"middle"|"bottom"} ModalAlign
 */

/**
 * Galerie / banc d’essai des modales (design system).
 * Ouvre des démos dans `#modal-root` sans modifier les modales métier.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperModals(host) {
  function getDemoRoot() {
    return document.getElementById("developer-demo-root");
  }

  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Modale (Modal)</p>
        <h1 class="view-title">Modale (Modal)</h1>
      </header>

      <p class="styleguide-intro">
        Banc d’essai pour uniformiser les dialogues.
        <strong>3 tailles</strong> (<code>modal--sm</code> / <code>modal--md</code> / <code>modal--lg</code>).
        Sous <code>640px</code> de largeur&nbsp;: plein écran (plus d’overlay visible).
        Largeur / hauteur toujours plafonnées au <strong>viewport</strong> (<code>100vw</code> / <code>100dvh</code>), pas au scroll de la page.
        Les démos s’empilent au-dessus de cette galerie (sans la remplacer).
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vocabulaire</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Axe</th><th>Options</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Coquille</td>
                <td><code>modal-backdrop</code> + <code>modal</code> (<code>role="dialog"</code> <code>aria-modal</code>)</td>
              </tr>
              <tr>
                <td>Taille</td>
                <td><code>modal--sm</code> (petite, ~640) · <code>modal--md</code> (moyenne, ~896, défaut) · <code>modal--lg</code> (grande, ~1152)</td>
              </tr>
              <tr>
                <td>Alignement vertical</td>
                <td><code>modal-backdrop--top</code> · <code>modal-backdrop--middle</code> (défaut) · <code>modal-backdrop--bottom</code></td>
              </tr>
              <tr>
                <td>Responsive</td>
                <td>≤&nbsp;640px&nbsp;: plein écran viewport ; sinon <code>max-width: calc(100vw - 2rem)</code> / <code>max-height: calc(100dvh - 2.5rem)</code></td>
              </tr>
              <tr>
                <td>Header</td>
                <td><code>modal-header</code> : <code>h1.view-title</code> (icône Remix optionnelle à gauche) + <code>btn primary icon-only modal-close</code> (couleurs inversées, <code>tabindex="-1"</code>)</td>
              </tr>
              <tr>
                <td>Corps</td>
                <td><code>modal-body</code> (défile si besoin)</td>
              </tr>
              <tr>
                <td>Pied</td>
                <td><code>modal-footer</code> + <code>modal-footer-start</code> (validation) + <code>modal-footer-end</code> (danger) — boutons centrés verticalement</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="form-hint" style="margin-top: 0.75rem">
          Appliqué dans l’app&nbsp;: paramètres / page MD (<code>modal--md</code>),
          thèmes + éditeur carte + éditeur de thème + espace développeur (<code>modal--lg</code>).
        </p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Correspondance app</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Usage</th><th>Taille</th></tr>
            </thead>
            <tbody>
              <tr><td>Paramètres / page MD</td><td><code>modal--md</code></td></tr>
              <tr><td>Thèmes LEGO / éditeur carte / éditeur de thème / espace développeur</td><td><code>modal--lg</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Tailles</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Sur desktop&nbsp;: largeurs distinctes. Réduis la fenêtre (&lt;&nbsp;640px) pour voir le plein écran.</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="size" data-size="sm">Petite — sm</button>
          <button type="button" class="btn secondary" data-demo-modal="size" data-size="md">Moyenne — md</button>
          <button type="button" class="btn secondary" data-demo-modal="size" data-size="lg">Grande — lg</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Alignement vertical</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Sur le <code>modal-backdrop</code>. Défaut&nbsp;: milieu. Sans effet en plein écran (&lt;&nbsp;640px).</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="align" data-align="top">Haut</button>
          <button type="button" class="btn secondary" data-demo-modal="align" data-align="middle">Milieu (défaut)</button>
          <button type="button" class="btn secondary" data-demo-modal="align" data-align="bottom">Bas</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Header</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">
          Titre court + bouton fermer (<code>btn primary icon-only</code>, couleurs inversées).
          Les confirmations peuvent avoir un titre plus long (il passe à la ligne).
        </p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="header-plain">Titre court</button>
          <button type="button" class="btn secondary" data-demo-modal="header-confirm">Titre de confirmation</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Corps long</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Grande modale avec beaucoup de contenu (scroll dans le body).</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="scroll">Ouvrir (contenu long)</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Footer d’actions</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">
          <code>modal-footer-start</code> (gauche&nbsp;: sauvegarde / validation) ·
          <code>modal-footer-end</code> (droite&nbsp;: danger). Boutons centrés verticalement (normal + <code>sm</code>).
          <strong>Annuler</strong>&nbsp;: <code>sm</code> s’il y a d’autres actions dans le pied ; taille normale s’il est seul.
        </p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-modal="footer">Zones gauche / droite</button>
          <button type="button" class="btn secondary" data-demo-modal="footer-danger">Confirm suppression (sm)</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Comportement</h2>
        <ul class="styleguide-notes">
          <li>Clic backdrop → ferme (desktop uniquement — en plein écran le backdrop n’est plus visible)</li>
          <li>Échap → ferme (le bouton Fermer n’est pas tabulable)</li>
          <li>Bouton close → ferme</li>
          <li><code>body.modal-open</code> bloque le scroll de fond</li>
        </ul>
      </div>
    </section>
  `;

  /** @type {(() => void)|null} */
  let demoCleanup = null;

  function closeDemo() {
    if (demoCleanup) {
      demoCleanup();
      demoCleanup = null;
    }
  }

  /**
   * @param {{
   *   size?: ModalSize,
   *   align?: ModalAlign,
   *   title: string,
   *   icon?: string,
   *   bodyHtml: string,
   *   footerHtml?: string,
   * }} spec
   */
  function openDemo(spec) {
    const demoRoot = getDemoRoot();
    if (!demoRoot) return;
    closeDemo();

    const size = spec.size || "md";
    const align = spec.align || "middle";
    const sizeClass = `modal--${size}`;
    const alignClass =
      align === "top" || align === "bottom" || align === "middle"
        ? ` modal-backdrop--${align}`
        : " modal-backdrop--middle";
    const footer = spec.footerHtml
      ? `<div class="modal-footer">${spec.footerHtml}</div>`
      : "";

    demoRoot.innerHTML = `
      <div class="modal-backdrop${alignClass}" id="demo-modal-backdrop" role="presentation">
        <div
          class="modal ${sizeClass}"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
        >
          <div class="modal-header">
            <div>
              <h1 class="view-title" id="demo-modal-title">${modalTitleMarkup(spec.title, spec.icon || ICON_WINDOW)}</h1>
            </div>
            <button type="button" class="btn primary icon-only modal-close" tabindex="-1" id="demo-modal-close">
              ${ICON_CLOSE}
              <span class="visually-hidden">Fermer</span>
            </button>
          </div>
          <div class="modal-body" tabindex="-1">
            ${spec.bodyHtml}
          </div>
          ${footer}
        </div>
      </div>
    `;

    const backdrop = demoRoot.querySelector("#demo-modal-backdrop");
    const btnClose = demoRoot.querySelector("#demo-modal-close");

    const onBackdrop = (/** @type {MouseEvent} */ e) => {
      if (e.target === backdrop) closeDemo();
    };
    const onKey = (/** @type {KeyboardEvent} */ e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeDemo();
      }
    };

    backdrop?.addEventListener("click", onBackdrop);
    btnClose?.addEventListener("click", closeDemo);
    demoRoot.querySelectorAll("[data-demo-close]").forEach((el) => {
      el.addEventListener("click", closeDemo);
    });
    document.addEventListener("keydown", onKey, true);
    queueMicrotask(() => focusTopModal());

    demoCleanup = () => {
      backdrop?.removeEventListener("click", onBackdrop);
      btnClose?.removeEventListener("click", closeDemo);
      document.removeEventListener("keydown", onKey, true);
      demoRoot.innerHTML = "";
    };
  }

  function longBodyHtml() {
    const paras = Array.from({ length: 12 }, (_, i) => {
      return `<p>Paragraphe de démonstration n°${i + 1}. Contenu volontairement long pour tester le défilement interne du <code>modal-body</code>.</p>`;
    }).join("\n");
    return `<div class="md-content">${paras}</div>`;
  }

  const sizeLabels = { sm: "petite", md: "moyenne", lg: "grande" };

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const btn = t.closest?.("[data-demo-modal]");
    if (!btn || !host.contains(btn)) return;
    const kind = btn.getAttribute("data-demo-modal");
    if (kind === "size") {
      const size = /** @type {ModalSize} */ (btn.getAttribute("data-size") || "md");
      openDemo({
        size,
        title: `Modale ${sizeLabels[size] || size}`,
        bodyHtml: `<p>Classe <code>modal--${size}</code>. Sous 640px&nbsp;: plein écran.</p><p>Corps de démo. Sur grand écran, la largeur suit la taille. Sur smartphone, la modale occupe tout l’écran.</p>`,
      });
      return;
    }
    if (kind === "align") {
      const align = /** @type {ModalAlign} */ (btn.getAttribute("data-align") || "middle");
      const alignLabels = { top: "haut", middle: "milieu", bottom: "bas" };
      openDemo({
        size: "sm",
        align,
        title: `Alignée en ${alignLabels[align] || align}`,
        bodyHtml: `<p>Classe <code>modal-backdrop--${align}</code> sur le backdrop.</p><p>Petite modale pour bien voir le positionnement vertical. Le défaut sans classe (ou <code>--middle</code>) centre verticalement.</p>`,
      });
      return;
    }
    if (kind === "header-plain") {
      openDemo({
        size: "md",
        title: "Paramètres",
        icon: "tools",
        bodyHtml: `<p>Header&nbsp;: titre court + <code>btn primary icon-only modal-close</code> (couleurs inversées sur le header ink).</p>`,
      });
      return;
    }
    if (kind === "header-confirm") {
      openDemo({
        size: "sm",
        title: "Supprimer la carte \"Saucer Centurien\" (#6939) ?",
        icon: "delete-bin-2",
        bodyHtml: `<p class="modal-confirm-msg">Attention, la suppression est définitive et ne pourra pas être annulée&nbsp;! Souhaitez-vous continuer&nbsp;?</p>`,
        footerHtml: `
          <div class="modal-footer-end">
            <button type="button" class="btn secondary sm" data-demo-close>Annuler</button>
            <button type="button" class="btn danger" data-demo-close>${ICON_DELETE_BIN_2}<span>Supprimer</span></button>
          </div>
        `,
      });
      return;
    }
    if (kind === "scroll") {
      openDemo({
        size: "lg",
        title: "Contenu long",
        bodyHtml: `<p><code>modal--lg</code> — le body défile.</p>${longBodyHtml()}`,
      });
      return;
    }
    if (kind === "footer") {
      openDemo({
        size: "md",
        title: "Footer à deux zones",
        bodyHtml: `<p>Gauche&nbsp;: validation · Droite&nbsp;: danger. Tailles mixte (normal + <code>sm</code>).</p><p>Les boutons restent alignés verticalement au centre du footer, quelle que soit leur taille.</p>`,
        footerHtml: `
          <div class="modal-footer-start">
            <button type="button" class="btn primary" data-demo-close>${ICON_SAVE}<span>Sauvegarder</span></button>
            <button type="button" class="btn secondary sm" data-demo-close>Annuler</button>
          </div>
          <div class="modal-footer-end">
            <button type="button" class="btn danger" data-demo-close>${ICON_DELETE_BIN_2}<span>Supprimer</span></button>
          </div>
        `,
      });
      return;
    }
    if (kind === "footer-danger") {
      openDemo({
        size: "sm",
        title: "Supprimer le thème \"Star Wars\" ?",
        icon: "delete-bin-2",
        bodyHtml: `<p class="modal-confirm-msg">Cette action est irréversible (démo).</p>`,
        footerHtml: `
          <div class="modal-footer-start">
            <button type="button" class="btn secondary sm" data-demo-close>Annuler</button>
          </div>
          <div class="modal-footer-end">
            <button type="button" class="btn danger" data-demo-close>${ICON_DELETE_BIN_2}<span>Supprimer</span></button>
          </div>
        `,
      });
    }
  };

  host.addEventListener("click", onClick);

  return () => {
    host.removeEventListener("click", onClick);
    closeDemo();
    host.innerHTML = "";
  };
}
