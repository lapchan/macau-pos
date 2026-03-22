"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size and auto-collapse/hide sidebar
  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    if (width < 768) {
      setIsMobile(true);
      setMobileOpen(false);
    } else if (width < 1024) {
      setIsMobile(false);
      setSidebarCollapsed(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Close mobile sidebar on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center gap-3 px-4 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 -ml-2 rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-hover transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-cs.png"
            alt="CountingStars"
            className="h-6 w-auto"
          />
        </header>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless mobileOpen */}
      {(!isMobile || mobileOpen) && (
        <AppSidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggle={() => {
            if (isMobile) {
              setMobileOpen(false);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />
      )}

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-200",
          isMobile
            ? "ml-0 pt-14"
            : sidebarCollapsed
            ? "ml-[68px]"
            : "ml-[260px]"
        )}
      >
        <div className={cn("max-w-[1200px] mx-auto py-6", isMobile ? "px-4" : "px-8 py-8")}>
          {children}
        </div>
      </main>
    </div>
  );
}
