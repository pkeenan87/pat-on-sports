import { describe, expect, it } from "vitest";
import {
  filterPosts,
  formatPostDate,
  getCategory,
  getUniqueTags,
  sortPostsByDate,
  toPostMeta,
  type BlogEntry,
  type PostMeta,
} from "./posts";

const week17: PostMeta = {
  slug: "week-17-pros-cons-pats-vs-jets",
  title: "Week 17 Pros & Cons: Patriots 42–Jets 10",
  date: "2025-12-28",
  description: "Week 17 recap.",
  heroImage: "/images/week-17/hero.jpg",
  heroAlt: "Hero alt text",
  heroCaption: "Hero caption",
  tags: ["NFL", "Pro & Cons", "New England Patriots", "New York Jets"],
  searchContent: "Maye threw five touchdowns against the Jets.",
};

const week16: PostMeta = {
  slug: "week-16",
  title: "Week 16 Pros & Cons",
  date: "2025-12-21",
  description: "Week 16 recap.",
  tags: ["NFL", "New England Patriots", "Older Tag"],
  searchContent: "A defensive slugfest in Baltimore.",
};

describe("src/lib/posts.ts", () => {
  it("sortPostsByDate returns metadata sorted by date desc", () => {
    const posts = sortPostsByDate([week16, week17]);
    expect(posts).toHaveLength(2);
    expect(posts[0].slug).toBe("week-17-pros-cons-pats-vs-jets");
    expect(posts[1].slug).toBe("week-16");
  });

  it("toPostMeta maps a collection entry onto PostMeta", () => {
    const entry: BlogEntry = {
      id: "week-17-pros-cons-pats-vs-jets",
      body: "Maye threw five touchdowns against the Jets.",
      data: {
        title: week17.title,
        date: new Date("2025-12-28T00:00:00.000Z"),
        description: week17.description ?? "",
        tags: week17.tags,
        heroImage: week17.heroImage,
        heroAlt: week17.heroAlt,
        heroCaption: week17.heroCaption,
      },
    };

    const post = toPostMeta(entry);
    expect(post.slug).toBe("week-17-pros-cons-pats-vs-jets");
    expect(post.date).toBe("2025-12-28");
    expect(post.heroImage).toBe("/images/week-17/hero.jpg");
    expect(post.searchContent).toContain("five touchdowns");
  });

  it("getUniqueTags returns a sorted, de-duped list of tags across posts", () => {
    const tags = getUniqueTags([week17, week16]);
    expect(tags.filter((t) => t === "NFL")).toHaveLength(1);
    expect(tags).toEqual([
      "New England Patriots",
      "New York Jets",
      "NFL",
      "Older Tag",
      "Pro & Cons",
    ]);
  });

  it("getCategory maps Pros & Cons, Preview, and default NFL badges", () => {
    expect(getCategory(["NFL", "Pro & Cons"]).label).toBe("Pros & Cons");
    expect(getCategory(["NFL", "Pros & Cons"]).color).toBe("bg-blue-600");
    expect(getCategory(["Divisional Round", "Preview"]).label).toBe("Preview");
    expect(getCategory(["NFL"]).label).toBe("NFL");
  });

  it("filterPosts matches tag and full-text query", () => {
    const posts = [week17, week16];
    expect(filterPosts(posts, "", "Pro & Cons")).toEqual([week17]);
    expect(filterPosts(posts, "baltimore", "")).toEqual([week16]);
    expect(filterPosts(posts, "maye", "Pro & Cons")).toEqual([week17]);
    expect(filterPosts(posts, "xyz", "")).toEqual([]);
  });

  it("formatPostDate keeps YYYY-MM-DD for Date and string inputs", () => {
    expect(formatPostDate("2025-12-28")).toBe("2025-12-28");
    expect(formatPostDate(new Date("2025-12-28T00:00:00.000Z"))).toBe(
      "2025-12-28"
    );
    expect(formatPostDate(undefined)).toBeUndefined();
  });
});
