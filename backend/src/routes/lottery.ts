import { Elysia, t } from "elysia";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getList as scrapeList, getLotto as scrapeLotto } from "../services/LottoService";
import { extractTicketsFromImage } from "../services/OcrService";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import jwt from '@elysiajs/jwt';
import { JWT_SECRET } from '../utils';
import { db } from "../db";
import { lotteryResults, lotteryChecks, funnyMessages, funnyMessagesUsage } from "../../drizzle/schema";
import { derive_middleware } from "../middleware";
import cron from "@elysiajs/cron";

type CheckDetail = {
    prize?: string;
    nearTo?: string;
    diff?: number;
};

const normalizeTicket = (ticket: string) => ticket.replace(/\D/g, "").padStart(6, "0").slice(-6);

const hammingDistance = (a: string, b: string) => {
    let d = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) d++;
    }
    return d + Math.abs(a.length - b.length);
}

const pickRandom = <T>(rows: T[]): T => rows[Math.floor(Math.random() * rows.length)];

const getRandomMessage = async (type: "win" | "near" | "miss", userId?: number) => {
    if (userId) {
        // Get messages not yet used by this user for this type
        const used = await db.select({ messageId: funnyMessagesUsage.messageId })
            .from(funnyMessagesUsage)
            .where(and(
                eq(funnyMessagesUsage.userId, userId),
                eq(funnyMessagesUsage.type, type as any)
            ) as any);
        const usedIds = used.map((u: { messageId: number }) => u.messageId);
        let candidates = await db.select({ id: funnyMessages.id, text: funnyMessages.text })
            .from(funnyMessages)
            .where(eq(funnyMessages.type, type as any) as any);
        if (usedIds.length > 0) {
            candidates = candidates.filter(c => !usedIds.includes(c.id));
        }
        // If all used -> reset usage for this type and user
        if (candidates.length === 0) {
            await db.delete(funnyMessagesUsage).where(and(eq(funnyMessagesUsage.userId, userId), eq(funnyMessagesUsage.type, type as any)) as any);
            candidates = await db.select({ id: funnyMessages.id, text: funnyMessages.text })
                .from(funnyMessages)
                .where(eq(funnyMessages.type, type as any) as any);
        }
        const chosen = pickRandom(candidates);
        await db.insert(funnyMessagesUsage).values({ userId, messageId: chosen.id, type });
        return chosen.text;
    }
    // anonymous fallback
    const rows = await db.select({ text: funnyMessages.text, id: funnyMessages.id })
        .from(funnyMessages)
        .where(eq(funnyMessages.type, type as any) as any);
    if (rows.length === 0) return type === "win" ? "ยินดีด้วย! เฮงๆรวยๆ!" : type === "near" ? "เฉียดไปนิดเดียวเอง!" : "ไม่เป็นไรงวดหน้าว่ากันใหม่";
    // uniform random
    const idx = Math.floor(Math.random() * rows.length);
    return rows[idx].text;
}

// =============================
// External API integration
// =============================

type ExternalPrize = {
    id: string;
    name: string;
    reward: string;
    amount: number;
    number: string[];
};

type ExternalRunning = {
    id: string;
    name: string;
    reward: string;
    amount: number;
    number: string[];
};

type ExternalLatestResponse = {
    status: string;
    response: {
        date: string; // e.g. "1 กันยายน 2568"
        endpoint: string;
        prizes: ExternalPrize[];
        runningNumbers: ExternalRunning[];
    };
};

const TH_MONTH: Record<string, string> = {
    "มกราคม": "01",
    "กุมภาพันธ์": "02",
    "มีนาคม": "03",
    "เมษายน": "04",
    "พฤษภาคม": "05",
    "มิถุนายน": "06",
    "กรกฎาคม": "07",
    "สิงหาคม": "08",
    "กันยายน": "09",
    "ตุลาคม": "10",
    "พฤศจิกายน": "11",
    "ธันวาคม": "12",
};

const parseThaiDateToISO = (thaiDate: string): string | null => {
    // Format: "1 กันยายน 2568" (BE)
    const parts = thaiDate.trim().split(/\s+/);
    if (parts.length < 3) return null;
    const [dayStr, monthTh, yearThStr] = parts;
    const day = dayStr.padStart(2, "0");
    const month = TH_MONTH[monthTh];
    const yearBE = parseInt(yearThStr, 10);
    if (!month || isNaN(yearBE)) return null;
    const yearCE = (yearBE - 543).toString();
    return `${yearCE}-${month}-${day}`;
};

