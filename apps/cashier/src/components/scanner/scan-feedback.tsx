"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

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

const STYLES: Record<ScanFeedbackKind, { bg: string; border: string; text: string; icon: typeof Check }> = {
  success: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    icon: Check,
  },
  "not-found": {
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-300",
    icon: AlertTriangle,
  },
  error: {
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    text: "text-red-300",
    icon: X,
  },
};

export default function ScanFeedback({ state, onDone, durationMs = 2000 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!state) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const showTimer = setTimeout(() => setVisible(false), durationMs);
    const doneTimer = setTimeout(onDone, durationMs + 250);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
    // Re-run on every new scan (nonce bumps), even if message is identical
  }, [state, durationMs, onDone]);

  if (!state) return null;

  const style = STYLES[state.kind];
  const Icon = style.icon;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-[60] -translate-x-1/2"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 backdrop-blur-md shadow-lg transition-all duration-200 ease-out ${
          style.bg
        } ${style.border} ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        }`}
      >
        <Icon className={`h-4 w-4 ${style.text}`} strokeWidth={2.5} />
        <span className={`text-[13px] font-medium ${style.text}`}>{state.message}</span>
      </div>
    </div>
  );
}
