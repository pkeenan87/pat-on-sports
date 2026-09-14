import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  API_SCHEMA_VERSION,
  absoluteUrl,
  apiManifestSchema,
  apiPostDetailSchema,
  apiPostsFeedSchema,
  buildManifest,
  buildPostsFeed,
  categoryColorToken,
  hashBody,
  siteOrigin,
  toApiCategory,
  toApiPostDetail,
  toApiPostSummary,
  type ApiPostSource,
} from "./api";
import type { PostMeta } from "./posts";

const week17: ApiPostSource = {
  slug: "week-17-pros-cons-pats-vs-jets",
  title: "Week 17: Patriots 42 – Jets 10",
  date: "2025-12-28",
  description: "Week 17 recap.",
  heroImage: "/images/week-17/hero.jpg",
  heroAlt: "Hero alt",
  heroCaption: "Hero caption",
  audio: "/audio/week-17.m4a",
  audioDurationSeconds: 612,
  tags: ["NFL", "Pros & Cons", "New England Patriots", "New York Jets"],
  season: 2025,
  week: 17,
  opponent: "New York Jets",
  scoreUs: 42,
  scoreThem: 10,
  result: "W",
  readingTimeMinutes: 4,
  body: `Intro paragraph.

## Pros
- Maye was lights out.

## Cons
- Still a few penalties.
`,
};

const week16: PostMeta = {
  slug: "week-16",
  title: "Week 16 Pros & Cons",
  date: "2025-12-21",
  description: "Week 16 recap.",
  tags: ["NFL", "Pros & Cons", "New England Patriots", "Baltimore Ravens"],
  season: 2025,
  week: 16,
  opponent: "Baltimore Ravens",
  readingTimeMinutes: 3,
};

const preview: PostMeta = {
  slug: "week-18-preview",
  title: "Week 18 Preview",
  date: "2025-12-30",
  description: "Looking ahead.",
  tags: ["NFL", "Preview", "New England Patriots"],
  season: 2025,
  week: 18,
  readingTimeMinutes: 2,
};

describe("siteOrigin / absoluteUrl", () => {
  it("strips trailing slash from the site origin", () => {
    expect(siteOrigin("https://patonsports.com/")).toBe(
      "https://patonsports.com"
    );
  });

  it("absolutizes root-relative paths and leaves absolute URLs alone", () => {
    expect(absoluteUrl("https://patonsports.com", "/images/hero.jpg")).toBe(
      "https://patonsports.com/images/hero.jpg"
    );
    expect(
      absoluteUrl("https://patonsports.com", "https://cdn.example/a.m4a")
    ).toBe("https://cdn.example/a.m4a");
    expect(absoluteUrl("https://patonsports.com", undefined)).toBeNull();
    expect(absoluteUrl("https://patonsports.com", "   ")).toBeNull();
  });
});

describe("hashBody", () => {
  it("returns a stable sha-256 hex digest", () => {
    const body = "## Pros\n- One\n";
    expect(hashBody(body)).toBe(
      createHash("sha256").update(body, "utf8").digest("hex")
    );
    expect(hashBody(body)).toBe(hashBody(body));
    expect(hashBody(body)).not.toBe(hashBody(body + " "));
  });
});

describe("toApiCategory / categoryColorToken", () => {
  it("maps Pros & Cons to navy and Preview to red", () => {
    expect(toApiCategory(week17.tags!)).toEqual({
      label: "Pros & Cons",
      slug: "pros-cons",
      color: "navy",
    });
    expect(categoryColorToken("Preview")).toBe("red");
    expect(categoryColorToken("UCLA")).toBe("ucla");
  });
});

describe("toApiPostSummary / buildPostsFeed", () => {
  it("builds a summary that matches the Zod schema", () => {
    const summary = toApiPostSummary(week17, "https://patonsports.com");
    expect(summary.heroImage).toBe(
      "https://patonsports.com/images/week-17/hero.jpg"
    );
    expect(summary.audio).toBe("https://patonsports.com/audio/week-17.m4a");
    expect(summary.audioDurationSeconds).toBe(612);
    expect(summary.bodyHash).toBe(hashBody(week17.body!));
    expect(summary.category.color).toBe("navy");
    expect(apiPostsFeedSchema.shape.posts.element.parse(summary)).toEqual(
      summary
    );
  });

  it("builds a feed envelope with schemaVersion and site", () => {
    const feed = buildPostsFeed(
      [week17],
      "https://patonsports.com/",
      "2026-09-14T12:00:00.000Z"
    );
    expect(feed.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(feed.site).toBe("https://patonsports.com");
    expect(feed.generatedAt).toBe("2026-09-14T12:00:00.000Z");
    expect(feed.posts).toHaveLength(1);
    expect(apiPostsFeedSchema.parse(feed)).toEqual(feed);
  });
});

describe("toApiPostDetail", () => {
  it("includes markdown, prosCons panels, caption, and related slugs", () => {
    const detail = toApiPostDetail(
      week17,
      [week17, week16, preview],
      "https://patonsports.com"
    );
    expect(detail.markdown).toContain("## Pros");
    expect(detail.prosCons?.hasPanels).toBe(true);
    expect(detail.prosCons?.pros).toEqual(["Maye was lights out."]);
    expect(detail.prosCons?.cons).toEqual(["Still a few penalties."]);
    expect(detail.heroCaption).toBe("Hero caption");
    expect(detail.related).toContain("week-16");
    expect(detail.related).not.toContain(week17.slug);
    expect(apiPostDetailSchema.parse(detail)).toEqual(detail);
  });

  it("omits prosCons when the post is not a Pros & Cons article", () => {
    const source: ApiPostSource = {
      ...preview,
      body: "Just a preview.",
    };
    const detail = toApiPostDetail(source, [week17, preview], "https://patonsports.com");
    expect(detail.prosCons).toBeNull();
  });
});

describe("buildManifest", () => {
  it("publishes app config with optional comments base and banner", () => {
    const manifest = buildManifest({
      site: "https://patonsports.com/",
      commentsApiBase: "https://patonsports.com/api/comments",
      message: "Maintenance tonight.",
    });
    expect(manifest.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(manifest.minSupportedSchemaVersion).toBe(API_SCHEMA_VERSION);
    expect(manifest.commentsApiBase).toBe(
      "https://patonsports.com/api/comments"
    );
    expect(manifest.message).toBe("Maintenance tonight.");
    expect(apiManifestSchema.parse(manifest)).toEqual(manifest);
  });

  it("nulls empty optional fields", () => {
    const manifest = buildManifest({
      site: "https://patonsports.com",
      commentsApiBase: "  ",
      message: "",
    });
    expect(manifest.commentsApiBase).toBeNull();
    expect(manifest.message).toBeNull();
  });

  it("fails closed when commentsApiBase is not an absolute URL", () => {
    expect(() =>
      buildManifest({
        site: "https://patonsports.com",
        commentsApiBase: "/api/comments",
      })
    ).toThrow();
  });
});
