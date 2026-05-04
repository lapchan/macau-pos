"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import { X, SwitchCamera, Zap, ZapOff } from "lucide-react";

type Props = {
  locale: Locale;
  onScan: (barcode: string) => void;
  onClose: () => void;
};

export default function CameraScanner({ locale, onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef(0);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      // Debounce: ignore same barcode within 2 seconds
      const now = Date.now();
      if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 2000) return;
      lastScanRef.current = decodedText;
      lastScanTimeRef.current = now;
      onScan(decodedText);
    },
    [onScan]
  );

  useEffect(() => {
    let scanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        // Explicit format list + native BarcodeDetector API (iOS 17+) — the
        // zxing-js fallback misses Macau Pass / Alipay / WeChat CODE128 wallet
        // barcodes on iPad Safari. Listing all the wallet-relevant formats
        // (1D wallet barcodes + 2D QR for Union Pay / WeChat Pay) means a
        // single scanner handles both CPM input modes the cashier sees.
        scanner = new Html5Qrcode(
          "camera-scanner-viewport",
          {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.ITF,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
              Html5QrcodeSupportedFormats.PDF_417,
            ],
            verbose: false,
            useBarCodeDetectorIfSupported: true,
          } as any,
        );
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode },
          {
            fps: 10,
            // Wider rectangle covers both the wallet barcode (top) and QR
            // (bottom) without needing to re-aim. Square ratio drops back to
            // qrbox bounds when not scanning a wallet.
            qrbox: (vw: number, vh: number) => {
              const w = Math.min(vw - 40, 520);
              const h = Math.min(vh - 80, 360);
              return { width: w, height: h };
            },
            aspectRatio: 1.0,
          },
          handleScanSuccess,
          () => {} // ignore errors (no barcode in frame)
        );
      } catch (err: any) {
        setError(err?.message || "Camera access denied");
      }
    };

    startScanner();

    return () => {
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [facingMode, handleScanSuccess]);

  const toggleCamera = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const toggleTorch = useCallback(async () => {
    try {
      const track = scannerRef.current?.getRunningTrackCameraCapabilities?.();
      if (track?.torchFeature?.isSupported()) {
        await track.torchFeature.apply(!torch);
        setTorch(!torch);
      }
    } catch {}
  }, [torch]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-4.5 w-4.5" />
        </button>
        <span className="text-white text-[15px] font-medium">{t(locale, "scanBarcode")}</span>
        <div className="flex gap-2">
          <button
            onClick={toggleTorch}
            className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {torch ? <Zap className="h-4.5 w-4.5" /> : <ZapOff className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={toggleCamera}
            className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <SwitchCamera className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 flex items-center justify-center relative" ref={containerRef}>
        <div id="camera-scanner-viewport" className="w-full h-full" />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center px-8">
              <p className="text-white/60 text-[14px] mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-white/10 text-white text-[14px] font-medium hover:bg-white/20 transition-colors"
              >
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
