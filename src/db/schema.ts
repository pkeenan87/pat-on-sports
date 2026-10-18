import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postSlug: text("post_slug").notNull(),
    parentId: uuid("parent_id"),
    authorName: text("author_name").notNull(),
    authorEmailHash: text("author_email_hash"),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    isAuthor: boolean("is_author").notNull().default(false),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    reportCount: integer("report_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "comments_status_check",
      sql`${table.status} IN ('pending', 'approved', 'spam', 'deleted')`
    ),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "comments_parent_id_fkey",
    }).onDelete("cascade"),
    index("comments_post_idx").on(
      table.postSlug,
      table.status,
      table.createdAt
    ),
  ]
);

/**
 * Single-use hashes for email approve/reject links.
 * Existing comment rows are not modified: approved comments stay approved.
 */
export const commentModerationTokens = pgTable(
  "comment_moderation_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: uuid("comment_id").notNull(),
    action: text("action").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "comment_moderation_tokens_action_check",
      sql`${table.action} IN ('approve', 'reject')`
    ),
    foreignKey({
      columns: [table.commentId],
      foreignColumns: [comments.id],
      name: "comment_moderation_tokens_comment_id_fkey",
    }).onDelete("cascade"),
    uniqueIndex("comment_moderation_tokens_hash_uq").on(table.tokenHash),
    index("comment_moderation_tokens_expires_idx").on(table.expiresAt),
  ]
);

export const trustedCommenters = pgTable("trusted_commenters", {
  emailHash: text("email_hash").primaryKey(),
  approvedAt: timestamp("approved_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const blockedCommenters = pgTable("blocked_commenters", {
  emailHash: text("email_hash"),
  ipHash: text("ip_hash"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

export const pushTokens = pgTable(
  "push_tokens",
  {
    token: text("token").primaryKey(),
    platform: text("platform").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeen: timestamp("last_seen", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "push_tokens_platform_check",
      sql`${table.platform} IN ('ios', 'android', 'web')`
    ),
  ]
);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;
