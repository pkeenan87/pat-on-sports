import type { APIRoute } from "astro";
import {
  tagSharedCommentRead,
  withSharedCommentCacheTag,
} from "../../../lib/comments/commentCache";
import { decideCommentRead } from "../../../lib/comments/readCache";
import { getApprovedCommentTree } from "../../../lib/comments/service";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) {
    return json({ error: "Missing slug" }, 400, {
      "Cache-Control": "private, no-store",
    });
  }

  const fresh = new URL(request.url).searchParams.get("fresh");
  const decision = decideCommentRead({
    fresh,
    userAgent: request.headers.get("user-agent"),
  });

  if (decision.type === "redirect") {
    return new Response(null, {
      status: 307,
      headers: {
        Location: `/api/comments/${encodeURIComponent(slug)}.json`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const headers =
    decision.type === "query"
      ? withSharedCommentCacheTag(decision.headers, slug, decision.bypass)
      : decision.headers;

  if (decision.type === "query") {
    await tagSharedCommentRead(slug, decision.bypass);
  }

  if (decision.type === "empty") {
    return json({ comments: [] }, 200, headers);
  }

  try {
    const tree = await getApprovedCommentTree(slug);
    return json({ comments: tree }, 200, headers);
  } catch (err) {
    console.error("GET comments failed", err);
    return json({ error: "Unavailable" }, 503, {
      "Cache-Control": "private, no-store",
    });
  }
};

function json(
  data: unknown,
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
