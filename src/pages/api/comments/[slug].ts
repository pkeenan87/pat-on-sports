import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { comments } from "../../../db/schema";
import {
  checkOrigin,
  clientIpFromHeaders,
  hashEmail,
  hashIp,
  rateLimit,
  submitCommentSchema,
} from "../../../lib/comments";
import {
  isBlocked,
  isTrusted,
  verifyBotIdOrBypass,
} from "../../../lib/comments/service";

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) {
    return json({ error: "Missing slug" }, 400);
  }

  if (!checkOrigin(request)) {
    return json({ error: "Invalid origin" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = submitCommentSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid input" }, 400);
  }

  const data = parsed.data;
  if (data.website) {
    return json({ error: "Rejected" }, 400);
  }

  const botOk = await verifyBotIdOrBypass();
  if (!botOk) {
    return json({ error: "Rejected" }, 403);
  }

  let ipHash: string;
  let emailHash: string | null = null;
  try {
    const ip = clientIpFromHeaders(request.headers);
    ipHash = hashIp(ip);
    if (data.email) emailHash = hashEmail(data.email);
  } catch {
    return json({ error: "Server misconfigured" }, 500);
  }

  const limited = await rateLimit(`submit:${ipHash}`, 5);
  if (!limited.allowed) {
    return json({ error: "Rate limit exceeded" }, 429);
  }

  if (await isBlocked(emailHash, ipHash)) {
    return json({ error: "Forbidden" }, 403);
  }

  // One level of replies only; parent must already be approved.
  if (data.parentId) {
    const db = getDb();
    const parents = await db
      .select({
        id: comments.id,
        parentId: comments.parentId,
        status: comments.status,
      })
      .from(comments)
      .where(
        and(eq(comments.id, data.parentId), eq(comments.postSlug, slug))
      )
      .limit(1);
    const parent = parents[0];
    if (!parent || parent.parentId || parent.status !== "approved") {
      return json({ error: "Invalid parent" }, 400);
    }
  }

  const trusted = await isTrusted(emailHash);
  const status = trusted ? "approved" : "pending";
  const now = new Date();

  const db = getDb();
  await db.insert(comments).values({
    postSlug: slug,
    parentId: data.parentId ?? null,
    authorName: data.name,
    authorEmailHash: emailHash,
    body: data.body,
    status,
    isAuthor: false,
    ipHash,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    approvedAt: trusted ? now : null,
  });

  return json({ status }, 201);
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
