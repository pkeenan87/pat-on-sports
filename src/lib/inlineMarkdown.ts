import { defineHastPlugin, markdownToHtml } from "satteri";
import { newTabLinks } from "./newTabLinks";

/**
 * Turn raw HTML nodes into text so `markdownToHtml` escapes them on
 * stringify. Satteri's default is to re-emit raw HTML verbatim, which would
 * let a post inject markup when the result is placed with `set:html`.
 */
const escapeRawHtml = defineHastPlugin({
  name: "escape-raw-html",
  raw(node, ctx) {
    ctx.replaceNode(node, { type: "text", value: node.value });
  },
});

const UNSAFE_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "style",
  "link",
  "meta",
  "form",
  "svg",
  "math",
];

function urlProp(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

/** http(s), mailto, site-relative paths, fragments, and scheme-less relatives. */
export function isSafeMarkdownUrl(value: unknown): boolean {
  const url = urlProp(value)?.trim();
  if (!url) return false;
  if (/[\u0000-\u001F\u007F]/.test(url)) return false;
  if (url.startsWith("#")) return true;
  // Protocol-relative URLs (`//host`) follow the page scheme. Drop them.
  if (url.startsWith("//") || url.startsWith("/\\")) return false;
  if (url.startsWith("/")) return true;
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url);
  if (!scheme) return true;
  const name = scheme[1].toLowerCase();
  return name === "http" || name === "https" || name === "mailto";
}

const sanitizeUrls = defineHastPlugin({
  name: "sanitize-inline-urls",
  element: {
    filter: ["a", "img", ...UNSAFE_TAGS],
    visit(node, ctx) {
      if (node.tagName !== "a" && node.tagName !== "img") {
        ctx.removeNode(node);
        return;
      }
      const url = urlProp(
        node.tagName === "img" ? node.properties?.src : node.properties?.href
      );
      if (isSafeMarkdownUrl(url)) return;
      if (node.tagName === "a") {
        ctx.replaceNode(node, node.children ?? []);
      } else {
        ctx.removeNode(node);
      }
    },
  },
});

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Render one Pros & Cons line (paragraph, list item, or bullet) to HTML.
 * Uses the same Markdown engine as the rest of the site (`satteri`), with
 * raw HTML escaped and unsafe link/image URLs dropped. Returns the inside of
 * a single paragraph so callers can place it in `<p>`, `<li>`, or `<span>`.
 */
export function renderInlineMarkdown(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "";

  const { html } = markdownToHtml(trimmed, {
    features: {
      // Footnotes and frontmatter can emit extra blocks from one line.
      gfm: { footnotes: false },
      frontmatter: false,
      rawHtml: false,
    },
    hastPlugins: [escapeRawHtml, sanitizeUrls, newTabLinks],
  });

  const normalized = html.replace(/\s+$/, "");
  const paragraph = normalized.match(/^<p>([\s\S]*)<\/p>$/);
  if (!paragraph) return escapeHtml(trimmed);
  return paragraph[1];
}
