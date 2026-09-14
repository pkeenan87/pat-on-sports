import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const site = import.meta.env.PUBLIC_SITE_URL ?? "https://patonsports.com";
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${site}/sitemap-index.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
