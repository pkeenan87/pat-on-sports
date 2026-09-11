import { describe, expect, it } from "vitest";
import {
  blogFilterUrl,
  categoryToSlug,
  categoryUrl,
  filterPosts,
  formatDisplayDate,
  formatPostDate,
  formatScoreline,
  getAdjacentPosts,
  getCategory,
  getOpponentTags,
  getPostResult,
  getRelatedPosts,
  getUniqueCategories,
  getUniqueTags,
  matchesSearchQuery,
  normalizeCategoryParam,
  parsePatriotsResult,
  readFilterParams,
  slugToCategory,
  sortPostsByDate,
  tagToSlug,
  toPostMeta,
  toSearchContent,
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
  season: 2025,
  week: 17,
  opponent: "New York Jets",
  scoreUs: 42,
  scoreThem: 10,
  result: "W",
  readingTimeMinutes: 1,
};

const week16: PostMeta = {
  slug: "week-16",
  title: "Week 16 Pros & Cons",
  date: "2025-12-21",
  description: "Week 16 recap.",
  tags: ["NFL", "New England Patriots", "Older Tag"],
  searchContent: "A defensive slugfest in Baltimore.",
  season: 2025,
  week: 16,
};

const week05: PostMeta = {
  slug: "week-05",
  title: "Week 5: Patriots 23 – Bills 20",
  date: "2025-10-05",
  description: "Week 5 recap.",
  tags: ["NFL", "Pros & Cons", "New England Patriots", "Buffalo Bills"],
  searchContent: "Close win over Buffalo.",
  season: 2025,
  week: 5,
  opponent: "Buffalo Bills",
  scoreUs: 23,
  scoreThem: 20,
  result: "W",
};

const week15: PostMeta = {
  slug: "week-15",
  title: "Week 15: Patriots 31 – Bills 35",
  date: "2025-12-14",
  description: "Week 15 recap.",
  tags: ["NFL", "Pros & Cons", "New England Patriots", "Buffalo Bills"],
  searchContent: "Loss to Buffalo.",
  season: 2025,
  week: 15,
  opponent: "Buffalo Bills",
  scoreUs: 31,
  scoreThem: 35,
  result: "L",
};

const preview: PostMeta = {
  slug: "divisional-round-preview",
  title: "Divisional Round Preview",
  date: "2026-01-16",
  description: "Preview of the playoff games this weekend.",
  tags: ["NFL", "Preview", "New England Patriots"],
  searchContent: "Four games this weekend.",
  season: 2025,
};

const uclaRecap: PostMeta = {
  slug: "ucla-bruins-recap-bruins-45-golden-bears-24",
  title: "UCLA Recap: Bruins 45 – Golden Bears 24",
  date: "2026-09-06",
  description: "A 45–24 win that was closer than the scoreboard suggests.",
  tags: ["NCAAF", "UCLA Bruins", "California Golden Bears"],
  searchContent: "Chesney’s Bruins rushed for 277 yards.",
  season: 2026,
  opponent: "California Golden Bears",
  scoreUs: 45,
  scoreThem: 24,
  result: "W",
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
        season: 2025,
        week: 17,
        opponent: "New York Jets",
        scoreUs: 42,
        scoreThem: 10,
        result: "W",
      },
    };

    const post = toPostMeta(entry);
    expect(post.slug).toBe("week-17-pros-cons-pats-vs-jets");
    expect(post.date).toBe("2025-12-28");
    expect(post.heroImage).toBe("/images/week-17/hero.jpg");
    expect(post.audio).toBe("/audio/week-17-pros-cons-pats-vs-jets.m4a");
    expect(post.searchContent).toContain("five touchdowns");
    expect(post.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(post.scoreUs).toBe(42);
    expect(post.result).toBe("W");
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

  it("toSearchContent strips markdown and truncates", () => {
    expect(toSearchContent("## Pros\n\n- **Maye** was great")).toContain("Maye");
    expect(toSearchContent("## Pros\n\n- **Maye** was great")).not.toContain("**");
    expect(toSearchContent("a ".repeat(800)).length).toBeLessThanOrEqual(1200);
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

  it("getOpponentTags drops category and home-team labels", () => {
    expect(getOpponentTags(week17.tags)).toEqual(["New York Jets"]);
    expect(getOpponentTags(uclaRecap.tags)).toEqual(["California Golden Bears"]);
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
    expect(getCategory(["NFL", "Pros & Cons"]).slug).toBe("pros-cons");
    expect(getCategory(["Divisional Round", "Preview"]).label).toBe("Preview");
    expect(getCategory(["NFL"]).label).toBe("NFL");
    expect(getCategory(["NCAAF", "UCLA Bruins"]).label).toBe("UCLA");
    expect(getCategory(["NCAAF", "UCLA Bruins"]).color).toBe("bg-ucla");
    expect(getCategory(["NCAAF", "Pros & Cons", "UCLA Bruins"]).label).toBe(
      "UCLA"
    );
  });

  it("category slug helpers round-trip", () => {
    expect(categoryToSlug("Pros & Cons")).toBe("pros-cons");
    expect(slugToCategory("pros-cons")).toBe("Pros & Cons");
    expect(categoryUrl("UCLA")).toBe("/category/ucla");
    expect(tagToSlug("New York Jets")).toBe("new-york-jets");
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

  it("filterPosts matches category labels and tokenized full-text query", () => {
    const posts = [week17, week16, preview, uclaRecap];
    expect(filterPosts(posts, "", "Pro & Cons")).toEqual([week17]);
    expect(filterPosts(posts, "", "Preview")).toEqual([preview]);
    expect(filterPosts(posts, "", "NFL")).toEqual([week16]);
    expect(filterPosts(posts, "", "UCLA")).toEqual([uclaRecap]);
    expect(filterPosts(posts, "baltimore", "")).toEqual([week16]);
    expect(filterPosts(posts, "maye", "Pros & Cons")).toEqual([week17]);
    expect(filterPosts(posts, "five touchdowns", "")).toEqual([week17]);
    expect(filterPosts(posts, "xyz", "")).toEqual([]);
    expect(filterPosts(posts, "", "Buffalo Bills")).toEqual(posts);
  });

  it("matchesSearchQuery requires every token", () => {
    expect(matchesSearchQuery("Maye threw five touchdowns", "maye touchdowns")).toBe(
      true
    );
    expect(matchesSearchQuery("Maye threw five touchdowns", "maye buffalo")).toBe(
      false
    );
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

  it("getPostResult prefers schema scores over title parsing", () => {
    expect(getPostResult(week17)).toEqual({
      pats: 42,
      opp: 10,
      result: "W",
    });
    expect(formatScoreline(getPostResult(week17)!)).toBe("W 42–10");
    expect(getPostResult(week16)).toBeNull();
  });

  it("getAdjacentPosts and getRelatedPosts walk a newest-first list", () => {
    const posts = [preview, week17, week16];
    expect(getAdjacentPosts(posts, week17.slug)).toEqual({
      newer: preview,
      older: week16,
    });
    expect(getRelatedPosts(posts, week17, 3).map((p) => p.slug)).toEqual([
      "divisional-round-preview",
      "week-16",
    ]);
    expect(
      getRelatedPosts([week15, week05, week17], week15).map((p) => p.slug)
    ).toEqual(["week-05", "week-17-pros-cons-pats-vs-jets"]);
    expect(
      getRelatedPosts([preview, week17, uclaRecap], preview).map((p) => p.slug)
    ).toEqual(["week-17-pros-cons-pats-vs-jets"]);
  });
});
