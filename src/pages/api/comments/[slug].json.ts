import type { APIRoute } from "astro";
import { getApprovedCommentTree } from "../../../lib/comments/service";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const tree = await getApprovedCommentTree(slug);
    return new Response(JSON.stringify({ comments: tree }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("GET comments failed", err);
    return new Response(JSON.stringify({ error: "Unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
