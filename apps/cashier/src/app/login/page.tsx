"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginPassword } from "@/lib/auth-actions";
import { Eye, EyeOff } from "lucide-react";

// ─── POS Background — frozen & blurred ─────────────────────
function POSBackground({ dark }: { dark: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden select-none pointer-events-none">
      <div className="absolute inset-0 bg-[#f5f5f7]">
        {/* Header bar */}
        <div className="absolute top-0 left-0 right-0 h-[56px] bg-white border-b border-[#e5e5e7] flex items-center px-5 gap-3">
          <div className="h-8 w-8 rounded-[8px] bg-[#0071e3] flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">CS</span>
          </div>
          <div className="h-3 w-24 rounded bg-[#1d1d1f]/10" />
          <div className="flex-1 max-w-md mx-4 h-9 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7]" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-[#f5f5f7] border border-[#e5e5e7]" />
            <div className="h-8 w-20 rounded-lg bg-[#f5f5f7] border border-[#e5e5e7]" />
          </div>
        </div>
        {/* Category tabs */}
        <div className="absolute top-[56px] left-0 right-[360px] h-[48px] bg-white border-b border-[#e5e5e7] flex items-center gap-2 px-5">
          <div className="h-[32px] w-[60px] rounded-full bg-[#0071e3]" />
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="h-[32px] w-[72px] rounded-full bg-[#f5f5f7] border border-[#e5e5e7]" />
          ))}
        </div>
        {/* Product grid */}
        <div className="absolute top-[104px] left-0 right-[360px] bottom-0 p-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({length: 16}).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-[#e5e5e7] p-3">
                <div className="aspect-square rounded-xl bg-[#f5f5f7] mb-2.5" />
                <div className="h-3 w-4/5 rounded bg-[#1d1d1f]/8 mb-1.5" />
                <div className="h-3 w-12 rounded bg-[#0071e3]/15" />
              </div>
            ))}
          </div>
        </div>
        {/* Cart panel */}
        <div className="absolute top-0 right-0 bottom-0 w-[360px] bg-white border-l border-[#e5e5e7]">
          <div className="h-[56px] border-b border-[#e5e5e7] flex items-center px-5 gap-2">
            <div className="h-4 w-4 rounded bg-[#1d1d1f]/10" />
            <div className="h-3 w-14 rounded bg-[#1d1d1f]/10" />
          </div>
          <div className="p-4 space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7]">
                <div className="h-10 w-10 rounded-lg bg-[#e5e5e7]" />
                <div className="flex-1">
                  <div className="h-3 w-20 rounded bg-[#1d1d1f]/8 mb-1.5" />
                  <div className="h-2.5 w-14 rounded bg-[#1d1d1f]/5" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-[#e5e5e7]">
            <div className="h-12 rounded-2xl bg-[#0071e3]/60" />
          </div>
        </div>
      </div>
      {/* Blur overlay */}
      <div className={`absolute inset-0 backdrop-blur-[32px] transition-colors duration-500 ${
        dark ? "bg-black/70" : "bg-white/55"
      }`} />
    </div>
  );
}

