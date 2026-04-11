"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Monitor, Loader2, AlertCircle, CheckCircle2, QrCode, X } from "lucide-react";

const CODE_LENGTH = 6;

export default function ActivateTerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-blue-500 animate-spin" /></div>}>
      <ActivateTerminalContent />
    </Suspense>
  );
}

function ActivateTerminalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const [terminalName, setTerminalName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const autoActivatedRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  console.log("[Activate] Component mounted, state:", state, "code:", code);

  const handleActivate = useCallback(async (activationCode: string) => {
    console.log("[Activate] handleActivate called with:", activationCode);
    setError(null);
    setState("loading");

    try {
      const res = await fetch("/api/terminals/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activationCode,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language,
          },
        }),
      });

      const data = await res.json();
      console.log("[Activate] API response:", data);

      if (data.success) {
        // Store terminal ID
        localStorage.setItem("pos_terminal_id", data.terminalId);
        localStorage.setItem("pos_terminal_name", data.terminalName);
        setTerminalName(data.terminalName);
        setState("success");

        // Redirect to login after brief success display
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(data.error || "Activation failed");
        setState("idle");
      }
    } catch (e) {
      console.error("[Activate] Network error:", e);
      setError("Network error. Please check your connection.");
      setState("idle");
    }
  }, [router]);

  const handleInput = useCallback((value: string) => {
    console.log("[Activate] handleInput raw:", value);
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    console.log("[Activate] handleInput cleaned:", cleaned);
    setCode(cleaned);
    setError(null);

    if (cleaned.length === CODE_LENGTH) {
      console.log("[Activate] Full code entered, auto-submitting");
      handleActivate(cleaned);
    }
  }, [handleActivate]);

  const handleQrScan = useCallback((decodedText: string) => {
    // Extract code from URL or use raw text
    let activationCode = decodedText;
    try {
      const url = new URL(decodedText);
      const codeParam = url.searchParams.get("code");
      if (codeParam) activationCode = codeParam;
    } catch { /* not a URL, use raw text */ }

    const cleaned = activationCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    if (cleaned.length === CODE_LENGTH) {
      setScanning(false);
      // Stop scanner
      scannerRef.current?.stop?.().catch(() => {});
      scannerRef.current = null;
      setCode(cleaned);
      handleActivate(cleaned);
    }
  }, [handleActivate]);

  const startScanner = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-scanner-viewport");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleQrScan,
        () => {}
      );
    } catch {
      setError("Camera access denied. Please allow camera permission.");
      setScanning(false);
    }
  }, [handleQrScan]);

  const stopScanner = useCallback(() => {
    scannerRef.current?.stop?.().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => { scannerRef.current?.stop?.().catch(() => {}); };
  }, []);

  // Auto-activate from QR code URL (?code=ABC123)
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && urlCode.length >= 4 && !autoActivatedRef.current) {
      autoActivatedRef.current = true;
      const cleaned = urlCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
      setCode(cleaned);
      if (cleaned.length === CODE_LENGTH) {
        handleActivate(cleaned);
      }
    }
  }, [searchParams, handleActivate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <Monitor className="h-10 w-10 text-white" strokeWidth={1.75} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Activate Terminal
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Enter the 6-character activation code from your admin dashboard to pair this device.
        </p>

        {/* Success state */}
        {state === "success" && (
          <div className="animate-[scaleIn_0.3s_ease-out]">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">Terminal Activated!</p>
            <p className="text-sm text-gray-500">{terminalName}</p>
            <p className="text-xs text-gray-400 mt-2">Redirecting to login...</p>
          </div>
        )}

        {/* Code input */}
        {state !== "success" && (
          <>
            {/* Character boxes */}
            <div
              className="flex justify-center gap-2.5 mb-6 cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                const char = code[i] || "";
                const isActive = i === code.length && state === "idle";
                return (
                  <div
                    key={i}
                    className={`
                      h-14 w-11 rounded-xl border-2 flex items-center justify-center
                      text-xl font-bold text-gray-900 transition-all duration-150
                      ${isActive ? "border-blue-500 bg-blue-50/50 scale-105" : char ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-50"}
                      ${state === "loading" ? "opacity-60" : ""}
                    `}
                  >
                    {state === "loading" && i === code.length - 1 ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : (
                      char
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hidden input */}
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => handleInput(e.target.value)}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={CODE_LENGTH}
              disabled={state === "loading"}
              className="sr-only"
              aria-label="Activation code"
            />

            {/* Error */}
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-4 animate-[scaleIn_0.2s_ease-out]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* QR Scanner */}
            {scanning ? (
              <div className="mb-4">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <div id="qr-scanner-viewport" className="w-full" style={{ minHeight: 280 }} />
                  <button
                    onClick={stopScanner}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Point camera at the QR code in Admin</p>
              </div>
            ) : (
              <button
                onClick={startScanner}
                disabled={state === "loading"}
                className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <QrCode className="h-4 w-4" />
                Scan QR Code
              </button>
            )}

            <div className="text-xs text-gray-400 border-t border-gray-200 pt-4 mt-2">
              <p>Enter the code manually or scan the QR code from Admin → Terminals.</p>
            </div>

            {/* Clear button */}
            {code.length > 0 && state === "idle" && (
              <button
                onClick={() => { setCode(""); setError(null); inputRef.current?.focus(); }}
                className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear and try again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
