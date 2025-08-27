export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db"; // <-- use your SQL helper (NOT a Drizzle db)

/**
 * Snooze a compliance task's due date by N days (default 1).
 * Path: POST /api/compliance/[id]/snooze  with JSON body: { "days": number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse and validate body
    const body = (await req.json().catch(() => ({}))) as Partial<{ days: number }>;
    const days = Number.isFinite(body.days) ? Number(body.days) : 1;

    // 1) Fetch current due date
    const rows = await query<{ dueDate: string | null }>(
      `select due_at as "dueDate" from compliance_tasks where id = $1 limit 1`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const currentDue = rows[0].dueDate ? new Date(rows[0].dueDate) : new Date();
    const next = new Date(currentDue.getTime() + days * 24 * 60 * 60 * 1000);

    // 2) Update to new due date
    await query(
      `update compliance_tasks set due_at = $2 where id = $1`,
      [params.id, next.toISOString()]
    );

    return NextResponse.json({ ok: true, dueDate: next.toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/compliance/[id]/snooze] ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
