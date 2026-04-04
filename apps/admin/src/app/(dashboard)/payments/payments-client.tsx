"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/shared/card";
import { MetricCard } from "@/components/shared/metric-card";
import {
  Search,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { PaymentTransaction, PaymentStats } from "@/lib/queries";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";

const PAGE_SIZE = 20;

const METHOD_COLORS: Record<string, string> = {
  cash: "#10b981",
  tap: "#3b82f6",
  insert: "#6366f1",
  qr: "#a855f7",
};

const methodBadgeClass: Record<string, string> = {
  cash: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  tap: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  insert: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  qr: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const methodLabel: Record<string, string> = {
  cash: "Cash",
  tap: "Card",
  insert: "Card",
  qr: "QR Pay",
};

const statusBadgeClass: Record<string, string> = {
  completed: "bg-success-light text-success",
  pending: "bg-warning-light text-warning",
  refunded: "bg-surface-hover text-text-tertiary",
  voided: "bg-danger-light text-danger",
};

type MethodFilter = "all" | "cash" | "card" | "qr";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMOP(amount: string | number, mopLabel: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${mopLabel} ${num.toFixed(1)}`;
}

type Props = {
  transactions: PaymentTransaction[];
  stats: PaymentStats;
};

export default function PaymentsClient({ transactions, stats }: Props) {
  const { locale } = useLocale();
  const mopLabel = t(locale, "common.mop");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [page, setPage] = useState(1);

  // Compute metric values
  const cashTotal = useMemo(() => {
    return stats.methodBreakdown
      .filter((m) => m.method === "cash")
      .reduce((sum, m) => sum + parseFloat(m.total), 0);
  }, [stats.methodBreakdown]);

  const digitalTotal = useMemo(() => {
    return stats.methodBreakdown
      .filter((m) => m.method !== "cash")
      .reduce((sum, m) => sum + parseFloat(m.total), 0);
  }, [stats.methodBreakdown]);

  // Pie chart data
  const pieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const m of stats.methodBreakdown) {
      const label = methodLabel[m.method] || m.method;
      grouped[label] = (grouped[label] || 0) + parseFloat(m.total);
    }
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [stats.methodBreakdown]);

  const pieColors = useMemo(() => {
    const colorMap: Record<string, string> = {
      Cash: METHOD_COLORS.cash,
      Card: METHOD_COLORS.tap,
      "QR Pay": METHOD_COLORS.qr,
    };
    return pieData.map((d) => colorMap[d.name] || "#94a3b8");
  }, [pieData]);

  // Filter transactions
  const filtered = useMemo(() => {
    let list = transactions;
    if (methodFilter === "cash") {
      list = list.filter((tx) => tx.method === "cash");
    } else if (methodFilter === "card") {
      list = list.filter((tx) => tx.method === "tap" || tx.method === "insert");
    } else if (methodFilter === "qr") {
      list = list.filter((tx) => tx.method === "qr");
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((tx) => tx.orderNumber.toLowerCase().includes(q));
    }
    return list;
  }, [transactions, search, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const filterTabs: { key: MethodFilter; label: string }[] = [
    { key: "all", label: t(locale, "payments.filterAll") },
    { key: "cash", label: t(locale, "payments.filterCash") },
    { key: "card", label: t(locale, "payments.filterCard") },
    { key: "qr", label: t(locale, "payments.filterQR") },
  ];

  const totalGrand = stats.methodBreakdown.reduce(
    (s, m) => s + parseFloat(m.total),
    0
  );

  return (
    <>
      <PageHeader
        title={t(locale, "sidebar.paymentsInvoices")}
        subtitle={interpolate("{count} transactions", {
          count: transactions.length,
        })}
      />

      {/* Stats row */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label={t(locale, "payments.todaysRevenue")}
            value={formatMOP(stats.todayAmount, mopLabel)}
            change="--"
            up={true}
          />
          <MetricCard
            label={t(locale, "payments.todaysTransactions")}
            value={String(stats.todayCount)}
            change="--"
            up={true}
          />
          <MetricCard
            label={t(locale, "payments.cashTotal")}
            value={formatMOP(cashTotal, mopLabel)}
            change="--"
            up={true}
          />
          <MetricCard
            label={t(locale, "payments.digitalTotal")}
            value={formatMOP(digitalTotal, mopLabel)}
            change="--"
            up={true}
          />
        </div>
      </Card>

      {/* Payment Method Breakdown */}
      {pieData.length > 0 && (
        <Card className="mb-6">
          <CardHeader title={t(locale, "payments.methodBreakdown")} />
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatMOP(value, mopLabel)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {stats.methodBreakdown.map((m) => {
                const pct =
                  totalGrand > 0
                    ? ((parseFloat(m.total) / totalGrand) * 100).toFixed(1)
                    : "0";
                return (
                  <div key={m.method} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          METHOD_COLORS[m.method] || "#94a3b8",
                      }}
                    />
                    <span className="text-sm text-text-primary font-medium w-16">
                      {methodLabel[m.method] || m.method}
                    </span>
                    <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            METHOD_COLORS[m.method] || "#94a3b8",
                        }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary tabular-nums w-12 text-right">
                      {pct}%
                    </span>
                    <span className="text-xs text-text-tertiary tabular-nums w-20 text-right">
                      {formatMOP(m.total, mopLabel)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-0.5 border-b border-border">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMethodFilter(tab.key);
                setPage(1);
              }}
              className={cn(
                "px-3 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                methodFilter === tab.key
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder={t(locale, "payments.searchPlaceholder")}
            aria-label={t(locale, "common.search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        <span className="text-xs text-text-tertiary ml-auto">
          {filtered.length} transactions
        </span>
      </div>

      {/* Transaction Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            aria-label="Payment transactions"
          >
            <thead>
              <tr className="border-b border-border">
                {[
                  { label: t(locale, "payments.orderNumber"), left: true },
                  { label: t(locale, "payments.dateTime"), left: true },
                  { label: t(locale, "payments.method"), left: true },
                  { label: t(locale, "payments.amount"), right: true },
                  { label: t(locale, "common.status"), left: true },
                  { label: t(locale, "payments.cashDetails"), left: true },
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
              {paged.map((tx) => {
                const badge =
                  methodBadgeClass[tx.method] ||
                  "bg-surface-hover text-text-secondary";
                const label = methodLabel[tx.method] || tx.method;
                const sBadge =
                  statusBadgeClass[tx.orderStatus] ||
                  statusBadgeClass.completed;

                return (
                  <tr
                    key={tx.paymentId}
                    className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {tx.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                          badge
                        )}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-text-primary">
                      {formatMOP(tx.amount, mopLabel)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                          sBadge
                        )}
                      >
                        {tx.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {tx.method === "cash" &&
                      tx.cashReceived ? (
                        <span className="tabular-nums">
                          {t(locale, "payments.received")} {formatMOP(tx.cashReceived, mopLabel)}
                          {tx.changeGiven &&
                            parseFloat(tx.changeGiven) > 0 && (
                              <>
                                {" / "}{t(locale, "payments.change")}{" "}
                                {formatMOP(tx.changeGiven, mopLabel)}
                              </>
                            )}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center mb-3">
                        <CreditCard
                          className="h-6 w-6 text-text-tertiary"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">
                        {t(locale, "payments.emptyTitle")}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {search
                          ? "Try a different search term"
                          : t(locale, "payments.emptyDesc")}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-tertiary">
              {interpolate(t(locale, "common.showingRange"), {
                start: (currentPage - 1) * PAGE_SIZE + 1,
                end: Math.min(currentPage * PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (p) => (
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
                )
              )}
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
    </>
  );
}
