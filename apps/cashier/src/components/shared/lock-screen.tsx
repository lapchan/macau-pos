"use client";

import { useState, useEffect } from "react";
import { type Locale, t } from "@/i18n/locales";
import bcrypt from "bcryptjs";
import Avatar from "./avatar";
import ConfirmDialog from "./confirm-dialog";

type Props = {
  userName: string;
  userAvatar?: string | null;
  userId: string;
  pinHash?: string | null;
  terminalName: string | null;
  terminalCode: string | null;
  locale?: Locale;
  onUnlock: () => void;
  onForceLogout: () => void;
};

export default function LockScreen({
  userName, userAvatar, userId, pinHash, terminalName, terminalCode, locale = "tc", onUnlock, onForceLogout,
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [connectionError, setConnectionError] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const [reloading, setReloading] = useState(false);

  const MAX_ATTEMPTS = 5;

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Online/offline listener
  useEffect(() => {
    const goOnline = () => { setOnline(true); setConnectionError(false); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  // Auto-submit when 4 digits entered (delay to let the 4th dot render)
  useEffect(() => {
    if (pin.length === 4 && !verifying) {
      const timer = setTimeout(handleSubmit, 150);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function verifyLocally(enteredPin: string): Promise<boolean> {
    if (!pinHash) return false;
    return bcrypt.compare(enteredPin, pinHash);
  }

  async function handleSubmit() {
    setVerifying(true);
    setError("");

    try {
      let success = false;

      if (navigator.onLine) {
        // Online: verify via API
        try {
          const res = await fetch("/api/verify-pin", {
            method: "POST",
            body: JSON.stringify({ pin, userId }),
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          success = data.success;
        } catch {
          // API failed — fall back to local verification
          success = await verifyLocally(pin);
          if (!success && !pinHash) {
            // No local hash available and API unreachable
            setConnectionError(true);
            setError(t(locale, "lockConnectionError"));
            setPin("");
            setVerifying(false);
            return;
          }
        }
      } else {
        // Offline: verify locally
        success = await verifyLocally(pin);
        if (!pinHash) {
          setConnectionError(true);
          setError(t(locale, "lockConnectionError"));
          setPin("");
          setVerifying(false);
          return;
        }
      }

      if (success) {
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
        <Avatar src={userAvatar} name={userName} size={64} className="mb-3 shadow-lg" />
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

      {/* Build ID (bottom-left) — visible confirmation of which JS bundle is running */}
      <div className="absolute bottom-6 left-6">
        <span className="text-[10px] font-mono text-[#86868b]/60 tabular-nums select-none">
          build {process.env.NEXT_PUBLIC_BUILD_ID || "dev"}
        </span>
      </div>

      {/* Connection indicator (bottom-right) */}
      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          onClick={() => setShowReloadConfirm(true)}
          className={`h-7 w-7 flex items-center justify-center rounded-full border transition-colors ${
            !online || connectionError
              ? "text-[#ff3b30] border-[#ff3b30]/20 bg-[#ff3b30]/5"
              : "text-[#34c759] border-[#34c759]/20 bg-[#34c759]/5"
          }`}
        >
          {!online || connectionError ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01" /><path d="M8.5 16.429a5 5 0 0 1 7 0" /><path d="M5 12.859a10 10 0 0 1 5.17-2.69" /><path d="M13.83 10.17A10 10 0 0 1 19 12.859" /><path d="M2 8.82a15 15 0 0 1 4.17-2.65" /><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" /><path d="m2 2 20 20" /></svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01" /><path d="M8.5 16.429a5 5 0 0 1 7 0" /><path d="M5 12.859a10 10 0 0 1 14 0" /><path d="M2 8.82a15 15 0 0 1 20 0" /></svg>
          )}
        </button>
      </div>

      <ConfirmDialog
        open={showReloadConfirm}
        onClose={() => { if (!reloading) setShowReloadConfirm(false); }}
        onConfirm={async () => {
          setReloading(true);
          try {
            const res = await fetch("/api/ping", { cache: "no-store", signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              window.location.reload();
              return;
            }
          } catch { /* no connection */ }
          setReloading(false);
          setShowReloadConfirm(false);
          setError(t(locale, "lockConnectionError"));
        }}
        icon={
          reloading ? (
            <svg className="h-10 w-10 text-pos-accent mx-auto animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.356v4.992" />
            </svg>
          ) : (
            <svg className="h-10 w-10 text-pos-accent mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.015 4.356v4.992" />
            </svg>
          )
        }
        title={t(locale, "lockReloadTitle")}
        message={reloading ? t(locale, "lockReloadChecking") : t(locale, "lockReloadMessage")}
        cancelLabel={t(locale, "lockReloadCancel")}
        confirmLabel={t(locale, "lockReloadConfirm")}
        variant="primary"
        loading={reloading}
        zIndex={60}
      />
    </div>
  );
}
