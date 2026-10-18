-- One-time approve/reject links for comment notification emails.
-- Does not change comments.status. Existing rows stay as they are
-- (approved comments remain approved; new comments still default to pending).
CREATE TABLE "comment_moderation_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"action" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_moderation_tokens_action_check" CHECK ("comment_moderation_tokens"."action" IN ('approve', 'reject'))
);
--> statement-breakpoint
ALTER TABLE "comment_moderation_tokens" ADD CONSTRAINT "comment_moderation_tokens_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "comment_moderation_tokens_hash_uq" ON "comment_moderation_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "comment_moderation_tokens_expires_idx" ON "comment_moderation_tokens" USING btree ("expires_at");