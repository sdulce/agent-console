export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

type ComplianceRow = {
  id: string;
  type: string;
  client: string;
  status: "pending" | "in_review" | "completed" | "overdue";
  agentId: string | null;
  dueDate: string | null;    // ISO
  createdAt: string;         // ISO
};

// GET /api/tasks/compliance
export async function GET() {
  try {
    const rows = await query<ComplianceRow>(`
      select id, type, client, status,
             agent_id as "agentId",
             due_at as "dueDate",
             created_at as "createdAt"
      from compliance_tasks
      order by created_at desc
      limit 200
    `);

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "GET failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/tasks/compliance
export async function POST(req: NextRequest) {
  try {
    const allowed = new Set(["pending", "in_review", "completed", "overdue"] as const);

    const body = (await req.json()) as Partial<{
      type: string;
      client: string;
      status: ComplianceRow["status"];
      agentId: string | null;
      dueDate: string | null; // ISO
    }>;

    const { type, client, status = "pending", agentId = null, dueDate = null } = body;

    if (!type || !client) {
      return NextResponse.json({ error: "type and client are required" }, { status: 400 });
    }
    if (!allowed.has(status)) {
      return NextResponse.json({ error: `invalid status: ${status}` }, { status: 400 });
    }

    const rows = await query<ComplianceRow>(
      `
      insert into compliance_tasks (type, client, status, agent_id, due_at)
      values ($1, $2, $3, $4, $5)
      returning id, type, client, status,
                agent_id as "agentId",
                due_at as "dueDate",
                created_at as "createdAt"
      `,
      [type, client, status, agentId, dueDate]
    );

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    console.error("[/api/tasks/compliance] ERROR:", err);
    const msg = err instanceof Error ? err.message : "POST failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
