export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { query } from "@/server/db";
import type { IdCtx } from "@/types/route";
import { getId } from "@/types/route";

/**
 * Mark a lead as responded now.
 * POST /api/leads/[id]/responded
 */
export async function POST(_req: NextRequest, ctx: IdCtx) {
  try {
    const id = await getId(ctx);

    await query(
      `update leads
         set responded = true,
             response_at = now()
       where id = $1`,
      [id]
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/leads/[id]/responded] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
