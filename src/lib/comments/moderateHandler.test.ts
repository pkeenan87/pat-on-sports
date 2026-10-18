import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  buildModerationLinks,
  hashActionToken,
  tokenFromModerationUrl,
  type CommentModerationAction,
  type StoredActionToken,
  type TokenStore,
} from "./actionToken";
import { moderationGet, moderationPost, type ModerationDeps } from "./moderateHandler";
import { renderConfirmPage, renderResultPage } from "./moderationPage";
import type { ModerationCommentView } from "./moderationPage";

const material = "orange-horizon-fixture-0123456789";
const NOW = 1_760_000_000_000;
const ORIGIN = "https://patonsports.com";

class MemoryTokenStore implements TokenStore {
  rows = new Map<string, StoredActionToken>();

  insert(hash: string, row: StoredActionToken) {
    this.rows.set(hash, { ...row });
  }

  async findByHash(hash: string) {
    const row = this.rows.get(hash);
    return row ? { ...row } : null;
  }

  async markUsed(
    hash: string,
    now: Date,
    claims: { commentId: string; action: CommentModerationAction }
  ) {
    const row = this.rows.get(hash);
    if (!row || row.usedAt) return false;
    if (row.expiresAt.getTime() <= now.getTime()) return false;
    if (row.commentId !== claims.commentId || row.action !== claims.action) {
      return false;
    }
    row.usedAt = now;
    return true;
  }
}

function commentView(): ModerationCommentView {
  return {
    authorName: '<script>alert(1)</script>',
    body: "see https://evil.test/phish",
    postSlug: "week-01",
    postTitle: "Week 1",
    status: "pending",
    createdAt: new Date(NOW),
  };
}

function setup(now = NOW) {
  const store = new MemoryTokenStore();
  const commentId = randomUUID();
  const links = buildModerationLinks({
    commentId,
    secret: material,
    siteOrigin: ORIGIN,
    now,
  });
  for (const row of links.rows) {
    store.insert(hashActionToken(tokenFromModerationUrl(row.url)), {
      commentId,
      action: row.action,
      expiresAt: row.expiresAt,
      usedAt: null,
    });
  }
  const apply = vi.fn(async () => "applied" as const);
  const deps: ModerationDeps = {
    secret: () => material,
    now: () => now + 1_000,
    store: () => store,
    loadComment: async () => commentView(),
    apply,
  };
  return { store, links, commentId, apply, deps };
}

function postRequest(token: string, origin = ORIGIN) {
  return new Request(`${ORIGIN}/comments/moderate`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token }),
  });
}

describe("moderation HTTP flow", () => {
  it("shows a confirmation form on GET and does not approve", async () => {
    const { links, apply, deps } = setup();
    const token = tokenFromModerationUrl(links.approveUrl);
    const res = await moderationGet(
      new Request(`${ORIGIN}/comments/moderate?token=${encodeURIComponent(token)}`),
      deps
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('method="post"');
    expect(html).toContain("Opening this page does not change the comment.");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain('href="https://evil.test/phish"');
    expect(html).toContain("https://evil.test/phish");
    expect(apply).not.toHaveBeenCalled();
  });

  it("approves only when the confirmation form is posted", async () => {
    const { links, apply, deps, commentId } = setup();
    const token = tokenFromModerationUrl(links.approveUrl);
    const res = await moderationPost(postRequest(token), deps);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "/comments/moderate/done?result=approved"
    );
    expect(apply).toHaveBeenCalledWith(commentId, "approve");
  });

  it("does not apply an expired, reused, or tampered token", async () => {
    const expired = setup(NOW - 8 * 24 * 60 * 60 * 1000);
    const expiredToken = tokenFromModerationUrl(expired.links.approveUrl);
    const expiredRes = await moderationPost(
      postRequest(expiredToken),
      { ...expired.deps, now: () => NOW }
    );
    expect(expiredRes.headers.get("location")).toBe(
      "/comments/moderate/done?result=expired"
    );
    expect(expired.apply).not.toHaveBeenCalled();

    const { links, apply, deps } = setup();
    const token = tokenFromModerationUrl(links.approveUrl);
    await moderationPost(postRequest(token), deps);
    apply.mockClear();
    const reused = await moderationPost(postRequest(token), deps);
    expect(reused.headers.get("location")).toBe(
      "/comments/moderate/done?result=reused"
    );
    expect(apply).not.toHaveBeenCalled();

    const [payload, sig] = tokenFromModerationUrl(links.rejectUrl).split(".");
    const tampered = `${payload}.${sig.slice(0, -1)}${sig.endsWith("a") ? "b" : "a"}`;
    const tamperedRes = await moderationPost(postRequest(tampered), deps);
    expect(tamperedRes.headers.get("location")).toBe(
      "/comments/moderate/done?result=invalid"
    );
    expect(apply).not.toHaveBeenCalled();
  });

  it("rejects a cross-site post without using the token", async () => {
    const { links, apply, deps, store } = setup();
    const token = tokenFromModerationUrl(links.rejectUrl);
    const res = await moderationPost(postRequest(token, "https://evil.test"), deps);
    expect(res.status).toBe(403);
    expect(apply).not.toHaveBeenCalled();
    const row = await store.findByHash(hashActionToken(token));
    expect(row?.usedAt).toBeNull();
  });
});

describe("moderation pages", () => {
  it("escapes the hidden token and ignores unexpected result text", () => {
    const html = renderConfirmPage({
      token: 'abc" onfocus="alert(1)',
      action: "reject",
      comment: commentView(),
    });
    expect(html).toContain("abc&quot; onfocus=&quot;alert(1)");
    expect(html).toContain('class="reject"');
    expect(html).not.toContain('value="abc"');

    const poisoned = renderResultPage("<script>alert(1)</script>");
    expect(poisoned).not.toContain("<script>");
    expect(poisoned).toContain("This link is invalid.");
    expect(renderResultPage("approved")).toContain(
      "This comment is approved and public."
    );
  });
});
