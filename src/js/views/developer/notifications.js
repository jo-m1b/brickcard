import { ICON_NOTIFICATION_LINE } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { formCheckboxMarkup } from "../../form-checkbox.js";
import { bindFormRadios, formRadioMarkup } from "../../form-radio.js";
import { TOAST_DELAY_DEFAULT, toast } from "../../toast.js";

/** @typedef {import("../../toast.js").ToastOptions} ToastOptions */
/** @typedef {import("../../toast.js").ToastType} ToastType */

/** @type {Record<string, ToastOptions | ToastOptions[]>} */
const PRESETS = {
  normal: { message: "Collection à jour." },
  success: { type: "success", message: "Carte enregistrée" },
  error: { type: "error", message: "Page introuvable" },
  "no-title-icon": {
    title: false,
    icon: "notification-line",
    message: "Nouvelle version disponible.",
  },
  "icon-override": {
    type: "success",
    icon: "save",
    message: "Sauvegarde enregistrée.",
  },
  secondary: {
    type: "success",
    message: "Thème CITY enregistré.",
    secondary: "à l’instant",
  },
  delay: { message: "Fermeture dans 2 secondes.", delay: 2000 },
  sticky: {
    type: "error",
    message: "Cette notification reste affichée jusqu’à fermeture.",
    delay: false,
  },
  stack: [
    { message: "Première notification" },
    { type: "success", message: "Deuxième notification" },
    { type: "error", message: "Troisième notification" },
  ],
};

