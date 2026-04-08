"use client";

import { useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  onClick: () => void;
  className?: string;
  dark?: boolean;
  label?: string;
};

export default function CloseButton({ onClick, className, dark = false, label = "Close" }: Props) {
  const pressing = useRef(false);

  const handleClick = useCallback(() => {
    if (pressing.current) return;
    pressing.current = true;
    // Small delay to show the scale feedback before closing
    setTimeout(() => {
      onClick();
      pressing.current = false;
    }, 120);
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-[0.90]",
        dark
          ? "bg-white/10 text-zinc-400 hover:bg-white/20"
          : "bg-black/8 text-pos-text-muted hover:bg-black/15",
        className
      )}
    >
      <X className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
