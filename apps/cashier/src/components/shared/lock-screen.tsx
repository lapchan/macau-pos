"use client";

import { useState, useEffect } from "react";
import { type Locale, t } from "@/i18n/locales";

type Props = {
  userName: string;
  userAvatar?: string | null;
  userId: string;
  terminalName: string | null;
  terminalCode: string | null;
  locale?: Locale;
  onUnlock: () => void;
  onForceLogout: () => void;
};

export default function LockScreen({
  userName, userAvatar, userId, terminalName, terminalCode, locale = "tc", onUnlock, onForceLogout,
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [time, setTime] = useState(new Date());

  const MAX_ATTEMPTS = 5;

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && !verifying) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function handleSubmit() {
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        body: JSON.stringify({ pin, userId }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        onUnlock();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);

        if (newAttempts >= MAX_ATTEMPTS) {
          setError(t(locale, "lockTooManyAttempts"));
          setTimeout(onForceLogout, 1500);
        } else {
          setError(t(locale, "lockInvalidPin").replace("{remaining}", String(MAX_ATTEMPTS - newAttempts)));
        }
      }
    } catch {
      setError(t(locale, "lockConnectionError"));
      setPin("");
    } finally {
      setVerifying(false);
    }
  }

  function handleDigit(d: string) {
    if (pin.length < 4 && !verifying) setPin((p) => p + d);
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
  }

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const initial = userName.charAt(0).toUpperCase();

  const letterMap: Record<string, string> = {
    "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL",
    "6": "MNO", "7": "PQRS", "8": "TUV", "9": "WXYZ",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl">
      {/* Clock */}
      <div className="text-center mb-8">
        <p className="text-[#86868b] text-[14px] font-medium">{dateStr}</p>
        <p className="text-[#1d1d1f] text-[64px] font-extralight leading-none mt-1 tabular-nums tracking-tight">
          {hours}:{minutes}
        </p>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-6">
        {userAvatar ? (
          <img src={userAvatar} alt={userName} className="h-[64px] w-[64px] rounded-full object-cover mb-3 shadow-lg bg-[#f5f5f7]" />
        ) : (
          <div className="h-[64px] w-[64px] rounded-full flex items-center justify-center mb-3 shadow-lg" style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}>
            <span className="text-white text-[24px] font-semibold">{initial}</span>
          </div>
        )}
        <p className="text-[#1d1d1f] text-[15px] font-medium">{userName}</p>
        {terminalName && (
          <p className="text-[#86868b] text-[12px] mt-1">
            {terminalCode ? `${terminalCode} · ` : ""}{terminalName}
          </p>
        )}
      </div>

      {/* PIN dots */}
      <div className="mb-8">
        <div className={`flex gap-[14px] justify-center ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-[13px] w-[13px] rounded-full transition-all duration-200 ${
                i < pin.length ? "bg-[#1d1d1f]" : "border-[1.5px] border-[#1d1d1f]/20"
              }`}
            />
          ))}
        </div>
        {error && (
          <p className="text-[#ff3b30] text-[12px] text-center mt-3 animate-fade-in">{error}</p>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-[12px]">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            disabled={verifying || pin.length >= 4}
            className="h-[72px] w-[72px] rounded-full bg-[#f5f5f7] border border-black/[0.04] hover:bg-[#e8e8ed] active:bg-[#d1d1d6] flex flex-col items-center justify-center transition-all active:scale-[0.90] disabled:opacity-40"
          >
            <span className="text-[#1d1d1f] text-[26px] font-light leading-none">{d}</span>
            {letterMap[d] && (
              <span className="text-[#86868b]/60 text-[8px] tracking-[0.16em] mt-[2px] font-medium">
                {letterMap[d]}
              </span>
            )}
          </button>
        ))}
        <div className="h-[72px] w-[72px]" />
        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={verifying || pin.length >= 4}
          className="h-[72px] w-[72px] rounded-full bg-[#f5f5f7] border border-black/[0.04] hover:bg-[#e8e8ed] active:bg-[#d1d1d6] flex items-center justify-center transition-all active:scale-[0.90] disabled:opacity-40"
        >
          <span className="text-[#1d1d1f] text-[26px] font-light">0</span>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pin.length === 0}
          className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-[#86868b]/30 hover:text-[#86868b]/60 transition-all active:scale-[0.90] disabled:opacity-10"
        >
          <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
