import { bindFormImage, formImageMarkup } from "../../form-image.js";
import { compressImage } from "../../storage.js";
import { linkMarkup } from "../../link.js";

/**
 * Image field gallery (design system — test only).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperImages(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Image</p>
        <h1 class="view-title">Image</h1>
      </header>

      <p class="styleguide-intro">
        Control&nbsp;: <code>form-image</code> wrapper.
        Empty&nbsp;: text + file / URL buttons.
        With image&nbsp;: background color (no hint) then crop preview
        (zoom / alignment badges, reset, delete, save).
        Crop&nbsp;: focus or click, then drag / wheel / arrows / <code>+</code> <code>−</code>.
        Read-only (<code>readOnly</code>)&nbsp;: frozen preview, <strong>Save</strong> kept (no load / crop / delete).
        Module&nbsp;: <code>form-image.js</code>.
        Used&nbsp;: card editor; theme logos (<code>withBackgroundColor: false</code>, background = theme color); default theme view.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Empty</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" id="demo-image-empty-label">Image</label>
            ${formImageMarkup({ id: "demo-image-empty" })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">With image</h2>
        <p class="form-hint">App logo as a data URL, crop intentionally offset (reset visible). Background <code>#e8f4ff</code>.</p>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" id="demo-image-filled-label">Image</label>
            ${formImageMarkup({
              id: "demo-image-filled",
              backgroundColor: "#e8f4ff",
              zoom: 1.25,
              offsetX: 0.08,
              offsetY: -0.05,
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Read-only</h2>
        <p class="form-hint">Frozen preview and badges; only <strong>Save</strong> stays active. Empty&nbsp;: “&nbsp;No logo&nbsp;”.</p>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" id="demo-image-readonly-label">Image</label>
            ${formImageMarkup({
              id: "demo-image-readonly",
              labelledBy: "demo-image-readonly-label",
              backgroundColor: "#e8f4ff",
              zoom: 1.25,
              offsetX: 0.08,
              offsetY: -0.05,
              readOnly: true,
            })}
          </div>
          <div class="form-field">
            <label class="form-label" id="demo-image-readonly-empty-label">No image</label>
            ${formImageMarkup({
              id: "demo-image-readonly-empty",
              labelledBy: "demo-image-readonly-empty-label",
              readOnly: true,
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Without background field (theme)</h2>
        <p class="form-hint">Same control, without “Image background”. The preview uses an external color (here <code>#e3000b</code>). Zoom = logo width (100&nbsp;% = 50&nbsp;% of the box).</p>
        <div class="styleguide-fields">
          <div class="form-field" style="--form-image-aspect: 63 / 44">
            <label class="form-label" id="demo-image-theme-label">Logo</label>
            ${formImageMarkup({
              id: "demo-image-theme",
              labelledBy: "demo-image-theme-label",
              withBackgroundColor: false,
              previewBackground: "#e3000b",
              fit: "logo",
            })}
          </div>
        </div>
      </div>
    </section>
  `;

  const dialogHost = document.getElementById("modal-root") || document.body;
  /** @type {(() => void)[]} */
  const unbind = [];

  const emptyRoot = /** @type {HTMLElement|null} */ (
    host.querySelector("#demo-image-empty")?.closest("[data-form-image]")
  );
  if (emptyRoot) {
    const ctl = bindFormImage(emptyRoot, {
      processFile: compressImage,
      dialogHost,
      downloadBasename: "demo-image",
    });
    unbind.push(() => ctl.destroy());
  }

  const filledRoot = /** @type {HTMLElement|null} */ (
    host.querySelector("#demo-image-filled")?.closest("[data-form-image]")
  );
  /** @type {ReturnType<typeof bindFormImage>|null} */
  let filledCtl = null;
  if (filledRoot) {
    filledCtl = bindFormImage(filledRoot, {
      processFile: compressImage,
      dialogHost,
      downloadBasename: "demo-image-logo",
    });
    unbind.push(() => filledCtl?.destroy());
  }

  const themeRoot = /** @type {HTMLElement|null} */ (
    host.querySelector("#demo-image-theme")?.closest("[data-form-image]")
  );
  /** @type {ReturnType<typeof bindFormImage>|null} */
  let themeCtl = null;
  if (themeRoot) {
    themeCtl = bindFormImage(themeRoot, {
      processFile: compressImage,
      dialogHost,
      previewBackground: "#e3000b",
      downloadBasename: "demo-theme-logo",
      fit: "logo",
    });
    unbind.push(() => themeCtl?.destroy());
  }

  const readonlyRoot = /** @type {HTMLElement|null} */ (
    host.querySelector("#demo-image-readonly")?.closest("[data-form-image]")
  );
  /** @type {ReturnType<typeof bindFormImage>|null} */
  let readonlyCtl = null;
  if (readonlyRoot) {
    readonlyCtl = bindFormImage(readonlyRoot, {
      dialogHost,
      downloadBasename: "demo-image-readonly",
      readOnly: true,
    });
    unbind.push(() => readonlyCtl?.destroy());
  }

  const readonlyEmptyRoot = /** @type {HTMLElement|null} */ (
    host.querySelector("#demo-image-readonly-empty")?.closest("[data-form-image]")
  );
  if (readonlyEmptyRoot) {
    const ctl = bindFormImage(readonlyEmptyRoot, {
      dialogHost,
      readOnly: true,
    });
    unbind.push(() => ctl.destroy());
  }

  if (filledCtl || themeCtl || readonlyCtl) {
    fetch("img/brickcard-logo.svg")
      .then((res) => {
        if (!res.ok) throw new Error("Demo: logo not found.");
        return res.blob();
      })
      .then((blob) =>
        compressImage(new File([blob], "logo.svg", { type: blob.type || "image/svg+xml" }))
      )
      .then((dataUrl) => {
        filledCtl?.setValue({
          dataUrl,
          backgroundColor: "#e8f4ff",
          zoom: 1.25,
          offsetX: 0.08,
          offsetY: -0.05,
        });
        themeCtl?.setValue({ dataUrl });
        readonlyCtl?.setValue({
          dataUrl,
          backgroundColor: "#e8f4ff",
          zoom: 1.25,
          offsetX: 0.08,
          offsetY: -0.05,
        });
      })
      .catch(() => {
        /* gallery: leave the control empty if the logo fails to load */
      });
  }

  return () => {
    unbind.forEach((fn) => fn());
    host.innerHTML = "";
  };
}
