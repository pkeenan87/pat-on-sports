import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../../db";
import { commentModerationTokens } from "../../db/schema";
import type {
  CommentModerationAction,
  IssuedModerationLink,
  StoredActionToken,
  TokenStore,
} from "./actionToken";

function asAction(value: string): CommentModerationAction | null {
  if (value === "approve" || value === "reject") return value;
  return null;
}

export function dbTokenStore(): TokenStore {
  return {
    async findByHash(hash: string): Promise<StoredActionToken | null> {
      const db = getDb();
      const rows = await db
        .select({
          commentId: commentModerationTokens.commentId,
          action: commentModerationTokens.action,
          expiresAt: commentModerationTokens.expiresAt,
          usedAt: commentModerationTokens.usedAt,
        })
        .from(commentModerationTokens)
        .where(eq(commentModerationTokens.tokenHash, hash))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      const action = asAction(row.action);
      if (!action) return null;
      return {
        commentId: row.commentId,
        action,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
      };
    },

    async markUsed(hash, now, claims) {
      const db = getDb();
      const updated = await db
        .update(commentModerationTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(commentModerationTokens.tokenHash, hash),
            eq(commentModerationTokens.commentId, claims.commentId),
            eq(commentModerationTokens.action, claims.action),
            isNull(commentModerationTokens.usedAt),
            gt(commentModerationTokens.expiresAt, now)
          )
        )
        .returning({ id: commentModerationTokens.id });
      return updated.length > 0;
    },
  };
}

export async function storeModerationTokens(
  rows: IssuedModerationLink[]
): Promise<void> {
  if (rows.length === 0) return;
  const db = getDb();
  await db.insert(commentModerationTokens).values(
    rows.map((row) => ({
      commentId: row.commentId,
      action: row.action,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
    }))
  );
}
