export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";
import type { IdCtx } from "@/types/route";
import { getId } from "@/types/route";

/**
 * Snooze a compliance task's due date by N days (default 1).
 * POST /api/compliance/[id]/snooze  body: { "days": number }
 */
export async function POST(req: NextRequest, ctx: IdCtx) {
  try {
    const id = await getId(ctx);
    const body = (await req.json().catch(() => ({}))) as Partial<{ days: number }>;
    const days = Number.isFinite(body.days) ? Number(body.days) : 1;

    // 1) Load status + current due
    const rows = await query<{ status: string; dueDate: string | null }>(
      `select status, due_at as "dueDate" from compliance_tasks where id = $1 limit 1`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (rows[0].status === "completed") {
      return NextResponse.json({ ok: false, error: "Task already completed" }, { status: 409 });
    }

    // 2) Compute new due
    const currentDue = rows[0].dueDate ? new Date(rows[0].dueDate) : new Date();
    const next = new Date(currentDue.getTime() + days * 24 * 60 * 60 * 1000);

    // 3) Update
    await query(`update compliance_tasks set due_at = $2 where id = $1`, [id, next.toISOString()]);

    return NextResponse.json({ ok: true, dueDate: next.toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/compliance/[id]/snooze] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
