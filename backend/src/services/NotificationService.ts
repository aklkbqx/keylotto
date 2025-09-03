import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { db } from '../db';
import { deviceTokens, notifications } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const accessToken = process.env.EXPO_ACCESS_TOKEN;
if (!accessToken) {
    console.warn('[NotificationService] EXPO_ACCESS_TOKEN not configured. Push notifications will not work.');
}

const expo = new Expo({ 
    accessToken: accessToken || undefined
});

interface NotificationData {
    title: string;
    body: string;
    iconName?: string; // ชื่อ ionicon
    data?: Record<string, any>;
    referenceId?: number;
}

class NotificationService {
    public async sendToUser(userId: number, notification: NotificationData, saveToDatabase: boolean = true) {
        try {
            // Get device tokens
            const userDevices = await db.select({
                expoPushToken: deviceTokens.expoPushToken
            })
            .from(deviceTokens)
            .where(and(
                eq(deviceTokens.userId, userId),
            ));

            const tokens = userDevices.map(device => device.expoPushToken);
            let pushResult = null;
            
            // Send push notification if tokens exist
            if (tokens.length > 0) {
                pushResult = await this.sendNotifications(tokens, notification);
            } else {
                // console.log(`[NotificationService] No active device tokens found for user ${userId} - notification will be saved to database only`);
            }

            // Always save to database if requested (regardless of push token availability)
            if (saveToDatabase) {
                try {
                    await db.insert(notifications).values({
                        userId,
                        // referenceId: notification.referenceId || 0,
                        title: notification.title,
                        message: notification.body,
                        iconName: notification.iconName || 'notifications',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
                    // console.log(`[NotificationService] Notification saved to database for user ${userId}`);
                } catch (error) {
                    console.error(`[NotificationService] Failed to save notification to database for user ${userId}:`, error);
                }
            }

            return {
                success: true, // Always return success if database save is successful
                hasExpoPushTokens: tokens.length > 0,
                pushResult,
                message: tokens.length > 0 ? 'Notification sent and saved' : 'Notification saved to database (no push tokens)'
            };
        } catch (error) {
            console.error('[NotificationService] Error sending notification to user:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    public async sendToUsers(userIds: number[], notification: NotificationData, saveToDatabase: boolean = true) {
        try {
            const results = [];
            const chunkSize = 100;
            let totalUsers = 0;
            let usersWithTokens = 0;
            let usersWithoutTokens = 0;
            let failedUsers = 0;

            for (let i = 0; i < userIds.length; i += chunkSize) {
                const chunk = userIds.slice(i, i + chunkSize);
                const promises = chunk.map(userId => this.sendToUser(userId, notification, saveToDatabase));
                const chunkResults = await Promise.all(promises);
                results.push(...chunkResults);
            }

            // Count results
            results.forEach(result => {
                if (result.success) {
                    totalUsers++;
                    if (result.hasExpoPushTokens) {
                        usersWithTokens++;
                    } else {
                        usersWithoutTokens++;
                    }
                } else {
                    failedUsers++;
                }
            });

            return {
                success: true,
                results,
                summary: {
                    totalUsers,
                    usersWithTokens,
                    usersWithoutTokens,
                    failedUsers,
                    message: `Sent to ${usersWithTokens} users with push tokens, saved to ${usersWithoutTokens} users without tokens${failedUsers > 0 ? `, ${failedUsers} failed` : ''}`
                }
            };
        } catch (error) {
            console.error('[NotificationService] Error sending notifications to multiple users:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async sendNotifications(tokens: string[], notification: NotificationData) {
        try {
            if (!accessToken) {
                console.warn('[NotificationService] Cannot send notifications - EXPO_ACCESS_TOKEN not configured');
                return {
                    success: false,
                    message: 'EXPO_ACCESS_TOKEN not configured'
                };
            }
            
            const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
            if (validTokens.length === 0) {
                return {
                    success: false,
                    message: 'No valid tokens found'
                };
            }
            
            const messages: ExpoPushMessage[] = validTokens.map(token => ({
                to: token,
                sound: 'default',
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                priority: 'high',
                badge: 1,
                // Add settings for faster delivery
                channelId: 'default',
                categoryId: 'chat',
                // Use immediate delivery for chat messages
                ...(notification.data?.type === 'chat_message' && {
                    priority: 'high',
                    sound: 'default',
                    badge: 1
                })
            }));
            
            const chunks = expo.chunkPushNotifications(messages);
            
            // Send all chunks in parallel for maximum speed
            const chunkPromises = chunks.map(async (chunk) => {
                try {
                    return await expo.sendPushNotificationsAsync(chunk);
                } catch (error) {
                    console.error('[NotificationService] Error sending chunk:', error);
                    return [];
                }
            });
            
            const allTickets = await Promise.all(chunkPromises);
            const tickets = allTickets.flat();
            
            const successCount = tickets.filter(ticket => ticket.status === 'ok').length;
            
            return {
                success: successCount > 0,
                tickets,
                successCount,
                totalSent: validTokens.length
            };
        } catch (error) {
            console.error('[NotificationService] Error sending notifications:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

export default new NotificationService(); 