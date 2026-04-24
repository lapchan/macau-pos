import type { PrinterCodePage, PrinterDriver } from "@macau-pos/escpos-shared";

export interface BridgeConfig {
  version: string;
  locationId: string;
  tenantSlug: string;
  endpointUrl: string;
  heartbeatUrl: string;
  token: string;
  pendingToken?: string | null;
  rotationOverlapUntil?: string | null;
  listenPort: number;
  transport: "auto" | "linux-lp" | "node-usb" | "cups";
  cupsPrinterName: string | null;
  paperWidth: 58 | 80;
  codePage: PrinterCodePage;
  driver: PrinterDriver;
  logLevel: "debug" | "info" | "warn" | "error";
  sentryDsn: string | null;
}

export interface Metrics {
  jobsServedTotal: number;
  startedAt: number;
  lastError?: string;
}

export type PrinterErrorCode =
  | "unauthorized"
  | "rate_limited"
  | "bad_request"
  | "printer_offline"
  | "printer_paper_out"
  | "printer_cover_open"
  | "printer_error"
  | "printer_timeout"
  | "transport_unavailable"
  | "internal";
