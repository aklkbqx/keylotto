// backend/drizzle/migrations/schema.ts
import { pgTable, unique, serial, varchar, timestamp, integer, pgEnum, json, boolean, text, index, foreignKey, check, date, time } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userAccountStatusEnum = pgEnum("user_account_status_enum", ['active', 'suspended', 'deleted', 'banned']);
export const userRoles = pgEnum("user_roles", ['user','admin']);

type AccountStatusType = {
	readonly status: typeof userAccountStatusEnum.enumValues[number];
	readonly reason?: string;
	readonly actionAt?: string;
	readonly lastStatusChange: string;
}

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	firstname: varchar({ length: 150 }).notNull(),
	lastname: varchar({ length: 150 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }),
	passwordHash: varchar("password_hash", { length: 120 }).notNull(),
	profileImage: varchar("profile_image", { length: 255 }).default('default-profile.png').notNull(),
	role: userRoles("role").notNull().default("user"),
	accountStatus: json("account_status").$type<AccountStatusType>().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_email_key").on(table.email),
]);

export const deviceTokens = pgTable("device_tokens", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	expoPushToken: varchar("expo_push_token", { length: 255 }).notNull(),
	deviceInfo: text("device_info"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_device_tokens_push_token").using("btree", table.expoPushToken.asc().nullsLast().op("text_ops")),
	index("idx_device_tokens_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "device_tokens_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	unique("device_tokens_push_token_unique").on(table.expoPushToken),
]);

export interface UserSettingsProps {
    notificationSetting: {
        notificationsEnabled: boolean;
        soundEnabled: boolean;
        vibrationEnabled: boolean;
    }
}

// User settings table
export const userSettings = pgTable("user_settings", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	settings: json("notification_settings").$type<UserSettingsProps>().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("user_settings_user_id_key").on(table.userId),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_settings_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export interface ReferenceNotificationType {
    id: number;
    tablename: string;
}

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	reference: integer("reference_id").$type<ReferenceNotificationType>(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	iconName: varchar("icon_name", { length: 50 }).default('notifications').notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "notifications_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

// =============================================
// Lottery domain tables
// =============================================

export const lotteryCheckStatus = pgEnum("lottery_check_status", ['win', 'near', 'miss']);

export const lotteryResults = pgTable("lottery_results", {
	id: serial().primaryKey().notNull(),
	drawDate: date("draw_date").notNull(),
	firstPrize: varchar("first_prize", { length: 6 }).notNull(),
	front3Digits: json("front3_digits").$type<string[]>().notNull(),
	back3Digits: json("back3_digits").$type<string[]>().notNull(),
	last2Digits: varchar("last_2_digits", { length: 2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("lottery_results_draw_date_key").on(table.drawDate),
]);

export const lotteryChecks = pgTable("lottery_checks", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	drawDate: date("draw_date").notNull(),
	ticketNumber: varchar("ticket_number", { length: 6 }).notNull(),
	status: lotteryCheckStatus("status").notNull(),
	detail: json("detail"),
	// Phase 2 fields
	ticketImage: varchar("ticket_image", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_lottery_checks_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "lottery_checks_user_id_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

export const funnyMessages = pgTable("funny_messages", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 10 }).notNull(),
	text: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	check("funny_messages_type_check", sql`"type" in ('win','near','miss')`),
	index("idx_funny_messages_type").using("btree", table.type.asc().nullsLast()),
]);

// Track which messages a user has seen to avoid repetition until all are used
export const funnyMessagesUsage = pgTable("funny_messages_usage", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	messageId: integer("message_id").notNull(),
	type: varchar({ length: 10 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	check("funny_messages_usage_type_check", sql`"type" in ('win','near','miss')`),
	index("idx_funny_usage_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("idx_funny_usage_type").using("btree", table.type.asc().nullsLast()),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "funny_messages_usage_user_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.messageId],
		foreignColumns: [funnyMessages.id],
		name: "funny_messages_usage_message_id_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	unique("funny_usage_user_message_unique").on(table.userId, table.messageId),
]);