import { describe, expect, it } from "vitest";
import {
  COMMENT_READ_FRESH_WINDOW_MS,
  COMMENT_READ_S_MAXAGE_SECONDS,
  decideCommentRead,
  isRecentFreshToken,
} from "./readCache";

const NOW = 1_760_000_000_000;
const BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

describe("isRecentFreshToken", () => {
  it("accepts a timestamp inside the CDN window", () => {
    expect(isRecentFreshToken(String(NOW - 1_000), NOW)).toBe(true);
    expect(isRecentFreshToken(String(NOW - COMMENT_READ_FRESH_WINDOW_MS), NOW)).toBe(
      true
    );
  });

  it("rejects stale, future, and non-timestamp values", () => {
    expect(isRecentFreshToken(String(NOW - COMMENT_READ_FRESH_WINDOW_MS - 1), NOW)).toBe(
      false
    );
    expect(isRecentFreshToken(String(NOW + 120_000), NOW)).toBe(false);
    expect(isRecentFreshToken("1", NOW)).toBe(false);
    expect(isRecentFreshToken("not-a-time", NOW)).toBe(false);
  });
});

describe("decideCommentRead", () => {
  it("caches anonymous reads for 15 minutes", () => {
    const decision = decideCommentRead({
      fresh: null,
      userAgent: BROWSER,
      now: NOW,
    });
    expect(decision.type).toBe("query");
    if (decision.type !== "query") return;
    expect(decision.bypass).toBe(false);
    expect(decision.headers["Cache-Control"]).toContain(
      `s-maxage=${COMMENT_READ_S_MAXAGE_SECONDS}`
    );
    expect(decision.headers["Cache-Control"]).toContain("max-age=0");
    expect(decision.headers["Vercel-CDN-Cache-Control"]).toContain(
      `s-maxage=${COMMENT_READ_S_MAXAGE_SECONDS}`
    );
    expect(COMMENT_READ_S_MAXAGE_SECONDS).toBeGreaterThan(5 * 60);
  });

  it("bypasses the CDN only for a fresh timestamp from the commenter", () => {
    const decision = decideCommentRead({
      fresh: String(NOW - 5_000),
      userAgent: BROWSER,
      now: NOW,
    });
    expect(decision.type).toBe("query");
    if (decision.type !== "query") return;
    expect(decision.bypass).toBe(true);
    expect(decision.headers["Cache-Control"]).toContain("no-store");
  });

  it("redirects rotating fresh values without treating them as a cache bypass", () => {
    expect(
      decideCommentRead({ fresh: "nope", userAgent: BROWSER, now: NOW }).type
    ).toBe("redirect");
    expect(
      decideCommentRead({
        fresh: String(NOW - COMMENT_READ_FRESH_WINDOW_MS - 1),
        userAgent: BROWSER,
        now: NOW,
      }).type
    ).toBe("redirect");
  });

  it("does not query for an obvious crawler, even with a valid fresh token", () => {
    const decision = decideCommentRead({
      fresh: String(NOW),
      userAgent: GOOGLEBOT,
      now: NOW,
    });
    expect(decision.type).toBe("empty");
    if (decision.type !== "empty") return;
    expect(decision.headers["Cache-Control"]).toContain("no-store");
  });
});
