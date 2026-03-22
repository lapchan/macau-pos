"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { MetricCard } from "@/components/shared/metric-card";
import {
  Search,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { OrderRow, OrderStats } from "@/lib/queries";

const PAGE_SIZE = 20;

const statusBadge: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-success-light text-success" },
  pending: { label: "Pending", className: "bg-warning-light text-warning" },
  cancelled: { label: "Cancelled", className: "bg-danger-light text-danger" },
  refunded: { label: "Refunded", className: "bg-surface-hover text-text-tertiary" },
};

const paymentBadge: Record<string, { label: string; className: string }> = {
  cash: { label: "Cash", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  mpay: { label: "MPay", className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  alipay: { label: "Alipay", className: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  wechat_pay: { label: "WeChat Pay", className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  visa: { label: "Visa", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  mastercard: { label: "Mastercard", className: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  unionpay: { label: "UnionPay", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMOP(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `MOP ${num.toFixed(1)}`;
}

type Props = {
  orders: OrderRow[];
  stats: OrderStats;
};

export default function OrdersClient({ orders, stats }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => o.orderNumber.toLowerCase().includes(q));
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const subtitle =
    search && filtered.length !== orders.length
      ? `${filtered.length} of ${orders.length} orders`
      : `${orders.length} orders`;

  return (
    <>
      <PageHeader title="Orders" subtitle={subtitle} />

      {/* Stats row */}
      <Card className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Today's Orders"
            value={String(stats.todayOrders)}
            change="--"
            up={true}
          />
          <MetricCard
            label="Today's Revenue"
            value={formatMOP(stats.todayRevenue)}
            change="--"
            up={true}
          />
          <MetricCard
            label="This Week Orders"
            value={String(stats.weekOrders)}
            change="--"
            up={true}
          />
          <MetricCard
            label="This Week Revenue"
            value={formatMOP(stats.weekRevenue)}
            change="--"
            up={true}
          />
        </div>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number..."
            aria-label="Search orders"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        <span className="text-xs text-text-tertiary ml-auto">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Orders">
            <thead>
              <tr className="border-b border-border">
                {[
                  { label: "Order #", left: true },
                  { label: "Date", left: true },
                  { label: "Items", right: true },
                  { label: "Total", right: true },
                  { label: "Payment", left: true },
                  { label: "Status", left: true },
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
              {paged.map((order) => {
                const sBadge =
                  statusBadge[order.status] || statusBadge.completed;
                const pBadge = order.paymentMethod
                  ? paymentBadge[order.paymentMethod] || {
                      label: order.paymentMethod,
                      className:
                        "bg-surface-hover text-text-secondary",
                    }
                  : { label: "—", className: "bg-surface-hover text-text-tertiary" };

                return (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                      {order.itemCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-text-primary">
                      {formatMOP(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                          pBadge.className
                        )}
                      >
                        {pBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                          sBadge.className
                        )}
                      >
                        {sBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
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
                        No orders found
                      </p>
                      <p className="text-xs text-text-secondary">
                        {search
                          ? "Try adjusting your search"
                          : "Orders will appear here once created"}
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
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
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
                aria-label="Next page"
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
