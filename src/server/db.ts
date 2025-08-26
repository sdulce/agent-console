import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = new Client({
  connectionString: url,
  // DEV FIX: handle "self-signed certificate in certificate chain"
  ssl: { rejectUnauthorized: false },
});

client.connect();

export const db = drizzle(client);
