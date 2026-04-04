"use client";

import { Card, CardHeader } from "@/components/shared/card";
import { MetricCard } from "@/components/shared/metric-card";
import { DateRangeSelector } from "@/components/shared/date-range-selector";
import { FilterChip } from "@/components/shared/filter-chip";
import { performanceData, metrics } from "@/data/mock";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function CustomTooltip({
  active,
  payload,
  label,
  thisPeriodLabel,
  previousLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
  thisPeriodLabel: string;
  previousLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-sm)] shadow-lg p-3">
      <p className="text-xs font-medium text-text-secondary mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary capitalize">
            {entry.dataKey === "current" ? thisPeriodLabel : previousLabel}
          </span>
          <span className="font-medium text-text-primary ml-auto">
            MOP {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceChartCard() {
  const { locale } = useLocale();
  const thisPeriodLabel = t(locale, "performance.thisPeriod");
  const previousPeriodLabel = t(locale, "performance.previousPeriod");

  return (
    <Card>
      <CardHeader
        title={t(locale, "performance.title")}
        subtitle={t(locale, "performance.subtitle")}
        action={<DateRangeSelector />}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5">
        <FilterChip label={t(locale, "performance.allLocations")} active />
        <FilterChip label={t(locale, "performance.comparePrevious")} />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-border">
        <MetricCard
          label={t(locale, "performance.netSales")}
          value={metrics.netSales.value}
          change={metrics.netSales.change}
          up={metrics.netSales.up}
        />
        <MetricCard
          label={t(locale, "performance.grossSales")}
          value={metrics.grossSales.value}
          change={metrics.grossSales.change}
          up={metrics.grossSales.up}
        />
        <MetricCard
          label={t(locale, "performance.transactions")}
          value={metrics.transactions.value}
          change={metrics.transactions.change}
          up={metrics.transactions.up}
        />
        <MetricCard
          label={t(locale, "performance.avgBasket")}
          value={metrics.avgBasket.value}
          change={metrics.avgBasket.change}
          up={metrics.avgBasket.up}
        />
      </div>

      {/* Chart */}
      <div className="h-[240px] relative z-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={performanceData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              content={
                <CustomTooltip
                  thisPeriodLabel={thisPeriodLabel}
                  previousLabel={previousPeriodLabel}
                />
              }
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
              formatter={(value: string) =>
                value === "current" ? thisPeriodLabel : previousPeriodLabel
              }
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--color-text-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--color-text-tertiary)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
