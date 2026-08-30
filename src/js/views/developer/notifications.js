import { ICON_NOTIFICATION_LINE } from "../../icons.js";
import { linkMarkup } from "../../link.js";
import { formCheckboxMarkup } from "../../form-checkbox.js";
import { bindFormRadios, formRadioMarkup } from "../../form-radio.js";
import { TOAST_DELAY_DEFAULT, toast } from "../../toast.js";

/** @typedef {import("../../toast.js").ToastOptions} ToastOptions */
/** @typedef {import("../../toast.js").ToastType} ToastType */

/** @type {Record<string, ToastOptions | ToastOptions[]>} */
const PRESETS = {
  normal: { message: "Collection up to date." },
  success: { type: "success", message: "Card saved" },
  error: { type: "error", message: "Page not found" },
  "no-title-icon": {
    title: false,
    icon: "notification-line",
    message: "A new version is available.",
  },
  "icon-override": {
    type: "success",
    icon: "save",
    message: "Backup saved.",
  },
  secondary: {
    type: "success",
    message: "CITY theme saved.",
    secondary: "just now",
  },
  delay: { message: "Closes in 2 seconds.", delay: 2000 },
  sticky: {
    type: "error",
    message: "This notification stays until you dismiss it.",
    delay: false,
  },
  stack: [
    { message: "First notification" },
    { type: "success", message: "Second notification" },
    { type: "error", message: "Third notification" },
  ],
};

/**
 * Toast notification gallery / playground (design system).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperNotifications(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Toast</p>
        <h1 class="view-title">Toast</h1>
      </header>

      <p class="styleguide-intro">
        Non-blocking action feedback, stackable, above modals.
        Module&nbsp;: <code>toast.js</code>.
        No animation (show / dismiss).
        Icons&nbsp;: ${linkMarkup("Remix Icon", { href: "https://remixicon.com/" })}.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vocabulary</h2>
        <div class="styleguide-table-wrap">
          <table class="styleguide-table">
            <thead>
              <tr><th>Axis</th><th>Options</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Type</td>
                <td><code>normal</code> (default, no icon or title) · <code>success</code> (green, “&nbsp;Success&nbsp;”, <code>checkbox-circle-fill</code>) · <code>error</code> (red, “&nbsp;Error&nbsp;”, <code>error-warning-fill</code>)</td>
              </tr>
              <tr>
                <td>Header</td>
                <td>if title or secondary text&nbsp;: icon + title on the left, <code>small</code> + close on the right</td>
              </tr>
              <tr>
                <td>Body</td>
                <td>message (required). Without title&nbsp;: icon to the left of the message, close at the top right</td>
              </tr>
              <tr>
                <td>Dismiss</td>
                <td>close (default) · auto <code>delay</code> ${TOAST_DELAY_DEFAULT}&nbsp;ms · collection import/backup 15&nbsp;s · <code>delay: false</code> forces the close button</td>
              </tr>
              <tr>
                <td>Stack</td>
                <td>new items at the bottom right · previous ones move up · ≤&nbsp;640px&nbsp;: full width centered (1.25rem margin)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Types</h2>
        <p class="form-hint" style="margin-bottom: 0.65rem">Toasts stack at the bottom right (above this modal)</p>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-toast="normal">Normal</button>
          <button type="button" class="btn secondary" data-demo-toast="success">Success</button>
          <button type="button" class="btn secondary" data-demo-toast="error">Error</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Header / body</h2>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-toast="no-title-icon">No title + icon</button>
          <button type="button" class="btn secondary" data-demo-toast="icon-override">Icon override</button>
          <button type="button" class="btn secondary" data-demo-toast="secondary">Secondary text</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Dismiss</h2>
        <div class="styleguide-row">
          <button type="button" class="btn secondary" data-demo-toast="delay">2&nbsp;s delay</button>
          <button type="button" class="btn secondary" data-demo-toast="sticky">No auto-dismiss</button>
          <button type="button" class="btn secondary" data-demo-toast="stack">Stack 3</button>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Playground</h2>
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
                label: "Success",
              })}
              ${formRadioMarkup({
                id: "toast-type-error",
                name: "toast-type",
                value: "error",
                label: "Error",
              })}
            </div>
          </fieldset>
          <div class="form-field">
            <label class="form-label form-label--required" for="toast-message">Message</label>
            <textarea class="form-control" id="toast-message" name="toast-message" rows="2" required>Card saved</textarea>
            <p class="form-error" id="toast-message-error" hidden>The message is required.</p>
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-title">Title</label>
            <p class="form-hint" id="toast-title-hint">Empty = type default (Success / Error). Check “&nbsp;No title&nbsp;” to hide it.</p>
            <input class="form-control" type="text" id="toast-title" name="toast-title" autocomplete="off" aria-describedby="toast-title-hint" />
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-secondary">Secondary text</label>
            <p class="form-hint" id="toast-secondary-hint">Shown on the right of the header (<code>small</code>)</p>
            <input class="form-control" type="text" id="toast-secondary" name="toast-secondary" placeholder="just now" autocomplete="off" aria-describedby="toast-secondary-hint" />
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-icon">Icon</label>
            <p class="form-hint" id="toast-icon-hint">Remix key (e.g. <code>save</code>, <code>notification-line</code>). Empty = type default.</p>
            <input class="form-control" type="text" id="toast-icon" name="toast-icon" placeholder="checkbox-circle-fill" autocomplete="off" aria-describedby="toast-icon-hint" />
          </div>
          <div class="form-field">
            <label class="form-label" for="toast-delay">Auto delay (seconds)</label>
            <input class="form-control" type="number" id="toast-delay" name="toast-delay" min="1" step="1" value="${TOAST_DELAY_DEFAULT / 1000}" inputmode="numeric" />
          </div>
          <div class="form-check-list">
            ${formCheckboxMarkup({
              id: "toast-hide-title",
              name: "toast-hide-title",
              label: "No title",
              hint: "Icon and close move into the body",
            })}
            ${formCheckboxMarkup({
              id: "toast-hide-icon",
              name: "toast-hide-icon",
              label: "No icon",
            })}
            ${formCheckboxMarkup({
              id: "toast-close",
              name: "toast-close",
              label: "Close button",
              checked: true,
            })}
            ${formCheckboxMarkup({
              id: "toast-autohide",
              name: "toast-autohide",
              label: "Auto-dismiss",
              checked: true,
            })}
          </div>
          <div class="styleguide-row">
            <button type="submit" class="btn primary">${ICON_NOTIFICATION_LINE}<span>Show</span></button>
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
