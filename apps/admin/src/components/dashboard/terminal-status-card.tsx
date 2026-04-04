"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/shared/card";
import { cn } from "@/lib/cn";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import { fetchTerminalDashboardData } from "@/lib/terminal-dashboard-action";
import {
  Monitor,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  PowerOff,
  Loader2,
} from "lucide-react";
import type { Locale } from "@macau-pos/i18n";

// ─── Types ───────────────────────────────────────────────────

type TerminalSummary = {
  total: number;
  online: number;
  offline: number;
  disabled: number;
  maintenance: number;
};

type TerminalRow = {
  id: string;
  name: string;
  code: string;
  status: "active" | "disabled" | "maintenance";
  lastHeartbeatAt: string | null;
  todayOrders: number;
  todayRevenue: number;
};

type DashboardData = {
  summary: TerminalSummary;
  terminals: TerminalRow[];
};

type DisplayStatus = "online" | "offline" | "disabled" | "maintenance";

function getDisplayStatus(
  status: "active" | "disabled" | "maintenance",
  lastHeartbeatAt: string | null
): DisplayStatus {
  if (status === "disabled") return "disabled";
  if (status === "maintenance") return "maintenance";
  if (!lastHeartbeatAt) return "offline";
  return Date.now() - new Date(lastHeartbeatAt).getTime() < 3 * 60 * 1000
    ? "online"
    : "offline";
}

function getStatusConfig(locale: Locale): Record<DisplayStatus, { color: string; bg: string; label: string }> {
  return {
    online: { color: "text-success", bg: "bg-success", label: t(locale, "terminalStatus.online") },
    offline: { color: "text-danger", bg: "bg-danger", label: t(locale, "terminalStatus.offline") },
    disabled: { color: "text-text-tertiary", bg: "bg-text-tertiary", label: t(locale, "terminals.statusDisabled") },
    maintenance: { color: "text-warning", bg: "bg-warning", label: t(locale, "terminals.statusMaintenance") },
  };
}

export function TerminalStatusCard() {
  const { locale } = useLocale();
  const statusCfg = getStatusConfig(locale);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = await fetchTerminalDashboardData();
        if (mounted && result) {
          setData(result as DashboardData);
        }
      } catch {
        // Silently fail — card will show empty state
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    // Auto-refresh every 30s
    const interval = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const summaryBadges: Array<{
    icon: typeof Wifi;
    labelKey: string;
    value: number;
    color: string;
    bg: string;
  }> = [
    {
      icon: Wifi,
      labelKey: "terminalStatus.online",
      value: data?.summary.online ?? 0,
      color: "text-success",
      bg: "bg-success-light",
    },
    {
      icon: WifiOff,
      labelKey: "terminalStatus.offline",
      value: data?.summary.offline ?? 0,
      color: "text-danger",
      bg: "bg-danger-light",
    },
    {
      icon: AlertTriangle,
      labelKey: "terminals.statusMaintenance",
      value: data?.summary.maintenance ?? 0,
      color: "text-warning",
      bg: "bg-warning-light",
    },
  ];

  return (
    <Card>
      <CardHeader
        title={t(locale, "terminalStatus.title")}
        subtitle={t(locale, "terminalStatus.subtitle")}
        action={
          loading ? (
            <Loader2 className="h-3.5 w-3.5 text-text-tertiary animate-spin" />
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <RefreshCw className="h-3 w-3" />
              <span>{interpolate(t(locale, "terminalStatus.total"), { count: data?.summary.total ?? 0 })}</span>
            </div>
          )
        }
      />

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {summaryBadges.map((item) => (
          <div
            key={item.labelKey}
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-[var(--radius-sm)]",
              item.bg
            )}
          >
            <item.icon className={cn("h-4 w-4", item.color)} strokeWidth={1.75} />
            <div>
              <p className={cn("text-lg font-semibold", item.color)}>
                {item.value}
              </p>
              <p className="text-xs text-text-secondary">{t(locale, item.labelKey as Parameters<typeof t>[1])}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Disabled count row */}
      {(data?.summary.disabled ?? 0) > 0 && (
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <PowerOff className="h-3.5 w-3.5 text-text-tertiary" />
            {data?.summary.disabled} {t(locale, "terminals.statusDisabled").toLowerCase()}
          </span>
          <span className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5 text-text-tertiary" />
            {interpolate(t(locale, "terminalStatus.total"), { count: data?.summary.total ?? 0 })}
          </span>
        </div>
      )}

      {/* Terminal list */}
      <div className="space-y-1">
        {loading ? (
          <div className="py-8 text-center text-sm text-text-tertiary">
            <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin" />
          </div>
        ) : data?.terminals.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-tertiary">
            {t(locale, "terminals.noResults")}
          </div>
        ) : (
          data?.terminals.map((terminal) => {
            const ds = getDisplayStatus(terminal.status, terminal.lastHeartbeatAt);
            const cfg = statusCfg[ds];
            return (
              <button
                key={terminal.id}
                className="w-full flex items-center gap-3 p-2.5 rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors text-left group"
              >
                <div className="relative">
                  <Monitor className="h-5 w-5 text-text-tertiary" strokeWidth={1.5} />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface",
                      cfg.bg
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {terminal.name}
                  </p>
                  <p className="text-xs text-text-tertiary">{terminal.code}</p>
                </div>
                <span className={cn("text-xs font-medium", cfg.color)}>
                  {cfg.label}
                </span>
                {ds === "online" && (
                  <span className="text-xs text-text-tertiary tabular-nums">
                    {interpolate(t(locale, "terminalStatus.sales"), { count: terminal.todayOrders })}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })
        )}
      </div>

      <a
        href="/terminals"
        className="w-full mt-3 py-2 text-xs font-medium text-accent hover:text-accent-dark transition-colors flex items-center justify-center gap-1"
      >
        {t(locale, "terminalStatus.viewAll")}
        <ChevronRight className="h-3 w-3" />
      </a>
    </Card>
  );
}
