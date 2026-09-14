import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { comments } from "../../../../db/schema";
import {
  checkOrigin,
  clientIpFromHeaders,
  hashIp,
  rateLimit,
  reportCommentSchema,
} from "../../../../lib/comments";
import { statusAfterReport } from "../../../../lib/comments/service";

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return json({ error: "Missing id" }, 400);
  }

  if (!checkOrigin(request)) {
    return json({ error: "Invalid origin" }, 403);
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = reportCommentSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid input" }, 400);
  }

  let ipHash: string;
  try {
    ipHash = hashIp(clientIpFromHeaders(request.headers));
  } catch {
    return json({ error: "Server misconfigured" }, 500);
  }

  const limited = await rateLimit(`report:${ipHash}`, 5);
  if (!limited.allowed) {
    return json({ error: "Rate limit exceeded" }, 429);
  }

  const db = getDb();
  const rows = await db
    .select({
      id: comments.id,
      reportCount: comments.reportCount,
      status: comments.status,
      isAuthor: comments.isAuthor,
    })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);

  const row = rows[0];
  if (!row || row.status === "deleted" || row.status === "spam") {
    return json({ error: "Not found" }, 404);
  }

  const nextCount = row.reportCount + 1;
  const nextStatus = statusAfterReport({
    reportCount: nextCount,
    status: row.status,
    isAuthor: row.isAuthor,
  });

  await db
    .update(comments)
    .set({
      reportCount: nextCount,
      status: nextStatus,
      approvedAt: nextStatus === "pending" ? null : undefined,
    })
    .where(eq(comments.id, id));

  return json({ ok: true, reportCount: nextCount }, 200);
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
