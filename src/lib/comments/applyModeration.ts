import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { comments, trustedCommenters } from "../../db/schema";
import type { CommentModerationAction } from "./actionToken";
import { invalidateCommentThread } from "./commentCache";

/** Apply an email moderation decision. Matches the admin approve / delete behavior. */
export async function applyCommentModeration(
  commentId: string,
  action: CommentModerationAction
): Promise<"applied" | "missing"> {
  const db = getDb();
  const rows = await db
    .select({
      id: comments.id,
      postSlug: comments.postSlug,
      authorEmailHash: comments.authorEmailHash,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  const comment = rows[0];
  if (!comment) return "missing";

  const now = new Date();
  if (action === "approve") {
    await db
      .update(comments)
      .set({ status: "approved", approvedAt: now, reportCount: 0 })
      .where(eq(comments.id, commentId));
    if (comment.authorEmailHash) {
      await db
        .insert(trustedCommenters)
        .values({ emailHash: comment.authorEmailHash, approvedAt: now })
        .onConflictDoNothing();
    }
  } else {
    await db
      .update(comments)
      .set({ status: "deleted", approvedAt: null })
      .where(eq(comments.id, commentId));
  }

  await invalidateCommentThread(comment.postSlug);
  return "applied";
}
