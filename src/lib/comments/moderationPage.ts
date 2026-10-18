import { escapeHtml } from "./commentText";
import type { CommentModerationAction } from "./actionToken";

export type PublicModerationResult =
  | "approved"
  | "rejected"
  | "expired"
  | "reused"
  | "invalid"
  | "missing"
  | "error";

const COPY: Record<PublicModerationResult, { title: string; body: string }> = {
  approved: {
    title: "Comment approved",
    body: "This comment is approved and public.",
  },
  rejected: {
    title: "Comment rejected",
    body: "This comment was rejected and will not be shown.",
  },
  expired: {
    title: "Link expired",
    body: "This link has expired.",
  },
  reused: {
    title: "Link already used",
    body: "This link was already used.",
  },
  invalid: {
    title: "Invalid link",
    body: "This link is invalid.",
  },
  missing: {
    title: "Comment not found",
    body: "That comment no longer exists.",
  },
  error: {
    title: "Something went wrong",
    body: "Something went wrong, and the comment was not changed.",
  },
};

export function toPublicResult(reason: string): PublicModerationResult {
  if (
    reason === "approved" ||
    reason === "rejected" ||
    reason === "expired" ||
    reason === "reused" ||
    reason === "missing" ||
    reason === "error"
  ) {
    return reason;
  }
  return "invalid";
}

export type ModerationCommentView = {
  authorName: string;
  body: string;
  postSlug: string;
  postTitle: string;
  status: string;
  createdAt: Date;
};

export function moderationSecurityHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "private, no-store",
    "CDN-Cache-Control": "private, no-store",
    "Vercel-CDN-Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  };
}

function pageShell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(title)} | Pat on Sports</title>
  <style>
    body { margin: 0; padding: 1.5rem; background: #f7f5f1; color: #0c2340;
      font-family: system-ui, sans-serif; line-height: 1.45; }
    main { max-width: 40rem; }
    h1 { font-size: 1.5rem; letter-spacing: 0.04em; text-transform: uppercase; }
    pre { white-space: pre-wrap; font: inherit; margin: 0.5rem 0 1rem; }
    button { border: 0; background: #0c2340; color: #fff; font: inherit;
      font-weight: 600; padding: 0.55rem 0.9rem; cursor: pointer; }
    button.reject { background: #c8102e; }
    a { color: #0c2340; }
    .meta { color: #1b3654; font-size: 0.9rem; }
  </style>
</head>
<body>
  <main>
    ${inner}
    <p><a href="/admin/comments">Admin queue</a></p>
  </main>
</body>
</html>`;
}

export function renderResultPage(result: string): string {
  const copy = COPY[toPublicResult(result)];
  return pageShell(
    copy.title,
    `<h1>${escapeHtml(copy.title)}</h1><p>${escapeHtml(copy.body)}</p>`
  );
}

function postHref(slug: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(slug)) return null;
  return `/blog/${slug}`;
}

export function renderConfirmPage(input: {
  token: string;
  action: CommentModerationAction;
  comment: ModerationCommentView;
}): string {
  const approve = input.action === "approve";
  const title = approve ? "Approve this comment?" : "Reject this comment?";
  const button = approve ? "Approve comment" : "Reject comment";
  const href = postHref(input.comment.postSlug);
  const postLabel = escapeHtml(input.comment.postTitle || input.comment.postSlug);
  const post = href
    ? `<a href="${escapeHtml(href)}">${postLabel}</a>`
    : postLabel;
  const when = escapeHtml(
    input.comment.createdAt.toISOString().replace("T", " ").slice(0, 16) + " UTC"
  );
  return pageShell(
    title,
    `<h1>${escapeHtml(title)}</h1>
    <p>Opening this page does not change the comment.</p>
    <p class="meta">On ${post} · ${escapeHtml(input.comment.status)} · ${when}</p>
    <p>From <strong>${escapeHtml(input.comment.authorName)}</strong></p>
    <pre>${escapeHtml(input.comment.body)}</pre>
    <form method="post" action="/comments/moderate">
      <input type="hidden" name="token" value="${escapeHtml(input.token)}" />
      <button type="submit" class="${approve ? "approve" : "reject"}">${escapeHtml(button)}</button>
    </form>`
  );
}

export function resultRedirect(result: PublicModerationResult): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: `/comments/moderate/done?result=${result}`,
      ...moderationSecurityHeaders(),
    },
  });
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: moderationSecurityHeaders(),
  });
}
