"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds

export type ForcedLogoutReason = "unlinked" | "disabled" | null;

/**
 * Sends periodic heartbeat pings to keep the terminal "online" in admin dashboard.
 * Also detects if the terminal has been unlinked or disabled by admin.
 */
export function useHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [forcedLogout, setForcedLogout] = useState<ForcedLogoutReason>(null);

  const sendHeartbeat = useCallback(() => {
    const terminalId = localStorage.getItem("pos_terminal_id");
    if (!terminalId) return;

    fetch("/api/terminals/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terminalId }),
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error === "unlinked" || data.error === "not-found") {
          setForcedLogout("unlinked");
        } else if (data.error === "disabled") {
          setForcedLogout("disabled");
        }
      })
      .catch(() => {
        // Silent fail — terminal will show "offline" after 3 min in admin
      });
  }, []);

  useEffect(() => {
    // Send immediately on mount
    sendHeartbeat();

    // Then every 60 seconds
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sendHeartbeat]);

  return { forcedLogout };
}
