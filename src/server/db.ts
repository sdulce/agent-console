// src/server/db.ts
import { Pool, type PoolConfig, type QueryResultRow } from "pg";

const { DATABASE_URL, VERCEL, PG_SSL_DISABLE_VERIFY } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * TLS strategy:
 * - On Vercel (VERCEL=1): disable cert verification to avoid CA hassles in serverless.
 * - Locally: if PG_SSL_DISABLE_VERIFY=1, disable verification (dev convenience).
 * - Otherwise: use system CAs (ssl: true).
 *
 * NOTE:
 * - Your current URL targets Supabase on port 5432 with ?sslmode=require. This config will work.
 * - For best reliability on serverless, consider switching DATABASE_URL (on Vercel) to the
 *   Supabase **Pooler** URL (port 6543) later. This code supports both.
 */
const onVercel = !!VERCEL;
const disableVerify = PG_SSL_DISABLE_VERIFY === "1";

let ssl: PoolConfig["ssl"];
if (onVercel || disableVerify) {
  ssl = { rejectUnauthorized: false };
} else {
  ssl = true; // use default system CAs
}

const poolCfg: PoolConfig = {
  connectionString: DATABASE_URL,
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

export const db = new Pool(poolCfg);

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await db.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
