ALTER TABLE "funny_messages" ALTER COLUMN "type" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "funny_messages_usage" ALTER COLUMN "type" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "funny_messages" DROP COLUMN "locale";--> statement-breakpoint
ALTER TABLE "funny_messages" DROP COLUMN "weight";--> statement-breakpoint
ALTER TABLE "funny_messages" ADD CONSTRAINT "funny_messages_type_check" CHECK ("type" in ('win','near'));--> statement-breakpoint
ALTER TABLE "funny_messages_usage" ADD CONSTRAINT "funny_messages_usage_type_check" CHECK ("type" in ('win','near'));--> statement-breakpoint
DROP TYPE "public"."funny_message_type";