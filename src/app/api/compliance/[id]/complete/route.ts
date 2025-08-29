export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query } from "@/db";

// POST /api/compliance/:id/complete
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    // Only update the targeted row, and only if not already completed
    const rows = await query<{ id: string; status: string }>(
      `
      update compliance_tasks
         set status = 'completed'
       where id = $1
         and status <> 'completed'
      returning id, status
      `,
      [id]
    );

    if (rows.length === 0) {
      // Either not found or already completed; be explicit which:
      const [exists] = await query<{ id: string }>(`select id from compliance_tasks where id = $1`, [id]);
      return exists
        ? NextResponse.json({ ok: true, alreadyCompleted: true }, { status: 200 })
        : NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rows[0] }, { status: 200 });
  } catch (e: any) {
    console.error("[POST /api/compliance/:id/complete] ERROR", e);
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
