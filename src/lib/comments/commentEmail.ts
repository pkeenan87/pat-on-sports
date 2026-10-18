import { COMMENT_ACTION_TTL_DAYS } from "./actionToken";
import {
  escapeHtml,
  htmlCommentText,
  plainCommentText,
  singleLine,
} from "./commentText";

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export type CommentNotificationContent = {
  postTitle: string;
  postUrl: string;
  authorName: string;
  body: string;
  status: "pending" | "approved";
  approveUrl: string;
  rejectUrl: string;
};

export type BuiltCommentEmail = {
  subject: string;
  html: string;
  text: string;
};

export function parseNotifyFrom(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) return null;
  const wrapped = trimmed.match(/^(.*?)<([^<>]+)>$/);
  const email = (wrapped ? wrapped[2] : trimmed).trim();
  const name = wrapped ? wrapped[1].trim() : "";
  if (!EMAIL_RE.test(email)) return null;
  if (/[<>]/.test(name)) return null;
  return name ? `${name} <${email}>` : email;
}

export function parseNotifyTo(value: string): string[] | null {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > 10) return null;
  if (parts.some((part) => /[\r\n]/.test(part) || !EMAIL_RE.test(part))) {
    return null;
  }
  return parts;
}

function safeHref(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Refusing non-http link");
  }
  return escapeHtml(url.toString());
}

/**
 * Notification mail. Commenter name and body are plain text: escaped, and
 * broken so mail clients do not turn URLs in the comment into links.
 * The only anchors are the post and the one-time moderation links.
 */
export function buildCommentNotificationEmail(
  input: CommentNotificationContent
): BuiltCommentEmail {
  const title = singleLine(input.postTitle) || "a post";
  const name = htmlCommentText(input.authorName);
  const body = htmlCommentText(input.body);
  const plainName = plainCommentText(singleLine(input.authorName, 200));
  const plainBody = plainCommentText(input.body);
  const postHref = safeHref(input.postUrl);
  const approveHref = safeHref(input.approveUrl);
  const rejectHref = safeHref(input.rejectUrl);
  const pending = input.status !== "approved";
  const statusNote = pending
    ? "This comment is pending and is not public yet."
    : "This comment is already public because this commenter was approved before. You can still reject it.";
  const subject = pending
    ? `New comment awaiting approval: ${title}`
    : `New comment (already public): ${title}`;

  const text = [
    subject,
    statusNote,
    "",
    `Post: ${input.postUrl}`,
    "",
    "--- comment ---",
    `From: ${plainName}`,
    "",
    plainBody,
    "--- end comment ---",
    "",
    "Open a link below, then press the button on the confirmation page.",
    "Opening the link does not approve or reject the comment.",
    `Each link works once and expires in ${COMMENT_ACTION_TTL_DAYS} days.`,
    "",
    `Approve: ${input.approveUrl}`,
    `Reject: ${input.rejectUrl}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="font-family: Georgia, 'Iowan Old Style', serif; color: #0c2340; line-height: 1.45;">
  <p>${escapeHtml(subject)}</p>
  <p>${escapeHtml(statusNote)}</p>
  <p>Post: <a href="${postHref}">${escapeHtml(title)}</a></p>
  <p>From: ${name}</p>
  <pre data-comment-body style="white-space: pre-wrap; font-family: ui-monospace, monospace;">${body}</pre>
  <p>Open a link below, then press the button on the confirmation page. Opening the link does not approve or reject the comment. Each link works once and expires in ${COMMENT_ACTION_TTL_DAYS} days.</p>
  <p><a href="${approveHref}">Approve comment</a></p>
  <p><a href="${rejectHref}">Reject comment</a></p>
</body>
</html>`;

  return { subject, html, text };
}

export async function sendResendEmail(input: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error("Resend rejected comment notification", res.status, detail);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request failed", err instanceof Error ? err.message : "error");
    return false;
  }
}
