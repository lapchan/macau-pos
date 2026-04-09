"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { openShift } from "@/lib/shift-actions";
import { Clock } from "lucide-react";
import { type Locale, t } from "@/i18n/locales";

type Props = {
  userName: string;
  terminalName: string | null;
  terminalCode: string | null;
  onShiftOpened: (shiftId: string) => void;
  locale?: Locale;
  currency?: string;
};

export default function ShiftOpenModal({ userName, terminalName, terminalCode, onShiftOpened, locale = "en", currency = "MOP" }: Props) {
  const router = useRouter();
  const [floatAmount, setFloatAmount] = useState("0");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        const result = await openShift(parseFloat(floatAmount) || 0);
        if (result.success && result.data) {
          onShiftOpened(result.data.id);
        } else {
          const err = result.error || "Failed to open shift";
          if (err.toLowerCase().includes("no active session") || err.toLowerCase().includes("session")) {
            window.location.href = "/login";
            return;
          }
          setError(err);
        }
      } catch {
        setError("Connection error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xl">
      <div className="w-full max-w-sm mx-4 text-center">
        {/* Icon */}
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
          style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}
        >
          <Clock className="h-8 w-8 text-white" />
        </div>

        {/* Header */}
        <h1 className="text-[20px] font-semibold text-[#1d1d1f] mb-1">{t(locale, "shiftStart")}</h1>
        <p className="text-[13px] text-[#86868b] mb-1">{userName}</p>
        {terminalName && (
          <p className="text-[12px] text-[#86868b]">
            {terminalCode ? `${terminalCode} · ` : ""}{terminalName}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-[12px] text-[#ff3b30] bg-[#ff3b30]/8 px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        {/* Opening float */}
        <div className="mt-6 mb-6">
          <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2 text-left">
            {t(locale, "shiftOpeningFloat").replace("{currency}", currency)}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-[#86868b]">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={floatAmount}
              onChange={(e) => setFloatAmount(e.target.value)}
              className="w-full h-[52px] pl-9 pr-4 text-[20px] font-semibold text-center bg-[#f5f5f7] border border-[#e5e5e7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all"
            />
          </div>
          <p className="text-[11px] text-[#86868b] mt-1.5">
            {t(locale, "shiftFloatHint")}
          </p>
        </div>

        {/* Start button */}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full h-[48px] rounded-[var(--radius-md)] font-medium text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t(locale, "shiftStarting")}
            </span>
          ) : (
            t(locale, "shiftStartBtn")
          )}
        </button>

        {/* Skip note */}
        <p className="text-[11px] text-[#86868b] mt-3">
          {t(locale, "shiftFloatZero")}
        </p>
      </div>
    </div>
  );
}
