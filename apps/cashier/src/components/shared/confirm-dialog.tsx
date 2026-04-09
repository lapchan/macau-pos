"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  icon?: ReactNode;
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  variant?: "danger" | "primary";
  zIndex?: number;
};

export default function ConfirmDialog({
  open, onClose, onConfirm, icon, title, message, cancelLabel, confirmLabel, variant = "danger", zIndex = 50,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40" style={{ zIndex }} onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] bg-pos-surface border border-pos-border rounded-[var(--radius-lg)] shadow-xl p-5 animate-scale-in text-center"
        style={{ zIndex: zIndex + 1 }}
      >
        {icon && <div className="mb-3">{icon}</div>}
        <p className="text-[14px] font-medium text-pos-text mb-1">{title}</p>
        {message && <p className="text-[13px] text-pos-text-muted mb-4">{message}</p>}
        {!message && <div className="mb-3" />}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-[var(--radius-md)] text-[13px] font-medium text-pos-text-secondary border border-pos-border hover:bg-pos-surface-hover transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-[var(--radius-md)] text-[13px] font-medium text-white transition-colors ${
              variant === "danger"
                ? "bg-pos-danger hover:bg-pos-danger/90"
                : "bg-[#007aff] hover:bg-[#0066d6]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
