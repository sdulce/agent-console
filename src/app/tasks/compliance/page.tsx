// src/app/tasks/compliance/page.tsx
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  type: "buyer_agreement" | "comp_disclosure";
  client: string;
  status: "missing" | "pending" | "completed";
  agentId: string | null;
  dueDate: string | null; // ISO string from API
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default async function CompliancePage() {
  // In your environment, headers() returns a Promise — await it.
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/tasks/compliance`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch compliance tasks: ${res.status}`);

  const { data }: { data: Row[] } = await res.json();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Compliance Tasks</h1>

      {data.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2">{row.id}</td>
                  <td className="px-3 py-2 capitalize">{row.type.replace("_", " ")}</td>
                  <td className="px-3 py-2">{row.client}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">{row.agentId ?? "—"}</td>
                  <td className="px-3 py-2">{formatDateTime(row.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
