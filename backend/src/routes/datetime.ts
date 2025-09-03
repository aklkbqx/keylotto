// Path: backend/src/routes/datetime.ts
import Elysia from "elysia";

const app = new Elysia({ prefix: "datetime" })
    .get("/", () => {
        const now = new Date();

        const thaiDateLong = new Intl.DateTimeFormat('th-TH', {
            timeZone: 'Asia/Bangkok',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
        }).format(now);

        const thaiDateShort = new Intl.DateTimeFormat('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(now);

        const thaiDateMedium = new Intl.DateTimeFormat('th-TH', {
            timeZone: 'Asia/Bangkok',
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(now);

        const thaiDate = new Intl.DateTimeFormat('th-TH', {
            timeZone: 'Asia/Bangkok',
            dateStyle: 'long',
        }).format(now);

        return {
            success: true,
            data: {
                timestamp: now.getTime(),
                utc: now.toISOString(),
                thai: {
                    long: thaiDateLong,        // วันจันทร์ที่ 25 มิถุนายน 2568 เวลา 17:36 น.
                    short: thaiDateShort,      // 25/6/2568 17:36:10
                    medium: thaiDateMedium,    // 25 มิ.ย. 2568 17:36
                    date: thaiDate
                },
                timezone: 'Asia/Bangkok',
                // offset: '+07:00'
            }
        }
    })
export default app