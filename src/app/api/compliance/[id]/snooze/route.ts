import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { complianceTasks } from "@/server/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { days = 1 } = await req.json().catch(() => ({ days: 1 }));
  const [current] = await db
    .select()
    .from(complianceTasks)
    .where(eq(complianceTasks.id, params.id));

  const base = current?.dueDate ? new Date(current.dueDate as any) : new Date();
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await db
    .update(complianceTasks)
    .set({ dueDate: next as any })
    .where(eq(complianceTasks.id, params.id));

  return NextResponse.json({ ok: true, dueDate: next.toISOString() });
}
