"use client";

import { useState, useMemo, useCallback, useTransition, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/shared/card";
import { MetricCard } from "@/components/shared/metric-card";
import BottomSheet from "@/components/shared/bottom-sheet";
import {
  Search,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronDetail,
  Package,
  X,
  Loader2,
  Download,
  Calendar,
} from "lucide-react";
import type { OrderRow, OrderStats, OrderDetail } from "@/lib/queries";
import { fetchOrderDetail, fetchFilteredOrders } from "@/lib/order-actions";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import type { Locale } from "@macau-pos/i18n";

const PAGE_SIZE = 20;

const statusBadgeClass: Record<string, string> = {
  completed: "bg-success-light text-success",
  pending: "bg-warning-light text-warning",
  cancelled: "bg-danger-light text-danger",
  refunded: "bg-surface-hover text-text-tertiary",
};

const statusLabelKeys: Record<string, string> = {
  completed: "orders.statusCompleted",
  pending: "orders.statusPending",
  cancelled: "orders.statusCancelled",
  refunded: "orders.statusRefunded",
};

const paymentBadgeClass: Record<string, string> = {
  cash: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  mpay: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  alipay: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  wechat_pay: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  visa: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  mastercard: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  unionpay: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const paymentLabelKeys: Record<string, string> = {
  cash: "orders.payCash",
  mpay: "orders.payMpay",
  alipay: "orders.payAlipay",
  wechat_pay: "orders.payWechat",
  visa: "orders.payVisa",
  mastercard: "orders.payMastercard",
  unionpay: "orders.payUnionpay",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

function formatMOP(amount: string | number, mopLabel: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${mopLabel} ${num.toFixed(1)}`;
}

function formatMOP2(amount: string | number, mopLabel: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${mopLabel} ${num.toFixed(2)}`;
}

type Props = {
  orders: OrderRow[];
  stats: OrderStats;
};

type DateRange = { from: string; to: string }; // ISO datetime strings

function todayRange(): DateRange {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: `${dateStr}T00:00:00`, to: `${dateStr}T23:59:59` };
}

function shiftRange(range: DateRange, days: number): DateRange {
  const fromD = new Date(range.from);
  const toD = new Date(range.to);
  fromD.setDate(fromD.getDate() + days);
  toD.setDate(toD.getDate() + days);
  return { from: toLocalISO(fromD), to: toLocalISO(toD) };
}

function toLocalISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function formatRangeLabel(range: DateRange) {
  // Check if range is today's full day
  const today = todayRange();
  if (range.from === today.from && range.to === today.to) return "Today";

  const from = new Date(range.from);
  const to = new Date(range.to);
  const fmt = (d: Date) => new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).format(d);
  const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const sameDay = from.toDateString() === to.toDateString();
  if (sameDay && fmtTime(from) === "00:00" && fmtTime(to) === "23:59") return fmt(from);
  if (sameDay) return `${fmt(from)} ${fmtTime(from)} – ${fmtTime(to)}`;
  return `${fmt(from)} – ${fmt(to)}`;
}

function dateOnly(iso: string) { return iso.slice(0, 10); }
function timeOnly(iso: string) { return iso.slice(11, 16); }

// ─── Date Range Picker Dropdown ──────────────────────────
function DateRangePicker({ range, onApply, onClose }: { range: DateRange; onApply: (r: DateRange) => void; onClose: () => void }) {
  const todayPreset = todayRange;
  const [fromDate, setFromDate] = useState(dateOnly(range.from));
  const [fromTime, setFromTime] = useState(timeOnly(range.from));
  const [toDate, setToDate] = useState(dateOnly(range.to));
  const [toTime, setToTime] = useState(timeOnly(range.to));
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(range.from);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const firstDow = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(viewMonth.year, viewMonth.month, 1));
  const prevMonth = () => setViewMonth((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const nextMonth = () => setViewMonth((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function handleDayClick(dateStr: string) {
    if (selecting === "from") {
      setFromDate(dateStr);
      if (dateStr > toDate) setToDate(dateStr);
      setSelecting("to");
    } else {
      if (dateStr < fromDate) { setFromDate(dateStr); } else { setToDate(dateStr); }
      setSelecting("from");
    }
  }

  function handleApply() {
    onApply({ from: `${fromDate}T${fromTime}:00`, to: `${toDate}T${toTime}:59` });
    onClose();
  }

  function isInRange(dateStr: string) {
    return dateStr >= fromDate && dateStr <= toDate;
  }

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1.5 z-30 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg p-3 w-[300px] animate-scale-in">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-surface-hover transition-colors"><ChevronLeft className="h-4 w-4 text-text-secondary" /></button>
        <span className="text-xs font-semibold text-text-primary">{monthLabel}</span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-surface-hover transition-colors"><ChevronRight className="h-4 w-4 text-text-secondary" /></button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d} className="text-[10px] font-medium text-text-tertiary py-1">{d}</span>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5 mb-3">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const ds = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFrom = ds === fromDate;
          const isTo = ds === toDate;
          const inRange = isInRange(ds) && !isFrom && !isTo;
          const isToday = ds === todayStr;
          return (
            <button
              key={ds}
              onClick={() => handleDayClick(ds)}
              className={cn(
                "h-7 w-full rounded-[3px] text-[11px] font-medium transition-colors",
                (isFrom || isTo) ? "bg-text-primary text-white" : inRange ? "bg-accent/10 text-accent" : isToday ? "ring-1 ring-accent/40 text-accent" : "text-text-primary hover:bg-surface-hover"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
      {/* Date range inputs */}
      <div className="border-t border-border pt-3 mb-2">
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <label className="block text-[10px] font-medium text-text-tertiary mb-1">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full h-8 px-2 text-[11px] bg-background border border-border rounded-[var(--radius-sm)] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-text-tertiary mb-1">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full h-8 px-2 text-[11px] bg-background border border-border rounded-[var(--radius-sm)] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
        </div>
        {/* Time range inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-text-tertiary mb-1">Start time</label>
            <input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="w-full h-8 px-2 text-[11px] bg-background border border-border rounded-[var(--radius-sm)] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-text-tertiary mb-1">End time</label>
            <input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} className="w-full h-8 px-2 text-[11px] bg-background border border-border rounded-[var(--radius-sm)] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
        </div>
      </div>
      {/* Quick presets + Apply */}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => {
            const t = todayPreset();
            setFromDate(dateOnly(t.from)); setToDate(dateOnly(t.to));
            setFromTime(timeOnly(t.from)); setToTime(timeOnly(t.to));
          }}
          className="h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)] border border-border text-text-secondary hover:bg-surface-hover transition-colors"
        >
          Today
        </button>
        <button onClick={handleApply} className="flex-1 h-8 rounded-[var(--radius-sm)] bg-text-primary text-white text-xs font-medium hover:opacity-90 transition-colors">
          Apply
        </button>
      </div>
    </div>
  );
}

function exportCSV(rows: OrderRow[], mopLabel: string) {
  const headers = ["Order #", "Date", "Items", "Subtotal", "Total", "Payment", "Status"];
  const csvRows = [headers.join(",")];
  for (const o of rows) {
    csvRows.push([
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.itemCount,
      o.subtotal,
      o.total,
      o.paymentMethod || "",
      o.status,
    ].map((v) => `"${v}"`).join(","));
  }
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersClient({ orders, stats }: Props) {
  const { locale } = useLocale();
  const mopLabel = t(locale, "common.mop");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ─── Filter state ──────────────────────────────────
  const [dateRange, setDateRange] = useState<DateRange>(todayRange);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  // Initial data from server is unfiltered — we'll apply today filter on mount
  const [filteredOrders, setFilteredOrders] = useState<OrderRow[]>(() => {
    // Client-side filter for initial render (today only)
    const range = todayRange();
    const fromTs = new Date(range.from).getTime();
    const toTs = new Date(range.to).getTime();
    return orders.filter((o) => {
      const ts = new Date(o.createdAt).getTime();
      return ts >= fromTs && ts <= toTs;
    });
  });
  const [isFiltering, startFilterTransition] = useTransition();

  const applyFilters = useCallback((range: DateRange, status: string, payment: string) => {
    startFilterTransition(async () => {
      const filters: Record<string, string> = {
        dateFrom: new Date(range.from).toISOString(),
        dateTo: new Date(range.to).toISOString(),
      };
      if (status !== "all") filters.status = status;
      if (payment !== "all") filters.paymentMethod = payment;

      const result = await fetchFilteredOrders(filters);
      setFilteredOrders(result);
      setPage(1);
    });
  }, []);

  // ─── Detail sheet state ─────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const openDetail = useCallback(async (orderId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const result = await fetchOrderDetail(orderId);
      setDetail(result);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetail(null);
  }, []);

  // Client-side search on top of server-filtered results
  const searched = useMemo(() => {
    if (!search) return filteredOrders;
    const q = search.toLowerCase();
    return filteredOrders.filter((o) => o.orderNumber.toLowerCase().includes(q));
  }, [filteredOrders, search]);

  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = searched.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const subtitle = interpolate(t(locale, "orders.orderCount"), { count: searched.length });

  // Date nav helpers — shift range by 1 day
  const handleDatePrev = () => {
    const r = shiftRange(dateRange, -1);
    setDateRange(r);
    applyFilters(r, statusFilter, paymentFilter);
  };
  const handleDateNext = () => {
    const r = shiftRange(dateRange, 1);
    setDateRange(r);
    applyFilters(r, statusFilter, paymentFilter);
  };
  const handleDateRangeApply = (r: DateRange) => {
    setDateRange(r);
    applyFilters(r, statusFilter, paymentFilter);
  };

  // ─── Filtered stats (computed from searched results) ─────
  const filteredStats = useMemo(() => {
    const totalOrders = searched.length;
    const totalRevenue = searched.reduce((sum, o) => sum + parseFloat(String(o.total)), 0);
    const completedOrders = searched.filter((o) => o.status === "completed").length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalOrders, totalRevenue, completedOrders, avgOrderValue };
  }, [searched]);

  const hasActiveFilters = statusFilter !== "all" || paymentFilter !== "all" || search;

  return (
    <>
      <PageHeader title={t(locale, "orders.title")} subtitle={subtitle}>
        <button
          onClick={() => exportCSV(searched, mopLabel)}
          disabled={searched.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {t(locale, "common.export")}
        </button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Date range navigator */}
        <div className="relative flex items-center border border-border rounded-[var(--radius-sm)] overflow-visible">
          <button
            onClick={handleDatePrev}
            className="px-2 py-1.5 text-text-tertiary hover:bg-surface-hover transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors min-w-[140px] text-center flex items-center gap-1.5 justify-center"
          >
            <Calendar className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            <span className="truncate">{formatRangeLabel(dateRange)}</span>
          </button>
          <button
            onClick={handleDateNext}
            className="px-2 py-1.5 text-text-tertiary hover:bg-surface-hover transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {calendarOpen && (
            <DateRangePicker
              range={dateRange}
              onApply={handleDateRangeApply}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </div>

        {/* Payment method filter */}
        <div className="relative">
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); applyFilters(dateRange, statusFilter, e.target.value); }}
            className="h-[34px] pl-3 pr-7 text-xs font-medium bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          >
            <option value="all">{t(locale, "orders.allMethods")}</option>
            <option value="cash">{t(locale, "orders.payCash")}</option>
            <option value="tap">Tap</option>
            <option value="insert">Insert</option>
            <option value="qr">QR</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); applyFilters(dateRange, e.target.value, paymentFilter); }}
            className="h-[34px] pl-3 pr-7 text-xs font-medium bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          >
            <option value="all">{t(locale, "orders.allStatuses")}</option>
            <option value="completed">{t(locale, "orders.statusCompleted")}</option>
            <option value="pending">{t(locale, "orders.statusPending")}</option>
            <option value="refunded">{t(locale, "orders.statusRefunded")}</option>
            <option value="voided">{t(locale, "orders.statusVoided")}</option>
          </select>
        </div>

        {/* Order number search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder={t(locale, "orders.searchPlaceholder")}
            aria-label={t(locale, "common.search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-[34px] pl-9 pr-3 text-xs bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>

      </div>

      {/* Stats row — always reflects filtered/searched results */}
      <Card className="mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label={t(locale, "orders.filteredOrders")}
            value={String(filteredStats.totalOrders)}
            change="--"
            up={true}
          />
          <MetricCard
            label={t(locale, "orders.filteredRevenue")}
            value={formatMOP(filteredStats.totalRevenue, mopLabel)}
            change="--"
            up={true}
          />
          <MetricCard
            label={t(locale, "orders.completedOrders")}
            value={String(filteredStats.completedOrders)}
            change="--"
            up={true}
          />
          <MetricCard
            label={t(locale, "orders.avgOrderValue")}
            value={formatMOP(filteredStats.avgOrderValue, mopLabel)}
            change="--"
            up={true}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t(locale, "orders.title")}>
            <thead>
              <tr className="border-b border-border">
                {[
                  { label: t(locale, "orders.colOrderNumber"), left: true },
                  { label: t(locale, "orders.colDate"), left: true },
                  { label: t(locale, "orders.colItems"), right: true },
                  { label: t(locale, "orders.colTotal"), right: true },
                  { label: t(locale, "orders.colPayment"), left: true },
                  { label: t(locale, "orders.colStatus"), left: true },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      "px-4 py-3",
                      col.right ? "text-right" : "text-left"
                    )}
                  >
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {col.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isFiltering && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`shimmer-${i}`} className="border-b border-border last:border-0">
                  {[120, 100, 40, 70, 60, 70].map((w, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 rounded-[var(--radius-sm)] bg-surface-hover animate-pulse" style={{ width: `${w}px` }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!isFiltering && paged.map((order) => {
                const sBadgeClass = statusBadgeClass[order.status] || statusBadgeClass.completed;
                const sBadgeLabel = t(locale, (statusLabelKeys[order.status] || "orders.statusCompleted") as any);
                const pBadgeClass = order.paymentMethod
                  ? (paymentBadgeClass[order.paymentMethod] || "bg-surface-hover text-text-secondary")
                  : "bg-surface-hover text-text-tertiary";
                const pBadgeLabel = order.paymentMethod
                  ? t(locale, (paymentLabelKeys[order.paymentMethod] || order.paymentMethod) as any)
                  : "—";

                return (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors group cursor-pointer"
                    onClick={() => openDetail(order.id)}
                  >
                    <td className="px-4 py-3 font-medium text-accent">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                      {order.itemCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-text-primary">
                      {formatMOP(order.total, mopLabel)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                          pBadgeClass
                        )}
                      >
                        {pBadgeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                            sBadgeClass
                          )}
                        >
                          {sBadgeLabel}
                        </span>
                        <ChevronDetail className="ml-auto h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isFiltering && searched.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center mb-3">
                        <Receipt
                          className="h-6 w-6 text-text-tertiary"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">
                        {t(locale, "orders.noOrders")}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {search
                          ? t(locale, "orders.noOrdersHintFiltered")
                          : t(locale, "orders.noOrdersHint")}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {searched.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-tertiary">
              {interpolate(t(locale, "common.showingRange"), { start: (currentPage - 1) * PAGE_SIZE + 1, end: Math.min(currentPage * PAGE_SIZE, searched.length), total: searched.length })}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label={t(locale, "common.previousPage")}
                className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={cn(
                    "h-8 w-8 rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
                    p === currentPage
                      ? "bg-text-primary text-white"
                      : "text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label={t(locale, "common.nextPage")}
                className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── Order Detail Bottom Sheet ─── */}
      <BottomSheet
        open={detailOpen}
        onClose={closeDetail}
        snapPoints={[1.0]}
        header={
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-base font-semibold text-text-primary">
              {detail
                ? interpolate(t(locale, "orders.detail.title"), {
                    orderNumber: detail.order.orderNumber,
                  })
                : t(locale, "orders.detail.title").replace("{orderNumber}", "...")}
            </h2>
            <button
              onClick={closeDetail}
              className="p-1.5 -mr-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        }
      >
        {detailLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-6 w-6 text-accent animate-spin mb-3" />
            <p className="text-sm text-text-tertiary">Loading...</p>
          </div>
        ) : !detail ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center mb-3">
              <Receipt className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">
              {t(locale, "orders.detail.notFound")}
            </p>
            <p className="text-xs text-text-secondary">
              {t(locale, "orders.detail.notFoundHint")}
            </p>
          </div>
        ) : (
          <OrderDetailContent detail={detail} locale={locale} mopLabel={mopLabel} />
        )}
      </BottomSheet>
    </>
  );
}

/* ─── Detail Content (rendered inside sheet) ─── */

function OrderDetailContent({
  detail,
  locale,
  mopLabel,
}: {
  detail: OrderDetail;
  locale: Locale;
  mopLabel: string;
}) {
  const { order, items, payment } = detail;

  const sBadgeClass = statusBadgeClass[order.status] || statusBadgeClass.completed;
  const sBadgeLabel = t(locale, (statusLabelKeys[order.status] || "orders.statusCompleted") as any);

  const subtotal = parseFloat(order.subtotal ?? "0");
  const discount = parseFloat(order.discountAmount ?? "0");
  const tax = parseFloat(order.taxAmount ?? "0");
  const total = parseFloat(order.total ?? "0");

  return (
    <div className="px-5 py-5 space-y-6">
      {/* ─── Top: Order Info + Payment side by side ─── */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Order Information */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              {t(locale, "orders.detail.orderInfo")}
            </h3>
            <dl className="space-y-2.5">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-text-secondary">
                  {t(locale, "orders.detail.status")}
                </dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                      sBadgeClass
                    )}
                  >
                    {sBadgeLabel}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">
                  {t(locale, "orders.detail.date")}
                </dt>
                <dd className="text-sm text-text-primary">
                  {formatDateTime(order.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-text-secondary">
                  {t(locale, "orders.colItems")}
                </dt>
                <dd className="text-sm text-text-primary">
                  {interpolate(t(locale, "orders.detail.itemCount"), {
                    count: order.itemCount,
                  })}
                </dd>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between">
                <dt className="text-sm text-text-secondary">
                  {t(locale, "orders.detail.subtotal")}
                </dt>
                <dd className="text-sm text-text-primary tabular-nums">
                  {formatMOP2(subtotal, mopLabel)}
                </dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-sm text-text-secondary">
                    {t(locale, "orders.detail.discount")}
                  </dt>
                  <dd className="text-sm text-danger tabular-nums">
                    -{formatMOP2(discount, mopLabel)}
                  </dd>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-sm text-text-secondary">
                    {t(locale, "orders.detail.tax")}
                  </dt>
                  <dd className="text-sm text-text-primary tabular-nums">
                    {formatMOP2(tax, mopLabel)}
                  </dd>
                </div>
              )}
              <div className="border-t border-border pt-2.5 flex justify-between">
                <dt className="text-sm font-semibold text-text-primary">
                  {t(locale, "orders.detail.total")}
                </dt>
                <dd className="text-sm font-semibold text-text-primary tabular-nums">
                  {formatMOP2(total, mopLabel)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              {t(locale, "orders.detail.paymentInfo")}
            </h3>
            {payment ? (
              <dl className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-text-secondary">
                    {t(locale, "orders.detail.paymentMethod")}
                  </dt>
                  <dd>
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                        paymentBadgeClass[payment.method] ||
                          "bg-surface-hover text-text-secondary"
                      )}
                    >
                      {t(
                        locale,
                        (paymentLabelKeys[payment.method] ||
                          payment.method) as any
                      )}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-text-secondary">
                    {t(locale, "orders.detail.amountPaid")}
                  </dt>
                  <dd className="text-sm text-text-primary tabular-nums">
                    {formatMOP2(payment.amount, mopLabel)}
                  </dd>
                </div>
                {payment.cashReceived && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-text-secondary">
                      {t(locale, "orders.detail.cashReceived")}
                    </dt>
                    <dd className="text-sm text-text-primary tabular-nums">
                      {formatMOP2(payment.cashReceived, mopLabel)}
                    </dd>
                  </div>
                )}
                {payment.changeGiven && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-text-secondary">
                      {t(locale, "orders.detail.changeGiven")}
                    </dt>
                    <dd className="text-sm text-text-primary tabular-nums">
                      {formatMOP2(payment.changeGiven, mopLabel)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-text-secondary">
                    {t(locale, "orders.detail.paidAt")}
                  </dt>
                  <dd className="text-sm text-text-primary">
                    {formatDateTime(payment.createdAt)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-text-tertiary italic">—</p>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="mt-5 pt-4 border-t border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  {t(locale, "orders.detail.notes")}
                </h3>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ─── Bottom: Line Items Table ─── */}
      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <CardHeader
            title={t(locale, "orders.detail.lineItems")}
            subtitle={interpolate(t(locale, "orders.detail.itemCount"), {
              count: items.length,
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            aria-label={t(locale, "orders.detail.lineItems")}
          >
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t(locale, "orders.detail.product")}
                  </span>
                </th>
                <th className="px-5 py-3 text-right">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t(locale, "orders.detail.unitPrice")}
                  </span>
                </th>
                <th className="px-5 py-3 text-right">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t(locale, "orders.detail.qty")}
                  </span>
                </th>
                <th className="px-5 py-3 text-right">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {t(locale, "orders.detail.lineTotal")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const itemName =
                  (item.translations as any)?.[locale] || item.name;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center flex-shrink-0">
                          <Package
                            className="h-4 w-4 text-text-tertiary"
                            strokeWidth={1.5}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {itemName}
                          </p>
                          {(item.variantName || item.optionCombo) && (
                            <p className="text-xs text-text-tertiary mt-0.5">
                              {[item.variantName, item.optionCombo]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                      {formatMOP2(item.unitPrice, mopLabel)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-text-primary">
                      {formatMOP2(item.lineTotal, mopLabel)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-surface-hover/30">
                <td
                  colSpan={3}
                  className="px-5 py-3 text-right text-sm font-semibold text-text-primary"
                >
                  {t(locale, "orders.detail.total")}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-sm font-semibold text-text-primary">
                  {formatMOP2(total, mopLabel)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
