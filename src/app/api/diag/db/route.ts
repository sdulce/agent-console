export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { query } from "@/server/db";

type VersionRow = { version: string };
type DbRow = { db: string };
type UserRow = { usr: string };
type ExistsRow = { exists: boolean };
type CountRow = { count: number };

function toErrorPayload(err: unknown) {
  let name = "Error";
  let error = "Unknown error";
  let code: string | null = null;

  if (err instanceof Error) {
    name = err.name || name;
    error = err.message || error;
    const codeVal = (err as unknown as { code?: unknown }).code;
    if (typeof codeVal === "string") code = codeVal;
  } else if (err && typeof err === "object") {
    const rec = err as { name?: unknown; message?: unknown; error?: unknown; code?: unknown };
    if (typeof rec.name === "string") name = rec.name;
    if (typeof rec.message === "string") error = rec.message;
    if (typeof rec.error === "string") error = rec.error;
    if (typeof rec.code === "string") code = rec.code;
  } else if (typeof err === "string") {
    error = err;
  }

  return { ok: false as const, name, code, error };
}

export async function GET() {
  try {
    const [version] = await query<VersionRow>("select version()");
    const [db] = await query<DbRow>("select current_database() as db");
    const [usr] = await query<UserRow>("select current_user as usr");

    const [leadsExists] = await query<ExistsRow>(
      "select exists (select 1 from information_schema.tables where table_schema='public' and table_name='leads') as exists"
    );
    const [compExists] = await query<ExistsRow>(
      "select exists (select 1 from information_schema.tables where table_schema='public' and table_name='compliance_tasks') as exists"
    );

    const result: Record<string, unknown> = {
      ok: true,
      version: version?.version,
      db: db?.db,
      user: usr?.usr,
      tables: {
        leads: !!leadsExists?.exists,
        compliance_tasks: !!compExists?.exists,
      },
    };

    if (leadsExists?.exists) {
      const [c] = await query<CountRow>("select count(*)::int as count from leads");
      result.leadsCount = c?.count ?? 0;
    }
    if (compExists?.exists) {
      const [c2] = await query<CountRow>("select count(*)::int as count from compliance_tasks");
      result.complianceTasksCount = c2?.count ?? 0;
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const payload = toErrorPayload(err);
    console.error("[GET /api/diag/db] ERROR:", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}
