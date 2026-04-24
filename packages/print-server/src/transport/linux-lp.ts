import { promises as fs } from "node:fs";
import type {
  PrinterProbeResult,
  TransportAdapter,
} from "./adapter.js";
import { PrinterOfflineError, PrinterTimeoutError } from "../errors.js";
import { logging } from "../util/logging.js";

const DEFAULT_LP_PATHS = [
  "/dev/usb/lp0",
  "/dev/usb/lp1",
  "/dev/usb/lp2",
  "/dev/usb/lp3",
];

export interface LinuxLpAdapterOpts {
  // Tests inject a list of candidate paths (real temp files) so the adapter
  // can be exercised without root or a real printer.
  lpPaths?: string[];
}

// Linux + OpenWRT raw printer path. Most cheap thermal printers expose
// themselves as /dev/usb/lp* when plugged in. The kernel's usblp driver
// buffers writes for us — we just open the char device and emit bytes.
export class LinuxLpAdapter implements TransportAdapter {
  readonly name = "linux-lp" as const;
  devicePath: string | null = null;
  private readonly paths: string[];

  constructor(opts: LinuxLpAdapterOpts = {}) {
    this.paths = opts.lpPaths ?? DEFAULT_LP_PATHS;
  }

  async init(): Promise<void> {
    this.devicePath = await this.findLpDevice();
    if (this.devicePath) {
      logging.info("linux-lp init", { device: this.devicePath });
    }
  }

  async write(
    bytes: Uint8Array,
    opts: { timeoutMs: number },
  ): Promise<void> {
    if (!this.devicePath) this.devicePath = await this.findLpDevice();
    if (!this.devicePath) throw new PrinterOfflineError("no /dev/usb/lp*");

    const fh = await fs.open(this.devicePath, "w");
    let timer: NodeJS.Timeout | null = null;
    try {
      await Promise.race<void>([
        fh.write(bytes, 0, bytes.length).then(() => undefined),
        new Promise<void>((_, reject) => {
          timer = setTimeout(
            () => reject(new PrinterTimeoutError()),
            opts.timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      await fh.close();
    }
  }

  async probe(): Promise<PrinterProbeResult> {
    const p = this.devicePath ?? (await this.findLpDevice());
    if (!p) return { up: false, lastError: "no lp device" };
    this.devicePath = p;
    return { up: true, model: p };
  }

  // Scans /dev/usb/lp0..3 (covers ≥99% of single-printer OpenWRT deployments).
  // Returns the first writable path, or null.
  async findLpDevice(): Promise<string | null> {
    for (const p of this.paths) {
      try {
        await fs.access(p, fs.constants.W_OK);
        return p;
      } catch {
        // next
      }
    }
    return null;
  }
}
