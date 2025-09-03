// Path: backend/src/routes/health.ts
import Elysia from "elysia";

const app = new Elysia({ prefix: "health" })
    .get("/", () => ({
        status: "ok"
    }))

export default app