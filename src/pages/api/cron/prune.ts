import type { APIRoute } from "astro";
import { timingSafeEqual } from "node:crypto";
import { lt } from "drizzle-orm";
import { getDb } from "../../../db";
import { comments, rateLimits } from "../../../db/schema";

export const prerender = false;

function bearerMatches(authHeader: string, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still run a compare so timing doesn't leak length alone via early return
    // of a short path — compare against itself after length check padding.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export const GET: APIRoute = async ({ request }) => {
  const auth = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: "Misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!bearerMatches(auth, secret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await db
    .update(comments)
    .set({ ipHash: null, userAgent: null })
    .where(lt(comments.createdAt, thirtyDaysAgo));

  await db.delete(rateLimits).where(lt(rateLimits.windowStart, oneDayAgo));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
