export const runtime = "nodejs";
import { NextResponse } from "next/server";

function safeParseDb(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      protocol: u.protocol,          // e.g. "postgresql:"
      hostname: u.hostname,          // e.g. "aws-1-us-west-1.pooler.supabase.com"
      port: u.port,                  // e.g. "6543"
      pathname: u.pathname,          // e.g. "/postgres"
      hasSslModeRequire: u.search.includes("sslmode=require"),
      hasUser: !!u.username,         // true/false only (no secret)
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const raw = process.env.DATABASE_URL || null;
  return NextResponse.json({
    ok: true,
    hasDatabaseUrl: !!raw,
    meta: safeParseDb(raw),
  });
}
