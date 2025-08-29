export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query } from "@/db";
import { canBookTourForClient } from "@/server/complianceGate";

type BookBody = { client: string; agentId?: string | null; leadId?: string | null; property: string; startsAt: string; source?: string | null; };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<BookBody>;
    const client = (body.client || "").trim();
    const property = (body.property || "").trim();
    const startsAt = (body.startsAt || "").trim();
    const agentId = body.agentId ?? null;
    const leadId = body.leadId ?? null;
    const source = body.source ?? "agent_app";
    if (!client || !property || !startsAt) return NextResponse.json({ error: "Missing client, property, or startsAt" }, { status: 400 });

    const ts = new Date(startsAt);
    if (Number.isNaN(ts.getTime())) return NextResponse.json({ error: "Invalid startsAt datetime" }, { status: 400 });

    const gate = await canBookTourForClient(client, agentId);
    if (!gate.allowed) return NextResponse.json({ error: "tour_blocked", reason: gate.reason, latest: gate.latest }, { status: 403 });

    try {
      const rows = await query(
        `insert into public.tours (lead_id, client, agent_id, property, starts_at, source)
         values ($1,$2,$3,$4,$5::timestamptz,$6)
         returning id, lead_id as "leadId", client, agent_id as "agentId",
                   property, starts_at as "startsAt", source, created_at as "createdAt"`,
        [leadId, client, agentId, property, startsAt, source]
      );
      return NextResponse.json({ ok: true, data: rows[0] }, { status: 201 });
    } catch (e: any) {
      if (e?.code === "23505") {
        const existing = await query(
          `select id, lead_id as "leadId", client, agent_id as "agentId",
                  property, starts_at as "startsAt", source, created_at as "createdAt"
             from public.tours
            where agent_id = $1 and client = $2 and property = $3 and starts_at = $4::timestamptz`,
          [agentId, client, property, startsAt]
        );
        if (existing[0]) return NextResponse.json({ ok: true, data: existing[0], deduped: true }, { status: 200 });
      }
      throw e;
    }
  } catch (err: any) {
    console.error("[POST /api/tours/book] ERROR", err);
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}
