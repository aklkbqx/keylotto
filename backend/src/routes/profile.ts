// backend/src/routes/profile.ts
import { Elysia, t } from "elysia";
import { db } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { derive_middleware } from '../middleware';
import jwt from '@elysiajs/jwt';
import { JWT_SECRET } from '../utils';
import { unlink } from "node:fs/promises";
import { existsSync } from "node:fs";

const app = new Elysia({ prefix: "profile" })
    .use(jwt({ name: 'jwt', secret: JWT_SECRET }))
    .derive(derive_middleware)
    .get('/me', async ({ user, set }) => {
        try {
            const inactiveStatuses = ["deleted", "suspended", "banned"] as const;
            if (inactiveStatuses.includes(user.accountStatus.status as "deleted" | "suspended" | "banned")) {
                set.status = 401;
                return { success: false, message: user.accountStatus };
            }
            return {
                success: true,
                message: "ดึงข้อมูลผู้ใช้สำเร็จ",
                user
            };
        } catch (error) {
            set.status = 500;
            return { success: false, message: `เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน` };
        }
    })
    .put('/', async ({ user, request, set }) => {
        if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
            set.status = 400;
            return { success: false, message: "Content type must be multipart/form-data" };
        }

        try {
            const form = await request.formData();
            const firstname = form.get("firstname") as string | null;
            const lastname = form.get("lastname") as string | null;
            const email = form.get("email") as string | null;
            const phoneNumber = form.get("phone_number") as string | null;
            const currentPassword = form.get("currentPassword") as string | null;
            const newPassword = form.get("newPassword") as string | null;
            const profileImageFile = form.get("profile_image"); // File or null

            let updateData: any = {};
            let profileImageName: string | undefined;

            // Handle profile image upload
            if (profileImageFile && profileImageFile instanceof File) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(profileImageFile.type)) {
                    set.status = 400;
                    return { success: false, message: "รองรับเฉพาะไฟล์ JPEG, PNG, หรือ WebP เท่านั้น" };
                }

                if (profileImageFile.size > 5 * 1024 * 1024) { // 5MB limit
                    set.status = 400;
                    return { success: false, message: "ขนาดไฟล์ต้องไม่เกิน 5MB" };
                }

                // ลบรูปเก่าก่อน (ถ้าไม่ใช่ default-profile.png)
                if (user.profileImage && user.profileImage !== "default-profile.png") {
                    const oldFilePath = `public/images/user_images/${user.profileImage}`;
                    if (existsSync(oldFilePath)) {
                        await unlink(oldFilePath);
                    }
                }

                const timestamp = Date.now();
                const extension = profileImageFile.name.split('.').pop();
                profileImageName = `profile_${user.id}_${timestamp}.${extension}`;

                const buffer = await profileImageFile.arrayBuffer();
                await Bun.write(`public/images/user_images/${profileImageName}`, buffer);
                updateData.profileImage = profileImageName;
            }

            // Update basic information
            if (firstname) updateData.firstname = firstname;
            if (lastname) updateData.lastname = lastname;
            if (email) updateData.email = email;
            if (phoneNumber) updateData.phoneNumber = phoneNumber;

            // Handle password change
            if (currentPassword && newPassword) {
                const isValidPassword = await Bun.password.verify(currentPassword, user.passwordHash);
                if (!isValidPassword) {
                    set.status = 400;
                    return { success: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
                }
                updateData.passwordHash = await Bun.password.hash(newPassword);
            }

            if (Object.keys(updateData).length === 0) {
                return { success: false, message: "ไม่มีข้อมูลที่ต้องอัปเดต" };
            }

            updateData.updatedAt = new Date().toISOString();

            const [updatedUser] = await db.update(users)
                .set(updateData)
                .where(eq(users.id, user.id))
                .returning();

            return {
                success: true,
                message: "อัปเดตข้อมูลสำเร็จ",
                user: updatedUser
            };
        } catch (error) {
            set.status = 500;
            return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", error };
        }
    })
    .delete('/account', async ({ user, set }) => {
        try {
            const [deletedUser] = await db.update(users)
                .set({
                    accountStatus: {
                        status: "deleted",
                        reason: "User requested account deletion",
                        actionAt: new Date().toISOString(),
                        lastStatusChange: new Date().toISOString()
                    },
                    updatedAt: new Date().toISOString()
                })
                .where(eq(users.id, user.id))
                .returning();

            return {
                success: true,
                message: "ลบบัญชีสำเร็จ",
                user: deletedUser
            };
        } catch (error) {
            set.status = 500;
            return { success: false, message: "เกิดข้อผิดพลาดในการลบบัญชี", error };
        }
    });

export default app;