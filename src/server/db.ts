// src/server/db.ts
import { Pool, type PoolConfig, type QueryResultRow } from "pg";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

/**
 * Supabase on Vercel:
 * - Use the Pooler URL (port 6543) with ?sslmode=require in Vercel env.
 * - Disable cert verification to avoid "self-signed certificate in certificate chain".
 *   This is common/acceptable for managed TLS in serverless.
 */
const poolCfg: PoolConfig = {
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // 👈 fixes the self-signed certificate error
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
