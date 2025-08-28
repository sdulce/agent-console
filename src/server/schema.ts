import { pgTable, text, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";


// --- leads ---
export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  source: text("source"),
  phone: text("phone"),
  email: text("email"),  
  location: text("location"),
  priceRange: text("price_range"),
  notes: text("notes"),
  assignedAgentId: text("assigned_agent_id"),
  // ✅ store with timezone
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  responded: boolean("responded").default(false).notNull(),
  // ✅ store with timezone
  responseAt: timestamp("response_at", { withTimezone: true, mode: "date" }),
  slaSeconds: integer("sla_seconds").default(120).notNull(),
  score: numeric("score", { precision: 4, scale: 2 }).$type<string | null>(),
});

// --- complianceTasks ---
export const complianceTasks = pgTable("compliance_tasks", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),     // "buyer_agreement" | "comp_disclosure"
  client: text("client").notNull(),
  status: text("status").notNull(), // "missing" | "pending" | "completed"
  agentId: text("agent_id"),
  // due moment (timestamp with timezone); use `date("due_at")` if you want date-only
  dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }),
  // ✅ store with timezone
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});
