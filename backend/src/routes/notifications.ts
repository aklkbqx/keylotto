import { Elysia, t } from "elysia";
import { db } from '../db';
import { notifications, deviceTokens, userSettings } from '../../drizzle/schema';
import type { UserSettingsProps } from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { derive_middleware } from "../middleware";
import { jwt } from '@elysiajs/jwt';
import { JWT_SECRET } from "../utils";
// import notificationService from "../services/NotificationService";

const app = new Elysia({ prefix: "/notifications" })
    .use(jwt({ name: 'jwt', secret: JWT_SECRET }))
    .derive(derive_middleware)

    // Register device token - Enhanced version to prevent duplicates with UPSERT
    .post('/register-device', async ({ user, body, set }) => {
        try {
            const { expoPushToken, deviceInfo } = body;
            if (!expoPushToken) {
                set.status = 400;
                return { success: false, message: "expoPushToken is required" };
            }

            // Use database transaction to ensure atomicity
            return await db.transaction(async (tx) => {
                // First, try to insert the new token
                const insertResult = await tx.insert(deviceTokens).values({
                    userId: user.id,
                    expoPushToken,
                    deviceInfo: deviceInfo || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }).onConflictDoNothing().returning();

                if (insertResult.length > 0) {
                    // Delete any other tokens for this user (except this one)
                    await tx.delete(deviceTokens)
                        .where(and(
                            eq(deviceTokens.userId, user.id),
                            sql`${deviceTokens.expoPushToken} != ${expoPushToken}`
                        ));

                    // Delete this token if it exists for other users
                    await tx.delete(deviceTokens)
                        .where(and(
                            eq(deviceTokens.expoPushToken, expoPushToken),
                            sql`${deviceTokens.userId} != ${user.id}`
                        ));

                    return { 
                        success: true, 
                        message: 'Device token registered successfully',
                        action: 'created'
                    };
                } else {
                    // Token already exists, update it
                    const updateResult = await tx.update(deviceTokens)
                        .set({
                            deviceInfo: deviceInfo || null,
                            updatedAt: new Date().toISOString()
                        })
                        .where(and(
                            eq(deviceTokens.userId, user.id),
                            eq(deviceTokens.expoPushToken, expoPushToken)
                        ))
                        .returning();

                    if (updateResult.length > 0) {
                        return { 
                            success: true, 
                            message: 'Device token already exists, updated successfully',
                            action: 'updated'
                        };
                    } else {
                        // Token exists but for different user, handle conflict
                        await tx.delete(deviceTokens)
                            .where(eq(deviceTokens.expoPushToken, expoPushToken));

                        // Re-insert for current user
                        await tx.insert(deviceTokens).values({
                            userId: user.id,
                            expoPushToken,
                            deviceInfo: deviceInfo || null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });

                        return { 
                            success: true, 
                            message: 'Device token transferred and registered successfully',
                            action: 'transferred'
                        };
                    }
                }
            });
        } catch (e) {
            console.error('Register device token error:', e);
            set.status = 500;
            return { success: false, message: "Register device token failed" };
        }
    }, {
        body: t.Object({
            expoPushToken: t.String(),
            deviceInfo: t.Optional(t.String())
        })
    })
    // Get all notifications (with pagination)
    .get('/', async ({ user, query, set }) => {
        try {
            const page = parseInt(query.page || '1');
            const limit = parseInt(query.limit || '20');
            const offset = (page - 1) * limit;

            const notificationList = await db.select().from(notifications)
                .where(eq(notifications.userId, user.id))
                .orderBy(desc(notifications.createdAt))
                .limit(limit)
                .offset(offset);

            const totalResult = await db.select({ count: sql`COUNT(*)`.as('count') })
                .from(notifications)
                .where(eq(notifications.userId, user.id));
            const total = Number(totalResult[0]?.count || 0);

            return {
                success: true,
                notifications: notificationList,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "Fetch notifications failed" };
        }
    }, {
        query: t.Object({
            page: t.Optional(t.String()),
            limit: t.Optional(t.String())
        })
    })

    // Get unread count
    .get('/unread-count', async ({ user, set }) => {
        try {
            const result = await db.select({ count: sql`COUNT(*)`.as('count') })
                .from(notifications)
                .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
            return { success: true, count: Number(result[0]?.count || 0) };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "Fetch unread count failed" };
        }
    })

    // Mark as read
    .put('/:id/read', async ({ user, params, set }) => {
        try {
            const updated = await db.update(notifications)
                .set({ isRead: true, updatedAt: new Date().toISOString() })
                .where(and(eq(notifications.id, parseInt(params.id)), eq(notifications.userId, user.id)))
                .returning();
            if (updated.length === 0) {
                set.status = 404;
                return { success: false, message: "Notification not found" };
            }
            return { success: true, data: updated[0] };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "Mark as read failed" };
        }
    })

    // Mark all as read
    .put('/read-all', async ({ user, set }) => {
        try {
            const updated = await db.update(notifications)
                .set({ isRead: true, updatedAt: new Date().toISOString() })
                .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
                .returning();
            return { success: true, updatedCount: updated.length };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "Mark all as read failed" };
        }
    })

    // Delete notification
    .delete('/:id', async ({ user, params, set }) => {
        try {
            const deleted = await db.delete(notifications)
                .where(and(eq(notifications.id, parseInt(params.id)), eq(notifications.userId, user.id)))
                .returning();
            if (deleted.length === 0) {
                set.status = 404;
                return { success: false, message: "Notification not found" };
            }
            return { success: true, message: "Deleted" };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "Delete failed" };
        }
    })

    // Get notification settings
    .get('/settings', async ({ user, set }) => {
        try {
            let settings = await db.select().from(userSettings)
                .where(eq(userSettings.userId, user.id))
                .limit(1);

            // Create default settings if not exists
            if (settings.length === 0) {
                const defaultSettings: UserSettingsProps = {
                    notificationSetting: {
                        notificationsEnabled: true,
                        soundEnabled: true,
                        vibrationEnabled: true
                    }
                };

                try {
                    const created = await db.insert(userSettings).values({
                        userId: user.id,
                        settings: defaultSettings,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }).onConflictDoNothing().returning();

                    // If onConflictDoNothing returned empty array, means conflict occurred
                    // So fetch the existing settings instead
                    if (created.length === 0) {
                        settings = await db.select().from(userSettings)
                            .where(eq(userSettings.userId, user.id))
                            .limit(1);
                    } else {
                        settings = created;
                    }
                } catch (insertError) {
                    // In case onConflictDoNothing doesn't work as expected, fallback to fetch
                    console.warn('Insert conflict, fetching existing settings:', insertError);
                    settings = await db.select().from(userSettings)
                        .where(eq(userSettings.userId, user.id))
                        .limit(1);
                }
            }

            return {
                success: true,
                settings: settings[0]
            };
        } catch (e) {
            console.error('Get notification settings error:', e);
            set.status = 500;
            return { success: false, message: "Get notification settings failed" };
        }
    })

    // Update notification settings
    .put('/settings', async ({ user, body, set }) => {
        try {
            const { settings } = body as { settings?: UserSettingsProps };

            if (settings && (!settings.notificationSetting ||
                typeof settings.notificationSetting.notificationsEnabled !== 'boolean' ||
                typeof settings.notificationSetting.soundEnabled !== 'boolean' ||
                typeof settings.notificationSetting.vibrationEnabled !== 'boolean')) {
                set.status = 400;
                return { success: false, message: 'Invalid settings payload' };
            }

            const updateData: any = {
                updatedAt: new Date().toISOString()
            };

            if (settings) updateData.settings = settings;

            // Use upsert pattern to avoid race condition
            const defaultSettings: UserSettingsProps = {
                notificationSetting: {
                    notificationsEnabled: true,
                    soundEnabled: true,
                    vibrationEnabled: true
                }
            };

            // Try to insert first (handles case where settings don't exist)
            const insertResult = await db.insert(userSettings).values({
                userId: user.id,
                settings: settings || defaultSettings,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }).onConflictDoNothing().returning();

            let result;
            if (insertResult.length > 0) {
                // Successfully inserted new settings
                result = insertResult;
            } else {
                // Settings already exist, update them
                result = await db.update(userSettings)
                    .set(updateData)
                    .where(eq(userSettings.userId, user.id))
                    .returning();
            }

            return {
                success: true,
                data: result[0],
                message: "Settings updated successfully"
            };
        } catch (e) {
            console.error('Update notification settings error:', e);
            set.status = 500;
            return { success: false, message: "Update notification settings failed" };
        }
    }, {
        body: t.Object({
            settings: t.Optional(t.Object({
                notificationSetting: t.Object({
                    notificationsEnabled: t.Boolean(),
                    soundEnabled: t.Boolean(),
                    vibrationEnabled: t.Boolean()
                })
            }))
        })
    })

    // Reset notification settings to default
    .post('/settings/reset', async ({ user, set }) => {
        try {
            const defaultSettings: UserSettingsProps = {
                notificationSetting: {
                    notificationsEnabled: true,
                    soundEnabled: true,
                    vibrationEnabled: true
                }
            };

            const result = await db.update(userSettings)
                .set({
                    settings: defaultSettings,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(userSettings.userId, user.id))
                .returning();

            if (result.length === 0) {
                // Create if not exists (use onConflictDoNothing to avoid duplicate key error)
                try {
                    const created = await db.insert(userSettings).values({
                        userId: user.id,
                        settings: defaultSettings,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }).onConflictDoNothing().returning();

                    if (created.length > 0) {
                        return {
                            success: true,
                            data: created[0],
                            message: "Settings reset to default successfully"
                        };
                    } else {
                        // Conflict occurred, fetch the existing record
                        const existing = await db.select().from(userSettings)
                            .where(eq(userSettings.userId, user.id))
                            .limit(1);
                        
                        return {
                            success: true,
                            data: existing[0],
                            message: "Settings already exist, fetched existing"
                        };
                    }
                } catch (insertError) {
                    // Fallback to fetch existing
                    console.warn('Insert conflict in reset, fetching existing:', insertError);
                    const existing = await db.select().from(userSettings)
                        .where(eq(userSettings.userId, user.id))
                        .limit(1);
                    
                    return {
                        success: true,
                        data: existing[0],
                        message: "Settings fetched successfully"
                    };
                }
            }

            return {
                success: true,
                data: result[0],
                message: "Settings reset to default successfully"
            };
        } catch (e) {
            console.error('Reset notification settings error:', e);
            set.status = 500;
            return { success: false, message: "Reset notification settings failed" };
        }
    })

    // Unregister device token
    .post('/unregister-device', async ({ user, body, set }) => {
        try {
            const { expoPushToken } = body;

            // If no token provided, delete all tokens for this user
            if (!expoPushToken) {
                await db.delete(deviceTokens)
                    .where(eq(deviceTokens.userId, user.id));
                
                return {
                    success: true,
                    message: "All device tokens removed successfully"
                };
            }

            // Delete specific token
            const result = await db.delete(deviceTokens)
                .where(and(
                    eq(deviceTokens.userId, user.id),
                    eq(deviceTokens.expoPushToken, expoPushToken)
                ))
                .returning();

            if (result.length > 0) {
                return { 
                    success: true, 
                    message: 'Device token deleted successfully'
                };
            } else {
                return { 
                    success: true, 
                    message: 'Device token already deleted'
                };
            }
        } catch (error) {
            console.error('Unregister device token error:', error);
            set.status = 500;
            return { success: false, message: "Failed to unregister device token" };
        }
    }, {
        body: t.Object({
            expoPushToken: t.Optional(t.String())
        })
    });

export default app;