export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  // Don't leak secrets; just tell if it's set
  return NextResponse.json({ ok: true, hasDatabaseUrl: hasDbUrl });
}
