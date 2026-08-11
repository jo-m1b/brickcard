import {
  ICON_ADD,
  ICON_ARROW_RIGHT,
  ICON_CLOSE,
  ICON_PRINTER,
  ICON_SETTINGS,
} from "../../icons.js";

/**
 * @param {"primary"|"secondary"|"ghost"|"danger"} variant
 * @param {string} label
 * @param {{
 *   icon?: string,
 *   iconRight?: boolean,
 *   iconOnly?: boolean,
 *   sm?: boolean,
 *   disabled?: boolean,
 *   badge?: string | number,
 * }} [opts]
 */
function demoBtn(variant, label, opts = {}) {
  const classes = ["btn", variant];
  if (opts.sm) classes.push("sm");
  if (opts.iconRight) classes.push("icon-right");
  if (opts.iconOnly) classes.push("icon-only");
  const disabled = opts.disabled ? " disabled" : "";
  const icon = opts.icon || "";
  const badge =
    opts.badge != null && opts.badge !== ""
      ? `<span class="btn-badge" aria-hidden="true">${opts.badge}</span>`
      : "";
  if (opts.iconOnly) {
    return `<button type="button" class="${classes.join(" ")}"${disabled}>${icon}<span class="visually-hidden">${label}</span>${badge}</button>`;
  }
  if (icon) {
    return `<button type="button" class="${classes.join(" ")}"${disabled}>${icon}<span>${label}</span>${badge}</button>`;
  }
  return `<button type="button" class="${classes.join(" ")}"${disabled}>${label}${badge}</button>`;
}

