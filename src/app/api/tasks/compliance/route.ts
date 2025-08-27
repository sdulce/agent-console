// src/app/api/tasks/compliance/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { query } from "@/server/db";

// GET /api/tasks/compliance
export async function GET() {
  try {
    const rows = await query(`
      select id, type, client, status, agent_id as "agentId",
             due_at as "dueDate", created_at as "createdAt"
      from compliance_tasks
      order by created_at desc
      limit 200
    `);

    return new Response(JSON.stringify({ data: rows }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "GET failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

// POST /api/tasks/compliance
export async function POST(req: NextRequest) {
  try {
    const allowed = new Set(["pending", "in_review", "completed", "overdue"]);

    const body = await req.json();
    let { type, client, status = "pending", agentId = null, dueDate = null } = body ?? {};

    // Validation checks
    if (!type || !client) {
      return new Response(JSON.stringify({ error: "type and client are required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (!allowed.has(status)) {
      return new Response(JSON.stringify({ error: `invalid status: ${status}` }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Insert row into DB
    const rows = await query(
      `
      insert into compliance_tasks (type, client, status, agent_id, due_at)
      values ($1, $2, $3, $4, $5)
      returning id, type, client, status, agent_id as "agentId",
                due_at as "dueDate", created_at as "createdAt"
      `,
      [type, client, status, agentId, dueDate]
    );

    return new Response(JSON.stringify({ data: rows[0] }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[/api/tasks/compliance] ERROR:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "POST failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}