"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  active?: boolean;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function FilterChip({
  label,
  active,
  removable,
  onClick,
  onRemove,
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-full)] border transition-all",
        active
          ? "bg-text-primary text-white border-text-primary"
          : "bg-surface text-text-secondary border-border hover:border-border-strong hover:text-text-primary"
      )}
    >
      {label}
      {removable && (
        <X
          className="h-3 w-3 ml-0.5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        />
      )}
    </button>
  );
}
