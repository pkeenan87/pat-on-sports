import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildModerationLinks,
  consumeActionToken,
  createCommentActionToken,
  hashActionToken,
  previewActionToken,
  tokenFromModerationUrl,
  verifyCommentActionToken,
  type CommentModerationAction,
  type StoredActionToken,
  type TokenStore,
} from "./actionToken";

const material = "orange-horizon-fixture-0123456789";
const otherMat = "purple-horizon-fixture-987654321";
const NOW = 1_760_000_000_000;
const SITE = "https://patonsports.com";

class MemoryTokenStore implements TokenStore {
  rows = new Map<string, StoredActionToken>();
  markCalls = 0;

  insert(hash: string, row: StoredActionToken) {
    this.rows.set(hash, { ...row });
  }

  async findByHash(hash: string) {
    const row = this.rows.get(hash);
    return row ? { ...row, usedAt: row.usedAt } : null;
  }

  async markUsed(
    hash: string,
    now: Date,
    claims: { commentId: string; action: CommentModerationAction }
  ) {
    this.markCalls += 1;
    const row = this.rows.get(hash);
    if (!row) return false;
    if (row.usedAt) return false;
    if (row.expiresAt.getTime() <= now.getTime()) return false;
    if (row.commentId !== claims.commentId || row.action !== claims.action) {
      return false;
    }
    row.usedAt = now;
    return true;
  }
}

function storeIssued(commentId = randomUUID(), now = NOW) {
  const store = new MemoryTokenStore();
  const links = buildModerationLinks({
    commentId,
    secret: material,
    siteOrigin: SITE,
    now,
  });
  for (const row of links.rows) {
    store.insert(row.tokenHash, {
      commentId: row.commentId,
      action: row.action,
      expiresAt: row.expiresAt,
      usedAt: null,
    });
  }
  return { store, links, commentId };
}

describe("comment action tokens", () => {
  it("signs a token that verifies for the same comment and action", () => {
    const commentId = randomUUID();
    const issued = createCommentActionToken({
      commentId,
      action: "approve",
      secret: material,
      now: NOW,
    });
    const verified = verifyCommentActionToken(issued.token, NOW + 1_000, material);
    expect(verified).toEqual({
      ok: true,
      commentId,
      action: "approve",
      exp: NOW + 7 * 24 * 60 * 60 * 1000,
      jti: issued.jti,
    });
    expect(hashActionToken(issued.token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashActionToken(issued.token)).not.toContain(issued.token.slice(0, 12));
  });

  it("stores a hash of the link token, not the token itself", () => {
    const { links } = storeIssued();
    for (const row of links.rows) {
      const token = tokenFromModerationUrl(row.url);
      expect(row.tokenHash).toBe(hashActionToken(token));
      expect(row.url).not.toContain(row.tokenHash);
      expect(token.split(".")).toHaveLength(2);
    }
    expect(links.approveUrl).not.toBe(links.rejectUrl);
  });

  it("rejects a tampered payload, a flipped signature, and the wrong secret", () => {
    const commentId = randomUUID();
    const issued = createCommentActionToken({
      commentId,
      action: "approve",
      secret: material,
      now: NOW,
    });
    const [payload, sig] = issued.token.split(".");
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { cid: string; act: string };
    decoded.cid = randomUUID();
    decoded.act = "reject";
    const swapped = `${Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url")}.${sig}`;
    const flipped = `${payload}.${sig.slice(0, -1)}${sig.endsWith("a") ? "b" : "a"}`;

    expect(verifyCommentActionToken(swapped, NOW, material)).toEqual({
      ok: false,
      reason: "tampered",
    });
    expect(verifyCommentActionToken(flipped, NOW, material)).toEqual({
      ok: false,
      reason: "tampered",
    });
    expect(verifyCommentActionToken(issued.token, NOW, otherMat)).toEqual({
      ok: false,
      reason: "tampered",
    });
    expect(verifyCommentActionToken("not-a-token", NOW, material)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects an expired token without consulting the store", async () => {
    const { store, links } = storeIssued(randomUUID(), NOW - 8 * 24 * 60 * 60 * 1000);
    const token = tokenFromModerationUrl(links.approveUrl);
    const result = await consumeActionToken({
      token,
      now: NOW,
      secret: material,
      store,
    });
    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(store.markCalls).toBe(0);
    expect(verifyCommentActionToken(token, NOW, material)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("treats the expiry boundary as expired", () => {
    const issued = createCommentActionToken({
      commentId: randomUUID(),
      action: "reject",
      secret: material,
      now: NOW,
    });
    expect(
      verifyCommentActionToken(issued.token, issued.expiresAt.getTime(), material)
    ).toEqual({ ok: false, reason: "expired" });
    expect(
      verifyCommentActionToken(issued.token, issued.expiresAt.getTime() - 1, material).ok
    ).toBe(true);
  });
});

describe("approve flow", () => {
  it("previews without consuming, then approves once and rejects reuse", async () => {
    const { store, links, commentId } = storeIssued();
    const token = tokenFromModerationUrl(links.approveUrl);

    const preview = await previewActionToken({
      token,
      now: NOW + 1_000,
      secret: material,
      store,
    });
    expect(preview).toEqual({ ok: true, commentId, action: "approve" });
    expect(store.markCalls).toBe(0);

    const first = await consumeActionToken({
      token,
      now: NOW + 1_000,
      secret: material,
      store,
    });
    expect(first).toEqual({ ok: true, commentId, action: "approve" });

    const second = await consumeActionToken({
      token,
      now: NOW + 2_000,
      secret: material,
      store,
    });
    expect(second).toEqual({ ok: false, reason: "reused" });
    expect(store.markCalls).toBe(2);
  });

  it("does not let an approve token authorize a different comment", async () => {
    const { store, links, commentId } = storeIssued();
    const other = storeIssued();
    const token = tokenFromModerationUrl(links.approveUrl);
    const consumed = await consumeActionToken({
      token,
      now: NOW + 1_000,
      secret: material,
      store,
    });
    expect(consumed).toEqual({ ok: true, commentId, action: "approve" });
    expect(commentId).not.toBe(other.commentId);
    const foreign = await consumeActionToken({
      token,
      now: NOW + 1_000,
      secret: material,
      store: other.store,
    });
    expect(foreign).toEqual({ ok: false, reason: "unknown" });
  });

  it("keeps the reject link usable after approve is consumed", async () => {
    const { store, links, commentId } = storeIssued();
    await consumeActionToken({
      token: tokenFromModerationUrl(links.approveUrl),
      now: NOW + 1_000,
      secret: material,
      store,
    });
    const rejected = await consumeActionToken({
      token: tokenFromModerationUrl(links.rejectUrl),
      now: NOW + 1_000,
      secret: material,
      store,
    });
    expect(rejected).toEqual({ ok: true, commentId, action: "reject" });
  });

  it("does not consume a tampered token", async () => {
    const { store, links } = storeIssued();
    const token = tokenFromModerationUrl(links.approveUrl);
    const [payload, sig] = token.split(".");
    const tampered = `${payload}.${sig.slice(0, -1)}${sig.endsWith("a") ? "b" : "a"}`;
    const result = await consumeActionToken({
      token: tampered,
      now: NOW + 1_000,
      secret: material,
      store,
    });
    expect(result).toEqual({ ok: false, reason: "tampered" });
    expect(store.markCalls).toBe(0);
    const stillGood = await previewActionToken({
      token,
      now: NOW + 1_000,
      secret: material,
      store,
    });
    expect(stillGood.ok).toBe(true);
  });
});
