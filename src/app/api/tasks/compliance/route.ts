import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { complianceTasks } from "@/server/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId");

    const rows = agentId
      ? await db.select().from(complianceTasks).where(eq(complianceTasks.agentId, agentId)).limit(200)
      : await db.select().from(complianceTasks).limit(200);

    const out = rows.map((r) => ({
      ...r,
      dueDate: r.dueDate ? new Date(r.dueDate as any).toISOString() : null,
    }));

    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/tasks/compliance error:", e);
    // TEMP fallback so UI keeps working
    return NextResponse.json([], { status: 200 });
  }
}
