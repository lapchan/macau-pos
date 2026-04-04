"use client";

import { PageHeader } from "./page-header";
import { Construction } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const { locale } = useLocale();

  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-[var(--radius-lg)] bg-surface-hover flex items-center justify-center mb-5">
          <Construction className="h-8 w-8 text-text-tertiary" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          {t(locale, "comingSoon.title")}
        </h2>
        <p className="text-sm text-text-secondary max-w-sm">
          {description || interpolate(t(locale, "comingSoon.description"), { module: title })}
        </p>
      </div>
    </>
  );
}
