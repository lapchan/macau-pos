import Link from "next/link";
import { Printer, Check, AlertTriangle, XCircle } from "lucide-react";
import { getFleetPrinterStatus } from "@/lib/printer-actions";

export const metadata = { title: "Printers" };
export const dynamic = "force-dynamic";

export default async function PrintersFleetPage() {
  const rows = await getFleetPrinterStatus();

  return (
    <div className="min-h-screen bg-surface-subtle">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Printer className="w-6 h-6 text-text-secondary" />
          <h1 className="text-[20px] font-semibold text-text-primary">Printers</h1>
        </div>

        {rows.length === 0 ? (
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] px-6 py-12 text-center">
            <p className="text-[14px] text-text-tertiary">
              No network printers provisioned yet.
            </p>
            <p className="text-[12px] text-text-tertiary mt-1">
              Open a location and click &ldquo;Network Printer&rdquo; to provision one.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-surface-subtle border-b border-border">
                <tr className="text-left text-[12px] uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Printer</th>
                  <th className="px-4 py-3">Last seen</th>
                  <th className="px-4 py-3">Bridge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.locationId} className="hover:bg-surface-subtle transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/locations/${r.locationId}/printer`}
                        className="text-text-primary font-medium hover:underline"
                      >
                        {r.locationName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{r.status}</td>
                    <td className="px-4 py-3">
                      <AlertBadge level={r.alertLevel} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{r.printerStatus}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {r.lastSeenAt
                        ? `${formatAge(r.lastSeenAgeSec)} ago`
                        : "never"}
                    </td>
                    <td className="px-4 py-3 text-text-tertiary font-mono text-[12px]">
                      {r.bridgeVersion ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBadge({ level }: { level: "ok" | "warning" | "error" }) {
  if (level === "ok") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <Check className="w-3.5 h-3.5" />
        OK
      </span>
    );
  }
  if (level === "warning") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600">
        <AlertTriangle className="w-3.5 h-3.5" />
        Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-red-600">
      <XCircle className="w-3.5 h-3.5" />
      Offline
    </span>
  );
}

function formatAge(seconds: number | null): string {
  if (seconds === null) return "never";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
