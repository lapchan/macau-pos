"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  const { locale } = useLocale();

  useEffect(() => {
    document.title = `${title} — ${t(locale, "meta.title")}`;
  }, [title, locale]);

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
