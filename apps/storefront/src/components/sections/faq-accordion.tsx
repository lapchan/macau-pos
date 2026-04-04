"use client";

import { useState } from "react";

type FaqItem = { question: string; qTranslations?: Record<string, string>; answer: string; aTranslations?: Record<string, string> };
type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function FaqAccordion({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const items = (data.items as FaqItem[]) || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {title && <h2 className="text-2xl font-bold text-sf-text text-center mb-8">{title}</h2>}
      <div className="divide-y divide-sf-border border border-sf-border rounded-[var(--radius-lg)] overflow-hidden">
        {items.map((item, i) => {
          const q = item.qTranslations?.[locale] || item.question;
          const a = item.aTranslations?.[locale] || item.answer;
          const isOpen = openIndex === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-sf-surface-hover transition-colors"
              >
                <span className="text-[14px] font-medium text-sf-text pr-4">{q}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 text-sf-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 bg-white animate-slide-up">
                  <p className="text-[14px] text-sf-text-secondary leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
