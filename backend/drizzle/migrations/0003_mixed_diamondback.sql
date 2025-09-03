ALTER TABLE "funny_messages" DROP CONSTRAINT "funny_messages_type_check";--> statement-breakpoint
ALTER TABLE "funny_messages_usage" DROP CONSTRAINT "funny_messages_usage_type_check";--> statement-breakpoint
ALTER TABLE "lottery_checks" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."lottery_check_status";--> statement-breakpoint
CREATE TYPE "public"."lottery_check_status" AS ENUM('win', 'near', 'miss');--> statement-breakpoint
ALTER TABLE "lottery_checks" ALTER COLUMN "status" SET DATA TYPE "public"."lottery_check_status" USING "status"::"public"."lottery_check_status";--> statement-breakpoint
ALTER TABLE "funny_messages" ADD CONSTRAINT "funny_messages_type_check" CHECK ("type" in ('win','near','miss'));--> statement-breakpoint
ALTER TABLE "funny_messages_usage" ADD CONSTRAINT "funny_messages_usage_type_check" CHECK ("type" in ('win','near','miss'));