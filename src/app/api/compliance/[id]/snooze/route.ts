export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const { days = 1 } = (await req.json().catch(() => ({}))) as { days?: number };

  try {
    const [row] = await query<{ status: string }>(
      `select status from compliance_tasks where id = $1`,
      [id]
    );
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (row.status === "completed")
      return NextResponse.json({ error: "already_completed" }, { status: 409 });

    await query(
      `update compliance_tasks
          set due_at = coalesce(due_at, now()) + ($1 || ' days')::interval
        where id = $2`,
      [String(days), id]
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("[POST /api/compliance/:id/snooze] ERROR", e);
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
