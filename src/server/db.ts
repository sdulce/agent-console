// src/server/db.ts
import { Pool, type PoolConfig, type QueryResultRow } from "pg";

// On Vercel, also force global TLS no-verify to avoid "self-signed certificate" issues
if (process.env.VERCEL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

/**
 * Use the Supabase Pooler URL (port 6543) in Vercel env.
 * Keep SSL ON but disable certificate verification.
 */
const poolCfg: PoolConfig = {
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
