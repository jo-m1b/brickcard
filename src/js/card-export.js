/**
 * Téléchargement de fichiers (photo Brickcard, logos, sauvegardes).
 */

/**
 * Segment kebab-case pour un nom de fichier (vide si rien d’utilisable).
 * @param {string} text
 * @returns {string}
 */
export function filenameSlug(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {string} text
 * @returns {string}
 */
export function slugifyFilename(text) {
  return filenameSlug(text) || "brickcard";
}

/**
 * Nom de fichier (sans extension) d’une photo de carte.
 * Préfixe `brickcard-card-image-YYYY-MM-DD-` ; suite = ref, titre, les deux, ou id.
 * @param {{
 *   legoSetRef?: string,
 *   title?: string,
 *   cardId?: string,
 *   date?: string,
 * }} [opts]
 * @returns {string}
 */
export function formatCardImageBasename(opts = {}) {
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const refSlug = filenameSlug(opts.legoSetRef);
  const titleSlug = filenameSlug(opts.title);
  const parts = ["brickcard-card-image", date];
  if (refSlug && titleSlug) {
    parts.push(refSlug, titleSlug);
  } else if (refSlug) {
    parts.push(refSlug);
  } else if (titleSlug) {
    parts.push(titleSlug);
  } else {
    parts.push(filenameSlug(opts.cardId) || "card");
  }
  return parts.join("-");
}

/**
 * Nom de fichier (sans extension) d’un logo de thème.
 * Préfixe `brickcard-theme-logo-YYYY-MM-DD-` ; suite = slug du nom, ou id.
 * @param {{
 *   name?: string,
 *   themeId?: string,
 *   date?: string,
 * }} [opts]
 * @returns {string}
 */
export function formatThemeLogoBasename(opts = {}) {
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const nameSlug = filenameSlug(opts.name);
  const parts = ["brickcard-theme-logo", date];
  if (nameSlug) {
    parts.push(nameSlug);
  } else {
    parts.push(filenameSlug(opts.themeId) || "theme");
  }
  return parts.join("-");
}

/**
 * @param {string} mime
 * @returns {string}
 */
export function extFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("svg")) return "svg";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  return "";
}

/**
 * @param {string} dataUrl
 * @returns {{ mime: string, ext: string }}
 */
export function mimeFromDataUrl(dataUrl) {
  const m = /^data:([^;,]+)/i.exec(dataUrl);
  const mime = (m?.[1] || "image/jpeg").toLowerCase();
  const ext = extFromMime(mime) || "jpg";
  return { mime, ext };
}

/**
 * Extension depuis une data URL, un chemin, ou un nom de fichier.
 * @param {string} src
 * @returns {string}
 */
export function extFromSrc(src) {
  const raw = String(src || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:")) return mimeFromDataUrl(raw).ext;
  const path = raw.split("?")[0];
  const m = /\.([a-z0-9]+)$/i.exec(path);
  if (!m) return "";
  const e = m[1].toLowerCase();
  return e === "jpeg" ? "jpg" : e;
}

/**
 * Déclenche un téléchargement via `<a download>`.
 * @param {string} href
 * @param {string} filename
 */
export function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Télécharge une data URL, un chemin same-origin, ou une URL.
 * Toujours via `blob:` : un `href` data URL ignore `download` pour le WebP (nouvel onglet).
 * @param {string} src
 * @param {string} [basename] Sans extension
 * @returns {Promise<void>}
 */
export async function downloadCardPhoto(src, basename = "brickcard-photo") {
  const raw = String(src || "").trim();
  if (!raw) {
    throw new Error("Aucune photo à télécharger.");
  }

  const base = slugifyFilename(basename);
  const isData = raw.startsWith("data:");
  const fetchUrl = isData ? raw : raw.split("?")[0];
  const res = await fetch(fetchUrl, isData ? undefined : { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Téléchargement impossible.");
  }
  const blob = await res.blob();
  const ext = (isData ? mimeFromDataUrl(raw).ext : "") || extFromMime(blob.type) || extFromSrc(raw) || "png";
  downloadBlob(blob, `${base}.${ext}`);
}
