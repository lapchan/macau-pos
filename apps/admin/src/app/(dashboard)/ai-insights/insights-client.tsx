"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/shared/card";
import { cn } from "@/lib/cn";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  Sparkles,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────
type Overview = {
  totalRevenue: string;
  totalOrders: number;
  avgOrderValue: string;
  totalProducts: number;
};

type SalesTrendItem = {
  date: string;
  revenue: string | null;
  orderCount: number;
};

type TopProductItem = {
  name: string;
  totalRevenue: string | null;
  totalQuantity: string | null;
};

type PaymentStats = {
  todayAmount: string;
  todayCount: number;
  methodBreakdown: { method: string; total: string; count: number }[];
};

interface InsightsClientProps {
  overview: Overview;
  salesTrend: SalesTrendItem[];
  topProducts: TopProductItem[];
  paymentStats: PaymentStats;
}

// ─── Constants ────────────────────────────────────────────
const CHART_COLORS = {
  accent: "#4f6ef7",
  success: "#2f9e44",
  warning: "#e8590c",
  purple: "#7c3aed",
  blue: "#228be6",
};

const PAYMENT_COLORS: Record<string, string> = {
  cash: CHART_COLORS.success,
  card: CHART_COLORS.blue,
  qr: CHART_COLORS.purple,
  qr_code: CHART_COLORS.purple,
};

const PIE_FALLBACK_COLORS = [
  CHART_COLORS.success,
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.warning,
  CHART_COLORS.accent,
];

