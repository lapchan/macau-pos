import type { PrinterErrorCode } from "./types.js";

export class BridgeError extends Error {
  readonly code: PrinterErrorCode;
  readonly status: number;

  constructor(code: PrinterErrorCode, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class PrinterOfflineError extends BridgeError {
  constructor(message = "printer offline") {
    super("printer_offline", message, 503);
  }
}

export class PrinterTimeoutError extends BridgeError {
  constructor(message = "printer write timed out") {
    super("printer_timeout", message, 504);
  }
}

export class PrinterPaperOutError extends BridgeError {
  constructor() {
    super("printer_paper_out", "printer out of paper", 503);
  }
}

export class PrinterCoverOpenError extends BridgeError {
  constructor() {
    super("printer_cover_open", "printer cover open", 503);
  }
}

export class TransportUnavailableError extends BridgeError {
  constructor(message = "no transport adapter available") {
    super("transport_unavailable", message, 503);
  }
}
