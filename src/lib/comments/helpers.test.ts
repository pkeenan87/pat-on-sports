import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIpFromHeaders, hashEmail, hashIp } from "./hash";
import { linkifyPlainText } from "./linkify";
import { checkOrigin } from "./origin";
import {
  createSessionToken,
  passwordsMatch,
  readSessionCookie,
  verifySessionToken,
} from "./session";
import { submitCommentSchema } from "./schemas";
import { buildCommentTree, statusAfterReport } from "./service";

describe("hashEmail / hashIp", () => {
  it("hashes email case-insensitively with salt", () => {
    const a = hashEmail("Pat@Example.com", "salt");
    const b = hashEmail("  pat@example.com ", "salt");
    expect(a).toBe(b);
    expect(a).toBe(
      createHash("sha256").update("salt:pat@example.com").digest("hex")
    );
  });

  it("hashes IP with salt", () => {
    expect(hashIp("1.2.3.4", "salt")).toBe(
      createHash("sha256").update("salt:1.2.3.4").digest("hex")
    );
  });

  it("reads first x-forwarded-for address", () => {
    const headers = new Headers({
      "x-forwarded-for": " 10.0.0.1, 10.0.0.2 ",
    });
    expect(clientIpFromHeaders(headers)).toBe("10.0.0.1");
  });
});

describe("checkOrigin", () => {
  it("accepts matching origin from the request URL", () => {
    const req = new Request(
      "https://pat-on-sports-git-preview.vercel.app/api/comments/x",
      {
        method: "POST",
        headers: { origin: "https://pat-on-sports-git-preview.vercel.app" },
      }
    );
    expect(checkOrigin(req)).toBe(true);
  });

  it("rejects mismatched or missing origin", () => {
    const bad = new Request("https://patonsports.com/api/comments/x", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    const missing = new Request("https://patonsports.com/api/comments/x", {
      method: "POST",
    });
    expect(checkOrigin(bad)).toBe(false);
    expect(checkOrigin(missing)).toBe(false);
  });
});

describe("linkifyPlainText", () => {
  it("escapes HTML and preserves newlines", () => {
    expect(linkifyPlainText("hi <b>x</b>\nbye")).toBe(
      "hi &lt;b&gt;x&lt;/b&gt;<br>bye"
    );
  });

  it("autolinks URLs with safe rel", () => {
    const html = linkifyPlainText("see https://example.com/path.");
    expect(html).toContain(
      '<a href="https://example.com/path" rel="nofollow ugc noopener" target="_blank">https://example.com/path</a>.'
    );
  });
});

describe("session helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates and verifies a token", () => {
    const token = createSessionToken(1_000_000, "test-secret");
    expect(verifySessionToken(token, 1_000_100, "test-secret")).toBe(true);
    expect(verifySessionToken(token, 1_000_000 + 8 * 24 * 60 * 60 * 1000, "test-secret")).toBe(
      false
    );
    expect(verifySessionToken(token, 1_000_100, "wrong")).toBe(false);
  });

  it("reads the session cookie", () => {
    expect(
      readSessionCookie("foo=1; pos_admin_session=abc.def; bar=2")
    ).toBe("abc.def");
    expect(readSessionCookie(null)).toBeNull();
  });

  it("compares passwords with timingSafeEqual", () => {
    expect(passwordsMatch("secret", "secret")).toBe(true);
    expect(passwordsMatch("secret", "Secret")).toBe(false);
    expect(passwordsMatch("short", "longer-password")).toBe(false);
  });
});

describe("submitCommentSchema", () => {
  it("accepts a valid payload and normalizes empty email", () => {
    const parsed = submitCommentSchema.parse({
      name: " Pat ",
      email: "",
      body: "Nice take.",
      website: "",
    });
    expect(parsed.name).toBe("Pat");
    expect(parsed.email).toBeUndefined();
  });

  it("rejects honeypot and overlong body", () => {
    expect(() =>
      submitCommentSchema.parse({
        name: "Pat",
        body: "hi",
        website: "http://spam",
      })
    ).toThrow();
    expect(() =>
      submitCommentSchema.parse({
        name: "Pat",
        body: "x".repeat(2001),
      })
    ).toThrow();
  });
});

describe("buildCommentTree", () => {
  it("nests replies under approved parents and drops orphans", () => {
    const when = new Date("2026-09-01T12:00:00.000Z");
    const tree = buildCommentTree([
      {
        id: "root",
        parentId: null,
        authorName: "Alex",
        body: "Top",
        isAuthor: false,
        createdAt: when,
      },
      {
        id: "reply",
        parentId: "root",
        authorName: "Pat",
        body: "Thanks",
        isAuthor: true,
        createdAt: when,
      },
      {
        id: "orphan",
        parentId: "missing",
        authorName: "Sam",
        body: "Gone",
        isAuthor: false,
        createdAt: when,
      },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.replies).toHaveLength(1);
    expect(tree[0]!.replies[0]!.authorName).toBe("Pat");
    expect(tree.map((c) => c.id).join(",")).not.toContain("orphan");
  });
});

describe("statusAfterReport", () => {
  it("flips non-author comments to pending at the threshold", () => {
    expect(
      statusAfterReport({
        reportCount: 3,
        status: "approved",
        isAuthor: false,
      })
    ).toBe("pending");
  });

  it("keeps author replies approved", () => {
    expect(
      statusAfterReport({
        reportCount: 5,
        status: "approved",
        isAuthor: true,
      })
    ).toBe("approved");
  });
});
