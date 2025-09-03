CREATE TYPE "public"."funny_message_type" AS ENUM('win', 'near', 'lose');--> statement-breakpoint
CREATE TYPE "public"."lottery_check_status" AS ENUM('win', 'near', 'lose');--> statement-breakpoint
CREATE TYPE "public"."user_account_status_enum" AS ENUM('active', 'suspended', 'deleted', 'banned');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('user');--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expo_push_token" varchar(255) NOT NULL,
	"device_info" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone,
	CONSTRAINT "device_tokens_push_token_unique" UNIQUE("expo_push_token")
);
--> statement-breakpoint
CREATE TABLE "funny_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "funny_message_type" NOT NULL,
	"text" text NOT NULL,
	"locale" varchar(10) DEFAULT 'th' NOT NULL,
	"weight" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "lottery_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"draw_date" date NOT NULL,
	"ticket_number" varchar(6) NOT NULL,
	"status" "lottery_check_status" NOT NULL,
	"detail" json,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "lottery_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"draw_date" date NOT NULL,
	"first_prize" varchar(6) NOT NULL,
	"front3_digits" json NOT NULL,
	"back3_digits" json NOT NULL,
	"last_2_digits" varchar(2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "lottery_results_draw_date_key" UNIQUE("draw_date")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reference_id" integer,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"icon_name" varchar(50) DEFAULT 'notifications' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"notification_settings" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_settings_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"firstname" varchar(150) NOT NULL,
	"lastname" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(20),
	"birth_date" date,
	"birth_time" time,
	"password_hash" varchar(120) NOT NULL,
	"profile_image" varchar(255) DEFAULT 'default-profile.png' NOT NULL,
	"role" "user_roles" DEFAULT 'user' NOT NULL,
	"account_status" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lottery_checks" ADD CONSTRAINT "lottery_checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_device_tokens_push_token" ON "device_tokens" USING btree ("expo_push_token" text_ops);--> statement-breakpoint
CREATE INDEX "idx_device_tokens_user_id" ON "device_tokens" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_funny_messages_type" ON "funny_messages" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_lottery_checks_user_id" ON "lottery_checks" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id" int4_ops);