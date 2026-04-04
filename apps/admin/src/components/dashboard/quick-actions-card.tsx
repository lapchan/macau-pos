"use client";

import { Card, CardHeader } from "@/components/shared/card";
import { quickActions } from "@/data/mock";
import { useLocale } from "@/i18n/context";
import { t, type AdminTranslationKeys } from "@/i18n/locales";
import {
  PackagePlus,
  CreditCard,
  TicketPercent,
  UserPlus,
  Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  PackagePlus,
  CreditCard,
  TicketPercent,
  UserPlus,
  Monitor,
};

const actionLabelKeys: Record<string, keyof AdminTranslationKeys> = {
  "add-item": "quickActions.addItem",
  "take-payment": "quickActions.takePayment",
  "create-discount": "quickActions.createDiscount",
  "add-customer": "quickActions.addCustomer",
  "connect-terminal": "quickActions.connectTerminal",
};

export function QuickActionsCard() {
  const { locale } = useLocale();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader title={t(locale, "quickActions.title")} />
      <div className="grid grid-cols-5 gap-2 flex-1 content-start">
        {quickActions.map((action) => {
          const Icon = iconMap[action.icon];
          return (
            <button
              key={action.id}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-[var(--radius-sm)] border border-transparent hover:border-border hover:bg-surface-hover transition-all group"
            >
              <div className="h-10 w-10 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center group-hover:bg-accent-light transition-colors">
                <Icon
                  className="h-5 w-5 text-text-secondary group-hover:text-accent transition-colors"
                  strokeWidth={1.75}
                />
              </div>
              <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary text-center leading-tight">
                {actionLabelKeys[action.id] ? t(locale, actionLabelKeys[action.id]) : action.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
