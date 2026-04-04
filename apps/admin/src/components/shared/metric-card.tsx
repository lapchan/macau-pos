"use client";

import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  up?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function MetricCard({ label, value, change, up = true, icon: Icon }: MetricCardProps) {
  const { locale } = useLocale();

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="text-xl font-semibold text-text-primary tracking-tight">
        {value}
      </p>
      {change && (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            up ? "text-success" : "text-danger"
          )}
        >
          {up ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
          <span className="text-text-tertiary font-normal">{t(locale, "common.vsPrevPeriod")}</span>
        </div>
      )}
    </div>
  );
}
