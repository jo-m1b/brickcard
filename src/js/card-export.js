/**
 * Téléchargement de la photo d’une Brickcard (data URL).
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
 * @param {string} dataUrl
 * @returns {{ mime: string, ext: string }}
 */
function mimeFromDataUrl(dataUrl) {
  const m = /^data:([^;,]+)/i.exec(dataUrl);
  const mime = (m?.[1] || "image/jpeg").toLowerCase();
  if (mime.includes("png")) return { mime, ext: "png" };
  if (mime.includes("webp")) return { mime, ext: "webp" };
  if (mime.includes("gif")) return { mime, ext: "gif" };
  if (mime.includes("svg")) return { mime, ext: "svg" };
  return { mime: mime || "image/jpeg", ext: "jpg" };
}

/**
 * @param {string} dataUrl
 * @param {string} [basename] Sans extension
 */
export function downloadCardPhoto(dataUrl, basename = "brickcard-photo") {
  const src = String(dataUrl || "").trim();
  if (!src.startsWith("data:")) {
    throw new Error("Aucune photo à télécharger.");
  }

  const { ext } = mimeFromDataUrl(src);
  const name = `${slugifyFilename(basename)}.${ext}`;
  const a = document.createElement("a");
  a.href = src;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
