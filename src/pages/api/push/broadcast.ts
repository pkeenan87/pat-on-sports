import type { APIRoute } from "astro";
import { getEntry } from "astro:content";
import { inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { pushTokens } from "../../../db/schema";
import { siteOrigin } from "../../../lib/api";
import {
  bearerMatches,
  broadcastPushSchema,
  buildNewPostMessage,
  sendExpoPushMessages,
  tokensWithDeviceNotRegistered,
} from "../../../lib/push";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = request.headers.get("authorization") ?? "";
  const secret = process.env.PUSH_BROADCAST_SECRET;
  if (!secret) {
    return json({ error: "Misconfigured" }, 500);
  }

  if (!bearerMatches(auth, secret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = broadcastPushSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid input" }, 400);
  }

  const { slug } = parsed.data;
  const post = await getEntry("blog", slug);
  if (!post) {
    return json({ error: "Post not found" }, 404);
  }

  const db = getDb();
  const rows = await db.select({ token: pushTokens.token }).from(pushTokens);
  const tokens = rows.map((r) => r.token);

  if (tokens.length === 0) {
    return json({ ok: true, sent: 0, pruned: 0 }, 200);
  }

  const site = siteOrigin(import.meta.env.PUBLIC_SITE_URL);
  const messages = tokens.map((token) =>
    buildNewPostMessage(token, {
      slug,
      title: post.data.title,
      description: post.data.description,
      siteOrigin: site,
    })
  );

  let tickets;
  try {
    tickets = await sendExpoPushMessages(messages);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Expo send failed";
    return json({ error: message }, 502);
  }

  const stale = tokensWithDeviceNotRegistered(tokens, tickets);
  if (stale.length > 0) {
    await db.delete(pushTokens).where(inArray(pushTokens.token, stale));
  }

  return json(
    {
      ok: true,
      sent: tokens.length,
      pruned: stale.length,
    },
    200
  );
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
