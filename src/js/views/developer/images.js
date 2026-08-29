import { bindFormImage, formImageMarkup } from "../../form-image.js";
import { compressImage } from "../../storage.js";
import { linkMarkup } from "../../link.js";

/**
 * Galerie du champ image (design system — test uniquement).
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function renderDeveloperImages(host) {
  host.innerHTML = `
    <section class="panel styleguide no-print">
      <header class="styleguide-header">
        <p class="styleguide-kicker">${linkMarkup("Styleguide", { href: "#developer" })} / Sélecteur d’image (Image)</p>
        <h1 class="view-title">Sélecteur d’image (Image)</h1>
      </header>

      <p class="styleguide-intro">
        Contrôle&nbsp;: wrapper <code>form-image</code>.
        Sans image&nbsp;: texte + boutons fichier / URL.
        Avec image&nbsp;: couleur de fond (sans hint) puis aperçu de cadrage
        (badges zoom / alignement, reset, supprimer, sauvegarder).
        Cadrage&nbsp;: focus ou clic, puis glisser / molette / flèches / <code>+</code> <code>−</code>.
        Lecture seule (<code>readOnly</code>)&nbsp;: aperçu figé, <strong>Sauvegarder</strong> conservé (pas de chargement / cadrage / suppression).
        Module&nbsp;: <code>form-image.js</code>.
        Appliqué&nbsp;: éditeur de carte ; logos de thèmes (<code>withBackgroundColor: false</code>, fond = couleur du thème) ; vue thème par défaut.
      </p>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Vide</h2>
        <div class="styleguide-fields">
          <div class="form-field">
            <label class="form-label" id="demo-image-empty-label">Image</label>
            ${formImageMarkup({ id: "demo-image-empty" })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Avec image</h2>
        <p class="form-hint">Logo app en data URL, cadrage volontairement décalé (reset visible). Fond <code>#e8f4ff</code>.</p>
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
        <h2 class="styleguide-section-title">Lecture seule</h2>
        <p class="form-hint">Aperçu et badges figés ; seul <strong>Sauvegarder</strong> reste actif. Vide&nbsp;: «&nbsp;Aucun logo&nbsp;».</p>
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
            <label class="form-label" id="demo-image-readonly-empty-label">Sans image</label>
            ${formImageMarkup({
              id: "demo-image-readonly-empty",
              labelledBy: "demo-image-readonly-empty-label",
              readOnly: true,
            })}
          </div>
        </div>
      </div>

      <div class="styleguide-section">
        <h2 class="styleguide-section-title">Sans champ fond (thème)</h2>
        <p class="form-hint">Même contrôle, sans « Fond de l’image ». L’aperçu prend une couleur externe (ici <code>#e3000b</code>). Zoom = largeur du logo (100&nbsp;% = 50&nbsp;% de la boîte).</p>
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
        if (!res.ok) throw new Error("Démo : logo introuvable.");
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
        /* galerie : laisser le contrôle vide si le logo ne charge pas */
      });
  }

  return () => {
    unbind.forEach((fn) => fn());
    host.innerHTML = "";
  };
}
