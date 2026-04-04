"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds

/**
 * Sends periodic heartbeat pings to keep the terminal "online" in admin dashboard.
 * Reads terminal ID from localStorage. Silently fails on network errors.
 */
export function useHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sendHeartbeat = () => {
      const terminalId = localStorage.getItem("pos_terminal_id");
      if (!terminalId) return;

      fetch("/api/terminals/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terminalId }),
      }).catch(() => {
        // Silent fail — terminal will show "offline" after 3 min in admin
      });
    };

    // Send immediately on mount
    sendHeartbeat();

    // Then every 60 seconds
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
