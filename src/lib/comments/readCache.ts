import { isObviousBot } from "./bots";

/**
 * Public comment reads stay fresh on the CDN for 15 minutes.
 *
 * Neon suspends compute after 5 minutes of inactivity. The previous
 * `s-maxage=60` revalidated about once a minute while a post's comments were
 * requested, so compute never reached that window. 15 minutes is long enough
 * for compute to suspend between reader-driven revalidations. A commenter
 * still sees their own approved comment immediately, and everyone else sees
 * a newly approved comment on the next cache refresh.
 */
export const COMMENT_READ_S_MAXAGE_SECONDS = 15 * 60;

/** Serve a stale thread while one revalidation runs, instead of blocking on a cold start. */
export const COMMENT_READ_SWR_SECONDS = 10 * 60;

export const COMMENT_READ_FRESH_WINDOW_MS = COMMENT_READ_S_MAXAGE_SECONDS * 1000;

const FRESH_SKEW_MS = 60_000;

const PRIVATE_NO_STORE = {
  "Cache-Control": "private, no-store",
  "CDN-Cache-Control": "private, no-store",
  "Vercel-CDN-Cache-Control": "private, no-store",
} as const;

export type CommentReadDecision =
  | { type: "redirect" }
  | { type: "empty"; headers: Record<string, string> }
  | { type: "query"; bypass: boolean; headers: Record<string, string> };

/** A cache-bypass token is a millisecond timestamp inside the CDN freshness window. */
export function isRecentFreshToken(value: string, now = Date.now()): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const stamped = Number(value);
  const age = now - stamped;
  return age >= -FRESH_SKEW_MS && age <= COMMENT_READ_FRESH_WINDOW_MS;
}

export function commentReadCacheHeaders(bypass: boolean): Record<string, string> {
  if (bypass) return { ...PRIVATE_NO_STORE };
  const cdn = `public, s-maxage=${COMMENT_READ_S_MAXAGE_SECONDS}, stale-while-revalidate=${COMMENT_READ_SWR_SECONDS}`;
  return {
    // max-age=0 keeps the browser from holding its own copy. s-maxage is what
    // Vercel's CDN uses; the Vercel-specific header wins if the two ever differ.
    "Cache-Control": `public, max-age=0, s-maxage=${COMMENT_READ_S_MAXAGE_SECONDS}, stale-while-revalidate=${COMMENT_READ_SWR_SECONDS}`,
    "CDN-Cache-Control": cdn,
    "Vercel-CDN-Cache-Control": cdn,
  };
}

/**
 * Decide whether a comment read may touch Neon.
 * Obvious crawlers get an empty, uncacheable body and never open a connection.
 * Other rotating `?fresh=` values redirect to the canonical URL so they cannot
 * skip the CDN cache either.
 */
export function decideCommentRead(input: {
  fresh: string | null;
  userAgent: string | null;
  now?: number;
}): CommentReadDecision {
  const now = input.now ?? Date.now();
  if (isObviousBot(input.userAgent)) {
    return { type: "empty", headers: { ...PRIVATE_NO_STORE } };
  }
  if (input.fresh !== null && !isRecentFreshToken(input.fresh, now)) {
    return { type: "redirect" };
  }
  const bypass = input.fresh !== null;
  return {
    type: "query",
    bypass,
    headers: commentReadCacheHeaders(bypass),
  };
}
