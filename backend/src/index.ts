// backend/src/index.ts
import { Elysia } from 'elysia';
import { log } from 'console';
import cors from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger'
import apiRoute from "./routes/_routes";
import files from "./files"
import jwt from '@elysiajs/jwt';
import { API_PORT, DOCS_PORT, JWT_SECRET } from './utils';

process.env.OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000';

if ((!API_PORT || API_PORT === "") || (!DOCS_PORT || DOCS_PORT === "") || (!JWT_SECRET || JWT_SECRET === "")) {
  throw new Error("error some env not found");
}

const createBaseApp = () => {
  return new Elysia()
    .get('/test', () => ({ text: 'test' }))
    .use(files)
    .group("/api", (app) => app.use(apiRoute))
};

const apiServer = createBaseApp()
  .use(cors({
    origin: ["*"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Upgrade', 'Connection', 'Sec-WebSocket-Key', 'Sec-WebSocket-Version', 'Sec-WebSocket-Protocol'],
    credentials: true
  }))
  .use(jwt({ name: 'jwt', secret: JWT_SECRET }))
  .onError(({ code, error, set }) => {
    set.status = code === 'NOT_FOUND' ? 404 : 500;
    return {
      success: false,
      message: code === 'NOT_FOUND' ? 'Not Found' : 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? null : error
    };
  })
  .listen(API_PORT, async () => {
    log(`🦊 API Server is running at port: ${API_PORT}`);
  });

const docsServer = createBaseApp()
  .use(swagger({
    provider: "scalar",
    documentation: {
      info: {
        title: "API Documentation",
        version: "1.0.0"
      }
    }
  }))
  .listen(DOCS_PORT, () => {
    log(`📚 Swagger Documentation is running at port: ${DOCS_PORT}`);
  });

export { apiServer, docsServer };