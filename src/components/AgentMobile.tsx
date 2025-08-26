"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PhoneCall,
  MessageSquare,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Filter,
  CheckCircle2,
  Bell,
  TrendingDown,
  TrendingUp,
  TimerReset,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ---------------------------------------------------------------------------------------
   Types
--------------------------------------------------------------------------------------- */

type Lead = {
  id: string;
  name: string;
  source?: string | null;
  phone?: string | null;
  createdAt: number;
  assignedAgentId?: string | null;
  responded: boolean;
  responseAt?: number | null;
  priceRange?: string | null;
  location?: string | null;
  notes?: string | null;
  slaSeconds: number;
  score: number; // 0..1
};

type ComplianceTask = {
  id: string;
  type: "buyer_agreement" | "comp_disclosure";
  client: string;
  dueInDays: number;
  status: "missing" | "pending" | "done";
  agent: string;
};

/* ---------------------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------------------- */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""; // empty = same origin

const secondsRemaining = (lead: Lead): number => {
  const elapsed = Math.floor((Date.now() - (lead.createdAt ?? Date.now())) / 1000);
  return Math.max((lead.slaSeconds ?? 120) - elapsed, 0);
};

const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

const formatTimer = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
};

type Severity = "ok" | "warn" | "breached";
const severityFor = (secs: number, responded: boolean): Severity => {
  if (responded) return "ok";
  if (secs === 0) return "breached";
  if (secs <= 30) return "warn";
  return "ok";
};

const typeLabel = (t: ComplianceTask["type"]): string =>
  t === "buyer_agreement" ? "Buyer Agreement" : "Comp Disclosure";

// safer JSON helper so UI never crashes on empty / non-JSON responses
const safeJson = async (r: Response) => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON");
  }
};

/* ---------------------------------------------------------------------------------------
   Component
--------------------------------------------------------------------------------------- */