// Simple in-memory cache
let latestCache: { data: ExternalLatestResponse["response"]; cachedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const fetchExternalLatest = async (): Promise<ExternalLatestResponse["response"]> => {
    const now = Date.now();
    if (latestCache && now - latestCache.cachedAt < CACHE_TTL_MS) {
        return latestCache.data;
    }
    // Prefer local scraping service to avoid external calls
    const lists = await scrapeList(1);
    const first = lists[0];
    let lotto = await scrapeLotto(first.id);
    if (lotto.prizes.some(p => p.number.some(num => num.toLowerCase().includes('x')))) {
        lotto = await scrapeLotto(lists[1].id);
    }
    const data = { status: 'success', response: lotto } as ExternalLatestResponse;
    latestCache = { data: data.response, cachedAt: now };
    // Upsert into DB as fallback snapshot
    try {
        const drawDateISO = parseThaiDateToISO(data.response.date);
        if (drawDateISO) {
            const firstPrizeNum = data.response.prizes.find(p => p.id === "prizeFirst")?.number?.[0] ?? "";
            const front3 = data.response.runningNumbers.find(r => r.id === "runningNumberFrontThree")?.number ?? [];
            const back3 = data.response.runningNumbers.find(r => r.id === "runningNumberBackThree")?.number ?? [];
            const last2 = data.response.runningNumbers.find(r => r.id === "runningNumberBackTwo")?.number?.[0] ?? "";
            await db.delete(lotteryResults).where(eq(lotteryResults.drawDate, drawDateISO as any));
            await db.insert(lotteryResults).values({
                drawDate: drawDateISO as any,
                firstPrize: firstPrizeNum,
                front3Digits: front3 as any,
                back3Digits: back3 as any,
                last2Digits: last2,
            });
        }
    } catch { }
    return data.response;
};

const app = new Elysia({ prefix: "/lottery" })
    .use(jwt({ name: 'jwt', secret: JWT_SECRET }))
    // Simple rate limiter (per IP/token) – 30 requests / 5 minutes
    .derive(({ headers }) => {
        const limiterWindowMs = 5 * 60 * 1000;
        const limiterMax = 30;
        const key =
            headers["x-forwarded-for"] ||
            headers["cf-connecting-ip"] ||
            headers["x-real-ip"] ||
            "global";
        return { limiter: { key, windowMs: limiterWindowMs, max: limiterMax } };
    })

    .use(cron({
        name: 'sync-lottery-latest',
        pattern: '*/10 * * * *',
        timezone: 'Asia/Bangkok',
        async run() {
          try {
            const lists = await scrapeList(1);
            const first = lists[0];
            let response = await scrapeLotto(first.id);
            if (response.prizes.some(p => p.number.some(num => num.toLowerCase().includes('x')))) {
              response = await scrapeLotto(lists[1].id);
            }
            const thaiDate: string = response.date;
            const TH_MONTH: Record<string, string> = { "มกราคม":"01","กุมภาพันธ์":"02","มีนาคม":"03","เมษายน":"04","พฤษภาคม":"05","มิถุนายน":"06","กรกฎาคม":"07","สิงหาคม":"08","กันยายน":"09","ตุลาคม":"10","พฤศจิกายน":"11","ธันวาคม":"12" };
            const parts = thaiDate.trim().split(/\s+/);
            if (parts.length < 3) return;
            const [d, mth, y] = parts as [string,string,string];
            const month = TH_MONTH[mth];
            const year = String(parseInt(y,10) - 543);
            if (!month || isNaN(parseInt(year))) return;
            const drawDateISO = `${year}-${d.padStart(2,'0')}-${month}`;
  
            const firstPrize = response.prizes.find((p: any) => p.id === 'prizeFirst')?.number?.[0] ?? '';
            const front3 = response.runningNumbers.find((r: any) => r.id === 'runningNumberFrontThree')?.number ?? [];
            const back3 = response.runningNumbers.find((r: any) => r.id === 'runningNumberBackThree')?.number ?? [];
            const last2 = response.runningNumbers.find((r: any) => r.id === 'runningNumberBackTwo')?.number?.[0] ?? '';
  
            await db.delete(lotteryResults).where(eq(lotteryResults.drawDate, drawDateISO as any));
            await db.insert(lotteryResults).values({
              drawDate: drawDateISO as any,
              firstPrize,
              front3Digits: front3 as any,
              back3Digits: back3 as any,
              last2Digits: last2,
            });
          } catch (e) {
            // silent cron error
          }
        }
      }))
    
    // Compatible endpoints migrated from thai-lotto-api
    .get("/list/:page", async ({ params, set }) => {
        try {
            const pageNum = Number(params.page);
            if (!Number.isSafeInteger(pageNum) || pageNum < 1) {
                set.status = 400;
                return { status: 'crash', response: 'invalid positive integer' };
            }
            const lists = await scrapeList(pageNum);
            return { status: 'success', response: lists };
        } catch (e) {
            set.status = 500;
            return { status: 'crash', response: 'api cannot fulfill your request at this time' };
        }
    }, {
        params: t.Object({ page: t.String() }),
        schema: { detail: { summary: 'Get lotto index by page', tags: ['lottery'] } }
    })
    // Admin: backfill results by scraping index pages range and storing into DB
    .post('/backfill', async ({ body, set, headers, jwt }) => {
        // Guard admin
        try {
            const derived = await derive_middleware({ headers, jwt, set });
            if (derived.user.role !== 'admin') {
                set.status = 403;
                return { success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้น' };
            }
        } catch {
            set.status = 401;
            return { success: false, message: 'Unauthorized' };
        }
        const { fromPage, toPage } = body as { fromPage: number; toPage: number };
        if (!Number.isSafeInteger(fromPage) || !Number.isSafeInteger(toPage) || fromPage < 1 || toPage < fromPage) {
            set.status = 400;
            return { success: false, message: 'กรุณาระบุช่วงหน้าให้ถูกต้อง (fromPage <= toPage และเริ่มจาก 1)' };
        }
        try {
            let inserted = 0;
            for (let page = fromPage; page <= toPage; page++) {
                const lists = await scrapeList(page);
                for (const it of lists) {
                    try {
                        let lotto = await scrapeLotto(it.id);
                        if (lotto.prizes.some(p => p.number.some(num => num.toLowerCase().includes('x')))) {
                            continue;
                        }
                        const drawDateISO = parseThaiDateToISO(lotto.date);
                        if (!drawDateISO) continue;
                        const firstPrizeNum = lotto.prizes.find(p => p.id === 'prizeFirst')?.number?.[0] ?? '';
                        const front3 = lotto.runningNumbers.find(r => r.id === 'runningNumberFrontThree')?.number ?? [];
                        const back3 = lotto.runningNumbers.find(r => r.id === 'runningNumberBackThree')?.number ?? [];
                        const last2 = lotto.runningNumbers.find(r => r.id === 'runningNumberBackTwo')?.number?.[0] ?? '';
                        await db.delete(lotteryResults).where(eq(lotteryResults.drawDate, drawDateISO as any));
                        await db.insert(lotteryResults).values({
                            drawDate: drawDateISO as any,
                            firstPrize: firstPrizeNum,
                            front3Digits: front3 as any,
                            back3Digits: back3 as any,
                            last2Digits: last2,
                        });
                        inserted++;
                    } catch {}
                }
            }
            return { success: true, inserted };
        } catch (e) {
            set.status = 500;
            return { success: false, message: 'Backfill ล้มเหลว' };
        }
    }, {
        body: t.Object({
            fromPage: t.Number(),
            toPage: t.Number(),
        }),
        schema: { detail: { summary: 'Admin: backfill results by scraping pages range', tags: ['lottery'] } }
    })
    .get("/lotto/:id", async ({ params, set }) => {
        try {
            const id = params.id;
            if (!Number.isSafeInteger(Number(id))) {
                set.status = 400;
                return { status: 'crash', response: 'invalid positive integer' };
            }
            const lotto = await scrapeLotto(id);
            return { status: 'success', response: lotto };
        } catch (e) {
            set.status = 500;
            return { status: 'crash', response: 'api cannot fulfill your request at this time' };
        }
    }, {
        params: t.Object({ id: t.String() }),
        schema: { detail: { summary: 'Get lotto detail by id', tags: ['lottery'] } }
    })
    // Proxy latest results from external API
    .get("/latest", async ({ set }) => {
        try {
            const latest = await fetchExternalLatest();
            return { success: true, data: latest };
        } catch (e) {
            // Fallback to DB snapshot
            try {
                const rows = await db.select().from(lotteryResults).orderBy(desc(lotteryResults.drawDate)).limit(1);
                if (rows.length > 0) {
                    const r = rows[0];
                    return {
                        success: true,
                        data: {
                            date: r.drawDate as unknown as string,
                            endpoint: "fallback:db",
                            prizes: [
                                { id: "prizeFirst", name: "รางวัลที่ 1", reward: "", amount: 1, number: [r.firstPrize] },
                            ],
                            runningNumbers: [
                                { id: "runningNumberFrontThree", name: "เลขหน้า 3 ตัว", reward: "", amount: 2, number: r.front3Digits as any },
                                { id: "runningNumberBackThree", name: "เลขท้าย 3 ตัว", reward: "", amount: 2, number: r.back3Digits as any },
                                { id: "runningNumberBackTwo", name: "เลขท้าย 2 ตัว", reward: "", amount: 1, number: [r.last2Digits] },
                            ]
                        }
                    };
                }
            } catch { }
            set.status = 502;
            return { success: false, message: "ไม่สามารถดึงผลล่าสุดจากภายนอกได้" };
        }
    })
    // Get results by date range or latest
    .get("/results", async ({ query, set }) => {
        const { from, to, limit } = query as { from?: string; to?: string; limit?: string };
        try {
            const where = from && to ? and(gte(lotteryResults.drawDate, from as any), lte(lotteryResults.drawDate, to as any)) : undefined;
            const rows = await db.select().from(lotteryResults).where(where as any).orderBy(desc(lotteryResults.drawDate)).limit(Number(limit ?? 10));
            return { success: true, data: rows };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "ไม่สามารถดึงผลรางวัลได้" };
        }
    })
    // Create/update results for a draw date (admin later can be guarded)
    .post("/results", async ({ body, set, headers, jwt }) => {
        // Simple admin guard: require valid token and role === admin
        try {
            const derived = await derive_middleware({ headers, jwt, set });
            if (derived.user.role !== 'admin') {
                set.status = 403;
                return { success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้น' };
            }
        } catch {
            set.status = 401;
            return { success: false, message: 'Unauthorized' };
        }
        const { drawDate, firstPrize, front3Digits, back3Digits, last2Digits } = body as any;
        try {
            // Upsert simplistic: delete then insert
            await db.delete(lotteryResults).where(eq(lotteryResults.drawDate, drawDate as any));
            const [row] = await db.insert(lotteryResults).values({ drawDate, firstPrize, front3Digits, back3Digits, last2Digits }).returning();
            set.status = 201;
            return { success: true, data: row };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "บันทึกผลรางวัลไม่สำเร็จ" };
        }
    }, {
        body: t.Object({
            drawDate: t.String(),
            firstPrize: t.String({ minLength: 6, maxLength: 6 }),
            front3Digits: t.Array(t.String({ minLength: 3, maxLength: 3 })),
            back3Digits: t.Array(t.String({ minLength: 3, maxLength: 3 })),
            last2Digits: t.String({ minLength: 2, maxLength: 2 }),
        }),
        schema: { detail: { summary: 'Admin: upsert draw results', tags: ['lottery'] } }
    })
    // Check a ticket
    .post("/check", async ({ body, headers, jwt, set, limiter }) => {
        const { ticketNumber, drawDate } = body as { ticketNumber: string; drawDate?: string };
        // rate limit simple check
        const rl = (globalThis as any).__lotto_rl__ || ((globalThis as any).__lotto_rl__ = new Map());
        const now = Date.now();
        // dynamic max: logged-in higher, anonymous lower
        let dynamicMax: number = Number(limiter.max);
        try {
            const auth = headers["authorization"];
            if (auth && auth.startsWith("Bearer ")) {
                const token = auth.split(" ")[1];
                const payload = await jwt.verify(token);
                if (payload && (payload as any).userId) dynamicMax = 60; // logged-in
            }
        } catch { }
        const entry = rl.get(limiter.key) || { count: 0, resetAt: now + limiter.windowMs };
        if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + limiter.windowMs; }
        entry.count += 1;
        rl.set(limiter.key, entry);
        if (entry.count > dynamicMax) {
            set.status = 429;
            return { success: false, message: 'ขออภัย มีการตรวจถี่เกินไป กรุณาลองใหม่ภายหลัง' };
        }
        if (!/^[0-9]{6}$/.test(ticketNumber)) {
            set.status = 400;
            return { success: false, message: "กรุณากรอกเลขสลาก 6 หลัก (0-9)" };
        }
        if (drawDate && !/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) {
            set.status = 400;
            return { success: false, message: "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" };
        }
        const ticket = normalizeTicket(ticketNumber);
        try {
            // Helper to compute near-first numbers (±1) with wrap-around
            const computeFirstNear = (num: string): string[] => {
                if (!/^\d{6}$/.test(num)) return [];
                const n = parseInt(num, 10);
                const prev = (n - 1 + 1000000) % 1000000;
                const next = (n + 1) % 1000000;
                const p = String(prev).padStart(6, '0');
                const nx = String(next).padStart(6, '0');
                return [p, nx];
            };

            let drawDateISO: string | null = null;
            let firstPrizeNum = "";
            let firstNearNums: string[] = [];
            let second: string[] = [];
            let third: string[] = [];
            let forth: string[] = [];
            let fifth: string[] = [];
            let front3: string[] = [];
            let back3: string[] = [];
            let last2 = "";

            if (drawDate) {
                // Use DB snapshot for specific draw date
                const rows = await db.select().from(lotteryResults).where(eq(lotteryResults.drawDate, drawDate as any)).limit(1);
                if (rows.length === 0) {
                    set.status = 404;
                    return { success: false, message: "ไม่พบผลรางวัลของวันที่ระบุ" };
                }
                const r = rows[0] as any;
                drawDateISO = r.drawDate as string;
                firstPrizeNum = r.firstPrize as string;
                front3 = (r.front3Digits || []) as string[];
                back3 = (r.back3Digits || []) as string[];
                last2 = r.last2Digits as string;
                // Compute first-near from first prize when using DB
                firstNearNums = computeFirstNear(firstPrizeNum);
            } else {
                // Use external latest results
                const latest = await fetchExternalLatest();
                drawDateISO = parseThaiDateToISO(latest.date);
                firstPrizeNum = latest.prizes.find(p => p.id === "prizeFirst")?.number?.[0] ?? "";
                firstNearNums = latest.prizes.find(p => p.id === "prizeFirstNear")?.number ?? [];
                second = latest.prizes.find(p => p.id === "prizeSecond")?.number ?? [];
                third = latest.prizes.find(p => p.id === "prizeThird")?.number ?? [];
                forth = latest.prizes.find(p => p.id === "prizeForth")?.number ?? [];
                fifth = latest.prizes.find(p => p.id === "prizeFifth")?.number ?? [];
                front3 = latest.runningNumbers.find(r => r.id === "runningNumberFrontThree")?.number ?? [];
                back3 = latest.runningNumbers.find(r => r.id === "runningNumberBackThree")?.number ?? [];
                last2 = latest.runningNumbers.find(r => r.id === "runningNumberBackTwo")?.number?.[0] ?? "";
            }

            let status: "win" | "near" | "miss" = "miss";
            const detail: CheckDetail = {};

            if (ticket === firstPrizeNum) {
                status = "win"; detail.prize = "รางวัลที่ 1";
            } else if (firstNearNums.includes(ticket)) {
                status = "near"; detail.nearTo = firstPrizeNum; detail.diff = 1;
            } else if (second.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 2";
            } else if (third.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 3";
            } else if (forth.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 4";
            } else if (fifth.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 5";
            } else if (ticket.slice(0, 3) && front3.includes(ticket.slice(0, 3))) {
                status = "win"; detail.prize = "รางวัลเลขหน้า 3 ตัว";
            } else if (ticket.slice(3) && back3.includes(ticket.slice(3))) {
                status = "win"; detail.prize = "รางวัลเลขท้าย 3 ตัว";
            } else if (ticket.slice(4) === last2) {
                status = "win"; detail.prize = "รางวัลเลขท้าย 2 ตัว";
            } else {
                const diff = firstPrizeNum ? hammingDistance(ticket, firstPrizeNum) : 99;
                if (diff <= 2) { status = "near"; detail.nearTo = firstPrizeNum; detail.diff = diff; }
            }

            // Save history (attach user if provided)
            let userId: number | undefined;
            try {
                const derived = await derive_middleware({ headers, jwt, set });
                userId = derived.user.id;
            } catch {
                userId = undefined;
            }

            await db.insert(lotteryChecks).values({
                userId,
                drawDate: ((drawDate ?? drawDateISO) ?? new Date().toISOString().slice(0, 10)) as any,
                ticketNumber: ticket,
                status,
                detail: detail as any,
            });

            const message = await getRandomMessage(status, userId);

            return {
                success: true,
                data: {
                    status,
                    detail,
                    message,
                }
            };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "ตรวจหวยไม่สำเร็จ" };
        }
    }, {
        body: t.Object({
            ticketNumber: t.String({ minLength: 1 }),
            drawDate: t.Optional(t.String()),
        }),
        schema: { detail: { summary: 'Check ticket by 6-digit number (optional drawDate)', tags: ['lottery'] } }
    })
    // Scan a stall image to detect many tickets and suggest one
    .post('/scan', async ({ request, set }) => {
        if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
            set.status = 400;
            return { success: false, message: "Content type must be multipart/form-data" };
        }
        try {
            const form = await request.formData();
            const imageFile = form.get('image');
            const selectMode = (form.get('selectMode') as string) || 'random';
            if (!imageFile || !(imageFile instanceof File)) {
                set.status = 400;
                return { success: false, message: 'กรุณาอัปโหลดรูปภาพ' };
            }
            const allowed = ['image/jpeg','image/png','image/webp'];
            if (!allowed.includes(imageFile.type)) {
                set.status = 400;
                return { success: false, message: 'รองรับเฉพาะ JPEG/PNG/WebP' };
            }
            if (imageFile.size > 8 * 1024 * 1024) {
                set.status = 400;
                return { success: false, message: 'ขนาดไฟล์ต้องไม่เกิน 8MB' };
            }
            const ts = Date.now();
            const ext = imageFile.name.split('.').pop();
            const stallImageName = `stall_${ts}.${ext}`;
            await mkdir('public/images/tickets', { recursive: true });
            const buf = await imageFile.arrayBuffer();
            const savePath = `public/images/tickets/tmp/${stallImageName}`;
            await Bun.write(savePath, buf);
            const absPath = path.isAbsolute(savePath) ? savePath : path.resolve(process.cwd(), savePath);

            const tickets = await extractTicketsFromImage(absPath);
            const valid = tickets.filter(t => (t.number || '').length === 6);
            // select one based on mode
            let selected = null as any;
            if (valid.length > 0) {
                if (selectMode === 'random') selected = valid[Math.floor(Math.random() * valid.length)];
                else if (selectMode === 'topmost') selected = [...valid].sort((a,b) => (a.box?.y ?? 0) - (b.box?.y ?? 0))[0];
                else if (selectMode === 'leftmost') selected = [...valid].sort((a,b) => (a.box?.x ?? 0) - (b.box?.x ?? 0))[0];
                else selected = valid[Math.floor(Math.random() * valid.length)];
            }

            const ticketsDto = valid.map(v => ({ number: v.number, box: v.box, confidence: v.confidence }));

            const responsePayload = {
                success: true,
                data: {
                    imagePath: `/public/images/tickets/tmp/${stallImageName}`,
                    count: ticketsDto.length,
                    selected: selected ? { number: selected.number, box: selected.box, confidence: selected.confidence } : null,
                    tickets: ticketsDto
                }
            };

            // Clean up saved file (non-blocking)
            rm(absPath).catch(() => {});
            return responsePayload;
        } catch (e) {
            set.status = 500;
            return { success: false, message: 'สแกนรูปแผงไม่สำเร็จ' };
        }
    }, { schema: { detail: { summary: 'Scan stall image and suggest a ticket', tags: ['lottery'] } } })
    // Scan image and immediately check selected ticket; optionally keep image and record
    .post('/scan-and-check', async ({ request, set, headers, jwt }) => {
        if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
            set.status = 400;
            return { success: false, message: "Content type must be multipart/form-data" };
        }
        try {
            const form = await request.formData();
            const imageFile = form.get('image');
            const selectMode = (form.get('selectMode') as string) || 'random';
            const keepImage = String(form.get('keepImage') || '').toLowerCase() === 'true';
            const drawDate = (form.get('drawDate') as string) || undefined;
            if (drawDate && !/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) {
                set.status = 400;
                return { success: false, message: "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" };
            }
            if (!imageFile || !(imageFile instanceof File)) {
                set.status = 400;
                return { success: false, message: 'กรุณาอัปโหลดรูปภาพ' };
            }
            const allowed = ['image/jpeg','image/png','image/webp'];
            if (!allowed.includes(imageFile.type)) {
                set.status = 400;
                return { success: false, message: 'รองรับเฉพาะ JPEG/PNG/WebP' };
            }
            if (imageFile.size > 8 * 1024 * 1024) {
                set.status = 400;
                return { success: false, message: 'ขนาดไฟล์ต้องไม่เกิน 8MB' };
            }
            const ts = Date.now();
            const ext = imageFile.name.split('.').pop();
            const imageName = `ticket_${ts}.${ext}`;
            await mkdir('public/images/tickets', { recursive: true });
            const buf = await imageFile.arrayBuffer();
            const savePath = `public/images/tickets/${imageName}`;
            await Bun.write(savePath, buf);
            const absPath = path.isAbsolute(savePath) ? savePath : path.resolve(process.cwd(), savePath);

            const tickets = await extractTicketsFromImage(absPath);
            const valid = tickets.filter(t => (t.number || '').length === 6);
            if (valid.length === 0) {
                if (!keepImage) rm(absPath).catch(() => {});
                set.status = 422;
                return { success: false, message: 'ไม่พบเลขสลากที่ชัดเจนในภาพ' };
            }
            let selected = null as any;
            if (selectMode === 'random') selected = valid[Math.floor(Math.random() * valid.length)];
            else if (selectMode === 'topmost') selected = [...valid].sort((a,b) => (a.box?.y ?? 0) - (b.box?.y ?? 0))[0];
            else if (selectMode === 'leftmost') selected = [...valid].sort((a,b) => (a.box?.x ?? 0) - (b.box?.x ?? 0))[0];
            else selected = valid[Math.floor(Math.random() * valid.length)];

            // Now check the selected ticket using same logic as /check
            const ticket = selected.number as string;

            // Helper to compute near-first numbers (±1)
            const computeFirstNear = (num: string): string[] => {
                if (!/^\d{6}$/.test(num)) return [];
                const n = parseInt(num, 10);
                const prev = (n - 1 + 1000000) % 1000000;
                const next = (n + 1) % 1000000;
                return [String(prev).padStart(6, '0'), String(next).padStart(6, '0')];
            };

            let drawDateISO: string | null = null;
            let firstPrizeNum = "";
            let firstNearNums: string[] = [];
            let second: string[] = [];
            let third: string[] = [];
            let forth: string[] = [];
            let fifth: string[] = [];
            let front3: string[] = [];
            let back3: string[] = [];
            let last2 = "";

            if (drawDate) {
                const rows = await db.select().from(lotteryResults).where(eq(lotteryResults.drawDate, drawDate as any)).limit(1);
                if (rows.length === 0) {
                    if (!keepImage) rm(absPath).catch(() => {});
                    set.status = 404;
                    return { success: false, message: "ไม่พบผลรางวัลของวันที่ระบุ" };
                }
                const r = rows[0] as any;
                drawDateISO = r.drawDate as string;
                firstPrizeNum = r.firstPrize as string;
                front3 = (r.front3Digits || []) as string[];
                back3 = (r.back3Digits || []) as string[];
                last2 = r.last2Digits as string;
                firstNearNums = computeFirstNear(firstPrizeNum);
            } else {
                const latest = await fetchExternalLatest();
                drawDateISO = parseThaiDateToISO(latest.date);
                firstPrizeNum = latest.prizes.find(p => p.id === "prizeFirst")?.number?.[0] ?? "";
                firstNearNums = latest.prizes.find(p => p.id === "prizeFirstNear")?.number ?? [];
                second = latest.prizes.find(p => p.id === "prizeSecond")?.number ?? [];
                third = latest.prizes.find(p => p.id === "prizeThird")?.number ?? [];
                forth = latest.prizes.find(p => p.id === "prizeForth")?.number ?? [];
                fifth = latest.prizes.find(p => p.id === "prizeFifth")?.number ?? [];
                front3 = latest.runningNumbers.find(r => r.id === "runningNumberFrontThree")?.number ?? [];
                back3 = latest.runningNumbers.find(r => r.id === "runningNumberBackThree")?.number ?? [];
                last2 = latest.runningNumbers.find(r => r.id === "runningNumberBackTwo")?.number?.[0] ?? "";
            }

            let status: "win" | "near" | "miss" = "miss";
            const detail: CheckDetail = {};
            if (ticket === firstPrizeNum) {
                status = "win"; detail.prize = "รางวัลที่ 1";
            } else if (firstNearNums.includes(ticket)) {
                status = "near"; detail.nearTo = firstPrizeNum; detail.diff = 1;
            } else if (second.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 2";
            } else if (third.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 3";
            } else if (forth.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 4";
            } else if (fifth.includes(ticket)) {
                status = "win"; detail.prize = "รางวัลที่ 5";
            } else if (ticket.slice(0, 3) && front3.includes(ticket.slice(0, 3))) {
                status = "win"; detail.prize = "รางวัลเลขหน้า 3 ตัว";
            } else if (ticket.slice(3) && back3.includes(ticket.slice(3))) {
                status = "win"; detail.prize = "รางวัลเลขท้าย 3 ตัว";
            } else if (ticket.slice(4) === last2) {
                status = "win"; detail.prize = "รางวัลเลขท้าย 2 ตัว";
            } else {
                const diff = firstPrizeNum ? hammingDistance(ticket, firstPrizeNum) : 99;
                if (diff <= 2) { status = "near"; detail.nearTo = firstPrizeNum; detail.diff = diff; }
            }

            // Attach user if provided
            let userId: number | undefined;
            try {
                const derived = await derive_middleware({ headers, jwt, set });
                userId = derived.user.id;
            } catch { userId = undefined; }

            await db.insert(lotteryChecks).values({
                userId,
                drawDate: ((drawDate ?? drawDateISO) ?? new Date().toISOString().slice(0, 10)) as any,
                ticketNumber: ticket,
                status,
                detail: { ...detail, ocrBox: selected.box, confidence: selected.confidence } as any,
                ticketImage: keepImage ? `tickets/${imageName}` : undefined,
            });

            const message = await getRandomMessage(status, userId);

            if (!keepImage) rm(absPath).catch(() => {});
            return {
                success: true,
                data: {
                    status,
                    detail,
                    message,
                    imagePath: `/public/images/tickets/${imageName}`,
                    ticket,
                }
            };
        } catch (e) {
            set.status = 500;
            return { success: false, message: 'สแกนและตรวจหวยไม่สำเร็จ' };
        }
    }, { schema: { detail: { summary: 'Scan image and check ticket', tags: ['lottery'] } } })
    // Protected endpoints group (uses derive middleware like profile route)
    .get("/history", async ({ set, query, headers }) => {
        let user: any = null
        try {
            const derived = await derive_middleware({ headers, jwt, set });
            if (derived.user.role !== 'user') {
                set.status = 403;
                return { success: false, message: 'เฉพาะผู้ใช้เท่านั้น' };
            }
            user = derived.user
        } catch {
            set.status = 401;
            return { success: false, message: 'Unauthorized' };
        }
        try {
            const page = Number((query as any).page ?? '1');
            const limit = Number((query as any).limit ?? '20');
            const offset = (page - 1) * limit;
            const rows = await db.select().from(lotteryChecks)
                .where(eq(lotteryChecks.userId, user.id))
                .orderBy(desc(lotteryChecks.createdAt))
                .limit(limit as any)
                .offset(offset as any);
            return { success: true, data: rows, page, limit };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "ไม่สามารถดึงประวัติได้" };
        }
    }, { schema: { detail: { summary: 'Get my lottery check history (paginated)', tags: ['lottery'] } } })
    // Funny messages CRUD (basic)
    .get("/messages", async () => {
        const rows = await db.select().from(funnyMessages);
        return { success: true, data: rows };
    })
    .post("/messages", async ({ body, set, headers, jwt }) => {
        try {
            const derived = await derive_middleware({ headers, jwt, set });
            if (derived.user.role !== 'admin') {
                set.status = 403;
                return { success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้น' };
            }
        } catch {
            set.status = 401;
            return { success: false, message: 'Unauthorized' };
        }
        const { type, text } = body as { type: "win" | "near" | "miss"; text: string };
        try {
            const [row] = await db.insert(funnyMessages).values({ type, text }).returning();
            set.status = 201;
            return { success: true, data: row };
        } catch (e) {
            set.status = 500;
            return { success: false, message: "บันทึกข้อความไม่สำเร็จ" };
        }
    }, {
        body: t.Object({
            type: t.Union([t.Literal("win"), t.Literal("near"), t.Literal("miss")]),
            text: t.String({ minLength: 1 }),
        })
    })

export default app;


