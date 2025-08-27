export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db"; // <-- use your typed SQL helper

type Params = { params: { id: string } };

/**
 * Mark a lead as responded and stamp response_at.
 * POST /api/leads/[id]/responded
 */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    // If your column is snake_case in Postgres (common):
    await query(
      `update leads
         set responded = true,
             response_at = now()
       where id = $1`,
      [params.id]
    );

    // If your DB column is camelCase (less common), use this instead:
    // await query(`update leads set responded = true, "responseAt" = now() where id = $1`, [params.id]);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/leads/[id]/responded] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
