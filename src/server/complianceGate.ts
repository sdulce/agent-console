// src/server/complianceGate.ts
import { query } from "@/db";

/**
 * Gate for tour booking based on compliance_tasks.
 * Decides by *client name* + optional agentId (matches your current schema).
 */
export async function canBookTourForClient(client: string, agentId?: string | null) {
  // Latest buyer_agreement for this client (scoped to agent if provided)
  const rows = await query<{
    id: string;
    status: "pending" | "in_review" | "completed" | "overdue" | string;
    due_at: string | null;
    created_at: string;
  }>(
    `
    select id, status, due_at, created_at
      from public.compliance_tasks
     where type = 'buyer_agreement'
       and client = $1
       and ($2::text is null or agent_id = $2)
     order by created_at desc
     limit 1
    `,
    [client, agentId ?? null]
  );

  const latest = rows[0] ?? null;

  if (!latest) {
    return {
      allowed: false as const,
      reason: "no_buyer_agreement" as const,
      latest: null,
    };
  }
  if (latest.status === "completed") {
    return { allowed: true as const, reason: null, latest };
  }
  return {
    allowed: false as const,
    reason: "buyer_agreement_not_completed" as const,
    latest,
  };
}
