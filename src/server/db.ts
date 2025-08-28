// src/server/db.ts
import { Pool, type PoolConfig, type QueryResultRow } from "pg";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

// Keep SSL ON, but disable cert verification per connection (works with Supabase pooler)
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
