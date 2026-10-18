import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(rootDir, "./src");

export default defineConfig({
  resolve: {
    alias: {
      "@": srcDir,
      // Server routes import this virtual module. Unit tests stub it.
      "astro:content": path.resolve(rootDir, "./test/astro-content-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        ".astro/**",
        "public/**",
        "**/*.d.ts",
        "**/test/**",
      ],
    },
  },
});
