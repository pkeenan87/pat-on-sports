import { describe, expect, it } from "vitest";
import {
  blogFilterUrl,
  filterPosts,
  formatDisplayDate,
  formatPostDate,
  getAdjacentPosts,
  getCategory,
  getRelatedPosts,
  getUniqueCategories,
  getUniqueTags,
  normalizeCategoryParam,
  parsePatriotsResult,
  readFilterParams,
  sortPostsByDate,
  toPostMeta,
  type BlogEntry,
  type PostMeta,
} from "./posts";

const week17: PostMeta = {
  slug: "week-17-pros-cons-pats-vs-jets",
  title: "Week 17: Patriots 42 – Jets 10",
  date: "2025-12-28",
  description: "Week 17 recap.",
  heroImage: "/images/week-17/hero.jpg",
  heroAlt: "Hero alt text",
  heroCaption: "Hero caption",
  audio: "/audio/week-17-pros-cons-pats-vs-jets.m4a",
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

const preview: PostMeta = {
  slug: "divisional-round-preview",
  title: "Divisional Round Preview",
  date: "2026-01-16",
  description: "Preview of the playoff games this weekend.",
  tags: ["NFL", "Preview", "New England Patriots"],
  searchContent: "Four games this weekend.",
};

const uclaRecap: PostMeta = {
  slug: "ucla-bruins-recap-bruins-45-golden-bears-24",
  title: "UCLA Recap: Bruins 45 – Golden Bears 24",
  date: "2026-09-06",
  description: "A 45–24 win that was closer than the scoreboard suggests.",
  tags: ["NCAAF", "UCLA Bruins", "California Golden Bears"],
  searchContent: "Chesney’s Bruins rushed for 277 yards.",
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
        audio: week17.audio,
      },
    };

    const post = toPostMeta(entry);
    expect(post.slug).toBe("week-17-pros-cons-pats-vs-jets");
    expect(post.date).toBe("2025-12-28");
    expect(post.heroImage).toBe("/images/week-17/hero.jpg");
    expect(post.audio).toBe("/audio/week-17-pros-cons-pats-vs-jets.m4a");
    expect(post.searchContent).toContain("five touchdowns");
  });

  it("toPostMeta omits audio when the entry has none", () => {
    const entry: BlogEntry = {
      id: "week-16",
      data: {
        title: week16.title,
        date: new Date("2025-12-21T00:00:00.000Z"),
        description: week16.description ?? "",
        tags: week16.tags,
      },
    };

    expect(toPostMeta(entry).audio).toBeUndefined();
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

  it("getUniqueCategories returns badge labels in display order", () => {
    expect(getUniqueCategories([week17, week16, preview, uclaRecap])).toEqual([
      "Pros & Cons",
      "Preview",
      "NFL",
      "UCLA",
    ]);
    expect(getUniqueCategories([week17, preview])).toEqual([
      "Pros & Cons",
      "Preview",
    ]);
  });

  it("getCategory maps Pros & Cons, Preview, UCLA, and default NFL badges", () => {
    expect(getCategory(["NFL", "Pro & Cons"]).label).toBe("Pros & Cons");
    expect(getCategory(["NFL", "Pros & Cons"]).color).toBe("bg-navy");
    expect(getCategory(["Divisional Round", "Preview"]).label).toBe("Preview");
    expect(getCategory(["NFL"]).label).toBe("NFL");
    expect(getCategory(["NCAAF", "UCLA Bruins"]).label).toBe("UCLA");
    expect(getCategory(["NCAAF", "UCLA Bruins"]).color).toBe("bg-ucla");
    expect(getCategory(["NCAAF", "Pros & Cons", "UCLA Bruins"]).label).toBe(
      "UCLA"
    );
  });

  it("normalizeCategoryParam maps aliases and ignores opponent names", () => {
    expect(normalizeCategoryParam("Pro & Cons")).toBe("Pros & Cons");
    expect(normalizeCategoryParam("pros-cons")).toBe("Pros & Cons");
    expect(normalizeCategoryParam("Preview")).toBe("Preview");
    expect(normalizeCategoryParam("NFL")).toBe("NFL");
    expect(normalizeCategoryParam("UCLA")).toBe("UCLA");
    expect(normalizeCategoryParam("UCLA Bruins")).toBe("UCLA");
    expect(normalizeCategoryParam("NCAAF")).toBe("UCLA");
    expect(normalizeCategoryParam("Buffalo Bills")).toBe("");
  });

  it("filterPosts matches category labels and full-text query", () => {
    const posts = [week17, week16, preview, uclaRecap];
    expect(filterPosts(posts, "", "Pro & Cons")).toEqual([week17]);
    expect(filterPosts(posts, "", "Preview")).toEqual([preview]);
    expect(filterPosts(posts, "", "NFL")).toEqual([week16]);
    expect(filterPosts(posts, "", "UCLA")).toEqual([uclaRecap]);
    expect(filterPosts(posts, "baltimore", "")).toEqual([week16]);
    expect(filterPosts(posts, "maye", "Pros & Cons")).toEqual([week17]);
    expect(filterPosts(posts, "xyz", "")).toEqual([]);
    expect(filterPosts(posts, "", "Buffalo Bills")).toEqual(posts);
  });

  it("readFilterParams prefers category over legacy tag", () => {
    expect(readFilterParams("?q=Maye&category=Preview")).toEqual({
      q: "Maye",
      category: "Preview",
    });
    expect(readFilterParams("?tag=Pro+%26+Cons")).toEqual({
      q: "",
      category: "Pros & Cons",
    });
    expect(readFilterParams("?tag=Preview")).toEqual({
      q: "",
      category: "Preview",
    });
    expect(readFilterParams("?tag=NFL")).toEqual({ q: "", category: "" });
    expect(readFilterParams("?category=NFL")).toEqual({
      q: "",
      category: "NFL",
    });
    expect(readFilterParams("?category=UCLA")).toEqual({
      q: "",
      category: "UCLA",
    });
    expect(readFilterParams("?tag=UCLA+Bruins")).toEqual({
      q: "",
      category: "UCLA",
    });
  });

  it("blogFilterUrl omits empty params", () => {
    expect(blogFilterUrl("", "")).toBe("/blog");
    expect(blogFilterUrl("Maye", "Pros & Cons")).toBe(
      "/blog?q=Maye&category=Pros+%26+Cons"
    );
  });

  it("formatPostDate keeps YYYY-MM-DD for Date and string inputs", () => {
    expect(formatPostDate("2025-12-28")).toBe("2025-12-28");
    expect(formatPostDate(new Date("2025-12-28T00:00:00.000Z"))).toBe(
      "2025-12-28"
    );
    expect(formatPostDate(undefined)).toBeUndefined();
  });

  it("formatDisplayDate renders a human-readable UTC date", () => {
    expect(formatDisplayDate("2026-01-25")).toBe("Jan 25, 2026");
    expect(formatDisplayDate(undefined)).toBeUndefined();
  });

  it("parsePatriotsResult reads W/L/T from scorelines", () => {
    expect(parsePatriotsResult("Week 1: Patriots 13 – Raiders 20")).toEqual({
      pats: 13,
      opp: 20,
      result: "L",
    });
    expect(parsePatriotsResult("Week 17: Patriots 42–Jets 10")).toEqual({
      pats: 42,
      opp: 10,
      result: "W",
    });
    expect(parsePatriotsResult("Week 3: Patriots 14 Steelers 14")).toEqual({
      pats: 14,
      opp: 14,
      result: "T",
    });
    expect(parsePatriotsResult("Divisional Round Preview")).toBeNull();
    expect(
      parsePatriotsResult("UCLA Recap: Bruins 45 – Golden Bears 24")
    ).toEqual({
      pats: 45,
      opp: 24,
      result: "W",
    });
  });

  it("getAdjacentPosts and getRelatedPosts walk a newest-first list", () => {
    const posts = [preview, week17, week16];
    expect(getAdjacentPosts(posts, week17.slug)).toEqual({
      newer: preview,
      older: week16,
    });
    expect(getRelatedPosts(posts, week17, 3).map((p) => p.slug)).toEqual([]);
    expect(getRelatedPosts([week17, { ...week16, tags: week17.tags }], week17)).toHaveLength(
      1
    );
  });
});
