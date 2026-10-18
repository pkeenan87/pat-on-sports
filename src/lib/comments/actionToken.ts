import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const COMMENT_ACTION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const COMMENT_ACTION_TTL_DAYS = 7;

const TOKEN_MAX_LENGTH = 4096;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CommentModerationAction = "approve" | "reject";

export type StoredActionToken = {
  commentId: string;
  action: CommentModerationAction;
  expiresAt: Date;
  usedAt: Date | null;
};

export type TokenStore = {
  findByHash(hash: string): Promise<StoredActionToken | null>;
  markUsed(
    hash: string,
    now: Date,
    claims: { commentId: string; action: CommentModerationAction }
  ): Promise<boolean>;
};

export type TokenFailureReason = "malformed" | "tampered" | "expired";

export type ConsumeFailureReason = TokenFailureReason | "reused" | "unknown";

type Verified =
  | {
      ok: true;
      commentId: string;
      action: CommentModerationAction;
      exp: number;
      jti: string;
    }
  | { ok: false; reason: TokenFailureReason };

export type ConsumeResult =
  | { ok: true; commentId: string; action: CommentModerationAction }
  | { ok: false; reason: ConsumeFailureReason };

type Payload = {
  v: 1;
  cid: string;
  act: CommentModerationAction;
  exp: number;
  jti: string;
};

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hashActionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createCommentActionToken(input: {
  commentId: string;
  action: CommentModerationAction;
  secret: string;
  now?: number;
  jti?: string;
}): { token: string; expiresAt: Date; jti: string } {
  if (!UUID_RE.test(input.commentId)) {
    throw new Error("comment id must be a uuid");
  }
  if (!input.secret) throw new Error("approval secret is empty");
  const now = input.now ?? Date.now();
  const jti = input.jti ?? randomBytes(32).toString("base64url");
  const exp = now + COMMENT_ACTION_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      cid: input.commentId,
      act: input.action,
      exp,
      jti,
    } satisfies Payload),
    "utf8"
  ).toString("base64url");
  return {
    token: `${payload}.${sign(payload, input.secret)}`,
    expiresAt: new Date(exp),
    jti,
  };
}

export function moderationUrl(siteOrigin: string, token: string): string {
  const origin = siteOrigin.replace(/\/$/, "");
  const url = new URL("/comments/moderate", `${origin}/`);
  url.searchParams.set("token", token);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("moderation link must be http(s)");
  }
  return url.toString();
}

/** Cryptographic check only. Does not look at the database or mark anything used. */
export function verifyCommentActionToken(
  token: string,
  now: number,
  secret: string
): Verified {
  if (!secret || !token || token.length > TOKEN_MAX_LENGTH) {
    return { ok: false, reason: "malformed" };
  }
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) {
    return { ok: false, reason: "malformed" };
  }
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig) return { ok: false, reason: "malformed" };
  if (!signaturesMatch(sig, sign(payload, secret))) {
    return { ok: false, reason: "tampered" };
  }

  let data: Partial<Payload>;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Payload>;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (data.v !== 1) return { ok: false, reason: "malformed" };
  if (data.act !== "approve" && data.act !== "reject") {
    return { ok: false, reason: "malformed" };
  }
  if (typeof data.cid !== "string" || !UUID_RE.test(data.cid)) {
    return { ok: false, reason: "malformed" };
  }
  if (typeof data.jti !== "string" || !/^[A-Za-z0-9_-]{16,128}$/.test(data.jti)) {
    return { ok: false, reason: "malformed" };
  }
  if (typeof data.exp !== "number" || !Number.isSafeInteger(data.exp)) {
    return { ok: false, reason: "malformed" };
  }
  if (data.exp <= now) return { ok: false, reason: "expired" };

  return {
    ok: true,
    commentId: data.cid,
    action: data.act,
    exp: data.exp,
    jti: data.jti,
  };
}

function classifyStored(
  row: StoredActionToken | null,
  claims: { commentId: string; action: CommentModerationAction },
  now: number
): ConsumeFailureReason {
  if (!row) return "unknown";
  if (row.commentId !== claims.commentId || row.action !== claims.action) {
    return "tampered";
  }
  if (row.usedAt) return "reused";
  if (row.expiresAt.getTime() <= now) return "expired";
  return "unknown";
}

/** Read a still-valid token without consuming it. Safe for a GET confirmation page. */
export async function previewActionToken(input: {
  token: string;
  now: number;
  secret: string;
  store: TokenStore;
}): Promise<ConsumeResult> {
  const verified = verifyCommentActionToken(input.token, input.now, input.secret);
  if (!verified.ok) return verified;
  const row = await input.store.findByHash(hashActionToken(input.token));
  if (!row) return { ok: false, reason: "unknown" };
  if (row.commentId !== verified.commentId || row.action !== verified.action) {
    return { ok: false, reason: "tampered" };
  }
  if (row.usedAt) return { ok: false, reason: "reused" };
  if (row.expiresAt.getTime() <= input.now) return { ok: false, reason: "expired" };
  return { ok: true, commentId: verified.commentId, action: verified.action };
}

/**
 * Atomically consume a token. A second call returns `reused`.
 * Expired and tampered tokens are not marked used.
 */
export async function consumeActionToken(input: {
  token: string;
  now: number;
  secret: string;
  store: TokenStore;
}): Promise<ConsumeResult> {
  const verified = verifyCommentActionToken(input.token, input.now, input.secret);
  if (!verified.ok) return verified;

  const hash = hashActionToken(input.token);
  const claims = { commentId: verified.commentId, action: verified.action };
  const won = await input.store.markUsed(hash, new Date(input.now), claims);
  if (won) return { ok: true, commentId: verified.commentId, action: verified.action };

  const row = await input.store.findByHash(hash);
  return { ok: false, reason: classifyStored(row, claims, input.now) };
}

export type IssuedModerationLink = {
  action: CommentModerationAction;
  url: string;
  commentId: string;
  tokenHash: string;
  expiresAt: Date;
};

/** Build approve and reject links. Callers store `tokenHash`, never the raw token. */
export function buildModerationLinks(input: {
  commentId: string;
  secret: string;
  siteOrigin: string;
  now?: number;
}): { approveUrl: string; rejectUrl: string; rows: IssuedModerationLink[] } {
  const actions: CommentModerationAction[] = ["approve", "reject"];
  const rows = actions.map((action) => {
    const issued = createCommentActionToken({
      commentId: input.commentId,
      action,
      secret: input.secret,
      now: input.now,
    });
    return {
      action,
      url: moderationUrl(input.siteOrigin, issued.token),
      commentId: input.commentId,
      tokenHash: hashActionToken(issued.token),
      expiresAt: issued.expiresAt,
    };
  });
  return {
    approveUrl: rows[0].url,
    rejectUrl: rows[1].url,
    rows,
  };
}

export function tokenFromModerationUrl(url: string): string {
  return new URL(url).searchParams.get("token") ?? "";
}