/**
 * Galerie des boutons du design system.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderTestButtons(host) {
  const variants = /** @type {const} */ (["primary", "secondary", "ghost", "danger"]);
  const labels = {
    primary: "Primary",
    secondary: "Secondary",
    ghost: "Ghost",
    danger: "Danger",
  };

  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker"><a href="#/test">Styleguide</a> / Boutons</p>
        <h1 class="view-title">Boutons</h1>
        <p class="view-desc">
          4 variantes × 3 contenus (texte, texte+icône, icône seule).
          Icône à droite : <code>icon-right</code>.
          Compact : <code>sm</code>.
          Badge : <code>btn-badge</code>.
          Icônes : <a href="https://remixicon.com/" target="_blank" rel="noopener">Remix Icon</a>.
          Hover et focus clavier partagent le même style.
        </p>
      </header>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Texte seul</h2>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v])).join("\n          ")}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Texte + icône (gauche)</h2>
        <div class="styleguide-row">
          ${demoBtn("primary", "Nouvelle carte", { icon: ICON_ADD })}
          ${demoBtn("secondary", "Secondary", { icon: ICON_ADD })}
          ${demoBtn("ghost", "Ghost", { icon: ICON_ADD })}
          ${demoBtn("danger", "Danger", { icon: ICON_ADD })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Texte + icône (droite)</h2>
        <div class="styleguide-row">
          ${demoBtn("primary", "Continuer", { icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${demoBtn("secondary", "Continuer", { icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${demoBtn("ghost", "Continuer", { icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${demoBtn("danger", "Continuer", { icon: ICON_ARROW_RIGHT, iconRight: true })}
        </div>
        <p class="styleguide-hint">Classe <code>icon-right</code> (SVG en premier dans le DOM, disposition inversée).</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Icône seule</h2>
        <div class="styleguide-row">
          ${demoBtn("primary", "Ajouter", { icon: ICON_ADD, iconOnly: true })}
          ${demoBtn("secondary", "Paramètres", { icon: ICON_SETTINGS, iconOnly: true })}
          ${demoBtn("ghost", "Paramètres", { icon: ICON_SETTINGS, iconOnly: true })}
          ${demoBtn("danger", "Fermer", { icon: ICON_CLOSE, iconOnly: true })}
        </div>
        <p class="styleguide-hint">
          Classe <code>icon-only</code> + label dans
          <code>span.visually-hidden</code> (nom accessible, icône en
          <code>aria-hidden</code>).
        </p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Badge <code>btn-badge</code></h2>
        <p class="styleguide-hint" style="margin-top: 0; margin-bottom: 0.75rem">
          Overlay coin haut-droit. Le bouton garde son type (texte / texte+icône / icon-only).
          Badge en <code>aria-hidden</code> — le libellé accessible reste sur le bouton
          (ex. <code>aria-label</code> ou <code>visually-hidden</code> avec le total).
        </p>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem">Texte seul</h3>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { badge: 3 })).join("\n          ")}
        </div>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem; margin-top: 1rem">Texte + icône</h3>
        <div class="styleguide-row">
          ${demoBtn("primary", "Nouvelle carte", { icon: ICON_ADD, badge: 2 })}
          ${demoBtn("secondary", "Secondary", { icon: ICON_ADD, badge: 2 })}
          ${demoBtn("ghost", "Ghost", { icon: ICON_ADD, badge: 2 })}
          ${demoBtn("danger", "Danger", { icon: ICON_ADD, badge: 2 })}
        </div>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem; margin-top: 1rem">Icône seule</h3>
        <div class="styleguide-row">
          ${demoBtn("primary", "Ajouter (3)", { icon: ICON_ADD, iconOnly: true, badge: 3 })}
          ${demoBtn("secondary", "Paramètres (3)", { icon: ICON_SETTINGS, iconOnly: true, badge: 3 })}
          ${demoBtn("ghost", "Impression (3)", { icon: ICON_PRINTER, iconOnly: true, badge: 3 })}
          ${demoBtn("danger", "Alertes (3)", { icon: ICON_CLOSE, iconOnly: true, badge: 3 })}
        </div>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem; margin-top: 1rem">Taille <code>sm</code></h3>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { sm: true, badge: 9 })).join("\n          ")}
        </div>
        <div class="styleguide-row" style="margin-top: 0.65rem">
          ${demoBtn("primary", "Avec icône", { icon: ICON_ADD, sm: true, badge: 9 })}
          ${demoBtn("secondary", "Continuer", { icon: ICON_ARROW_RIGHT, iconRight: true, sm: true, badge: 9 })}
          ${demoBtn("primary", "Ajouter (9)", { icon: ICON_ADD, iconOnly: true, sm: true, badge: 9 })}
          ${demoBtn("secondary", "Paramètres (9)", { icon: ICON_SETTINGS, iconOnly: true, sm: true, badge: 9 })}
          ${demoBtn("ghost", "Impression (9)", { icon: ICON_PRINTER, iconOnly: true, sm: true, badge: 9 })}
          ${demoBtn("danger", "Alertes (9)", { icon: ICON_CLOSE, iconOnly: true, sm: true, badge: 9 })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Taille <code>sm</code></h2>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { sm: true })).join("\n          ")}
        </div>
        <div class="styleguide-row" style="margin-top: 0.65rem">
          ${demoBtn("primary", "Avec icône", { icon: ICON_ADD, sm: true })}
          ${demoBtn("secondary", "Continuer", { icon: ICON_ARROW_RIGHT, iconRight: true, sm: true })}
          ${demoBtn("primary", "Ajouter", { icon: ICON_ADD, iconOnly: true, sm: true })}
          ${demoBtn("secondary", "Paramètres", { icon: ICON_SETTINGS, iconOnly: true, sm: true })}
          ${demoBtn("ghost", "Paramètres", { icon: ICON_SETTINGS, iconOnly: true, sm: true })}
          ${demoBtn("danger", "Fermer", { icon: ICON_CLOSE, iconOnly: true, sm: true })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Disabled</h2>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { disabled: true })).join("\n          ")}
        </div>
        <div class="styleguide-row" style="margin-top: 0.65rem">
          ${demoBtn("primary", "Nouvelle carte", { icon: ICON_ADD, disabled: true })}
          ${demoBtn("secondary", "Continuer", { icon: ICON_ARROW_RIGHT, iconRight: true, disabled: true })}
          ${demoBtn("primary", "Ajouter", { icon: ICON_ADD, iconOnly: true, disabled: true })}
          ${demoBtn("ghost", "Paramètres", { icon: ICON_SETTINGS, iconOnly: true, disabled: true })}
          ${demoBtn("danger", "Fermer", { icon: ICON_CLOSE, iconOnly: true, disabled: true })}
        </div>
      </div>

      <p class="styleguide-back">
        <a href="#/test">← Index styleguide</a>
        ·
        <a href="#/list">App</a>
      </p>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
