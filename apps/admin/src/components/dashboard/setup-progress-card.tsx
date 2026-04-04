"use client";

import { Card, CardHeader } from "@/components/shared/card";
import { cn } from "@/lib/cn";
import { setupSteps } from "@/data/mock";
import { useLocale } from "@/i18n/context";
import { t, type AdminTranslationKeys } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import {
  Check,
  ChevronRight,
  User,
  ShoppingBag,
  Wallet,
  Smartphone,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  account: User,
  pos: ShoppingBag,
  payments: Wallet,
  devices: Smartphone,
};

const stepLabelKeys: Record<string, keyof AdminTranslationKeys> = {
  account: "setup.account",
  pos: "setup.pos",
  payments: "setup.payments",
  devices: "setup.devices",
};

const stepDescKeys: Record<string, keyof AdminTranslationKeys> = {
  account: "setup.accountDesc",
  pos: "setup.posDesc",
  payments: "setup.paymentsDesc",
  devices: "setup.devicesDesc",
};

export function SetupProgressCard() {
  const { locale } = useLocale();
  const completed = setupSteps.filter((s) => s.done).length;
  const total = setupSteps.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <Card>
      <CardHeader
        title={t(locale, "setup.greeting")}
        subtitle={interpolate(t(locale, "setup.stepsCompleted"), { completed, total })}
        action={
          <button className="text-xs text-text-secondary hover:text-text-primary transition-colors">
            {t(locale, "setup.finishLater")}
          </button>
        }
      />

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-text-secondary">
            {t(locale, "setup.setupProgress")}
          </span>
          <span className="text-xs font-semibold text-text-primary">
            {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Step blocks */}
      <div className="grid grid-cols-2 gap-3">
        {setupSteps.map((step) => {
          const Icon = iconMap[step.id] || User;
          return (
            <button
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border transition-all text-left group",
                step.done
                  ? "border-border bg-surface-hover/50"
                  : "border-border hover:border-accent/30 hover:bg-accent-light/30"
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0",
                  step.done ? "bg-success-light" : "bg-surface-hover"
                )}
              >
                {step.done ? (
                  <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                ) : (
                  <Icon
                    className="h-4 w-4 text-text-tertiary group-hover:text-accent"
                    strokeWidth={1.75}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    step.done ? "text-text-secondary" : "text-text-primary"
                  )}
                >
                  {stepLabelKeys[step.id] ? t(locale, stepLabelKeys[step.id]) : step.label}
                </p>
                <p className="text-xs text-text-tertiary truncate">
                  {stepDescKeys[step.id] ? t(locale, stepDescKeys[step.id]) : step.description}
                </p>
              </div>
              {!step.done && (
                <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0 group-hover:text-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* View all */}
      <button className="w-full mt-4 py-2 text-xs font-medium text-accent hover:text-accent-dark transition-colors flex items-center justify-center gap-1">
        {t(locale, "setup.viewAllSteps")}
        <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
}
