ALTER TABLE "lottery_checks" ADD COLUMN "source" varchar(10) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "lottery_checks" ADD COLUMN "raw_qr_text" text;--> statement-breakpoint
ALTER TABLE "lottery_checks" ADD COLUMN "ticket_image" varchar(255);