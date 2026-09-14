import { and, asc, eq, or } from "drizzle-orm";
import { getDb } from "../../db";
import { blockedCommenters, comments, trustedCommenters } from "../../db/schema";
import { linkifyPlainText } from "./linkify";

export type PublicComment = {
  id: string;
  authorName: string;
  bodyHtml: string;
  isAuthor: boolean;
  createdAt: string;
  replies: PublicComment[];
};

export type CommentTreeRow = {
  id: string;
  parentId: string | null;
  authorName: string;
  body: string;
  isAuthor: boolean;
  createdAt: Date;
};

/** Pure tree builder — approved rows only; orphan replies are dropped. */
export function buildCommentTree(rows: CommentTreeRow[]): PublicComment[] {
  const byId = new Map<string, PublicComment>();
  const roots: PublicComment[] = [];

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      authorName: row.authorName,
      bodyHtml: linkifyPlainText(row.body),
      isAuthor: row.isAuthor,
      createdAt: row.createdAt.toISOString(),
      replies: [],
    });
  }

  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentId && byId.has(row.parentId)) {
      byId.get(row.parentId)!.replies.push(node);
    } else if (!row.parentId) {
      roots.push(node);
    }
  }

  return roots;
}

export async function getApprovedCommentTree(
  postSlug: string
): Promise<PublicComment[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      authorName: comments.authorName,
      body: comments.body,
      isAuthor: comments.isAuthor,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(
      and(eq(comments.postSlug, postSlug), eq(comments.status, "approved"))
    )
    .orderBy(asc(comments.createdAt));

  return buildCommentTree(rows);
}

export async function isBlocked(
  emailHash: string | null,
  ipHash: string
): Promise<boolean> {
  const db = getDb();
  const conditions = [eq(blockedCommenters.ipHash, ipHash)];
  if (emailHash) {
    conditions.push(eq(blockedCommenters.emailHash, emailHash));
  }
  const rows = await db
    .select({ emailHash: blockedCommenters.emailHash })
    .from(blockedCommenters)
    .where(or(...conditions))
    .limit(1);
  return rows.length > 0;
}

export async function isTrusted(emailHash: string | null): Promise<boolean> {
  if (!emailHash) return false;
  const db = getDb();
  const rows = await db
    .select({ emailHash: trustedCommenters.emailHash })
    .from(trustedCommenters)
    .where(eq(trustedCommenters.emailHash, emailHash))
    .limit(1);
  return rows.length > 0;
}

export async function verifyBotIdOrBypass(): Promise<boolean> {
  try {
    const { checkBotId } = await import("botid/server");
    const result = await checkBotId();
    if (result.isBot && !result.isVerifiedBot) return false;
    return true;
  } catch (err) {
    // Local/dev without BotID infrastructure: allow only in DEV.
    if (import.meta.env.DEV) return true;
    console.error("BotID check failed", err);
    return false;
  }
}

/** Next status after a report — author replies stay approved. */
export function statusAfterReport(opts: {
  reportCount: number;
  status: string;
  isAuthor: boolean;
  threshold?: number;
}): string {
  const threshold = opts.threshold ?? 3;
  if (opts.reportCount >= threshold && !opts.isAuthor) {
    return "pending";
  }
  return opts.status;
}
