export interface PrinterProbeResult {
  up: boolean;
  model?: string;
  lastError?: string;
  paperOut?: boolean;
  coverOpen?: boolean;
}

export interface TransportAdapter {
  readonly name: "linux-lp" | "node-usb" | "cups" | "noop";
  init(): Promise<void>;
  write(bytes: Uint8Array, opts: { timeoutMs: number }): Promise<void>;
  probe(): Promise<PrinterProbeResult>;
  close?(): Promise<void>;
}

// Temporary adapter used when no real transport is available (dev mode, no
// printer attached). write() is a no-op that logs; probe() reports healthy so
// the daemon can still start for integration testing.
export class NoopTransport implements TransportAdapter {
  readonly name = "noop" as const;
  async init(): Promise<void> {}
  async write(): Promise<void> {}
  async probe(): Promise<PrinterProbeResult> {
    return { up: true, model: "noop (dev only)" };
  }
}
