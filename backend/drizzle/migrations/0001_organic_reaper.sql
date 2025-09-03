CREATE TABLE "funny_messages_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message_id" integer NOT NULL,
	"type" "funny_message_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "funny_usage_user_message_unique" UNIQUE("user_id","message_id")
);
--> statement-breakpoint
DROP INDEX "idx_funny_messages_type";--> statement-breakpoint
ALTER TABLE "funny_messages_usage" ADD CONSTRAINT "funny_messages_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "funny_messages_usage" ADD CONSTRAINT "funny_messages_usage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."funny_messages"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_funny_usage_user_id" ON "funny_messages_usage" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_funny_usage_type" ON "funny_messages_usage" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_funny_messages_type" ON "funny_messages" USING btree ("type");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "birth_date";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "birth_time";