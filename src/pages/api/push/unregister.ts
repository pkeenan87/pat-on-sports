import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { pushTokens } from "../../../db/schema";
import { clientIpFromHeaders, hashIp } from "../../../lib/comments/hash";
import { rateLimit } from "../../../lib/comments/rateLimit";
import { unregisterPushSchema } from "../../../lib/push";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = unregisterPushSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid input" }, 400);
  }

  let ipHash: string;
  try {
    ipHash = hashIp(clientIpFromHeaders(request.headers));
  } catch {
    return json({ error: "Server misconfigured" }, 500);
  }

  const limited = await rateLimit(`push-unregister:${ipHash}`, 20);
  if (!limited.allowed) {
    return json({ error: "Rate limit exceeded" }, 429);
  }

  const db = getDb();
  await db.delete(pushTokens).where(eq(pushTokens.token, parsed.data.token));

  return json({ ok: true }, 200);
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
