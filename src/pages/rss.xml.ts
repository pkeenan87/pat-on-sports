import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { formatPostDate, sortPostsByDate, toPostMeta } from "../lib/posts";
import { audioEnclosure, escapeXml } from "../lib/rss";

export const GET: APIRoute = async () => {
  const site = (
    import.meta.env.PUBLIC_SITE_URL ?? "https://patonsports.com"
  ).replace(/\/$/, "");
  const collection = await getCollection("blog");
  const posts = sortPostsByDate(collection.map(toPostMeta));
  const bodyBySlug = new Map(
    collection.map((entry) => [entry.id, entry.body ?? ""])
  );
  const lastBuildDate = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${site}/blog/${post.slug}`;
      const date = formatPostDate(post.date);
      const body = bodyBySlug.get(post.slug) ?? "";
      const safeCdata = body.replaceAll("]]>", "]]]]><![CDATA[>");
      const enclosure = audioEnclosure(post);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description ?? "")}</description>
      <content:encoded><![CDATA[${safeCdata}]]></content:encoded>
      ${date ? `<pubDate>${new Date(date + "T12:00:00Z").toUTCString()}</pubDate>` : ""}
      <author>pat@patonsports.com (Pat)</author>
${enclosure}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Pat on Sports</title>
    <link>${site}</link>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Weekly Patriots and UCLA recaps, previews, and takes.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <itunes:author>Pat</itunes:author>
    <itunes:summary>Weekly Patriots and UCLA recaps from Pat on Sports.</itunes:summary>
    <itunes:category text="Sports" />
${items}
  </channel>
</rss>
`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};
