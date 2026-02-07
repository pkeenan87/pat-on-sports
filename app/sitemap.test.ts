import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/posts", () => {
  return {
    getAllPosts: () =>
      Promise.resolve([
        { slug: "week-17-pros-cons-pats-vs-jets", date: "2025-12-28" },
        { slug: "week-16", date: "2025-12-21" },
      ]),
  };
});

describe("app/sitemap", async () => {
  const mod = await import("./sitemap");
  const sitemap = mod.default;

  it("includes home, blog, and all posts", async () => {
    const entries = await sitemap();

    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://patonsports.com");
    expect(urls).toContain("https://patonsports.com/blog");
    expect(urls).toContain("https://patonsports.com/blog/week-17-pros-cons-pats-vs-jets");
    expect(urls).toContain("https://patonsports.com/blog/week-16");
  });
});
