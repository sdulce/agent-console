import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { leads } from "@/server/schema";

const Body = z.object({
  id: z.string().optional(),
  name: z.string(),
  source: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  priceRange: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  assignedAgentId: z.string().nullable().optional(),
  slaSeconds: z.number().int().positive().optional(),
  score: z.number().min(0).max(1).optional(),
});

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const id = body.id ?? `ld_${Date.now()}`;

  await db.insert(leads).values({
    id,
    name: body.name,
    source: body.source ?? null,
    phone: body.phone ?? null,
    location: body.location ?? null,
    priceRange: body.priceRange ?? null,
    notes: body.notes ?? null,
    assignedAgentId: body.assignedAgentId ?? null,
    slaSeconds: body.slaSeconds ?? 120,
    score: (body.score ?? 0.5) as any,
  });

  return NextResponse.json({ ok: true, id });
}