/**
 * Galerie / banc d’essai des notifications toast (design system).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperNotifications(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Notification (Toast)</p>
        <h1 class="view-title">Notification (Toast)</h1>
      </header>

      <p class="styleguide-intro">
        Retour d’action non bloquant, empilable, au-dessus des modales.
        Module&nbsp;: <code>toast.js</code>.
        Pas d’animation (affichage / suppression).
        Icônes&nbsp;: ${linkMarkup("Remix Icon", { href: "https://remixicon.com/" })}.
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
                <td>Type</td>
                <td><code>normal</code> (défaut, pas d’icône ni de titre) · <code>success</code> (vert, «&nbsp;Succès&nbsp;», <code>checkbox-circle-fill</code>) · <code>error</code> (rouge, «&nbsp;Erreur&nbsp;», <code>error-warning-fill</code>)</td>
              </tr>
              <tr>
                <td>Header</td>
                <td>si titre ou texte secondaire&nbsp;: icône + titre à gauche, <code>small</code> + croix à droite</td>
              </tr>
              <tr>
                <td>Body</td>
                <td>message (obligatoire). Sans titre&nbsp;: icône à gauche du message, croix en haut à droite</td>
              </tr>
              <tr>
                <td>Fermeture</td>
                <td>croix (défaut) · auto <code>delay</code> ${TOAST_DELAY_DEFAULT}&nbsp;ms · import/sauvegarde collection 15&nbsp;s · <code>delay: false</code> force la croix</td>
              </tr>
              <tr>
                <td>Pile</td>
                <td>nouvelles en bas à droite · les précédentes remontent · ≤&nbsp;640px&nbsp;: pleine largeur centrée (marge 1,25rem)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Types</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Les toasts s’empilent en bas à droite (au-dessus de cette modale)</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-toast="normal">Normal</button>
          <button type="button" class="btn secondary" data-demo-toast="success">Succès</button>
          <button type="button" class="btn secondary" data-demo-toast="error">Erreur</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Header / body</h2>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-toast="no-title-icon">Sans titre + icône</button>
          <button type="button" class="btn secondary" data-demo-toast="icon-override">Icône surchargée</button>
          <button type="button" class="btn secondary" data-demo-toast="secondary">Texte secondaire</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Fermeture</h2>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-toast="delay">Délai 2&nbsp;s</button>
          <button type="button" class="btn secondary" data-demo-toast="sticky">Sans auto-fermeture</button>
          <button type="button" class="btn secondary" data-demo-toast="stack">Empiler 3</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Banc d’essai</h2>
        <form id="toast-playground" class="styleguide-fields">
          <fieldset class="form-check-group">
            <legend class="form-label">Type</legend>
            <div class="form-check-list form-check-list--row">
              ${formRadioMarkup({
                id: "toast-type-normal",
                name: "toast-type",
                value: "normal",
                label: "Normal",
                checked: true,
              })}
              ${formRadioMarkup({
                id: "toast-type-success",
                name: "toast-type",
                value: "success",
                label: "Succès",
              })}
              ${formRadioMarkup({
                id: "toast-type-error",
                name: "toast-type",
                value: "error",
                label: "Erreur",
              })}
            </div>
          </fieldset>
          <div class="form-field">
            <label class="form-label form-label--required" for="toast-message">Message</label>
            <textarea class="form-control" id="toast-message" name="toast-message" rows="2" required>Carte enregistrée</textarea>
            <p class="form-error" id="toast-message-error" hidden>Le message est obligatoire.</p>
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-title">Titre</label>
            <p class="form-hint" id="toast-title-hint">Vide = défaut du type (Succès / Erreur). Cocher «&nbsp;Sans titre&nbsp;» pour le masquer.</p>
            <input class="form-control" type="text" id="toast-title" name="toast-title" autocomplete="off" aria-describedby="toast-title-hint" />
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-secondary">Texte secondaire</label>
            <p class="form-hint" id="toast-secondary-hint">Affiché à droite du header (<code>small</code>)</p>
            <input class="form-control" type="text" id="toast-secondary" name="toast-secondary" placeholder="à l’instant" autocomplete="off" aria-describedby="toast-secondary-hint" />
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-icon">Icône</label>
            <p class="form-hint" id="toast-icon-hint">Clé Remix (ex. <code>save</code>, <code>notification-line</code>). Vide = défaut du type.</p>
            <input class="form-control" type="text" id="toast-icon" name="toast-icon" placeholder="checkbox-circle-fill" autocomplete="off" aria-describedby="toast-icon-hint" />
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-delay">Délai auto (secondes)</label>
            <input class="form-control" type="number" id="toast-delay" name="toast-delay" min="1" step="1" value="${TOAST_DELAY_DEFAULT / 1000}" inputmode="numeric" />
          </div>
          <div class="form-check-list">
            ${formCheckboxMarkup({
              id: "toast-hide-title",
              name: "toast-hide-title",
              label: "Sans titre",
              hint: "Icône et croix passent dans le body",
            })}
            ${formCheckboxMarkup({
              id: "toast-hide-icon",
              name: "toast-hide-icon",
              label: "Sans icône",
            })}
            ${formCheckboxMarkup({
              id: "toast-close",
              name: "toast-close",
              label: "Bouton fermer",
              checked: true,
            })}
            ${formCheckboxMarkup({
              id: "toast-autohide",
              name: "toast-autohide",
              label: "Fermeture automatique",
              checked: true,
            })}
          </div>
          <div class="styleguide-row">
            <button type="submit" class="btn primary">${ICON_NOTIFICATION_LINE}<span>Afficher</span></button>
          </div>
        </form>
      </div>
    </section>
  `;

  const unbindRadios = bindFormRadios(host);
  const form = host.querySelector("#toast-playground");
  const delayInput = host.querySelector("#toast-delay");
  const autohideInput = host.querySelector("#toast-autohide");
  const messageError = host.querySelector("#toast-message-error");
  const messageInput = host.querySelector("#toast-message");

  function syncDelayEnabled() {
    if (!(delayInput instanceof HTMLInputElement)) return;
    const on =
      autohideInput instanceof HTMLInputElement ? autohideInput.checked : true;
    delayInput.disabled = !on;
  }
  syncDelayEnabled();
  autohideInput?.addEventListener("change", syncDelayEnabled);

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const btn = e.target instanceof Element ? e.target.closest("[data-demo-toast]") : null;
    if (!(btn instanceof HTMLButtonElement)) return;
    const key = btn.getAttribute("data-demo-toast") || "";
    const preset = PRESETS[key];
    if (!preset) return;
    if (Array.isArray(preset)) {
      preset.forEach((opts) => toast(opts));
      return;
    }
    toast(preset);
  };
  host.addEventListener("click", onClick);

  /** @param {SubmitEvent} e */
  const onSubmit = (e) => {
    e.preventDefault();
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const message = String(data.get("toast-message") || "").trim();
    if (!message) {
      if (messageInput instanceof HTMLTextAreaElement) {
        messageInput.classList.add("is-invalid");
        messageInput.setAttribute("aria-invalid", "true");
      }
      if (messageError instanceof HTMLElement) messageError.hidden = false;
      return;
    }
    if (messageInput instanceof HTMLTextAreaElement) {
      messageInput.classList.remove("is-invalid");
      messageInput.removeAttribute("aria-invalid");
    }
    if (messageError instanceof HTMLElement) messageError.hidden = true;

    const type = /** @type {ToastType} */ (String(data.get("toast-type") || "normal"));
    /** @type {ToastOptions} */
    const opts = { message, type };

    if (data.get("toast-hide-title")) opts.title = false;
    else {
      const title = String(data.get("toast-title") || "").trim();
      if (title) opts.title = title;
    }

    const secondary = String(data.get("toast-secondary") || "").trim();
    if (secondary) opts.secondary = secondary;

    if (data.get("toast-hide-icon")) opts.icon = false;
    else {
      const icon = String(data.get("toast-icon") || "").trim();
      if (icon) opts.icon = icon;
    }

    opts.closeButton = Boolean(data.get("toast-close"));
    if (data.get("toast-autohide")) {
      const seconds = Number(data.get("toast-delay"));
      opts.delay = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : TOAST_DELAY_DEFAULT;
    } else {
      opts.delay = false;
    }
    toast(opts);
  };
  form?.addEventListener("submit", onSubmit);

  return () => {
    unbindRadios();
    host.removeEventListener("click", onClick);
    form?.removeEventListener("submit", onSubmit);
    autohideInput?.removeEventListener("change", syncDelayEnabled);
    host.innerHTML = "";
  };
}