// ─── Main Login Page ───────────────────────────────────────
export default function CashierLoginPage() {
  const [dark, setDark] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginPassword, null);
  const [lastIdentifier, setLastIdentifier] = useState("");
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [terminalName, setTerminalName] = useState("");
  const [terminalId, setTerminalId] = useState("");

  // Read localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pos-last-identifier");
    if (saved) setLastIdentifier(saved);
    const name = localStorage.getItem("pos_terminal_name");
    if (name) setTerminalName(name);
    const tid = localStorage.getItem("pos_terminal_id");
    if (tid) setTerminalId(tid);
  }, []);

  // Handle successful login
  useEffect(() => {
    if (state?.success) {
      // Save identifier for next time
      const form = document.querySelector("form");
      const identifier = form?.querySelector<HTMLInputElement>('input[name="identifier"]')?.value;
      if (identifier) {
        localStorage.setItem("pos-last-identifier", identifier);
      }
      setUnlocking(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    }
  }, [state, router]);

  const textMuted = dark ? "text-white/20" : "text-[#86868b]/30";

  const inputClasses = dark
    ? "bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus:ring-white/20 focus:border-white/20"
    : "bg-black/[0.03] border-black/[0.06] text-[#1d1d1f] placeholder:text-[#86868b]/40 focus:ring-[#0071e3]/25 focus:border-[#0071e3]/40";

  return (
    <div className={`min-h-screen transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      unlocking ? "opacity-0 scale-[1.06]" : "opacity-100 scale-100"
    }`}>
      <POSBackground dark={dark} />

      {/* Theme toggle */}
      <button
        onClick={() => setDark(d => !d)}
        aria-label="Toggle dark mode"
        className={`fixed top-4 right-4 z-20 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
          dark ? "text-white/20 hover:text-white/50" : "text-[#86868b]/25 hover:text-[#86868b]/60"
        }`}
      >
        <span className="text-[13px]">{dark ? "\u2600" : "\u263E"}</span>
      </button>

      {/* Login content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center w-full max-w-[340px] mx-4">
          {/* Logo */}
          <div className="inline-flex items-center justify-center h-[64px] w-[64px] rounded-[20px] bg-[#0071e3] mb-5 shadow-xl shadow-[#0071e3]/30">
            <span className="text-white text-[22px] font-bold tracking-tight">CS</span>
          </div>
          <h1 className={`text-[20px] font-semibold tracking-[0.01em] mb-1 ${
            dark ? "text-white" : "text-[#1d1d1f]"
          }`}>
            CountingStars
          </h1>
          <p className={`text-[13px] ${dark ? "text-white/45" : "text-[#86868b]"} ${terminalName ? "mb-4" : "mb-8"}`}>
            Sign in to start your session
          </p>

          {/* Terminal info badge */}
          {terminalName && (
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl mb-4 text-[12px] font-medium ${
              dark ? "bg-white/[0.06] text-white/50 border border-white/[0.06]" : "bg-black/[0.03] text-[#86868b] border border-black/[0.04]"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-emerald-400/70" : "bg-emerald-500/60"}`} />
              {terminalName}
            </div>
          )}

          {/* Login form */}
          <form action={formAction} className="w-full space-y-3">
            {state?.error && (
              <div className="text-[12px] text-center text-[#ff3b30] bg-[#ff3b30]/8 px-3 py-2.5 rounded-2xl border border-[#ff3b30]/10 animate-fade-in">
                {state.error}
              </div>
            )}

            <div>
              <input
                name="identifier"
                type="text"
                required
                placeholder="Phone number or email"
                autoComplete="username"
                defaultValue={lastIdentifier}
                autoFocus={!lastIdentifier}
                className={`w-full h-[48px] px-4 text-[14px] border rounded-2xl focus:outline-none focus:ring-2 transition-all ${inputClasses}`}
              />
            </div>

            <div className="relative">
              <input
                ref={passwordRef}
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                autoComplete="current-password"
                autoFocus={!!lastIdentifier}
                className={`w-full h-[48px] px-4 pr-12 text-[14px] border rounded-2xl focus:outline-none focus:ring-2 transition-all ${inputClasses}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                tabIndex={-1}
                className={`absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full transition-colors ${
                  dark ? "text-white/25 hover:text-white/50" : "text-[#86868b]/40 hover:text-[#86868b]/70"
                }`}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Hidden terminal ID */}
            <input
              type="hidden"
              name="terminalId"
              value={terminalId}
            />

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[48px] rounded-2xl bg-[#0071e3] text-white font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-[#0071e3]/20"
            >
              {isPending ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Sign In"}
            </button>

            {/* Demo credentials hint — absolute so removal doesn't shift layout */}
            <div className={`text-[11px] text-center mt-3 ${
              dark ? "text-white/25" : "text-[#86868b]/50"
            }`}>
              Demo: owner@countingstars.mo / demo1234
            </div>
          </form>
        </div>
      </div>

      {/* Bottom branding */}
      <div className={`fixed bottom-4 left-0 right-0 text-center z-10 ${textMuted}`}>
        <span className="text-[10px] tracking-[0.2em] uppercase font-medium">RetailOS</span>
      </div>
    </div>
  );
}
