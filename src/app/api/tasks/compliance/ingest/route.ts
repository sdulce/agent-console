export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

type ComplianceItem = {
  id?: string;
  type: string;
  client: string;
  status?: "pending" | "in_review" | "completed" | "overdue";
  agentId?: string | null;
  dueDate?: string | null; // ISO string
};

const allowed = new Set(["pending", "in_review", "completed", "overdue"] as const);

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ComplianceItem | ComplianceItem[];
    const items: ComplianceItem[] = Array.isArray(payload) ? payload : [payload];

    if (items.length === 0) {
      return NextResponse.json({ error: "no items" }, { status: 400 });
    }

    // Validate quickly
    for (const it of items) {
      if (!it.type || !it.client) {
        return NextResponse.json({ error: "type and client are required for each item" }, { status: 400 });
      }
      if (it.status && !allowed.has(it.status)) {
        return NextResponse.json({ error: `invalid status: ${it.status}` }, { status: 400 });
      }
    }

    // Build multi-row insert into compliance_tasks (snake_case)
    const cols = ["id", "type", "client", "status", "agent_id", "due_at"] as const;
    const values: unknown[] = [];
    const tuples: string[] = [];

    items.forEach((it, idx) => {
      const base = idx * cols.length;
      tuples.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
      );
      values.push(
        it.id ?? null,
        it.type,
        it.client,
        it.status ?? "pending",
        it.agentId ?? null,
        it.dueDate ?? null
      );
    });

    await query(
      `
      insert into compliance_tasks (${cols.join(", ")})
      values ${tuples.join(", ")}
    `,
      values
    );

    return NextResponse.json({ ok: true, inserted: items.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/tasks/compliance/ingest] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
