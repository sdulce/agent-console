export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

/**
 * Mark a compliance task as completed.
 * POST /api/compliance/[id]/complete
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await query(
      `update compliance_tasks
         set status = 'completed'
       where id = $1`,
      [params.id]
    );

    // If you also want to clear the due date, use this instead:
    // await query(
    //   `update compliance_tasks
    //      set status='completed', due_at = null
    //    where id = $1`,
    //   [params.id]
    // );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/compliance/[id]/complete] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
