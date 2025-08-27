// src/server/db.ts
import { Pool, type PoolConfig, type QueryResultRow } from "pg";
import fs from "fs";
import path from "path";

const {
  DATABASE_URL = "",
  PG_SSL_DISABLE_VERIFY = "0",
  PG_CA_PATH = "",
} = process.env;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const disableVerify = PG_SSL_DISABLE_VERIFY === "1";

// Optional CA
let ca: string | undefined;
if (PG_CA_PATH) {
  const p = path.resolve(process.cwd(), PG_CA_PATH);
  if (fs.existsSync(p)) ca = fs.readFileSync(p, "utf8");
}

// Local dev: allow insecure verify bypass
if (disableVerify) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const poolCfg: PoolConfig = {
  connectionString: DATABASE_URL,
  ssl: disableVerify ? { rejectUnauthorized: false, ca } : { rejectUnauthorized: true, ca },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

export const db = new Pool(poolCfg);

/* eslint-disable @typescript-eslint/no-explicit-any */
// ^ pg's type for `values` is `any[] | undefined`. Use `any[]` to satisfy the driver.
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await db.query<T>(text, params);
  return res.rows;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
