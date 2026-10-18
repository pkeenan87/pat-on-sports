import { checkOriginOrReferer } from "./origin";
import {
  consumeActionToken,
  previewActionToken,
  type CommentModerationAction,
  type TokenStore,
} from "./actionToken";
import { applyCommentModeration } from "./applyModeration";
import { dbTokenStore } from "./moderationTokens";
import {
  htmlResponse,
  renderConfirmPage,
  renderResultPage,
  resultRedirect,
  toPublicResult,
  type ModerationCommentView,
} from "./moderationPage";

export type ModerationDeps = {
  secret: () => string | undefined;
  now: () => number;
  store: () => TokenStore;
  loadComment: (id: string) => Promise<ModerationCommentView | null>;
  apply: (
    commentId: string,
    action: CommentModerationAction
  ) => Promise<"applied" | "missing">;
};

function approvalSecret(): string | undefined {
  const value = process.env.COMMENT_APPROVAL_SECRET?.trim();
  if (!value || value.length < 16) return undefined;
  return value;
}

export const defaultModerationDeps: ModerationDeps = {
  secret: approvalSecret,
  now: () => Date.now(),
  store: () => dbTokenStore(),
  loadComment: async () => {
    throw new Error("loadComment is provided by the page");
  },
  apply: applyCommentModeration,
};

/**
 * GET shows a confirmation form. It never approves or rejects.
 * Mail-client and CDN prefetchers only issue GET.
 */
export async function moderationGet(
  request: Request,
  deps: ModerationDeps
): Promise<Response> {
  const secret = deps.secret();
  if (!secret) return htmlResponse(renderResultPage("error"), 500);

  const token = new URL(request.url).searchParams.get("token") ?? "";
  try {
    const preview = await previewActionToken({
      token,
      now: deps.now(),
      secret,
      store: deps.store(),
    });
    if (!preview.ok) {
      return htmlResponse(renderResultPage(toPublicResult(preview.reason)));
    }
    const comment = await deps.loadComment(preview.commentId);
    if (!comment) return htmlResponse(renderResultPage("missing"));
    return htmlResponse(
      renderConfirmPage({ token, action: preview.action, comment })
    );
  } catch (err) {
    console.error("comment moderation preview failed", err);
    return htmlResponse(renderResultPage("error"), 500);
  }
}

/** POST is the only request that changes a comment. */
export async function moderationPost(
  request: Request,
  deps: ModerationDeps
): Promise<Response> {
  if (!checkOriginOrReferer(request)) {
    return new Response("Invalid origin", {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const secret = deps.secret();
  if (!secret) return resultRedirect("error");

  let token = "";
  try {
    const form = await request.formData();
    token = String(form.get("token") ?? "");
  } catch {
    return resultRedirect("invalid");
  }

  try {
    const consumed = await consumeActionToken({
      token,
      now: deps.now(),
      secret,
      store: deps.store(),
    });
    if (!consumed.ok) return resultRedirect(toPublicResult(consumed.reason));
    const applied = await deps.apply(consumed.commentId, consumed.action);
    if (applied === "missing") return resultRedirect("missing");
    return resultRedirect(consumed.action === "approve" ? "approved" : "rejected");
  } catch (err) {
    console.error("comment moderation failed", err);
    return resultRedirect("error");
  }
}
