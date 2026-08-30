import {
  ICON_ADD,
  ICON_ARROW_RIGHT,
  ICON_CLOSE,
  ICON_PRINTER,
  ICON_SETTINGS,
} from "../../icons.js";
import { linkMarkup } from "../../link.js";

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
 * Button gallery of the design system.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperButtons(host) {
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
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Button</p>
        <h1 class="view-title">Button</h1>
      </header>

      <p class="styleguide-intro">
        Four variants, text and icons.
        Icon on the right&nbsp;: <code>icon-right</code>.
        Compact&nbsp;: <code>sm</code>.
        Badge&nbsp;: <code>btn-badge</code>.
        Icons&nbsp;: ${linkMarkup("Remix Icon", { href: "https://remixicon.com/" })}.
        Hover and keyboard focus share the same style.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Text only</h2>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v])).join("\n          ")}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Text + icon (left)</h2>
        <div class="styleguide-row">
          ${demoBtn("primary", "New card", { icon: ICON_ADD })}
          ${demoBtn("secondary", "Secondary", { icon: ICON_ADD })}
          ${demoBtn("ghost", "Ghost", { icon: ICON_ADD })}
          ${demoBtn("danger", "Danger", { icon: ICON_ADD })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Text + icon (right)</h2>
        <div class="styleguide-row">
          ${demoBtn("primary", "Continue", { icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${demoBtn("secondary", "Continue", { icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${demoBtn("ghost", "Continue", { icon: ICON_ARROW_RIGHT, iconRight: true })}
          ${demoBtn("danger", "Continue", { icon: ICON_ARROW_RIGHT, iconRight: true })}
        </div>
        <p class="styleguide-hint">Class <code>icon-right</code> (SVG first in the DOM, layout reversed).</p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Icon only</h2>
        <div class="styleguide-row">
          ${demoBtn("primary", "Add", { icon: ICON_ADD, iconOnly: true })}
          ${demoBtn("secondary", "Settings", { icon: ICON_SETTINGS, iconOnly: true })}
          ${demoBtn("ghost", "Settings", { icon: ICON_SETTINGS, iconOnly: true })}
          ${demoBtn("danger", "Close", { icon: ICON_CLOSE, iconOnly: true })}
        </div>
        <p class="styleguide-hint">
          Class <code>icon-only</code> + label in
          <code>span.visually-hidden</code> (accessible name, icon
          <code>aria-hidden</code>).
        </p>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Badge <code>btn-badge</code></h2>
        <p class="styleguide-hint" style="margin-top: 0; margin-bottom: 0.75rem">
          Overlay, top-right corner. The button keeps its type (text / text+icon / icon-only).
          Badge is <code>aria-hidden</code> — the accessible name stays on the button
          (e.g. <code>aria-label</code> or <code>visually-hidden</code> with the total).
        </p>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem">Text only</h3>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { badge: 3 })).join("\n          ")}
        </div>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem; margin-top: 1rem">Text + icon</h3>
        <div class="styleguide-row">
          ${demoBtn("primary", "New card", { icon: ICON_ADD, badge: 2 })}
          ${demoBtn("secondary", "Secondary", { icon: ICON_ADD, badge: 2 })}
          ${demoBtn("ghost", "Ghost", { icon: ICON_ADD, badge: 2 })}
          ${demoBtn("danger", "Danger", { icon: ICON_ADD, badge: 2 })}
        </div>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem; margin-top: 1rem">Icon only</h3>
        <div class="styleguide-row">
          ${demoBtn("primary", "Add (3)", { icon: ICON_ADD, iconOnly: true, badge: 3 })}
          ${demoBtn("secondary", "Settings (3)", { icon: ICON_SETTINGS, iconOnly: true, badge: 3 })}
          ${demoBtn("ghost", "Print (3)", { icon: ICON_PRINTER, iconOnly: true, badge: 3 })}
          ${demoBtn("danger", "Alerts (3)", { icon: ICON_CLOSE, iconOnly: true, badge: 3 })}
        </div>
        <h3 class="styleguide-section-title" style="font-size: 0.9rem; margin-top: 1rem">Size <code>sm</code></h3>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { sm: true, badge: 9 })).join("\n          ")}
        </div>
        <div class="styleguide-row" style="margin-top: 0.65rem">
          ${demoBtn("primary", "With icon", { icon: ICON_ADD, sm: true, badge: 9 })}
          ${demoBtn("secondary", "Continue", { icon: ICON_ARROW_RIGHT, iconRight: true, sm: true, badge: 9 })}
          ${demoBtn("primary", "Add (9)", { icon: ICON_ADD, iconOnly: true, sm: true, badge: 9 })}
          ${demoBtn("secondary", "Settings (9)", { icon: ICON_SETTINGS, iconOnly: true, sm: true, badge: 9 })}
          ${demoBtn("ghost", "Print (9)", { icon: ICON_PRINTER, iconOnly: true, sm: true, badge: 9 })}
          ${demoBtn("danger", "Alerts (9)", { icon: ICON_CLOSE, iconOnly: true, sm: true, badge: 9 })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Size <code>sm</code></h2>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { sm: true })).join("\n          ")}
        </div>
        <div class="styleguide-row" style="margin-top: 0.65rem">
          ${demoBtn("primary", "With icon", { icon: ICON_ADD, sm: true })}
          ${demoBtn("secondary", "Continue", { icon: ICON_ARROW_RIGHT, iconRight: true, sm: true })}
          ${demoBtn("primary", "Add", { icon: ICON_ADD, iconOnly: true, sm: true })}
          ${demoBtn("secondary", "Settings", { icon: ICON_SETTINGS, iconOnly: true, sm: true })}
          ${demoBtn("ghost", "Settings", { icon: ICON_SETTINGS, iconOnly: true, sm: true })}
          ${demoBtn("danger", "Close", { icon: ICON_CLOSE, iconOnly: true, sm: true })}
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Disabled</h2>
        <div class="styleguide-row">
          ${variants.map((v) => demoBtn(v, labels[v], { disabled: true })).join("\n          ")}
        </div>
        <div class="styleguide-row" style="margin-top: 0.65rem">
          ${demoBtn("primary", "New card", { icon: ICON_ADD, disabled: true })}
          ${demoBtn("secondary", "Continue", { icon: ICON_ARROW_RIGHT, iconRight: true, disabled: true })}
          ${demoBtn("primary", "Add", { icon: ICON_ADD, iconOnly: true, disabled: true })}
          ${demoBtn("ghost", "Settings", { icon: ICON_SETTINGS, iconOnly: true, disabled: true })}
          ${demoBtn("danger", "Close", { icon: ICON_CLOSE, iconOnly: true, disabled: true })}
        </div>
      </div>
    </section>
  `;
  return () => {
    host.innerHTML = "";
  };
}
