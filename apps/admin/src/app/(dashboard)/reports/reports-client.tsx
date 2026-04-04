"use client";

import { useState, useTransition, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/shared/card";
import { MetricCard } from "@/components/shared/metric-card";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { fetchReportData } from "@/lib/report-actions";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Tag,
  BarChart3,
  Download,
  Package,
  Calendar,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Props = {
  summary: { totalOrders: number; totalRevenue: number; avgOrderValue: number };
  salesByDate: { date: string; orders: number; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  salesByCategory: { category: string; orders: number; revenue: number }[];
  paymentBreakdown: { method: string; count: number; total: number }[];
};

const PIE_COLORS = ["#4f6ef7", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  tap: "Card (Tap)",
  insert: "Card (Insert)",
  qr: "QR Pay",
};

const RANGE_OPTIONS = [
  { value: 7, labelKey: "reports.last7Days" },
  { value: 14, labelKey: "reports.last14Days" },
  { value: 30, labelKey: "reports.last30Days" },
  { value: 90, labelKey: "reports.last90Days" },
] as const;

function exportReportCSV(data: Props) {
  const lines: string[] = [];
  // Summary
  lines.push("== Summary ==");
  lines.push(`Total Orders,${data.summary.totalOrders}`);
  lines.push(`Total Revenue,${data.summary.totalRevenue.toFixed(2)}`);
  lines.push(`Avg Order Value,${data.summary.avgOrderValue.toFixed(2)}`);
  lines.push("");
  // Sales by Date
  lines.push("== Sales by Date ==");
  lines.push("Date,Orders,Revenue");
  for (const d of data.salesByDate) lines.push(`${d.date},${d.orders},${d.revenue.toFixed(2)}`);
  lines.push("");
  // Top Products
  lines.push("== Top Products ==");
  lines.push("Product,Quantity,Revenue");
  for (const p of data.topProducts) lines.push(`"${p.name}",${p.quantity},${p.revenue.toFixed(2)}`);
  lines.push("");
  // Categories
  lines.push("== Sales by Category ==");
  lines.push("Category,Orders,Revenue");
  for (const c of data.salesByCategory) lines.push(`"${c.category}",${c.orders},${c.revenue.toFixed(2)}`);
  lines.push("");
  // Payment Methods
  lines.push("== Payment Methods ==");
  lines.push("Method,Count,Total");
  for (const p of data.paymentBreakdown) lines.push(`${p.method},${p.count},${p.total.toFixed(2)}`);

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "report-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsClient({
  summary: initialSummary,
  salesByDate: initialSalesByDate,
  topProducts: initialTopProducts,
  salesByCategory: initialSalesByCategory,
  paymentBreakdown: initialPaymentBreakdown,
}: Props) {
  const { locale } = useLocale();
  const [days, setDays] = useState(30);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [isLoading, startTransition] = useTransition();

  // Report data state (initialized from server props)
  const [summary, setSummary] = useState(initialSummary);
  const [salesByDate, setSalesByDate] = useState(initialSalesByDate);
  const [topProducts, setTopProducts] = useState(initialTopProducts);
  const [salesByCategory, setSalesByCategory] = useState(initialSalesByCategory);
  const [paymentBreakdown, setPaymentBreakdown] = useState(initialPaymentBreakdown);

  const handleRangeChange = useCallback((newDays: number) => {
    setDays(newDays);
    setRangeOpen(false);
    startTransition(async () => {
      const data = await fetchReportData(newDays);
      setSummary(data.summary);
      setSalesByDate(data.salesByDate);
      setTopProducts(data.topProducts);
      setSalesByCategory(data.salesByCategory);
      setPaymentBreakdown(data.paymentBreakdown);
    });
  }, []);

  const hasData = summary.totalOrders > 0;

  const topCategory = salesByCategory.length > 0
    ? salesByCategory.reduce((a, b) => (b.revenue > a.revenue ? b : a)).category
    : "—";

  const currentRangeLabel = RANGE_OPTIONS.find((r) => r.value === days)?.labelKey || "reports.last30Days";

  return (
    <>
      <PageHeader title={t(locale, "reports.pageTitle")} subtitle={t(locale, "reports.subtitle")}>
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="relative">
            <button
              onClick={() => setRangeOpen(!rangeOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-[var(--radius-sm)] hover:border-border-strong transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
              {t(locale, currentRangeLabel as any)}
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-text-tertiary" /> : <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />}
            </button>
            {rangeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg z-20 py-1">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleRangeChange(opt.value)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm transition-colors",
                        days === opt.value
                          ? "bg-surface-hover text-text-primary font-medium"
                          : "text-text-secondary hover:bg-surface-hover"
                      )}
                    >
                      {t(locale, opt.labelKey as any)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Export */}
          <button
            onClick={() => exportReportCSV({ summary, salesByDate, topProducts, salesByCategory, paymentBreakdown })}
            disabled={!hasData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> {t(locale, "common.export")}
          </button>
        </div>
      </PageHeader>

      {!hasData ? (
        /* Empty state */
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-[var(--radius-lg)] bg-surface-hover flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-text-tertiary" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-semibold text-text-primary mb-1">{t(locale, "reports.noData")}</p>
            <p className="text-[13px] text-text-secondary max-w-sm">{t(locale, "reports.noDataDesc")}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label={t(locale, "reports.totalRevenue")}
              value={`MOP ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
            />
            <MetricCard
              label={t(locale, "reports.totalOrders")}
              value={String(summary.totalOrders)}
              icon={ShoppingCart}
            />
            <MetricCard
              label={t(locale, "reports.avgOrderValue")}
              value={`MOP ${summary.avgOrderValue.toFixed(2)}`}
              icon={TrendingUp}
            />
            <MetricCard
              label={t(locale, "reports.topCategory")}
              value={topCategory}
              icon={Tag}
            />
          </div>

          {/* Sales trend chart */}
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <h3 className="text-[15px] font-semibold text-text-primary">
                  {t(locale, "reports.salesTrend")}
                </h3>
                <span className="text-[12px] text-text-tertiary">
                  {t(locale, currentRangeLabel as any)}
                </span>
              </div>
            </CardHeader>
            <div className="px-5 pb-5">
              {salesByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={salesByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => {
                        const date = new Date(d);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      stroke="var(--color-text-tertiary)"
                      fontSize={11}
                    />
                    <YAxis
                      stroke="var(--color-text-tertiary)"
                      fontSize={11}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`MOP ${value.toFixed(2)}`, t(locale, "reports.revenue")]}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[13px] text-text-tertiary">
                  {t(locale, "reports.noData")}
                </div>
              )}
            </div>
          </Card>

          {/* Two-column: Top Products + Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top products */}
            <Card padding="none">
              <CardHeader>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  {t(locale, "reports.topProducts")}
                </h3>
              </CardHeader>
              {topProducts.length > 0 ? (
                <div className="px-5 pb-4">
                  <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 36)}>
                    <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                      <XAxis type="number" fontSize={11} stroke="var(--color-text-tertiary)" tickFormatter={(v) => `$${v}`} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        fontSize={11}
                        stroke="var(--color-text-secondary)"
                        tickFormatter={(name) => name.length > 18 ? name.substring(0, 16) + "..." : name}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`MOP ${value.toFixed(2)}`, t(locale, "reports.revenue")]}
                      />
                      <Bar dataKey="revenue" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="px-5 py-12 text-center text-[13px] text-text-tertiary">
                  {t(locale, "reports.noData")}
                </div>
              )}
            </Card>

            {/* Payment breakdown */}
            <Card padding="none">
              <CardHeader>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  {t(locale, "reports.paymentMethods")}
                </h3>
              </CardHeader>
              {paymentBreakdown.length > 0 ? (
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-6">
                    <div className="w-[180px] h-[180px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentBreakdown}
                            dataKey="total"
                            nameKey="method"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {paymentBreakdown.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-surface)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-md)",
                              fontSize: 12,
                            }}
                            formatter={(value: number) => [`MOP ${value.toFixed(2)}`]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {paymentBreakdown.map((p, i) => {
                        const totalAll = paymentBreakdown.reduce((s, x) => s + x.total, 0);
                        const pct = totalAll > 0 ? ((p.total / totalAll) * 100).toFixed(1) : "0";
                        return (
                          <div key={p.method} className="flex items-center gap-2.5">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-text-primary">
                                {METHOD_LABELS[p.method] || p.method}
                              </p>
                              <p className="text-[11px] text-text-tertiary">
                                {p.count} {t(locale, "reports.orders").toLowerCase()} · {pct}%
                              </p>
                            </div>
                            <span className="text-[13px] font-semibold tabular-nums text-text-primary">
                              MOP {p.total.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-12 text-center text-[13px] text-text-tertiary">
                  {t(locale, "reports.noData")}
                </div>
              )}
            </Card>
          </div>

          {/* Sales by category table */}
          <Card padding="none">
            <CardHeader>
              <h3 className="text-[15px] font-semibold text-text-primary">
                {t(locale, "reports.salesByCategory")}
              </h3>
            </CardHeader>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t(locale, "reports.category")}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t(locale, "reports.orders")}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t(locale, "reports.revenue")}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t(locale, "reports.percentage")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesByCategory.map((cat) => {
                    const totalRev = salesByCategory.reduce((s, c) => s + c.revenue, 0);
                    const pct = totalRev > 0 ? ((cat.revenue / totalRev) * 100).toFixed(1) : "0";
                    return (
                      <tr key={cat.category} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                        <td className="px-5 py-3 text-[13px] font-medium text-text-primary">{cat.category}</td>
                        <td className="px-5 py-3 text-right text-[13px] tabular-nums text-text-secondary">{cat.orders}</td>
                        <td className="px-5 py-3 text-right text-[13px] tabular-nums font-medium text-text-primary">
                          MOP {cat.revenue.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[12px] tabular-nums text-text-tertiary w-10 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {salesByCategory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-text-tertiary">
                        {t(locale, "reports.noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top products table */}
          <Card padding="none" className="mt-6">
            <CardHeader>
              <h3 className="text-[15px] font-semibold text-text-primary">
                {t(locale, "reports.topProducts")}
              </h3>
            </CardHeader>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-8 px-5 py-3 text-left text-xs font-semibold text-text-tertiary">#</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t(locale, "reports.productName")}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t(locale, "reports.qtySold")}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t(locale, "reports.revenue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((prod, i) => (
                    <tr key={prod.name} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                      <td className="px-5 py-3 text-[12px] text-text-tertiary tabular-nums">{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-text-tertiary" strokeWidth={1.5} />
                          </div>
                          <span className="text-[13px] font-medium text-text-primary truncate">{prod.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums text-text-secondary">{prod.quantity}</td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums font-medium text-text-primary">
                        MOP {prod.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-text-tertiary">
                        {t(locale, "reports.noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
