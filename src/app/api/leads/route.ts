export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

type LeadJson = {
  id: string;
  name: string;
  source: string | null;
  email: string | null;
  phone: string | null;
  responded: boolean | null;
  responseAt: string | null;
  createdAt: string;
};

// GET /api/leads
export async function GET() {
  try {
    const rows = await query<LeadJson>(`
      select
        id,
        name,
        source,
        email,
        phone,
        responded,
        response_at as "responseAt",
        created_at as "createdAt"
      from leads
      order by created_at desc
      limit 200
    `);

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/leads] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/leads
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<{
      id: string;
      name: string;
      source: string | null;
      email: string | null;
      phone: string | null;
      responded: boolean;
      responseAt: string | null; // ISO
    }>;

    const { name } = body;
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const rows = await query<LeadJson>(
      `
      insert into leads
        (id, name, source, email, phone, responded, response_at)
      values
        ($1, $2, $3, $4, $5, $6, $7)
      returning
        id, name, source, email, phone, responded,
        response_at as "responseAt",
        created_at as "createdAt"
      `,
      [
        body.id ?? null,
        name,
        body.source ?? null,
        body.email ?? null,
        body.phone ?? null,
        typeof body.responded === "boolean" ? body.responded : null,
        body.responseAt ?? null,
      ]
    );

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/leads] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
