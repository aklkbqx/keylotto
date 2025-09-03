// backend/src/utils/index.ts
export const API_PORT = process.env.API_PORT || "3000"
export const DOCS_PORT = process.env.DOCS_PORT || "3001"
export const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret-for-development"
export const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/database"
export const PROJECT_NAME = process.env.PROJECT_NAME || "project name"