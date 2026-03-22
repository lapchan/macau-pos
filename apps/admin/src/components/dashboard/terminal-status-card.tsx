"use client";

import { Card, CardHeader } from "@/components/shared/card";
import { cn } from "@/lib/cn";
import { terminalStatus } from "@/data/mock";
import {
  Monitor,
  Wifi,
  WifiOff,
  AlertTriangle,
  Package,
  CreditCard,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  online: { color: "text-success", bg: "bg-success", label: "Online" },
  offline: { color: "text-danger", bg: "bg-danger", label: "Offline" },
  warning: { color: "text-warning", bg: "bg-warning", label: "Warning" },
  refill: { color: "text-accent", bg: "bg-accent", label: "Refill needed" },
};

export function TerminalStatusCard() {
  return (
    <Card>
      <CardHeader
        title="Terminal status"
        subtitle="Real-time machine overview"
        action={
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <RefreshCw className="h-3 w-3" />
            <span>Synced {terminalStatus.lastSync}</span>
          </div>
        }
      />

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            icon: Wifi,
            label: "Online",
            value: terminalStatus.online,
            color: "text-success",
            bg: "bg-success-light",
          },
          {
            icon: WifiOff,
            label: "Offline",
            value: terminalStatus.offline,
            color: "text-danger",
            bg: "bg-danger-light",
          },
          {
            icon: AlertTriangle,
            label: "Warnings",
            value: terminalStatus.warning,
            color: "text-warning",
            bg: "bg-warning-light",
          },
        ].map((item) => (
          <div
            key={item.label}
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
              <p className="text-xs text-text-secondary">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional status row */}
      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-text-tertiary" />
          {terminalStatus.refillNeeded} need refill
        </span>
        <span className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-text-tertiary" />
          {terminalStatus.paymentIssue} payment issue
        </span>
        <span className="flex items-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 text-text-tertiary" />
          {terminalStatus.total} total
        </span>
      </div>

      {/* Terminal list */}
      <div className="space-y-1">
        {terminalStatus.terminals.map((terminal) => {
          const cfg = statusConfig[terminal.status];
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
                <p className="text-xs text-text-tertiary">{terminal.id}</p>
              </div>
              <span className={cn("text-xs font-medium", cfg.color)}>
                {cfg.label}
              </span>
              {terminal.status === "online" && (
                <span className="text-xs text-text-tertiary tabular-nums">
                  {terminal.sales} sales
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      <button className="w-full mt-3 py-2 text-xs font-medium text-accent hover:text-accent-dark transition-colors flex items-center justify-center gap-1">
        View all terminals
        <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
}
