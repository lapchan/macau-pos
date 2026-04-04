"use client";

import { useState, useEffect } from "react";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function SaleBanner({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const endDate = data.endDate as string | undefined;
  const ctaLink = (data.ctaLink as string) || `/${locale}/products`;
  const bgColor = (data.bgColor as string) || "#dc3545";

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft(""); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!title) return null;

  return (
    <div className="py-8 md:py-12" style={{ backgroundColor: bgColor }}>
      <div className="max-w-[var(--sf-max-width)] mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-white/80 mt-2 text-[15px]">{subtitle}</p>}
        {timeLeft && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-[var(--radius-full)] px-5 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="text-white font-mono text-[15px] font-semibold tabular-nums">{timeLeft}</span>
          </div>
        )}
        <div className="mt-5">
          <a
            href={ctaLink}
            className="inline-flex items-center justify-center h-11 px-6 rounded-[var(--radius-full)] bg-white text-[14px] font-semibold transition-opacity hover:opacity-90"
            style={{ color: bgColor }}
          >
            {locale === "en" ? "Shop Now" : locale === "pt" ? "Comprar" : locale === "ja" ? "今すぐ購入" : "立即搶購"}
          </a>
        </div>
      </div>
    </div>
  );
}
