import { Pool } from "pg";

const globalForDb = globalThis as unknown as { contentRoomPool?: Pool };

export const pool = globalForDb.contentRoomPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

if (process.env.NODE_ENV !== "production") globalForDb.contentRoomPool = pool;
