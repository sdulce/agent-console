// src/server/store.ts
// Simple in-memory store for local dev/testing.
// ⚠️ Data resets whenever the dev server restarts.

export type LeadRow = {
  id: string;
  name: string;
  source?: string | null;
  phone?: string | null;
  location?: string | null;
  priceRange?: string | null;
  notes?: string | null;
  assignedAgentId?: string | null;
  createdAt: number;         // epoch ms
  responded: boolean;
  responseAt?: number | null;
  slaSeconds: number;        // SLA target (seconds)
  score: number;             // 0..1
};

export type TaskRow = {
  id: string;
  type: "buyer_agreement" | "comp_disclosure";
  client: string;
  status: "missing" | "pending" | "done";
  agentId?: string | null;
  dueDate?: string | null;   // ISO string
  createdAt: number;         // epoch ms
};

// ------------------------------------------------------------------
// Internal arrays (the "database")
// ------------------------------------------------------------------
const leads: LeadRow[] = [];
const tasks: TaskRow[] = [];

// ------------------------------------------------------------------
// Leads
// ------------------------------------------------------------------
export function addLead(p: Partial<LeadRow>): LeadRow {
  const row: LeadRow = {
    id: p.id ?? `ld_${Date.now()}`,
    name: p.name ?? "Unknown",
    source: p.source ?? null,
    phone: p.phone ?? null,
    location: p.location ?? null,
    priceRange: p.priceRange ?? null,
    notes: p.notes ?? null,
    assignedAgentId: p.assignedAgentId ?? null,
    createdAt: Date.now(),
    responded: false,
    responseAt: null,
    slaSeconds: typeof p.slaSeconds === "number" ? p.slaSeconds : 120,
    score: typeof p.score === "number" ? p.score : 0.5,
  };
  // newest first
  leads.unshift(row);
  return row;
}

export function listLeads(agentId?: string | null): LeadRow[] {
  return agentId ? leads.filter((l) => l.assignedAgentId === agentId) : [...leads];
}

export function markLeadResponded(id: string): boolean {
  const l = leads.find((x) => x.id === id);
  if (!l) return false;
  l.responded = true;
  l.responseAt = Date.now();
  return true;
}

// ------------------------------------------------------------------
// Compliance Tasks
// ------------------------------------------------------------------
export function addTask(p: Partial<TaskRow>): TaskRow {
  const row: TaskRow = {
    id: p.id ?? `ct_${Date.now()}`,
    type: (p.type as TaskRow["type"]) ?? "buyer_agreement",
    client: p.client ?? "Unknown",
    status: (p.status as TaskRow["status"]) ?? "pending",
    agentId: p.agentId ?? null,
    dueDate: p.dueDate ?? null, // ISO string
    createdAt: Date.now(),
  };
  tasks.unshift(row);
  return row;
}

export function listTasks(agentId?: string | null): TaskRow[] {
  return agentId ? tasks.filter((t) => t.agentId === agentId) : [...tasks];
}

export function snoozeTask(id: string, days: number = 1): boolean {
  const t = tasks.find((x) => x.id === id);
  if (!t) return false;
  const base = t.dueDate ? new Date(t.dueDate).getTime() : Date.now();
  const next = new Date(base + days * 24 * 60 * 60 * 1000);
  t.dueDate = next.toISOString();
  return true;
}

export function completeTask(id: string): boolean {
  const t = tasks.find((x) => x.id === id);
  if (!t) return false;
  t.status = "done";
  return true;
}
