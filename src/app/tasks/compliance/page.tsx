"use client";

import React, { useEffect, useState } from "react";

/* ----------------------------- Types ----------------------------- */

type Wire = {
  id: string;
  type: "buyer_agreement" | "comp_disclosure" | string;
  client: string;
  status: "pending" | "in_review" | "completed" | "overdue" | string;
  agentId: string | null;
  dueDate: string | null; // ISO (DB: due_at)
  createdAt: string;      // ISO
};

type Row = {
  id: string;
  type: "buyer_agreement" | "comp_disclosure";
  client: string;
  status: "missing" | "pending" | "completed";
  agentId: string | null;
  dueDate: string | null; // ISO for display
};

/* ----------------------------- Helpers --------------------------- */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""; // empty => same origin

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function toUiStatus(wireStatus: Wire["status"]): Row["status"] {
  if (wireStatus === "completed") return "completed";
  if (wireStatus === "pending" || wireStatus === "in_review") return "pending";
  return "missing";
}

function toUiType(wireType: Wire["type"]): Row["type"] {
  return wireType === "comp_disclosure" ? "comp_disclosure" : "buyer_agreement";
}

/* ----------------------------- Page ------------------------------ */

export default function CompliancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/compliance`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) throw new Error(`GET /api/tasks/compliance → ${res.status} ${res.statusText} ${text}`);
      const json = (text ? JSON.parse(text) : { data: [] }) as { data: Wire[] };

      const mapped: Row[] = (json.data || []).map((w) => ({
        id: w.id,
        type: toUiType(w.type),
        client: w.client,
        status: toUiStatus(w.status),
        agentId: w.agentId ?? null,
        dueDate: w.dueDate,
      }));

      // Overdue first, then nearest due date; keep nulls last
      const byDue = (a: Row, b: Row) => {
        const ta = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const tb = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return ta - tb;
      };

      setRows(mapped.sort(byDue));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      setErr(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function snooze(id: string, days = 1) {
    try {
      const res = await fetch(`${API_BASE}/api/compliance/${id}/snooze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`POST /api/compliance/${id}/snooze → ${res.status} ${t}`);
      }

      // Optimistic: bump dueDate locally
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const base = r.dueDate ? new Date(r.dueDate) : new Date();
          const next = new Date(base.getTime());
          next.setDate(base.getDate() + days);
          return { ...r, dueDate: next.toISOString() };
        })
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function complete(id: string) {
    try {
      const res = await fetch(`${API_BASE}/api/compliance/${id}/complete`, { method: "POST" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`POST /api/compliance/${id}/complete → ${res.status} ${t}`);
      }

      // Optimistic: hide from list after completion
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Compliance Tasks</h1>

      {err && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <div className="font-medium">Error</div>
          <div className="opacity-80">{err}</div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">No pending compliance tasks.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Agent</th>
                <th className="px-3 py-2 text-left">Due</th>
                <th className="px-3 py-2 text-left w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2">{row.id}</td>
                  <td className="px-3 py-2 capitalize">{row.type.replace("_", " ")}</td>
                  <td className="px-3 py-2">{row.client}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">{row.agentId ?? "—"}</td>
                  <td className="px-3 py-2">{formatDateTime(row.dueDate)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1 hover:bg-gray-50"
                        onClick={() => snooze(row.id, 1)}
                        disabled={row.status === "completed"}
                        title="Snooze by 1 day"
                      >
                        Snooze +1d
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:opacity-50"
                        onClick={() => complete(row.id)}
                        disabled={row.status === "completed"}
                        title="Mark complete"
                      >
                        Complete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
