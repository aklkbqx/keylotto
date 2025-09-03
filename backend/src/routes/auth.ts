// backend/src/routes/auth.ts
import { Elysia, t } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { jwt } from '@elysiajs/jwt';
import { users, deviceTokens } from '../../drizzle/schema';
import { JWT_SECRET } from '../utils';
import DateUtil from '../utils/DateUtil';
// import NotificationService from '../services/NotificationService';

const app = new Elysia({ prefix: "/auth" })
    .use(jwt({ name: 'jwt', secret: JWT_SECRET }))
    .post('/register', async ({ body, set, jwt }) => {
        const { firstname, lastname, email, password } = body;

        try {
            const existingUser = await db.select().from(users).where(eq(users.email, email));

            if (existingUser.length > 0) {
                set.status = 409;
                return {
                    success: false,
                    message: "มีบัญชีนี้อยู่ในระบบอยู่แล้ว กรุณาเข้าสู่ระบบ!"
                }
            }

            const passwordHash = await Bun.password.hash(password);

            const newUser = await db.insert(users).values({
                firstname,
                lastname,
                email,
                passwordHash,
                accountStatus: {
                    status: "active",
                    lastStatusChange: new Date().toISOString(),
                },
            }).returning();

            if (newUser.length === 0) {
                set.status = 500;
                return {
                    success: false,
                    message: "ไม่สามารถสร้างบัญชีได้"
                }
            }

            const user = newUser[0];

            const token = await jwt.sign({
                userId: user.id,
                email: user.email,
                // iat: Math.floor(Date.now() / 1000)
                // ไม่ระบุ exp เพื่อให้ token ไม่หมดอายุ
            });

            console.log({
                message: "สมัครสมาชิกสำเร็จ",
                user,
                token,
                date: DateUtil.formatThaiDate(new Date())
            });

            // await NotificationService.sendToUser(user.id, {
            //     title: 'ยินดีต้อนรับ',
            //     body: `สวัสดี ${user.firstname}! ขอบคุณที่สมัครสมาชิก ${PROJECT_NAME}`,
            //     iconName: 'person',
            //     data: { userId: user.id }
            // });

            set.status = 201;
            return {
                success: true,
                message: "สมัครสมาชิกสำเร็จ",
                user,
                token
            };

        } catch (error) {
            console.error('Registration error:', error);
            set.status = 500;
            return {
                success: false,
                message: `ข้อผิดพลาดของเซิร์ฟเวอร์ภายใน error:${error}`,
            };
        }
    }, {
        body: t.Object({
            firstname: t.String({ minLength: 1, maxLength: 150 }),
            lastname: t.String({ minLength: 1, maxLength: 150 }),
            email: t.String({ format: 'email', maxLength: 255 }),
            password: t.String({ minLength: 6, maxLength: 100 }),
        })
    })
    .post('/login', async ({ body, set, jwt }) => {
        const { email, password } = body;

        try {
            // หาผู้ใช้จากอีเมล
            const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);

            if (userResult.length === 0) {
                set.status = 401;
                return {
                    success: false,
                    message: "ไม่มีข้อมูลบัญชีผู้ใช้นี้ กรุณาทำการสมัครสมาชิก"
                }
            }

            const user = userResult[0];

            // ตรวจสอบรหัสผ่าน
            const isPasswordValid = await Bun.password.verify(password, user.passwordHash);

            if (!isPasswordValid) {
                set.status = 401;
                return {
                    success: false,
                    message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
                }
            }

            const inactiveStatuses = ["deleted", "suspended", "banned"] as const;

            if (inactiveStatuses.includes(user.accountStatus.status as "deleted" | "suspended" | "banned")) {
                set.status = 401;
                return { success: false, message: user.accountStatus };
            }

            // สร้าง JWT token (ไม่มีวันหมดอายุ)
            const token = await jwt.sign({
                userId: user.id,
                email: user.email,
                // iat: Math.floor(Date.now() / 1000)
            });

            console.log({
                message: "เข้าสู่ระบบสำเร็จ",
                user,
                token,
                date: DateUtil.formatThaiDate(new Date())
            });

            return {
                success: true,
                message: "เข้าสู่ระบบสำเร็จ",
                user,
                token
            };
        } catch (error) {
            console.error('Login error:', error);
            set.status = 500;
            return {
                success: false,
                message: `ข้อผิดพลาดของเซิร์ฟเวอร์ภายใน error:${error}`,
            };
        }
    }, {
        body: t.Object({
            email: t.String({ format: 'email' }),
            password: t.String({ minLength: 1 }),
        })
    })


export default app;