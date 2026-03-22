"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { SearchInput } from "./search-input";
import { NavItem } from "./nav-item";
import {
  Home,
  Package,
  CreditCard,
  Globe,
  Users,
  BarChart3,
  UserCog,
  Settings,
  Monitor,
  Sparkles,
  Bell,
  MessageCircle,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Banknote,
  Receipt,
} from "lucide-react";

const mainNav = [
  { icon: Home, label: "Home", href: "/", id: "home" },
  { icon: Package, label: "Items & services", href: "/items", id: "items" },
  { icon: Receipt, label: "Orders", href: "/orders", id: "orders" },
  { icon: CreditCard, label: "Payments & invoices", href: "/payments", id: "payments" },
  { icon: Globe, label: "Online", href: "/online", id: "online" },
  { icon: Users, label: "Customers", href: "/customers", id: "customers" },
  { icon: BarChart3, label: "Reports", href: "/reports", id: "reports" },
  { icon: Monitor, label: "Machines / Terminals", href: "/terminals", id: "terminals" },
  { icon: Sparkles, label: "AI Insights", href: "/ai-insights", id: "ai-insights", badge: "3" },
  { icon: UserCog, label: "Staff", href: "/staff", id: "staff" },
  { icon: Settings, label: "Settings", href: "/settings", id: "settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen bg-sidebar-bg border-r border-border flex flex-col transition-all duration-200 z-40",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo / workspace */}
      <div
        className={cn(
          "relative shrink-0 border-b border-border",
          collapsed ? "flex items-center justify-center h-16 px-2" : "px-4 py-3"
        )}
      >
        {collapsed ? (
          <Link href="/" className="h-9 w-9 rounded-[var(--radius-sm)] bg-text-primary flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-extrabold tracking-tighter">CS</span>
          </Link>
        ) : (
          <Link href="/" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-cs.png"
              alt="CountingStars"
              className="h-8 w-auto object-contain object-left"
            />
            <p className="text-[10px] text-text-tertiary mt-1 truncate">
              Macau · Main Branch
            </p>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors",
            collapsed
              ? "-right-3.5 bg-surface border border-border shadow-sm z-50"
              : "right-3"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="py-3">
          <SearchInput />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {mainNav.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href)}
            badge={item.badge}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-border p-2 space-y-2">
        <button
          className={cn(
            "w-full flex items-center justify-center gap-2 bg-text-primary text-white rounded-[var(--radius-sm)] font-medium transition-all hover:opacity-90 active:scale-[0.98]",
            collapsed ? "h-10 px-2" : "h-10 px-4 text-sm"
          )}
        >
          <Banknote className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Take payment</span>}
        </button>

        <div
          className={cn(
            "flex items-center",
            collapsed ? "flex-col gap-1" : "justify-around px-1"
          )}
        >
          {[
            { icon: Bell, label: "Notifications", badge: true },
            { icon: MessageCircle, label: "Inbox" },
            { icon: HelpCircle, label: "Help" },
          ].map((item) => (
            <button
              key={item.label}
              title={item.label}
              className="relative p-2 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.badge && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-danger rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
