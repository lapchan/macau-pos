"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { terminalsList } from "@/data/mock";
import {
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  Wrench,
  Monitor,
  Package,
  DollarSign,
  Clock,
  Signal,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Power,
  RotateCcw,
  Settings,
} from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }
> = {
  online: { label: "Online", color: "text-success", bg: "bg-success", icon: Wifi },
  offline: { label: "Offline", color: "text-danger", bg: "bg-danger", icon: WifiOff },
  warning: { label: "Warning", color: "text-warning", bg: "bg-warning", icon: AlertTriangle },
  maintenance: { label: "Maintenance", color: "text-text-tertiary", bg: "bg-text-tertiary", icon: Wrench },
};

export default function TerminalsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(null);
      }
    },
    []
  );

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [menuOpen, handleEscape]);

  const summary = {
    online: terminalsList.filter((t) => t.status === "online").length,
    offline: terminalsList.filter((t) => t.status === "offline").length,
    warning: terminalsList.filter((t) => t.status === "warning").length,
    maintenance: terminalsList.filter((t) => t.status === "maintenance").length,
  };

  return (
    <>
      <PageHeader
        title="Machines / Terminals"
        subtitle={`${terminalsList.length} devices registered`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-[var(--radius-sm)] overflow-hidden">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  view === v
                    ? "bg-text-primary text-white"
                    : "text-text-secondary hover:bg-surface-hover"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all">
            <Plus className="h-4 w-4" />
            Add terminal
          </button>
        </div>
      </PageHeader>

      {/* Summary badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(
          [
            { key: "online", icon: Wifi, bg: "bg-success-light", color: "text-success" },
            { key: "offline", icon: WifiOff, bg: "bg-danger-light", color: "text-danger" },
            { key: "warning", icon: AlertTriangle, bg: "bg-warning-light", color: "text-warning" },
            { key: "maintenance", icon: Wrench, bg: "bg-surface-hover", color: "text-text-secondary" },
          ] as const
        ).map((item) => (
          <Card key={item.key}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0",
                  item.bg
                )}
              >
                <item.icon className={cn("h-5 w-5", item.color)} strokeWidth={1.5} />
              </div>
              <div>
                <p className={cn("text-2xl font-semibold tabular-nums", item.color)}>
                  {summary[item.key]}
                </p>
                <p className="text-xs text-text-tertiary capitalize">{item.key}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Terminal cards grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terminalsList.map((terminal) => {
            const cfg = statusConfig[terminal.status];
            const StatusIcon = cfg.icon;
            return (
              <Card key={terminal.id} className="relative group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center">
                        <Monitor className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} />
                      </div>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface",
                          cfg.bg
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {terminal.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {terminal.id} · {terminal.location}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === terminal.id ? null : terminal.id)
                      }
                      aria-label={`Actions for ${terminal.name}`}
                      aria-expanded={menuOpen === terminal.id}
                      className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpen === terminal.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div role="menu" className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg z-20 py-1">
                          {[
                            { icon: Eye, label: "View details" },
                            { icon: RotateCcw, label: "Restart" },
                            { icon: Settings, label: "Configure" },
                            { icon: Power, label: "Disable", danger: true },
                          ].map((action) => (
                            <button
                              key={action.label}
                              role="menuitem"
                              onClick={() => setMenuOpen(null)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                                "danger" in action && action.danger
                                  ? "text-danger hover:bg-danger-light"
                                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                              )}
                            >
                              <action.icon className="h-3.5 w-3.5" />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                      cfg.color,
                      terminal.status === "online"
                        ? "bg-success-light"
                        : terminal.status === "offline"
                        ? "bg-danger-light"
                        : terminal.status === "warning"
                        ? "bg-warning-light"
                        : "bg-surface-hover"
                    )}
                  >
                    <StatusIcon className="h-3 w-3" strokeWidth={2} />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-text-tertiary">{terminal.model}</span>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary mb-0.5">
                      <DollarSign className="h-3 w-3" />
                      Revenue
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-text-primary">
                      MOP {terminal.todayRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary mb-0.5">
                      <Package className="h-3 w-3" />
                      Stock
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            terminal.stockLevel > 50
                              ? "bg-success"
                              : terminal.stockLevel > 20
                              ? "bg-warning"
                              : "bg-danger"
                          )}
                          style={{ width: `${terminal.stockLevel}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums text-text-secondary">
                        {terminal.stockLevel}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary mb-0.5">
                      <Clock className="h-3 w-3" />
                      Synced
                    </div>
                    <p className="text-xs font-medium text-text-secondary">
                      {terminal.lastSync}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List view */
        <Card padding="none">
          <table className="w-full text-sm" aria-label="Terminals list">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Terminal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Sales</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Last sync</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {terminalsList.map((terminal) => {
                const cfg = statusConfig[terminal.status];
                return (
                  <tr key={terminal.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{terminal.name}</p>
                        <p className="text-xs text-text-tertiary">{terminal.id} · {terminal.location}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", cfg.color)}>
                        <span className={cn("h-2 w-2 rounded-full", cfg.bg)} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 w-24">
                        <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              terminal.stockLevel > 50 ? "bg-success" : terminal.stockLevel > 20 ? "bg-warning" : "bg-danger"
                            )}
                            style={{ width: `${terminal.stockLevel}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-text-secondary">{terminal.stockLevel}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary font-medium">{terminal.todaySales}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary font-medium">MOP {terminal.todayRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{terminal.lastSync}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{terminal.uptime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
