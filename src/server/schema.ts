import { pgTable, text, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  source: text("source"),
  phone: text("phone"),
  location: text("location"),
  priceRange: text("price_range"),
  notes: text("notes"),
  assignedAgentId: text("assigned_agent_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  responded: boolean("responded").default(false),
  responseAt: timestamp("response_at", { mode: "date" }),
  slaSeconds: integer("sla_seconds").default(120),
  score: numeric("score", { precision: 4, scale: 2 }),
});

export const complianceTasks = pgTable("compliance_tasks", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),        // "buyer_agreement" | "comp_disclosure"
  client: text("client").notNull(),
  status: text("status").notNull(),    // "missing" | "pending" | "done"
  agentId: text("agent_id"),
  dueDate: timestamp("due_date", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});
