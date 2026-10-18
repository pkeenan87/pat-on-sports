import { getEntry } from "astro:content";
import { waitUntil } from "@vercel/functions";
import { siteOrigin } from "../api";
import { buildModerationLinks } from "./actionToken";
import {
  buildCommentNotificationEmail,
  parseNotifyFrom,
  parseNotifyTo,
  sendResendEmail,
} from "./commentEmail";
import { storeModerationTokens } from "./moderationTokens";

export type CommentNotificationInput = {
  commentId: string;
  postSlug: string;
  authorName: string;
  body: string;
  status: "pending" | "approved";
};

const REQUIRED_ENV = [
  "RESEND_API_KEY",
  "COMMENT_NOTIFY_TO",
  "COMMENT_NOTIFY_FROM",
  "COMMENT_APPROVAL_SECRET",
] as const;

function missingNotifyConfig(): string[] {
  return REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
}

export function deferBackground(task: Promise<unknown>): void {
  const guarded = task.catch((err) => {
    console.error("background task failed", err);
  });
  try {
    waitUntil(guarded);
  } catch (err) {
    console.error("waitUntil unavailable", err);
  }
}

async function lookupPostTitle(slug: string): Promise<string> {
  try {
    const post = await getEntry("blog", slug);
    if (post?.data.title) return post.data.title;
  } catch (err) {
    console.error("comment notification post lookup failed", err);
  }
  return slug;
}

export async function deliverCommentNotification(
  input: CommentNotificationInput
): Promise<void> {
  const missing = missingNotifyConfig();
  if (missing.length > 0) {
    console.error(
      `comment notification skipped: missing ${missing.join(", ")}`
    );
    return;
  }

  const secret = process.env.COMMENT_APPROVAL_SECRET?.trim() ?? "";
  if (secret.length < 16) {
    console.error(
      "comment notification skipped: COMMENT_APPROVAL_SECRET is too short"
    );
    return;
  }

  const to = parseNotifyTo(process.env.COMMENT_NOTIFY_TO ?? "");
  const from = parseNotifyFrom(process.env.COMMENT_NOTIFY_FROM ?? "");
  if (!to || !from) {
    console.error(
      "comment notification skipped: COMMENT_NOTIFY_TO or COMMENT_NOTIFY_FROM is invalid"
    );
    return;
  }

  const site = siteOrigin(process.env.PUBLIC_SITE_URL);
  const links = buildModerationLinks({
    commentId: input.commentId,
    secret,
    siteOrigin: site,
  });
  await storeModerationTokens(links.rows);

  const title = await lookupPostTitle(input.postSlug);
  const postUrl = new URL(
    `/blog/${encodeURIComponent(input.postSlug)}`,
    `${site}/`
  ).toString();
  const message = buildCommentNotificationEmail({
    postTitle: title,
    postUrl,
    authorName: input.authorName,
    body: input.body,
    status: input.status,
    approveUrl: links.approveUrl,
    rejectUrl: links.rejectUrl,
  });

  const sent = await sendResendEmail({
    apiKey: process.env.RESEND_API_KEY ?? "",
    from,
    to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  if (sent) {
    console.info("comment notification sent", input.commentId);
  }
}

/**
 * Queue the email after the comment row is saved.
 * Resend errors are logged and do not reject the comment request.
 */
export function scheduleCommentNotification(
  input: CommentNotificationInput,
  run: (input: CommentNotificationInput) => Promise<void> = deliverCommentNotification
): void {
  try {
    const task = Promise.resolve().then(() => run(input));
    deferBackground(task);
  } catch (err) {
    console.error("comment notification failed to schedule", err);
  }
}
