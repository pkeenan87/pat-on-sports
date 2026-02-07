import { describe, it, expect, vi, beforeEach } from "vitest";

function mockPostModule(meta: Record<string, unknown>) {
  return {
    meta,
    default: () => null,
  };
}

const fakeModules: Record<string, () => Promise<ReturnType<typeof mockPostModule>>> = {
  "week-17-pros-cons-pats-vs-jets": () =>
    Promise.resolve(
      mockPostModule({
        slug: "week-17-pros-cons-pats-vs-jets",
        title: "Week 17 Pros & Cons: Patriots 42–Jets 10",
        date: "2025-12-28",
        description: "Week 17 recap.",
        heroImage: "/images/week-17/hero.jpg",
        heroAlt: "Hero alt text",
        heroCaption: "Hero caption",
        tags: ["NFL", "Pro & Cons", "New England Patriots", "New York Jets"],
      })
    ),
  "week-16": () =>
    Promise.resolve(
      mockPostModule({
        slug: "week-16",
        title: "Week 16 Pros & Cons",
        date: "2025-12-21",
        description: "Week 16 recap.",
        tags: ["NFL", "New England Patriots", "Older Tag"],
      })
    ),
};

async function importFreshPostsModule() {
  vi.resetModules();

  vi.doMock("@/posts", () => ({
    default: fakeModules,
  }));

  return await import("./posts");
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("lib/posts.ts", () => {
  it("getAllPosts returns metadata sorted by date desc", async () => {
    const { getAllPosts } = await importFreshPostsModule();

    const posts = await getAllPosts();
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

    await expect(getPostBySlug("")).rejects.toThrow(/slug is missing/i);
  });

  it("getPostBySlug throws if post does not exist", async () => {
    const { getPostBySlug } = await importFreshPostsModule();

    await expect(getPostBySlug("does-not-exist")).rejects.toThrow(/Post not found/i);
  });

  it("getPostBySlug returns meta and Content component", async () => {
    const { getPostBySlug } = await importFreshPostsModule();

    const post = await getPostBySlug("week-17-pros-cons-pats-vs-jets");

    expect(post.title).toContain("Week 17");
    expect(post.heroImage).toBe("/images/week-17/hero.jpg");
    expect(post.Content).toBeDefined();
    expect(typeof post.Content).toBe("function");
  });

  it("getAllTags returns a sorted, de-duped list of tags across posts", async () => {
    const { getAllTags } = await importFreshPostsModule();

    const tags = await getAllTags();

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
