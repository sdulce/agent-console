import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { leads } from "@/server/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId");

    const rows = agentId
      ? await db.select().from(leads).where(eq(leads.assignedAgentId, agentId)).limit(200)
      : await db.select().from(leads).limit(200);

    const out = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt as any).getTime() : Date.now(),
      responseAt: r.responseAt ? new Date(r.responseAt as any).getTime() : null,
      score: r.score ? Number(r.score) : 0.5,
    }));

    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/leads error:", e);
    // TEMP fallback so UI keeps working
    return NextResponse.json([], { status: 200 });
  }
}
