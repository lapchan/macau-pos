"use client";

import { useState, useTransition, useCallback } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { MetricCard } from "@/components/shared/metric-card";
import BottomSheet from "@/components/shared/bottom-sheet";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import { approveShift, flagShift, fetchFilteredShifts, fetchCashLog } from "@/lib/shift-actions";
import {
  Clock,
  Search,
  Check,
  AlertTriangle,
  X,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import type { ShiftRow, ShiftStats } from "@/lib/shift-queries";

type Props = {
  shifts: ShiftRow[];
  stats: ShiftStats;
};

const statusBadge: Record<string, { cls: string; key: string }> = {
  open: { cls: "bg-blue-50 text-blue-700", key: "shifts.statusOpen" },
  pending_approval: { cls: "bg-amber-50 text-amber-700", key: "shifts.statusPending" },
  closed: { cls: "bg-emerald-50 text-emerald-700", key: "shifts.statusClosed" },
  flagged: { cls: "bg-red-50 text-red-700", key: "shifts.statusFlagged" },
};

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

function fmtDuration(from: Date, to: Date | null) {
  const end = to ? new Date(to).getTime() : Date.now();
  const mins = Math.floor((end - new Date(from).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function exportCSV(rows: ShiftRow[]) {
  const headers = ["Cashier", "Terminal", "Location", "Opened", "Closed", "Duration", "Orders", "Sales", "Opening Float", "Expected Cash", "Actual Cash", "Variance", "Status"];
  const lines = [headers.join(",")];
  for (const s of rows) {
    lines.push([
      `"${s.cashierName}"`,
      `"${s.terminalName || ""}"`,
      `"${s.locationName || ""}"`,
      new Date(s.openedAt).toISOString(),
      s.closedAt ? new Date(s.closedAt).toISOString() : "",
      fmtDuration(s.openedAt, s.closedAt),
      s.totalOrders,
      s.totalSales,
      s.openingFloat,
      s.expectedCash,
      s.actualCash || "",
      s.variance || "",
      s.status,
    ].join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "shifts-export.csv";
  a.click();
}

type DateRange = { from: string; to: string };

function todayRange(): DateRange {
  const d = new Date();
  const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: `${ds}T00:00:00`, to: `${ds}T23:59:59` };
}

function shiftRange(range: DateRange, days: number): DateRange {
  const f = new Date(range.from); f.setDate(f.getDate() + days);
  const t = new Date(range.to); t.setDate(t.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return { from: toISO(f), to: toISO(t) };
}

function formatRangeLabel(range: DateRange): string {
  const today = todayRange();
  if (range.from === today.from && range.to === today.to) return "Today";
  const d = new Date(range.from);
  return new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).format(d);
}

export default function ShiftsClient({ shifts: initialShifts, stats }: Props) {
  const { locale } = useLocale();
  const [shifts, setShifts] = useState(initialShifts);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | null>(null); // null = all dates
  const [search, setSearch] = useState("");
  const [isFiltering, startFilterTransition] = useTransition();
  const [isActing, startActTransition] = useTransition();

  // Detail sheet
  const [detailShift, setDetailShift] = useState<ShiftRow | null>(null);
  const [cashLog, setCashLog] = useState<any[]>([]);

  const applyFilters = useCallback((status: string, range: DateRange | null) => {
    startFilterTransition(async () => {
      const filters: Record<string, string> = {};
      if (status !== "all") filters.status = status;
      if (range) {
        filters.dateFrom = new Date(range.from).toISOString();
        filters.dateTo = new Date(range.to).toISOString();
      }
      const result = await fetchFilteredShifts(Object.keys(filters).length > 0 ? filters : {});
      setShifts(result);
    });
  }, []);

  const filtered = search
    ? shifts.filter((s) => s.cashierName.toLowerCase().includes(search.toLowerCase()) || s.terminalName?.toLowerCase().includes(search.toLowerCase()))
    : shifts;

  const handleApprove = (shiftId: string) => {
    startActTransition(async () => {
      await approveShift(shiftId);
      setDetailShift(null);
      applyFilters(statusFilter, dateRange);
    });
  };

  const handleFlag = (shiftId: string) => {
    startActTransition(async () => {
      await flagShift(shiftId);
      setDetailShift(null);
      applyFilters(statusFilter, dateRange);
    });
  };

  return (
    <>
      <PageHeader
        title={t(locale, "shifts.title") || "Shifts"}
        subtitle={interpolate(t(locale, "shifts.shiftCount") || "{count} shifts", { count: filtered.length })}
      >
        <button
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {t(locale, "common.export")}
        </button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Date range navigator */}
        <div className="flex items-center border border-border rounded-[var(--radius-sm)] overflow-hidden">
          <button
            onClick={() => {
              const r = dateRange ? shiftRange(dateRange, -1) : shiftRange(todayRange(), -1);
              setDateRange(r);
              applyFilters(statusFilter, r);
            }}
            className="px-2 py-1.5 text-text-tertiary hover:bg-surface-hover transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (dateRange) { setDateRange(null); applyFilters(statusFilter, null); }
              else { const r = todayRange(); setDateRange(r); applyFilters(statusFilter, r); }
            }}
            className="px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors min-w-[110px] text-center flex items-center gap-1.5 justify-center"
          >
            <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
            {dateRange ? formatRangeLabel(dateRange) : t(locale, "orders.allDates") || "All dates"}
          </button>
          <button
            onClick={() => {
              const r = dateRange ? shiftRange(dateRange, 1) : shiftRange(todayRange(), 1);
              setDateRange(r);
              applyFilters(statusFilter, r);
            }}
            className="px-2 py-1.5 text-text-tertiary hover:bg-surface-hover transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); applyFilters(e.target.value, dateRange); }}
          className="h-[34px] pl-3 pr-7 text-xs font-medium bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        >
          <option value="all">{t(locale, "orders.allStatuses")}</option>
          <option value="open">{t(locale, "shifts.statusOpen")}</option>
          <option value="pending_approval">{t(locale, "shifts.statusPending")}</option>
          <option value="closed">{t(locale, "shifts.statusClosed")}</option>
          <option value="flagged">{t(locale, "shifts.statusFlagged")}</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder={t(locale, "shifts.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[34px] pl-9 pr-3 text-xs bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>

        {isFiltering && <Loader2 className="h-4 w-4 text-accent animate-spin" />}
      </div>

      {/* Table */}
      <Card padding="none" className="relative">
        {isFiltering && (
          <div className="absolute inset-0 z-10 bg-surface/60 flex items-center justify-center rounded-[var(--radius-md)]">
            <Loader2 className="h-5 w-5 text-accent animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  t(locale, "shifts.colCashier"),
                  t(locale, "shifts.colTerminal"),
                  t(locale, "shifts.colOpened"),
                  t(locale, "shifts.colDuration"),
                  t(locale, "shifts.colOrders"),
                  t(locale, "shifts.colSales"),
                  t(locale, "shifts.colVariance"),
                  t(locale, "shifts.colStatus"),
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((shift) => {
                const badge = statusBadge[shift.status] || statusBadge.open;
                const variance = shift.variance ? parseFloat(shift.variance) : null;
                return (
                  <tr
                    key={shift.id}
                    onClick={() => { setDetailShift(shift); fetchCashLog(shift.id).then(setCashLog); }}
                    className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{shift.cashierName}</td>
                    <td className="px-4 py-3 text-text-secondary">{shift.terminalCode ? `${shift.terminalCode} · ${shift.terminalName}` : "—"}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{fmtDate(shift.openedAt)}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{fmtDuration(shift.openedAt, shift.closedAt)}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{shift.totalOrders}</td>
                    <td className="px-4 py-3 font-medium text-text-primary tabular-nums">MOP {parseFloat(shift.totalSales).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {variance !== null ? (
                        <span className={cn("font-medium", Math.abs(variance) <= 5 ? "text-success" : "text-danger")}>
                          {variance >= 0 ? "+" : ""}{variance.toFixed(2)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]", badge.cls)}>
                        {t(locale, badge.key as any)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Clock className="h-8 w-8 text-text-tertiary/40 mb-2" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-text-primary">{t(locale, "shifts.noShifts")}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{t(locale, "shifts.noShiftsHint")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail BottomSheet */}
      <BottomSheet
        open={!!detailShift}
        onClose={() => setDetailShift(null)}
        header={
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-[15px] font-semibold text-text-primary">
              Shift — {detailShift?.cashierName}
            </h2>
            <button onClick={() => setDetailShift(null)} className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-hover transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        }
      >
        {detailShift && (
          <div className="px-5 py-5 space-y-5">
            <Card>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.cashier")}</p>
                  <p className="text-sm font-medium text-text-primary">{detailShift.cashierName}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.terminal")}</p>
                  <p className="text-sm font-medium text-text-primary">{detailShift.terminalCode ? `${detailShift.terminalCode} · ${detailShift.terminalName}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.location")}</p>
                  <p className="text-sm font-medium text-text-primary">{detailShift.locationName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.status")}</p>
                  <span className={cn("inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]", (statusBadge[detailShift.status] || statusBadge.open).cls)}>
                    {t(locale, ((statusBadge[detailShift.status] || statusBadge.open).key) as any)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.opened")}</p>
                  <p className="text-sm text-text-primary">{fmtDate(detailShift.openedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.closed")}</p>
                  <p className="text-sm text-text-primary">{fmtDate(detailShift.closedAt)}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.orders")}</p>
                  <p className="text-lg font-semibold text-text-primary tabular-nums">{detailShift.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.totalSales")}</p>
                  <p className="text-lg font-semibold text-text-primary tabular-nums">MOP {parseFloat(detailShift.totalSales).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.openingFloat")}</p>
                  <p className="text-sm text-text-primary tabular-nums">MOP {parseFloat(detailShift.openingFloat).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.expectedCash")}</p>
                  <p className="text-sm text-text-primary tabular-nums">MOP {parseFloat(detailShift.expectedCash).toFixed(2)}</p>
                </div>
                {detailShift.actualCash && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.actualCash")}</p>
                    <p className="text-sm text-text-primary tabular-nums">MOP {parseFloat(detailShift.actualCash).toFixed(2)}</p>
                  </div>
                )}
                {detailShift.variance && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.variance")}</p>
                    <p className={cn("text-sm font-medium tabular-nums", Math.abs(parseFloat(detailShift.variance)) <= 5 ? "text-success" : "text-danger")}>
                      MOP {parseFloat(detailShift.variance) >= 0 ? "+" : ""}{parseFloat(detailShift.variance).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {detailShift.notes && (
              <Card>
                <p className="text-xs text-text-tertiary mb-1">{t(locale, "shifts.detail.notes")}</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{detailShift.notes}</p>
              </Card>
            )}

            {/* Cash Ledger */}
            {cashLog.length > 0 && (
              <Card padding="none">
                <div className="px-5 pt-4 pb-2">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t(locale, "shifts.cashLedger")}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase">{t(locale, "shifts.ledgerTime")}</th>
                        <th className="text-left px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase">{t(locale, "shifts.ledgerEvent")}</th>
                        <th className="text-right px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase">{t(locale, "shifts.ledgerIn")}</th>
                        <th className="text-right px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase">{t(locale, "shifts.ledgerOut")}</th>
                        <th className="text-right px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase">{t(locale, "shifts.ledgerBalance")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashLog.map((entry) => (
                        <tr key={entry.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-2 text-[11px] text-text-tertiary whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-2 text-[11px] text-text-primary">
                            <span className={cn(
                              "inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium",
                              entry.eventType === "shift_open" ? "bg-blue-50 text-blue-700" :
                              entry.eventType === "cash_sale" ? "bg-emerald-50 text-emerald-700" :
                              entry.eventType === "cash_change" ? "bg-amber-50 text-amber-700" :
                              entry.eventType === "shift_close" ? "bg-gray-100 text-gray-600" :
                              "bg-surface-hover text-text-secondary"
                            )}>
                              {entry.eventType.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-[11px] tabular-nums text-emerald-600 font-medium">
                            {parseFloat(entry.creditAmount) > 0 ? `+${parseFloat(entry.creditAmount).toFixed(2)}` : ""}
                          </td>
                          <td className="px-4 py-2 text-right text-[11px] tabular-nums text-danger font-medium">
                            {parseFloat(entry.debitAmount) > 0 ? `-${parseFloat(entry.debitAmount).toFixed(2)}` : ""}
                          </td>
                          <td className="px-4 py-2 text-right text-[11px] tabular-nums text-text-primary font-semibold">
                            {parseFloat(entry.balanceAfter).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Actions for pending_approval shifts */}
            {detailShift.status === "pending_approval" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(detailShift.id)}
                  disabled={isActing}
                  className="flex-1 h-10 rounded-[var(--radius-md)] bg-text-primary text-white text-[13px] font-medium hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" /> {t(locale, "shifts.approve")}
                </button>
                <button
                  onClick={() => handleFlag(detailShift.id)}
                  disabled={isActing}
                  className="flex-1 h-10 rounded-[var(--radius-md)] bg-danger text-white text-[13px] font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" /> {t(locale, "shifts.flag")}
                </button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
