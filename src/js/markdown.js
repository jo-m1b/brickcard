/**
 * Light Markdown parser (GFM subset) + page loading
 * `data/page-{{slug}}.md` (English) / `data/page-{{slug}}.{{locale}}.md`.
 * Handles: headings, paragraphs, lists, quotes, code, links, images, bold/italic, HR, HTML blocks.
 * Placeholder: `{{APP_VERSION}}` → SemVer version.
 * Page title: `# Title` (removed from the modal body).
 */

import { linkMarkup } from "./link.js";
import { APP_VERSION } from "./version.js";
import { _t, getDefaultLocale, getLocale } from "./i18n.js";

/**
 * Escape raw HTML.
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
 * Inline: code, links, images, bold, italic.
 * Emphasis `_…_` / `*…*` applies only outside HTML tags
 * (otherwise URL underscores break hrefs, e.g. List_of_themes).
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
 * Line that opens an HTML block (mini GFM, trusted `data/` pages).
 * @param {string} line
 */
function isHtmlBlockStart(line) {
  const t = String(line || "").trim();
  return /^<[a-z]/i.test(t) || /^<!--/.test(t);
}

/**
 * Read an HTML block until the closing tag, `-->` (comment), or a blank line.
 * @param {string[]} lines
 * @param {number} start
 * @returns {{ html: string, next: number }}
 */
function readHtmlBlock(lines, start) {
  const line = lines[start];
  const trimmed = line.trim();
  const buf = [line];
  let i = start + 1;
  if (/^<!--/.test(trimmed)) {
    if (!/-->/.test(line)) {
      while (i < lines.length) {
        buf.push(lines[i]);
        i += 1;
        if (/-->/.test(buf[buf.length - 1])) break;
      }
    }
    return { html: buf.join("\n"), next: i };
  }
  const tagMatch = trimmed.match(/^<([a-z][a-z0-9]*)/i);
  const tag = tagMatch ? tagMatch[1].toLowerCase() : "";
  const voidTag = /^(img|br|hr|source|input)$/i.test(tag);
  const closedSameLine = Boolean(tag && new RegExp(`</${tag}\\s*>`, "i").test(line));
  if (tag && !voidTag && !closedSameLine) {
    const closeRe = new RegExp(`</${tag}\\s*>`, "i");
    while (i < lines.length && lines[i].trim()) {
      buf.push(lines[i]);
      i += 1;
      if (closeRe.test(buf[buf.length - 1])) break;
    }
  }
  return { html: buf.join("\n"), next: i };
}

/**
 * Convert Markdown to HTML.
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

    // Raw HTML (trusted `data/` pages; like GitHub: no escaping)
    if (isHtmlBlockStart(line)) {
      const block = readHtmlBlock(lines, i);
      out.push(block.html);
      i = block.next;
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
      !isHtmlBlockStart(lines[i]) &&
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
 * Page title: `# Title`.
 * @param {string} raw Line without the `#`
 * @returns {string} inline HTML (escaped)
 */
function parsePageHeading(raw) {
  const titleRaw = String(raw || "").trim();
  return titleRaw ? inline(titleRaw) : "";
}

/**
 * Markdown page URL: `data/page-{{slug}}.md` (English source),
 * or `data/page-{{slug}}.{{locale}}.md` for a translation.
 * @param {string} slug
 * @param {string} [locale]
 */
export function pageMarkdownUrl(slug, locale) {
  const loc = String(locale || "").trim();
  if (loc && loc !== getDefaultLocale()) return `data/page-${slug}.${loc}.md`;
  return `data/page-${slug}.md`;
}

/**
 * Load and parse `data/page-{{slug}}.md` (or `page-{{slug}}.{{locale}}.md`).
 * Missing locale / 404 → English source file.
 * @param {string} slug
 * @returns {Promise<{ slug: string, title: string, html: string }>}
 */
export async function loadMarkdownPage(slug) {
  const safe = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safe) throw new Error(_t("Invalid page slug"));

  const localized = pageMarkdownUrl(safe, getLocale());
  const fallback = pageMarkdownUrl(safe);
  let url = localized;
  let res = await fetch(localized, { cache: "reload" });
  if (!res.ok && localized !== fallback) {
    url = fallback;
    res = await fetch(fallback, { cache: "reload" });
  }
  if (!res.ok) {
    throw new Error(_t("Page not found: %(url)s (%(status)s)", { url, status: res.status }));
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
