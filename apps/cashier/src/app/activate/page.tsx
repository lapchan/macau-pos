"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Monitor, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const CODE_LENGTH = 6;

export default function ActivateTerminalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const [terminalName, setTerminalName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const autoActivatedRef = useRef(false);

  const handleActivate = useCallback(async (activationCode: string) => {
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
    } catch {
      setError("Network error. Please check your connection.");
      setState("idle");
    }
  }, [router]);

  const handleInput = useCallback((value: string) => {
    // Only allow alphanumeric, auto-uppercase
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(cleaned);
    setError(null);

    // Auto-submit when full code entered
    if (cleaned.length === CODE_LENGTH) {
      handleActivate(cleaned);
    }
  }, [handleActivate]);

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

            {/* Help text */}
            <p className="text-xs text-gray-400 mt-4">
              Ask your store manager for the activation code.
              <br />
              It can be found in <span className="font-medium">Admin → Terminals → Add Terminal</span>.
            </p>

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
