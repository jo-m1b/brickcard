/**
 * Parser Markdown léger (sous-ensemble GFM) + chargement des pages `data/page-{{slug}}.md`.
 * Gère : titres, paragraphes, listes, citations, code, liens, images, gras/italique, HR.
 * Placeholder : `{{APP_VERSION}}` → version SemVer.
 * Titre de page : `# Titre` (retiré du corps de la modale).
 */

import { linkMarkup } from "./link.js";
import { APP_VERSION } from "./version.js?v=0.8.0";

/**
 * Échappe le HTML brut.
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Inline : code, liens, images, gras, italique.
 * L’emphase `_…_` / `*…*` ne s’applique qu’hors balises HTML
 * (sinon les underscores d’URL cassent les href, ex. List_of_themes).
 * @param {string} text
 */
function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) => {
    const t = title ? ` title="${escapeHtml(title)}"` : "";
    return `<img src="${escapeHtml(src)}" alt="${alt}"${t} loading="lazy" />`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, href, title) => {
    return linkMarkup(label, {
      href,
      title: title || undefined,
      html: true,
    });
  });

  const parts = s.split(/(<[^>]+>)/);
  return parts
    .map((part) => {
      if (part.startsWith("<")) return part;
      let chunk = part;
      chunk = chunk.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      chunk = chunk.replace(/__([^_]+)__/g, "<strong>$1</strong>");
      chunk = chunk.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      chunk = chunk.replace(/_([^_]+)_/g, "<em>$1</em>");
      return chunk;
    })
    .join("");
}

/**
 * Convertit du Markdown en HTML.
 * @param {string} md
 * @returns {string}
 */
export function parseMarkdown(md) {
  const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fence code
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push("<hr />");
      i += 1;
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(`<blockquote>${parseMarkdown(buf.join("\n"))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*+]\s+/, ""))}</li>`);
        i += 1;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+[.)]\s+/, ""))}</li>`);
        i += 1;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Paragraph
    const buf = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+[.)]\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(`<p>${inline(buf.join(" ").replace(/\s+/g, " ").trim())}</p>`);
  }

  return out.join("\n");
}

/**
 * Titre de page : `# Titre`.
 * @param {string} raw Ligne sans le `#`
 * @returns {string} HTML inline (échappé)
 */
function parsePageHeading(raw) {
  const titleRaw = String(raw || "").trim();
  return titleRaw ? inline(titleRaw) : "";
}

/**
 * Charge et parse `data/page-{{slug}}.md`.
 * @param {string} slug
 * @returns {Promise<{ slug: string, title: string, html: string }>}
 */
export async function loadMarkdownPage(slug) {
  const safe = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safe) throw new Error("Slug de page invalide");

  const url = `data/page-${safe}.md`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Page introuvable : ${url} (${res.status})`);
  }
  const md = (await res.text()).replace(/\{\{APP_VERSION\}\}/g, APP_VERSION);
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = parsePageHeading(titleMatch ? titleMatch[1] : "");
  return {
    slug: safe,
    title: title || inline(safe),
    html: parseMarkdown(md),
  };
}
