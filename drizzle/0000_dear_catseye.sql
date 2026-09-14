CREATE TABLE "blocked_commenters" (
	"email_hash" text,
	"ip_hash" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_slug" text NOT NULL,
	"parent_id" uuid,
	"author_name" text NOT NULL,
	"author_email_hash" text,
	"body" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_author" boolean DEFAULT false NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"report_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "comments_status_check" CHECK ("comments"."status" IN ('pending', 'approved', 'spam', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trusted_commenters" (
	"email_hash" text PRIMARY KEY NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("post_slug","status","created_at");