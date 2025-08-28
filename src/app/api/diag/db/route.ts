export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { query } from "@/server/db";

export async function GET(_req: NextRequest) {
  try {
    const [version] = await query<{ version: string }>("select version()");
    const [db] = await query<{ db: string }>("select current_database() as db");
    const [usr] = await query<{ usr: string }>("select current_user as usr");

    const [leadsExists] = await query<{ exists: boolean }>(
      "select exists (select 1 from information_schema.tables where table_schema='public' and table_name='leads') as exists"
    );
    const [compExists] = await query<{ exists: boolean }>(
      "select exists (select 1 from information_schema.tables where table_schema='public' and table_name='compliance_tasks') as exists"
    );

    const result: Record<string, unknown> = {
      ok: true,
      version: version?.version,
      db: db?.db,
      user: usr?.usr,
      tables: {
        leads: leadsExists?.exists,
        compliance_tasks: compExists?.exists,
      },
    };

    if (leadsExists?.exists) {
      const [c] = await query<{ count: string }>(
        "select count(*)::int as count from leads"
      );
      result.leadsCount = Number(c?.count ?? 0);
    }
    if (compExists?.exists) {
      const [c2] = await query<{ count: string }>(
        "select count(*)::int as count from compliance_tasks"
      );
      result.complianceTasksCount = Number(c2?.count ?? 0);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const anyErr = err as any;
    const payload = {
      ok: false,
      name: anyErr?.name ?? "Error",
      code: anyErr?.code ?? null,
      error: anyErr instanceof Error ? anyErr.message : String(anyErr),
    };
    console.error("[GET /api/diag/db] ERROR:", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}
