"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  badge?: string | number;
  collapsed?: boolean;
}

export function NavItem({
  icon: Icon,
  label,
  href,
  active,
  badge,
  collapsed,
}: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-150 group",
        active
          ? "bg-sidebar-active text-text-primary"
          : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active ? "text-text-primary" : "text-text-tertiary group-hover:text-text-secondary"
        )}
        strokeWidth={active ? 2 : 1.75}
      />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {badge !== undefined && (
            <span className="text-xs font-medium text-text-tertiary bg-surface-hover px-1.5 py-0.5 rounded-[var(--radius-full)]">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
