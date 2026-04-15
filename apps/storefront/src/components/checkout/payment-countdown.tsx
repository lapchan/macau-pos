"use client";

import { useEffect, useState } from "react";

type Copy = {
  remaining: string;
  expired: string;
};

const copyByLocale: Record<string, Copy> = {
  en: { remaining: "Time remaining to pay", expired: "Payment window expired" },
  tc: { remaining: "付款剩餘時間", expired: "付款時限已過" },
  sc: { remaining: "付款剩余时间", expired: "付款时限已过" },
  pt: { remaining: "Tempo restante para pagar", expired: "Janela de pagamento expirada" },
  ja: { remaining: "支払い残り時間", expired: "支払い期限切れ" },
};

type Props = {
  expiresAtIso: string;
  locale: string;
  onExpire?: () => void;
};

export default function PaymentCountdown({ expiresAtIso, locale, onExpire }: Props) {
  const expiresAt = new Date(expiresAtIso).getTime();
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, expiresAt - Date.now()),
  );
  const c = copyByLocale[locale] ?? copyByLocale.en;

  useEffect(() => {
    if (remainingMs <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      const next = Math.max(0, expiresAt - Date.now());
      setRemainingMs(next);
      if (next <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, remainingMs, onExpire]);

  const expired = remainingMs <= 0;
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const warn = !expired && remainingMs < 3 * 60 * 1000;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs uppercase tracking-[0.1em] text-slate-500">
        {expired ? c.expired : c.remaining}
      </span>
      <span
        className={`font-mono text-3xl tabular-nums font-semibold ${
          expired ? "text-slate-400" : warn ? "text-amber-600" : "text-slate-900"
        }`}
      >
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
