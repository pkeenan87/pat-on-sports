import { describe, it, expect, vi, beforeEach } from "vitest";

// IMPORTANT: postsDirectory is computed at import-time using process.cwd().
// So we must mock process.cwd() BEFORE importing the module under test.

const FAKE_CWD = "/repo";
const POSTS_DIR = `${FAKE_CWD}/posts`;

const files: Record<string, string> = {
  [`${POSTS_DIR}/week-17-pros-cons-pats-vs-jets.md`]: `---
title: "Week 17 Pros & Cons: Patriots 42–Jets 10"
date: "2025-12-28"
description: "Week 17 recap."
heroImage: "/images/week-17/hero.jpg"
heroAlt: "Hero alt text"
heroCaption: "Hero caption"
tags:
  - "NFL"
  - "Pro & Cons"
  - "New England Patriots"
  - "New York Jets"
---

## Pros
-one
-two

Line1
Line2

## Cons
-bad
`,

  [`${POSTS_DIR}/week-16.md`]: `---
title: "Week 16 Pros & Cons"
date: "2025-12-21"
description: "Week 16 recap."
tags:
  - "NFL"
  - "New England Patriots"
  - "Older Tag"
---

Hello world
`,
};

function mockFsModule() {
  return {
    default: {
      existsSync: (p: string) => {
        if (p === POSTS_DIR) return true;
        return Object.prototype.hasOwnProperty.call(files, p);
      },
      readdirSync: (p: string) => {
        if (p !== POSTS_DIR) throw new Error(`Unexpected readdirSync path: ${p}`);
        return ["week-16.md", "week-17-pros-cons-pats-vs-jets.md"];
      },
      readFileSync: (p: string, encoding: string) => {
        if (encoding !== "utf8") throw new Error("Expected utf8 read");
        const v = files[p];
        if (v == null) throw new Error(`ENOENT: no such file: ${p}`);
        return v;
      },
    },
    // Some tooling ends up using named exports; provide them too.
    existsSync: (p: string) => {
      if (p === POSTS_DIR) return true;
      return Object.prototype.hasOwnProperty.call(files, p);
    },
    readdirSync: (p: string) => {
      if (p !== POSTS_DIR) throw new Error(`Unexpected readdirSync path: ${p}`);
      return ["week-16.md", "week-17-pros-cons-pats-vs-jets.md"];
    },
    readFileSync: (p: string, encoding: string) => {
      if (encoding !== "utf8") throw new Error("Expected utf8 read");
      const v = files[p];
      if (v == null) throw new Error(`ENOENT: no such file: ${p}`);
      return v;
    },
  };
}

async function importFreshPostsModule() {
  vi.resetModules();

  // Mock cwd before import (postsDirectory is computed immediately)
  vi.spyOn(process, "cwd").mockReturnValue(FAKE_CWD);

  // Mock fs before import
  vi.doMock("fs", () => mockFsModule());

  // Now import the module under test
  return await import("./posts");
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("lib/posts.ts", () => {
  it("getAllPosts parses frontmatter fields and sorts by date desc", async () => {
    const { getAllPosts } = await importFreshPostsModule();

    const posts = getAllPosts();
    expect(posts).toHaveLength(2);

    // Newest first
    expect(posts[0].slug).toBe("week-17-pros-cons-pats-vs-jets");
    expect(posts[0].title).toContain("Week 17");
    expect(posts[0].date).toBe("2025-12-28");
    expect(posts[0].description).toBe("Week 17 recap.");

    // Hero fields are present
    expect(posts[0].heroImage).toBe("/images/week-17/hero.jpg");
    expect(posts[0].heroAlt).toBe("Hero alt text");
    expect(posts[0].heroCaption).toBe("Hero caption");

    // Tags parsed
    expect(posts[0].tags).toContain("NFL");
    expect(posts[0].tags).toContain("Pro & Cons");

    // Older second
    expect(posts[1].slug).toBe("week-16");
    expect(posts[1].date).toBe("2025-12-21");
  });

  it("getPostBySlug throws if slug is missing", async () => {
    const { getPostBySlug } = await importFreshPostsModule();

    // @ts-expect-error - intentional
    await expect(getPostBySlug("")).rejects.toThrow(/slug is missing/i);
  });

  it("getPostBySlug throws if post file does not exist", async () => {
    const { getPostBySlug } = await importFreshPostsModule();

    await expect(getPostBySlug("does-not-exist")).rejects.toThrow(/Post not found/i);
  });

  it("getPostBySlug returns HTML and normalizes list markers + honors single newlines", async () => {
    const { getPostBySlug } = await importFreshPostsModule();

    const post = await getPostBySlug("week-17-pros-cons-pats-vs-jets");

    // Sanity check
    expect(post.title).toContain("Week 17");
    expect(post.heroImage).toBe("/images/week-17/hero.jpg");

    const html = post.contentHtml;

    // Headings present
    expect(html).toContain("<h2>Pros</h2>");
    expect(html).toContain("<h2>Cons</h2>");

    // ✅ list markers like "-one" get normalized to actual list items
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>two</li>");
    expect(html).toContain("<li>bad</li>");

    // ✅ remark-breaks: single newline in paragraph becomes <br>
    // We expect "Line1<br>" ... "Line2"
    expect(html).toMatch(/Line1\s*<br\s*\/?>\s*Line2/);
  });

  it("getAllTags returns a sorted, de-duped list of tags across posts", async () => {
    const { getAllTags } = await importFreshPostsModule();

    const tags = getAllTags();

    // De-duped
    expect(tags.filter((t) => t === "NFL")).toHaveLength(1);

    // Contains tags from both posts
    expect(tags).toEqual([
      "New England Patriots",
      "New York Jets",
      "NFL",
      "Older Tag",
      "Pro & Cons",
    ]);
  });
});
