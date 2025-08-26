import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const isProd = process.env.NODE_ENV === "production";
const allowInsecure = process.env.ALLOW_INSECURE_SSL === "true";

export const pool = new Pool({
  connectionString: url,                               // keep ?sslmode=require in the URL
  ssl: isProd && !allowInsecure ? true : { rejectUnauthorized: false },
});

export const db = drizzle(pool);
