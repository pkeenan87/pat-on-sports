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

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
