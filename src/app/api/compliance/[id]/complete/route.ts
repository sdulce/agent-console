import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { complianceTasks } from "@/server/schema";
import { eq } from "drizzle-orm";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await db
    .update(complianceTasks)
    .set({ status: "done" })
    .where(eq(complianceTasks.id, params.id));

  return NextResponse.json({ ok: true });
}
