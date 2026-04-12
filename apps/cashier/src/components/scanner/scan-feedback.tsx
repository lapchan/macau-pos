"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, ScanLine } from "lucide-react";

export type ScanFeedbackKind = "success" | "not-found" | "error";

export type ScanFeedbackState = {
  kind: ScanFeedbackKind;
  message: string;
  // Bumped on every new scan so identical messages still re-trigger the animation
  nonce: number;
} | null;

type Props = {
  state: ScanFeedbackState;
  onDone: () => void;
  durationMs?: number;
};

const STYLES: Record<
  ScanFeedbackKind,
  { iconBg: string; iconColor: string; icon: typeof Check; ring: string }
> = {
  success: {
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
    icon: Check,
    ring: "ring-emerald-500/30",
  },
  "not-found": {
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
    icon: AlertTriangle,
    ring: "ring-amber-500/30",
  },
  error: {
    iconBg: "bg-red-500/15",
    iconColor: "text-red-500",
    icon: X,
    ring: "ring-red-500/30",
  },
};

export default function ScanFeedback({ state, onDone, durationMs = 1800 }: Props) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!state) return;
    setClosing(false);
    const closeTimer = setTimeout(() => setClosing(true), durationMs);
    const doneTimer = setTimeout(onDone, durationMs + 220);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(doneTimer);
    };
  }, [state, durationMs, onDone]);

  if (!state) return null;

  const style = STYLES[state.kind];
  const Icon = style.icon;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-[8vh] px-4 transition-all duration-200 ${
        closing
          ? "opacity-0 -translate-y-4"
          : "animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]"
      }`}
      aria-live="polite"
    >
      <div
        className={`w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl ring-1 ${style.ring} overflow-hidden`}
      >
        <div className="flex items-center gap-4 px-6 py-5">
          <div
            className={`shrink-0 h-14 w-14 rounded-full flex items-center justify-center ${style.iconBg}`}
          >
            <Icon className={`h-7 w-7 ${style.iconColor}`} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
              <ScanLine className="h-3 w-3" />
              <span>Scan</span>
            </div>
            <p className="text-[16px] font-semibold text-pos-text leading-snug truncate">
              {state.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
