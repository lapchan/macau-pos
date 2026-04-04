"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Monitor, AlertTriangle, Loader2 } from "lucide-react";

type TerminalStatus = "checking" | "valid" | "not-activated" | "disabled" | "error";

export default function TerminalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<TerminalStatus>("checking");
  const [terminalName, setTerminalName] = useState("");

  // Skip guard on the activate page itself
  const isActivatePage = pathname === "/activate";

  useEffect(() => {
    if (isActivatePage) {
      setStatus("valid");
      return;
    }

    const terminalId = localStorage.getItem("pos_terminal_id");

    if (!terminalId) {
      setStatus("not-activated");
      return;
    }

    // Validate terminal with server
    fetch(`/api/terminals/me?id=${terminalId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTerminalName(data.terminalName);
          setStatus("valid");
        } else if (data.error === "disabled") {
          setTerminalName(data.terminalName || "");
          setStatus("disabled");
        } else {
          // Terminal not found — clear stored ID and redirect
          localStorage.removeItem("pos_terminal_id");
          localStorage.removeItem("pos_terminal_name");
          setStatus("not-activated");
        }
      })
      .catch(() => {
        // Network error — allow offline operation if terminal was previously activated
        const storedName = localStorage.getItem("pos_terminal_name");
        if (storedName) {
          setTerminalName(storedName);
          setStatus("valid"); // Trust localStorage for offline resilience
        } else {
          setStatus("error");
        }
      });
  }, [isActivatePage]);

  // Redirect to activate page
  useEffect(() => {
    if (status === "not-activated" && !isActivatePage) {
      router.replace("/activate");
    }
  }, [status, isActivatePage, router]);

  // Loading state
  if (status === "checking") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  // Disabled state
  if (status === "disabled") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Terminal Disabled</h1>
          <p className="text-sm text-gray-500 mb-4">
            {terminalName ? `"${terminalName}" has been` : "This terminal has been"} disabled by the administrator.
          </p>
          <p className="text-xs text-gray-400">
            Contact your store manager to re-enable this terminal.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("pos_terminal_id");
              localStorage.removeItem("pos_terminal_name");
              router.replace("/activate");
            }}
            className="mt-6 text-xs text-blue-500 hover:text-blue-600 transition-colors"
          >
            Activate a different terminal
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Monitor className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-sm text-gray-500 mb-4">
            Unable to verify this terminal. Please check your network connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-6 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Valid — render children
  return <>{children}</>;
}
