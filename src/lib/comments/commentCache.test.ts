import { describe, expect, it } from "vitest";
import { commentCacheTag, withSharedCommentCacheTag } from "./commentCache";

describe("commentCacheTag", () => {
  it("stays purgeable and distinct for slugs that sanitize alike", () => {
    const tag = commentCacheTag("week-01-pros-and-cons");
    expect(tag.startsWith("comments-week-01-pros-and-cons-")).toBe(true);
    expect(tag).not.toContain(",");
    expect(Buffer.byteLength(tag)).toBeLessThanOrEqual(256);
    expect(commentCacheTag("a/b")).not.toBe(commentCacheTag("a_b"));
  });

  it("tags only the shared cacheable read", () => {
    const shared: Record<string, string> = {
      "Cache-Control": "public, max-age=0, s-maxage=900",
    };
    const tagged = withSharedCommentCacheTag(shared, "week-01", false);
    expect(tagged["Vercel-Cache-Tag"]).toBe(commentCacheTag("week-01"));
    expect(shared["Vercel-Cache-Tag"]).toBeUndefined();

    const bypass: Record<string, string> = {
      "Cache-Control": "private, no-store",
    };
    expect(withSharedCommentCacheTag(bypass, "week-01", true)).toBe(bypass);
    expect(bypass["Vercel-Cache-Tag"]).toBeUndefined();
  });
});
