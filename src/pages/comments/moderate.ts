import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { comments } from "../../db/schema";
import {
  defaultModerationDeps,
  moderationGet,
  moderationPost,
  type ModerationDeps,
} from "../../lib/comments/moderateHandler";
import type { ModerationCommentView } from "../../lib/comments/moderationPage";

export const prerender = false;

async function loadComment(id: string): Promise<ModerationCommentView | null> {
  const db = getDb();
  const rows = await db
    .select({
      authorName: comments.authorName,
      body: comments.body,
      postSlug: comments.postSlug,
      status: comments.status,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  let postTitle = row.postSlug;
  try {
    const post = await getEntry("blog", row.postSlug);
    if (post?.data.title) postTitle = post.data.title;
  } catch (err) {
    console.error("moderation page post lookup failed", err);
  }

  return { ...row, postTitle };
}

function deps(): ModerationDeps {
  return { ...defaultModerationDeps, loadComment };
}

export const GET: APIRoute = ({ request }) => moderationGet(request, deps());

export const POST: APIRoute = ({ request }) => moderationPost(request, deps());
