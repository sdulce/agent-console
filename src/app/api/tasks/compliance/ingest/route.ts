import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { db } from "@/server/db";
import { complianceTasks } from "@/server/schema";

const Body = z.object({
  id: z.string().optional(),
  type: z.enum(["buyer_agreement", "comp_disclosure"]),
  client: z.string(),
  status: z.enum(["missing", "pending", "done"]).default("missing"),
  agentId: z.string().nullable().optional(),
  // ISO 8601 datetime string like "2025-08-26T12:00:00.000Z" or null
  dueDate: z.string().datetime().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const id = b.id ?? `ct_${Date.now()}`;

    // Write to DB (timestamp column expects a Date | null)
    await db.insert(complianceTasks).values({
      id,
      type: b.type,
      client: b.client,
      status: b.status,
      agentId: b.agentId ?? null,
      dueDate: b.dueDate ? (new Date(b.dueDate) as any) : null,
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    // ← This is the part that prevents a vague 500 and tells us what failed
    if (e instanceof ZodError) {
      console.error("Validation error:", e.issues);
      return NextResponse.json({ error: "Validation failed", issues: e.issues }, { status: 400 });
    }
    console.error("POST /api/tasks/compliance/ingest error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
