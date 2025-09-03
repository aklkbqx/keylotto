// Path: backend/src/middleware/index.ts
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../../drizzle/schema';

export const derive_middleware = async ({ headers, jwt, set }: { headers: any, jwt: any, set: any }) => {
    try {
        const authorization = headers.authorization;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            set.status = 401;
            throw new Error('Unauthorized: No token provided');
        }

        const token = authorization.split(' ')[1];

        if (!token) {
            set.status = 401;
            throw new Error('Unauthorized: Invalid token format');
        }

        // ตรวจสอบ JWT token
        const payload = await jwt.verify(token);

        if (!payload || !payload.userId) {
            set.status = 401;
            throw new Error('Unauthorized: Invalid token');
        }

        // ตรวจสอบว่าผู้ใช้ยังคงอยู่ในฐานข้อมูล
        const userResult = await db.select().from(users).where(eq(users.id, payload.userId));

        if (userResult.length === 0) {
            set.status = 401;
            throw new Error('Unauthorized: User not found');
        }

        return {
            user: userResult[0],
            token: payload
        };

    } catch (error) {
        set.status = 401;
        throw new Error('Unauthorized: ' + (error as Error).message);
    }
}