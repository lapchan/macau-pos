"use client";

import { Card, CardHeader } from "@/components/shared/card";
import { cn } from "@/lib/cn";
import { aiInsights } from "@/data/mock";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import {
  Sparkles,
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  ChevronRight,
} from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  restock: Package,
  anomaly: AlertTriangle,
  forecast: Clock,
  inventory: TrendingDown,
};

const severityStyles: Record<string, string> = {
  info: "bg-accent-light text-accent",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
};

export function AIInsightsCard() {
  const { locale } = useLocale();

  return (
    <Card>
      <CardHeader
        title={t(locale, "insights.title")}
        subtitle={t(locale, "insights.subtitle")}
        action={
          <div className="flex items-center gap-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{interpolate(t(locale, "insights.newCount"), { count: 4 })}</span>
          </div>
        }
      />

      <div className="space-y-1">
        {aiInsights.map((insight) => {
          const TypeIcon = typeIcons[insight.type] || Sparkles;
          return (
            <button
              key={insight.id}
              className="w-full flex items-start gap-3 p-3 rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors text-left group"
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 mt-0.5",
                  severityStyles[insight.severity]
                )}
              >
                <TypeIcon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary leading-snug">
                  {insight.title}
                </p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  {insight.time}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      <button className="w-full mt-2 py-2 text-xs font-medium text-accent hover:text-accent-dark transition-colors flex items-center justify-center gap-1">
        {t(locale, "insights.viewAll")}
        <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
}
