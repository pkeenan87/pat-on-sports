import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { formatPostDate, sortPostsByDate, toPostMeta } from "../lib/posts";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const GET: APIRoute = async () => {
  const site = import.meta.env.PUBLIC_SITE_URL ?? "https://patonsports.com";
  const posts = sortPostsByDate((await getCollection("blog")).map(toPostMeta));

  const items = posts
    .map((post) => {
      const url = `${site}/blog/${post.slug}`;
      const date = formatPostDate(post.date);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${escapeXml(post.description ?? "")}</description>
      ${date ? `<pubDate>${new Date(date + "T12:00:00Z").toUTCString()}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Pat on Sports</title>
    <link>${site}</link>
    <description>Weekly Patriots and UCLA recaps, previews, and takes.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};