export default function AgentMobile() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [query, setQuery] = useState<string>("");

  // Pull data from API on mount
  useEffect(() => {
    const agentId = "you";

    // Leads
    fetch(`${API_BASE}/api/leads?agentId=${agentId}`)
      .then(safeJson)
      .then((rows: any[]) => {
        setLeads((rows ?? []).map((r: any) => ({ ...r })) as Lead[]);
      })
      .catch((e) => {
        console.error("GET /api/leads failed", e);
        setLeads([]);
      });

    // Compliance tasks
    fetch(`${API_BASE}/api/tasks/compliance?agentId=${agentId}`)
      .then(safeJson)
      .then((rows: any[]) => {
        const now = Date.now();
        const mapped: ComplianceTask[] = (rows ?? []).map((r: any) => ({
          id: r.id,
          type: r.type,
          client: r.client,
          status: r.status,
          agent: r.agentId ?? "You",
          dueInDays: r.dueDate
            ? Math.ceil((new Date(r.dueDate).getTime() - now) / 86400000)
            : 0,
        }));
        setTasks(mapped);
      })
      .catch((e) => {
        console.error("GET /api/tasks/compliance failed", e);
        setTasks([]);
      });
  }, []);

  // Tick the SLA timers every second (re-render only)
  useEffect(() => {
    const id = setInterval(() => setLeads((prev) => [...prev]), 1000);
    return () => clearInterval(id);
  }, []);

  const filteredLeads = useMemo<Lead[]>(() => {
    const q = query.toLowerCase();
    return leads
      .filter((l) =>
        [l.name, l.location ?? "", l.source ?? "", l.notes ?? ""].some((v) =>
          (v || "").toLowerCase().includes(q)
        )
      )
      .sort((a, b) => secondsRemaining(a) - secondsRemaining(b));
  }, [leads, query]);

  const overdueFirstTasks = useMemo<ComplianceTask[]>(
    () => [...tasks].sort((a, b) => a.dueInDays - b.dueInDays),
    [tasks]
  );

  /* ------------------------------- Actions ------------------------------- */

  const markResponded = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/leads/${id}/responded`, { method: "POST" });
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, responded: true, responseAt: Date.now() } : l))
      );
    } catch (e) {
      console.error("POST mark responded failed", e);
    }
  };

  const snoozeTask = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/compliance/${id}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 1 }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, dueInDays: t.dueInDays + 1 } : t))
      );
    } catch (e) {
      console.error("POST snooze failed", e);
    }
  };

  const completeTask = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/compliance/${id}/complete`, { method: "POST" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error("POST complete failed", e);
    }
  };

  /* ------------------------------- UI ------------------------------- */

  // Temporary weekly nudge; later we’ll compute from real KPIs
  const MOCK_NUDGE = {
    weekOverWeekConversion: -0.18,
    coldLeads: 5,
    suggestion: "Call your top 3 scored leads first.",
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-3 sm:p-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Agent Console</h1>
        </div>
        <Button variant="ghost" className="rounded-2xl">
          <Bell className="w-5 h-5" />
        </Button>
      </div>

      {/* Weekly Nudge */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-3 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TimerReset className="w-4 h-4" /> Weekly Nudge
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {MOCK_NUDGE.weekOverWeekConversion < 0 ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="w-4 h-4" /> Conversion{" "}
                    {Math.round(MOCK_NUDGE.weekOverWeekConversion * -100)}% WoW
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-700">
                    <TrendingUp className="w-4 h-4" /> Conversion +
                    {Math.round(MOCK_NUDGE.weekOverWeekConversion * 100)}% WoW
                  </div>
                )}
                <div className="text-neutral-600">{MOCK_NUDGE.coldLeads} cold leads need attention</div>
              </div>
              <Button className="rounded-2xl" variant="secondary">
                View tips
              </Button>
            </div>
            <div className="mt-2 text-sm text-neutral-700">{MOCK_NUDGE.suggestion}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search / Filters */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search leads…"
            className="rounded-2xl pl-3"
          />
        </div>
        <Button variant="outline" className="rounded-2xl">
          <Filter className="w-4 h-4 mr-1" /> Filter
        </Button>
      </div>

      {/* SLA Lead Queue */}
      <h2 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Speed-to-Lead
      </h2>

      <div className="grid gap-3">
        {filteredLeads.length === 0 && (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-3 text-sm text-neutral-600">
              No leads yet. Ingest one via your API (POST /api/leads/ingest) and it will appear here.
            </CardContent>
          </Card>
        )}

        {filteredLeads.map((lead) => {
          const secs = secondsRemaining(lead);
          const sev = severityFor(secs, lead.responded);
          return (
            <Card key={lead.id} className="rounded-2xl shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold">
                      {lead.name}{" "}
                      <span className="text-neutral-500 font-normal">• {lead.location ?? "—"}</span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      {lead.priceRange ?? "—"} • {lead.source ?? "—"}
                    </div>
                    {lead.notes && (
                      <div className="text-xs text-neutral-500 line-clamp-2 mt-1">{lead.notes}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="rounded-full">
                        Score {(lead.score * 100).toFixed(0)}%
                      </Badge>
                      {lead.responded ? (
                        <Badge className="rounded-full bg-green-600 hover:bg-green-600">Responded</Badge>
                      ) : sev === "breached" ? (
                        <Badge className="rounded-full bg-red-600 hover:bg-red-600">SLA Breached</Badge>
                      ) : sev === "warn" ? (
                        <Badge className="rounded-full bg-amber-500 hover:bg-amber-500">{formatTimer(secs)}</Badge>
                      ) : (
                        <Badge className="rounded-full bg-emerald-500 hover:bg-emerald-500">{formatTimer(secs)}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`}>
                        <Button size="sm" className="rounded-2xl w-24">
                          <PhoneCall className="w-4 h-4 mr-1" /> Call
                        </Button>
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`sms:${lead.phone}?body=${encodeURIComponent(
                          `Hi ${lead.name.split(" ")[0]}, this is your agent. I just received your inquiry about ${
                            lead.location ?? "the area"
                          }. When is a good time to talk?`
                        )}`}
                      >
                        <Button size="sm" variant="secondary" className="rounded-2xl w-24">
                          <MessageSquare className="w-4 h-4 mr-1" /> SMS
                        </Button>
                      </a>
                    )}
                    {!lead.responded && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-2xl w-24"
                        onClick={() => markResponded(lead.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance Tasks */}
      <h2 className="text-sm font-medium text-neutral-700 mt-5 mb-2 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" /> Compliance Tasks
      </h2>

      <div className="grid gap-3 mb-28">
        {overdueFirstTasks.length === 0 && (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-3 text-sm text-neutral-600">
              No compliance tasks yet. Create one via API (POST /api/tasks/compliance/ingest) and it will appear here.
            </CardContent>
          </Card>
        )}

        {overdueFirstTasks.map((t) => (
          <Card key={t.id} className="rounded-2xl shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {typeLabel(t.type)}
                    {t.dueInDays < 0 ? (
                      <Badge className="rounded-full bg-red-600 hover:bg-red-600">
                        Overdue {Math.abs(t.dueInDays)}d
                      </Badge>
                    ) : t.dueInDays === 0 ? (
                      <Badge className="rounded-full bg-amber-500 hover:bg-amber-500">Due Today</Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full">
                        Due in {t.dueInDays}d
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-neutral-600">Client: {t.client}</div>
                  <div className="text-xs text-neutral-500">Status: {t.status}</div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="rounded-2xl w-28"
                    variant="secondary"
                    onClick={() => snoozeTask(t.id)}
                  >
                    <Clock className="w-4 h-4 mr-1" /> Snooze 1d
                  </Button>
                  <Button size="sm" className="rounded-2xl w-28" onClick={() => completeTask(t.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Done
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Dock */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-2 flex items-center justify-around max-w-xl mx-auto">
        <Button className="rounded-2xl" variant="ghost">
          <Clock className="w-5 h-5 mr-1" /> Leads
        </Button>
        <Button className="rounded-2xl" variant="ghost">
          <ShieldCheck className="w-5 h-5 mr-1" /> Compliance
        </Button>
        <Button className="rounded-2xl" variant="ghost">
          <AlertTriangle className="w-5 h-5 mr-1" /> Alerts
        </Button>
      </div>
    </div>
  );
}
