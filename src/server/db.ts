// src/server/db.ts
import { Pool, type PoolConfig, type QueryResultRow, type PoolClient } from "pg";
import * as pgLib from "pg";                    // ← add this

// Globally relax pg's TLS CA verification (local/Windows + Supabase pooler).
// SSL remains enabled; we just skip CA verification to avoid
// "self-signed certificate in certificate chain".
pgLib.defaults.ssl = { rejectUnauthorized: false };  // ← add this

/**
 * - SSL stays ON with rejectUnauthorized: false (works with Supabase pooler).
 * - Exports:
 *     db / pool (same Pool instance)
 *     query()  → rows-only helper
 *     withClient() / tx() helpers
 *     healthcheck()
 * - Uses a dev singleton so Next.js HMR doesn't leak connections.
 */

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const poolCfg: PoolConfig = {
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

// ----- Singleton Pool (no "possibly undefined") -----
declare global {
  // eslint-disable-next-line no-var
  var __PG_POOL__: Pool | undefined;
}

const poolInstance: Pool = global.__PG_POOL__ ?? new Pool(poolCfg);
if (process.env.NODE_ENV !== "production") {
  global.__PG_POOL__ = poolInstance;
}

// Export the Pool (two names for compatibility)
export const db = poolInstance;
export const pool = poolInstance;

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Rows-only query helper */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await poolInstance.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Borrow a client for advanced use */
export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await poolInstance.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/** Simple transaction helper (PgBouncer transaction-pooling safe) */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const out = await fn(client);
      await client.query("COMMIT");
      return out;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  });
}

/** Quick connectivity probe */
export async function healthcheck(): Promise<boolean> {
  try {
    await poolInstance.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
