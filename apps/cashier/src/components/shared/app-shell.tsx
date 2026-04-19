"use client";

import { useEffect } from "react";
import { Unplug, ShieldOff } from "lucide-react";
import TerminalGuard from "./terminal-guard";
import UpdateBanner from "./update-banner";
import { useHeartbeat } from "@/lib/use-heartbeat";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { forcedLogout, needsReload } = useHeartbeat();

  // When forced logout is detected, clear all terminal state and redirect after delay
  useEffect(() => {
    if (!forcedLogout) return;

    localStorage.removeItem("pos_terminal_id");
    localStorage.removeItem("pos_terminal_name");
    sessionStorage.removeItem("pos-locked");

    const timer = setTimeout(() => {
      window.location.href = "/activate";
    }, 4000);

    return () => clearTimeout(timer);
  }, [forcedLogout]);

  // Forced logout overlay — blocks entire UI
  if (forcedLogout) {
    const isUnlinked = forcedLogout === "unlinked";
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            {isUnlinked ? (
              <Unplug className="h-8 w-8 text-red-500" />
            ) : (
              <ShieldOff className="h-8 w-8 text-orange-500" />
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isUnlinked ? "Terminal Disconnected" : "Terminal Disabled"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isUnlinked
              ? "This terminal has been unlinked by the administrator. Redirecting to activation..."
              : "This terminal has been disabled by the administrator. Redirecting to activation..."}
          </p>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-[shrink_4s_linear_forwards]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <UpdateBanner visible={needsReload} />
      <TerminalGuard>{children}</TerminalGuard>
    </>
  );
}
