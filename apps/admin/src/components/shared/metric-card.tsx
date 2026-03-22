import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

export function MetricCard({ label, value, change, up }: MetricCardProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-semibold text-text-primary tracking-tight">
        {value}
      </p>
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
        <span className="text-text-tertiary font-normal">vs prev. period</span>
      </div>
    </div>
  );
}
