import type { APIRoute } from "astro";
import { getDb } from "../../../db";
import { pushTokens } from "../../../db/schema";
import { clientIpFromHeaders, hashIp } from "../../../lib/comments/hash";
import { rateLimit } from "../../../lib/comments/rateLimit";
import { registerPushSchema } from "../../../lib/push";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = registerPushSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid input" }, 400);
  }

  let ipHash: string;
  try {
    ipHash = hashIp(clientIpFromHeaders(request.headers));
  } catch {
    return json({ error: "Server misconfigured" }, 500);
  }

  const limited = await rateLimit(`push-register:${ipHash}`, 20);
  if (!limited.allowed) {
    return json({ error: "Rate limit exceeded" }, 429);
  }

  const { token, platform } = parsed.data;
  const now = new Date();
  const db = getDb();

  await db
    .insert(pushTokens)
    .values({
      token,
      platform,
      createdAt: now,
      lastSeen: now,
    })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: {
        platform,
        lastSeen: now,
      },
    });

  return json({ ok: true }, 200);
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
