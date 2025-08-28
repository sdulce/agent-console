export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { query } from "@/server/db";
import type { IdCtx } from "@/types/route";
import { getId } from "@/types/route";

/**
 * Mark a compliance task as completed.
 * POST /api/compliance/[id]/complete
 */
export async function POST(_req: NextRequest, ctx: IdCtx) {
  try {
    const id = await getId(ctx);

    await query(
      `update compliance_tasks
         set status = 'completed'
       where id = $1`,
      [id]
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/compliance/[id]/complete] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
