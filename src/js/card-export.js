/**
 * Téléchargement de fichiers (photo Brickcard, logos, JSON).
 */

/**
 * @param {string} text
 * @returns {string}
 */
export function slugifyFilename(text) {
  const s = String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "brickcard";
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

  if (raw.startsWith("data:")) {
    const { ext } = mimeFromDataUrl(raw);
    triggerDownload(raw, `${base}.${ext}`);
    return;
  }

  const fetchUrl = raw.split("?")[0];
  const res = await fetch(fetchUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Téléchargement impossible.");
  }
  const blob = await res.blob();
  const ext = extFromMime(blob.type) || extFromSrc(raw) || "png";
  downloadBlob(blob, `${base}.${ext}`);
}
