"use client";

import { useEffect, useRef, useCallback } from "react";

const MAX_KEY_INTERVAL = 50; // ms between keystrokes — scanners type faster than humans
const MIN_LENGTH = 4; // minimum barcode length
const RECENT_SCAN_WINDOW = 150; // ms — global key handlers should ignore Enter within this window
const DUPLICATE_SUPPRESS_MS = 2_000; // drop identical barcodes scanned within this window

// Module-level shared state so other window-level keydown handlers
// (e.g. POS-wide Enter → checkout) can tell when an Enter keystroke
// was actually the end-of-barcode submitted by a USB/BT scanner.
let lastScanSubmitAt = 0;

export function wasRecentBarcodeScan(): boolean {
  return Date.now() - lastScanSubmitAt < RECENT_SCAN_WINDOW;
}

// Detects a customer-wallet CPM auth code (Alipay / WeChat Pay / UnionPay).
// These are 16–24 digit numeric codes — strictly longer than any product
// barcode (EAN-8/12/13, GTIN-14 max 14 digits), so the length check alone
// is enough to avoid false positives on product scans.
export function isWalletAuthCode(code: string): boolean {
  return /^\d{16,24}$/.test(code.trim());
}

type Options = {
  onScan: (barcode: string) => void;
  enabled?: boolean;
};

export function useBarcodeScanner({ onScan, enabled = true }: Options) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const lastBarcodeRef = useRef("");
  const lastBarcodeTimeRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();

      if (e.key === "Enter") {
        const buf = bufferRef.current;
        bufferRef.current = "";
        lastKeyTimeRef.current = 0;
        // Submit barcode if buffer has enough characters and was typed quickly
        if (buf.length >= MIN_LENGTH) {
          // Drop rapid duplicates (USB/BT scanners sometimes fire twice, and
          // a user holding the trigger can flood the handler — the camera
          // scanner already dedups on a 2s window, match it here).
          if (
            buf === lastBarcodeRef.current &&
            now - lastBarcodeTimeRef.current < DUPLICATE_SUPPRESS_MS
          ) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
          lastBarcodeRef.current = buf;
          lastBarcodeTimeRef.current = now;
          // Mark this Enter as scan-originated so other window listeners
          // (e.g. POS-wide Enter → checkout) can ignore it.
          lastScanSubmitAt = now;
          // Stop the same Enter from also triggering other listeners
          // registered AFTER this hook (best-effort; harmless if they ran first).
          e.preventDefault();
          e.stopImmediatePropagation();
          onScan(buf);
        }
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
