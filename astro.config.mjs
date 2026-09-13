import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const site = process.env.PUBLIC_SITE_URL ?? "https://patonsports.com";
const commentBoxEntry = fileURLToPath(
  new URL("./node_modules/commentbox.io/dist/commentBox.min.js", import.meta.url)
);

export default defineConfig({
  site,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.endsWith("/404") && !page.includes("/404/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Package `module` points at unpublished src/; use the built bundle.
        "commentbox.io": commentBoxEntry,
      },
    },
  },
});
