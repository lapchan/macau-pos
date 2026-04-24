import { spawn, type ChildProcess } from "node:child_process";
import type {
  PrinterProbeResult,
  TransportAdapter,
} from "./adapter.js";
import {
  PrinterOfflineError,
  PrinterTimeoutError,
  TransportUnavailableError,
} from "../errors.js";
import { logging } from "../util/logging.js";

// CUPS fallback. macOS Gatekeeper sometimes blocks libusb; many admins
// already have the printer installed as a CUPS queue, so we can shell out
// to `lp -d <queue> -o raw` and let the system handle transport.
export class CupsAdapter implements TransportAdapter {
  readonly name = "cups" as const;
  private readonly printerName: string;

  constructor(printerName: string) {
    if (!printerName) throw new TransportUnavailableError("cups printer name required");
    this.printerName = printerName;
  }

  async init(): Promise<void> {
    const probe = await this.probe();
    if (!probe.up) {
      throw new PrinterOfflineError(probe.lastError ?? "cups probe failed");
    }
    logging.info("cups init", { printer: this.printerName });
  }

  async write(
    bytes: Uint8Array,
    opts: { timeoutMs: number },
  ): Promise<void> {
    const child = spawn("lp", ["-d", this.printerName, "-o", "raw"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const finished = new Promise<void>((resolve, reject) => {
      let stderrBuf = "";
      child.stderr?.on("data", (chunk: Buffer) => {
        stderrBuf += chunk.toString("utf-8");
      });
      child.on("error", (err) => reject(new PrinterOfflineError(err.message)));
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new PrinterOfflineError(`lp exited ${code}: ${stderrBuf.trim()}`));
      });
    });

    const stdin = child.stdin;
    if (!stdin) throw new PrinterOfflineError("cups spawn: no stdin");
    stdin.end(Buffer.from(bytes));

    await withTimeout(finished, opts.timeoutMs, child);
  }

  async probe(): Promise<PrinterProbeResult> {
    try {
      const { stdout, code } = await runCapture("lpstat", ["-p", this.printerName], 3000);
      if (code !== 0) return { up: false, lastError: `lpstat exit ${code}` };
      const lower = stdout.toLowerCase();
      const idle = lower.includes("idle") || lower.includes("is idle");
      const enabled = !lower.includes("disabled");
      const up = enabled && (idle || lower.includes("enabled"));
      return {
        up,
        model: this.printerName,
        lastError: up ? undefined : "printer not idle",
      };
    } catch (err) {
      return { up: false, lastError: (err as Error).message };
    }
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  child: ChildProcess,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new PrinterTimeoutError("cups write timed out"));
    }, timeoutMs);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(t);
        reject(err);
      });
  });
}

function runCapture(
  cmd: string,
  args: string[],
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${cmd} timed out`));
    }, timeoutMs);
    child.stdout?.on("data", (b: Buffer) => (stdout += b.toString("utf-8")));
    child.stderr?.on("data", (b: Buffer) => (stderr += b.toString("utf-8")));
    child.on("error", (err) => {
      clearTimeout(t);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ stdout, stderr, code: code ?? -1 });
    });
  });
}
