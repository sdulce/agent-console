export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

type LeadRow = {
  id?: string;
  name: string;
  source?: string | null;
  email?: string | null;
  phone?: string | null;
  responded?: boolean;
  responseAt?: string | null; // ISO string if present
};

function toBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

/**
 * Bulk insert leads.
 * Accepts either a single object or an array of objects shaped like LeadRow.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as LeadRow | LeadRow[];

    const items: LeadRow[] = Array.isArray(payload) ? payload : [payload];

    if (items.length === 0) {
      return NextResponse.json({ error: "no items" }, { status: 400 });
    }

    // Build a multi-row INSERT (snake_case in DB, camelCase in JSON)
    // Columns we handle: id?, name, source?, email?, phone?, responded?, response_at?
    const cols = [
      "id",
      "name",
      "source",
      "email",
      "phone",
      "responded",
      "response_at",
    ] as const;

    const values: unknown[] = [];
    const tuples: string[] = [];

    items.forEach((it, idx) => {
      const responded = toBool(it.responded);
      const responseAtIso =
        typeof it.responseAt === "string" ? it.responseAt : null;

      // 7 columns per row
      const base = idx * cols.length;
      tuples.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
      );
      values.push(
        it.id ?? null,
        it.name,
        it.source ?? null,
        it.email ?? null,
        it.phone ?? null,
        responded ?? null,
        responseAtIso
      );
    });

    await query(
      `
      insert into leads (${cols.join(", ")})
      values ${tuples.join(", ")}
    `,
      values
    );

    return NextResponse.json({ ok: true, inserted: items.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/leads/ingest] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
