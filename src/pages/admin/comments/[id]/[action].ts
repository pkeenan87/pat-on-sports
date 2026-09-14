import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  blockedCommenters,
  comments,
  trustedCommenters,
} from "../../../../db/schema";
import { requireAdminForm } from "../../../../lib/comments/adminAuth";

export const prerender = false;

async function loadComment(id: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  return rows[0] ?? null;
}

function redirectBack() {
  return new Response(null, {
    status: 303,
    headers: { Location: "/admin/comments" },
  });
}

export const POST: APIRoute = async ({ params, request, url }) => {
  const denied = requireAdminForm(request);
  if (denied) return denied;

  const id = params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  const action = url.pathname.split("/").pop();
  const comment = await loadComment(id);
  if (!comment) return new Response("Not found", { status: 404 });

  const db = getDb();
  const now = new Date();

  if (action === "approve") {
    await db
      .update(comments)
      .set({ status: "approved", approvedAt: now, reportCount: 0 })
      .where(eq(comments.id, id));
    if (comment.authorEmailHash) {
      await db
        .insert(trustedCommenters)
        .values({ emailHash: comment.authorEmailHash, approvedAt: now })
        .onConflictDoNothing();
    }
    return redirectBack();
  }

  if (action === "spam") {
    await db
      .update(comments)
      .set({ status: "spam", approvedAt: null })
      .where(eq(comments.id, id));
    return redirectBack();
  }

  if (action === "delete") {
    await db
      .update(comments)
      .set({ status: "deleted", approvedAt: null })
      .where(eq(comments.id, id));
    return redirectBack();
  }

  if (action === "block") {
    await db.insert(blockedCommenters).values({
      emailHash: comment.authorEmailHash,
      ipHash: comment.ipHash,
      reason: "Blocked from admin",
    });
    await db
      .update(comments)
      .set({ status: "spam", approvedAt: null })
      .where(eq(comments.id, id));
    return redirectBack();
  }

  if (action === "reply") {
    const form = await request.formData();
    const body = String(form.get("body") ?? "").trim();
    if (!body || body.length > 2000) {
      return new Response("Invalid reply", { status: 400 });
    }
    await db.insert(comments).values({
      postSlug: comment.postSlug,
      parentId: comment.parentId ?? comment.id,
      authorName: "Pat",
      authorEmailHash: null,
      body,
      status: "approved",
      isAuthor: true,
      ipHash: null,
      userAgent: null,
      approvedAt: now,
    });
    return redirectBack();
  }

  return new Response("Unknown action", { status: 404 });
};
