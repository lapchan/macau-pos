"use client";

import { useEffect, useRef, useCallback } from "react";

const MAX_KEY_INTERVAL = 50; // ms between keystrokes — scanners type faster than humans
const MIN_LENGTH = 4; // minimum barcode length

type Options = {
  onScan: (barcode: string) => void;
  enabled?: boolean;
};

export function useBarcodeScanner({ onScan, enabled = true }: Options) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();

      if (e.key === "Enter") {
        // Submit barcode if buffer has enough characters and was typed quickly
        if (bufferRef.current.length >= MIN_LENGTH) {
          onScan(bufferRef.current);
        }
        bufferRef.current = "";
        lastKeyTimeRef.current = 0;
        return;
      }

      // Only accept printable single characters
      if (e.key.length !== 1) return;

      // If too much time passed since last key, start fresh
      if (now - lastKeyTimeRef.current > MAX_KEY_INTERVAL && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      bufferRef.current += e.key;
      lastKeyTimeRef.current = now;
    },
    [onScan, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}
