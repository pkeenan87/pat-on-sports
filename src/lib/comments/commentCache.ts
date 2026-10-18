import { createHash } from "node:crypto";
import { addCacheTag, dangerouslyDeleteByTag } from "@vercel/functions";

/**
 * CDN tag for one post's public comment JSON.
 * Tags cannot contain commas and must stay within 256 bytes.
 * A short hash keeps two slugs that sanitize to the same text distinct.
 */
export function commentCacheTag(slug: string): string {
  const digest = createHash("sha256").update(slug).digest("hex").slice(0, 12);
  const readable = slug.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || "post";
  return `comments-${readable}-${digest}`;
}

/** Attach the tag only to the shared, cacheable read. Bypass and bot responses stay untagged. */
export function withSharedCommentCacheTag(
  headers: Record<string, string>,
  slug: string,
  bypass: boolean
): Record<string, string> {
  if (bypass) return headers;
  return { ...headers, "Vercel-Cache-Tag": commentCacheTag(slug) };
}

/** Record the tag with the Vercel runtime when it is available. Failures stay off the read path. */
export async function tagSharedCommentRead(
  slug: string,
  bypass: boolean
): Promise<void> {
  if (bypass) return;
  try {
    await addCacheTag(commentCacheTag(slug));
  } catch (err) {
    console.error("comment cache tag failed", err);
  }
}

/**
 * Drop the cached thread so the next reader rebuilds it.
 * Outside Vercel this is a no-op. A failure must not undo the moderation decision.
 */
export async function invalidateCommentThread(slug: string): Promise<void> {
  const tag = commentCacheTag(slug);
  try {
    await dangerouslyDeleteByTag(tag);
  } catch (err) {
    console.error("comment cache invalidation failed", tag, err);
  }
}
