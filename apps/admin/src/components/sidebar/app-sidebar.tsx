"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { SearchInput } from "./search-input";
import { NavItem } from "./nav-item";
import { LanguageSwitcher } from "./language-switcher";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
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
  Clock,
  MapPin,
  DollarSign,
  Sparkles,
  Bell,
  MessageCircle,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Banknote,
  Receipt,
  LogOut,
  User,
} from "lucide-react";
import { logout } from "@/lib/auth-actions";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userName?: string;
  userRole?: string;
}

export function AppSidebar({ collapsed, onToggle, userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { locale } = useLocale();

  const mainNav = [
    { icon: Home, label: t(locale, "sidebar.home"), href: "/", id: "home" },
    { icon: Package, label: t(locale, "sidebar.itemsServices"), href: "/items", id: "items" },
    { icon: Receipt, label: t(locale, "sidebar.orders"), href: "/orders", id: "orders" },
    { icon: CreditCard, label: t(locale, "sidebar.paymentsInvoices"), href: "/payments", id: "payments" },
    { icon: Globe, label: t(locale, "sidebar.online"), href: "/online", id: "online" },
    { icon: Users, label: t(locale, "sidebar.customers"), href: "/customers", id: "customers" },
    { icon: BarChart3, label: t(locale, "sidebar.reports"), href: "/reports", id: "reports" },
    { icon: Monitor, label: t(locale, "sidebar.terminals"), href: "/terminals", id: "terminals" },
    { icon: Clock, label: t(locale, "sidebar.shifts") || "Shifts", href: "/shifts", id: "shifts" },
    { icon: MapPin, label: t(locale, "sidebar.locations") || "Locations", href: "/locations", id: "locations" },
    { icon: DollarSign, label: "Pricing", href: "/pricing-strategies", id: "pricing-strategies" },
    { icon: Sparkles, label: t(locale, "sidebar.aiInsights"), href: "/ai-insights", id: "ai-insights", badge: "3" },
    { icon: UserCog, label: t(locale, "sidebar.staff"), href: "/staff", id: "staff" },
    { icon: Settings, label: t(locale, "sidebar.settings"), href: "/settings", id: "settings" },
  ];

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
          /* Collapsed: Logo transforms to expand button on hover */
          <div className="group relative">
            <button
              onClick={onToggle}
              className="h-9 w-9 rounded-[var(--radius-sm)] bg-text-primary flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-accent group-hover:scale-105 active:scale-95"
              aria-label={t(locale, "sidebar.expandSidebar")}
            >
              {/* CS logo → expand icon on hover */}
              <span className="text-white text-[11px] font-extrabold tracking-tighter transition-opacity duration-200 group-hover:opacity-0 absolute">CS</span>
              <PanelLeftOpen className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-text-primary text-white text-[11px] font-medium rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg">
              {t(locale, "sidebar.expandSidebar")}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-text-primary" />
            </div>
          </div>
        ) : (
          <Link href="/" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-cs.png"
              alt="CountingStars"
              className="h-8 w-auto object-contain object-left"
            />
            <p className="text-[10px] text-text-tertiary mt-1 truncate">
              {t(locale, "sidebar.location")}
            </p>
          </Link>
        )}
        {/* Collapse button with tooltip — only shown when expanded */}
        {!collapsed && (
          <div className="absolute top-1/2 -translate-y-1/2 right-3 group">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
              aria-label={t(locale, "sidebar.collapseSidebar")}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            {/* Tooltip */}
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-text-primary text-white text-[11px] font-medium rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg">
              {t(locale, "sidebar.collapseSidebar")}
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-text-primary" />
            </div>
          </div>
        )}
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
          {!collapsed && <span>{t(locale, "sidebar.takePayment")}</span>}
        </button>

        <div
          className={cn(
            "flex items-center",
            collapsed ? "flex-col gap-1" : "justify-around px-1"
          )}
        >
          {[
            { icon: Bell, label: t(locale, "sidebar.notifications"), badge: true },
            { icon: MessageCircle, label: t(locale, "sidebar.inbox") },
            { icon: HelpCircle, label: t(locale, "sidebar.help") },
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

        {/* Language switcher */}
        <LanguageSwitcher collapsed={collapsed} />

        {/* User info + logout */}
        {userName && (
          <div
            className={cn(
              "flex items-center border-t border-border pt-2 mt-1",
              collapsed ? "justify-center" : "gap-2 px-1"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-accent" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{userName}</p>
                <p className="text-[10px] text-text-tertiary capitalize">{userRole?.replace("_", " ")}</p>
              </div>
            )}
            <form action={logout}>
              <button
                type="submit"
                title={t(locale, "sidebar.signOut")}
                className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
