import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { leads } from "@/server/schema";
import { eq } from "drizzle-orm";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await db
    .update(leads)
    .set({ responded: true, responseAt: new Date() as any })
    .where(eq(leads.id, params.id));
  return NextResponse.json({ ok: true });
}
