import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const site = import.meta.env.PUBLIC_SITE_URL ?? "https://patonsports.com";
  const body = `User-agent: *\nAllow: /\nDisallow: /api\n\nSitemap: ${site}/sitemap-index.xml\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