function fmtMOP(value: string | number | null | undefined): string {
  const num = parseFloat(String(value ?? "0"));
  return `MOP ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ─── Empty State ──────────────────────────────────────────
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
      <BarChart3 className="h-10 w-10 mb-3" strokeWidth={1.25} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────
function SalesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-sm)] px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      <p className="text-text-secondary">
        Revenue: <span className="font-medium text-text-primary">{fmtMOP(payload[0]?.value)}</span>
      </p>
      {payload[0]?.payload?.orderCount !== undefined && (
        <p className="text-text-secondary">
          Orders: <span className="font-medium text-text-primary">{payload[0].payload.orderCount}</span>
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function InsightsClient({
  overview,
  salesTrend,
  topProducts,
  paymentStats,
}: InsightsClientProps) {
  const { locale } = useLocale();

  // Prepare chart data
  const trendData = salesTrend.map((d) => ({
    date: d.date,
    revenue: parseFloat(d.revenue ?? "0"),
    orderCount: d.orderCount,
  }));

  const barData = topProducts
    .filter((p) => parseFloat(p.totalRevenue ?? "0") > 0)
    .map((p) => ({
      name: p.name.length > 16 ? p.name.slice(0, 14) + "..." : p.name,
      fullName: p.name,
      revenue: parseFloat(p.totalRevenue ?? "0"),
      quantity: parseInt(p.totalQuantity ?? "0", 10),
    }));

  const totalPayments = paymentStats.methodBreakdown.reduce((s, m) => s + m.count, 0);
  const pieData = paymentStats.methodBreakdown.map((m) => ({
    name: m.method.charAt(0).toUpperCase() + m.method.slice(1).replace("_", " "),
    value: parseFloat(m.total),
    count: m.count,
    pct: totalPayments > 0 ? ((m.count / totalPayments) * 100).toFixed(1) : "0",
  }));

  // ─── Insights Feed ────────────────────────────────────
  const insights: { icon: string; text: string }[] = [];

  if (topProducts[0] && parseFloat(topProducts[0].totalRevenue ?? "0") > 0) {
    insights.push({
      icon: "\u{1F3C6}",
      text: interpolate(t(locale, "insights.topSeller"), {
        name: topProducts[0].name,
        amount: fmtMOP(topProducts[0].totalRevenue).replace("MOP ", ""),
      }),
    });
  }

  const cashEntry = paymentStats.methodBreakdown.find(
    (m) => m.method.toLowerCase() === "cash"
  );
  if (cashEntry && totalPayments > 0) {
    const pct = ((cashEntry.count / totalPayments) * 100).toFixed(1);
    insights.push({
      icon: "\u{1F4B0}",
      text: interpolate(t(locale, "insights.cashPercent"), { pct }),
    });
  }

  if (parseFloat(overview.avgOrderValue) > 0) {
    insights.push({
      icon: "\u{1F4CA}",
      text: interpolate(t(locale, "insights.avgValue"), {
        value: fmtMOP(overview.avgOrderValue).replace("MOP ", ""),
      }),
    });
  }

  if (overview.totalOrders > 0) {
    insights.push({
      icon: "\u{1F4C8}",
      text: interpolate(t(locale, "insights.totalProcessed"), {
        count: overview.totalOrders.toLocaleString(),
      }),
    });
  }

  insights.push({
    icon: "\u{1F514}",
    text: interpolate(t(locale, "insights.catalogCount"), {
      count: overview.totalProducts,
    }),
  });

  // ─── Metric cards config ──────────────────────────────
  const metrics = [
    {
      label: t(locale, "insights.totalRevenue"),
      value: fmtMOP(overview.totalRevenue),
      icon: DollarSign,
      color: "bg-success-light text-success",
    },
    {
      label: t(locale, "insights.totalOrders"),
      value: overview.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "bg-accent-light text-accent",
    },
    {
      label: t(locale, "insights.avgOrderValue"),
      value: fmtMOP(overview.avgOrderValue),
      icon: Receipt,
      color: "bg-warning-light text-warning",
    },
    {
      label: t(locale, "insights.productsInCatalog"),
      value: overview.totalProducts.toLocaleString(),
      icon: Package,
      color: "bg-accent-light text-accent",
    },
  ];

  return (
    <>
      <PageHeader
        title={t(locale, "insights.pageTitle")}
        subtitle={t(locale, "insights.subtitle")}
      />

      <div className="space-y-6">
        {/* ── Section 1: Overview Metrics ──────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                      {m.label}
                    </p>
                    <p className="text-xl font-semibold text-text-primary tracking-tight">
                      {m.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-9 w-9 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0",
                      m.color
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── Section 2: Sales Trend ──────────────────────── */}
        <Card>
          <CardHeader title={t(locale, "insights.salesTrendTitle")} />
          {trendData.length === 0 ? (
            <EmptyState text={t(locale, "insights.noSalesData")} />
          ) : (
            <div className="h-[300px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#adb5bd" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#adb5bd" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip content={<SalesTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* ── Section 3: Two-column grid ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Products */}
          <Card>
            <CardHeader title={t(locale, "insights.topProductsTitle")} />
            {barData.length === 0 ? (
              <EmptyState text={t(locale, "insights.noProductData")} />
            ) : (
              <div className="h-[360px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#adb5bd" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#6c757d" }}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                    <Tooltip
                      formatter={(value: number) => [fmtMOP(value), "Revenue"]}
                      labelFormatter={(label: string, payload: any[]) =>
                        payload?.[0]?.payload?.fullName ?? label
                      }
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e9ecef",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill={CHART_COLORS.accent}
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Payment Method Breakdown */}
          <Card>
            <CardHeader title={t(locale, "insights.paymentBreakdown")} />
            {pieData.length === 0 ? (
              <EmptyState text={t(locale, "insights.noPaymentData")} />
            ) : (
              <div className="h-[360px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      dataKey="value"
                      paddingAngle={3}
                      label={({ name, pct }: { name: string; pct: string }) =>
                        `${name} (${pct}%)`
                      }
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={
                            PAYMENT_COLORS[entry.name.toLowerCase().replace(" ", "_")] ??
                            PIE_FALLBACK_COLORS[i % PIE_FALLBACK_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [fmtMOP(value), "Total"]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e9ecef",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* ── Section 4: AI Insights Feed ─────────────────── */}
        <Card>
          <CardHeader
            title={t(locale, "insights.insightsTitle")}
            action={
              <div className="flex items-center gap-1 text-xs font-medium text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{insights.length} insights</span>
              </div>
            }
          />
          <div className="divide-y divide-border">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-lg leading-none shrink-0">{insight.icon}</span>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
