"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const PING_INTERVAL = 15_000; // Check every 15 seconds
const PING_TIMEOUT = 5_000;   // 5s timeout per ping

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT);
      const res = await fetch("/api/ping", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    // Browser events for instant detection
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection(); // Verify with server
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check immediately on mount, then periodically
    setIsOnline(navigator.onLine);
    checkConnection();
    timerRef.current = setInterval(checkConnection, PING_INTERVAL);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkConnection]);

  return isOnline;
}
