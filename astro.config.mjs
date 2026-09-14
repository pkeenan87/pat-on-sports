import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { satteri } from "@astrojs/markdown-satteri";
import { newTabLinks } from "./src/lib/newTabLinks";

const site = process.env.PUBLIC_SITE_URL ?? "https://patonsports.com";

export default defineConfig({
  site,
  adapter: vercel(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  markdown: {
    processor: satteri({
      hastPlugins: [newTabLinks],
    }),
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.endsWith("/404") &&
        !page.includes("/404/") &&
        !page.includes("/admin") &&
        !page.includes("/api/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
