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

// USB printer class (bInterfaceClass = 7) — matches every ESC/POS thermal
// we've tested (Xprinter N160II, Epson TM-T20, Star TSP-100). bInterfaceProtocol
// 2 (bidirectional) lets us read status replies; 1 (unidirectional) is
// accepted as fallback with probe() disabled.
const PRINTER_CLASS = 0x07;
const STATUS_QUERY_BYTES = new Uint8Array([0x1d, 0x72, 0x01]); // GS r 1
const STATUS_READ_TIMEOUT_MS = 500;

// Minimal shape of what we use from the `usb` package. Declared structurally
// so tests can inject a fake without pulling libusb.
export interface UsbModuleLike {
  getDeviceList(): UsbDeviceLike[];
}

export interface UsbDeviceLike {
  deviceDescriptor: {
    idVendor: number;
    idProduct: number;
    iProduct?: number;
  };
  configDescriptor?: { bNumInterfaces: number } | null;
  open(): void;
  close(): void;
  interfaces: UsbInterfaceLike[] | null;
  getStringDescriptor?(
    index: number,
    cb: (err: Error | undefined, value?: string) => void,
  ): void;
}

export interface UsbInterfaceLike {
  descriptor: {
    bInterfaceClass: number;
    bInterfaceProtocol: number;
  };
  endpoints: UsbEndpointLike[];
  claim(): void;
  release(closeDevice: boolean, cb: (err?: Error) => void): void;
  isKernelDriverActive?(): boolean;
  detachKernelDriver?(): void;
}

export interface UsbEndpointLike {
  direction: "in" | "out";
  transferType: number;
  transfer(
    dataOrLength: Buffer | number,
    cb: (err: Error | undefined, data?: Buffer) => void,
  ): void;
}

export interface NodeUsbAdapterOpts {
  vendorId?: number;
  productId?: number;
  // Test hook: inject a fake usb module. Production leaves this undefined and
  // init() does a dynamic import("usb").
  usbModule?: UsbModuleLike;
}

export class NodeUsbAdapter implements TransportAdapter {
  readonly name = "node-usb" as const;

  private usb: UsbModuleLike | null = null;
  private device: UsbDeviceLike | null = null;
  private iface: UsbInterfaceLike | null = null;
  private epOut: UsbEndpointLike | null = null;
  private epIn: UsbEndpointLike | null = null;
  private model: string | null = null;

  constructor(private readonly opts: NodeUsbAdapterOpts = {}) {}

  async init(): Promise<void> {
    this.usb = this.opts.usbModule ?? (await loadUsbModule());

    const device = this.findPrinter(this.usb.getDeviceList());
    if (!device) throw new PrinterOfflineError("no USB printer-class device");
    this.device = device;

    device.open();
    const printerIface = (device.interfaces ?? []).find(
      (i) => i.descriptor.bInterfaceClass === PRINTER_CLASS,
    );
    if (!printerIface) {
      device.close();
      throw new PrinterOfflineError("device has no printer interface");
    }

    if (printerIface.isKernelDriverActive?.()) {
      printerIface.detachKernelDriver?.();
    }
    printerIface.claim();
    this.iface = printerIface;

    for (const ep of printerIface.endpoints) {
      if (ep.direction === "out" && !this.epOut) this.epOut = ep;
      if (ep.direction === "in" && !this.epIn) this.epIn = ep;
    }
    if (!this.epOut) {
      await this.close();
      throw new PrinterOfflineError("no OUT endpoint on printer interface");
    }

    this.model = await readProductString(device);
    logging.info("node-usb init", { model: this.model });
  }

  async write(
    bytes: Uint8Array,
    opts: { timeoutMs: number },
  ): Promise<void> {
    if (!this.epOut) throw new PrinterOfflineError("node-usb not initialized");
    await transferWithTimeout(this.epOut, Buffer.from(bytes), opts.timeoutMs);
  }

  async probe(): Promise<PrinterProbeResult> {
    if (!this.epOut) return { up: false, lastError: "not initialized" };
    // Bidirectional interfaces support status query; unidirectional print-only
    // interfaces just report "up" based on successful claim.
    if (!this.epIn) return { up: true, model: this.model ?? "usb printer" };

    try {
      await transferWithTimeout(this.epOut, Buffer.from(STATUS_QUERY_BYTES), 500);
      const data = await readWithTimeout(this.epIn, 1, STATUS_READ_TIMEOUT_MS);
      const byte = data[0] ?? 0;
      const paperOut = (byte & 0x04) !== 0;
      const coverOpen = (byte & 0x20) !== 0;
      return {
        up: !paperOut && !coverOpen,
        model: this.model ?? "usb printer",
        paperOut,
        coverOpen,
      };
    } catch (err) {
      return {
        up: false,
        model: this.model ?? "usb printer",
        lastError: (err as Error).message,
      };
    }
  }

  async close(): Promise<void> {
    if (this.iface) {
      await new Promise<void>((resolve) => {
        this.iface!.release(true, () => resolve());
      });
    }
    this.iface = null;
    this.device = null;
    this.epOut = null;
    this.epIn = null;
  }

  private findPrinter(list: UsbDeviceLike[]): UsbDeviceLike | null {
    // If the user pinned vendor/product IDs, honor that first.
    const { vendorId, productId } = this.opts;
    if (vendorId != null) {
      const match = list.find((d) => {
        const vidOk = d.deviceDescriptor.idVendor === vendorId;
        const pidOk = productId == null
          ? true
          : d.deviceDescriptor.idProduct === productId;
        return vidOk && pidOk;
      });
      if (match) return match;
    }

    // Otherwise: first device with a printer-class interface.
    // We have to open() each candidate to inspect interfaces; close any we
    // don't end up using so libusb doesn't leak handles.
    for (const dev of list) {
      try {
        dev.open();
        const hasPrinter = (dev.interfaces ?? []).some(
          (i) => i.descriptor.bInterfaceClass === PRINTER_CLASS,
        );
        if (hasPrinter) return dev;
        dev.close();
      } catch {
        // permission denied / device busy — skip
      }
    }
    return null;
  }
}

async function loadUsbModule(): Promise<UsbModuleLike> {
  try {
    const mod = (await import("usb")) as unknown as {
      default?: UsbModuleLike;
      getDeviceList?: UsbModuleLike["getDeviceList"];
    };
    if (mod.default && typeof mod.default.getDeviceList === "function") {
      return mod.default;
    }
    if (typeof mod.getDeviceList === "function") {
      return mod as unknown as UsbModuleLike;
    }
    throw new TransportUnavailableError("usb module shape unrecognized");
  } catch (err) {
    // Optional dep not installed (no libusb on this box), or native binding
    // failed to compile. Bubble up so detect() can fall back to CUPS.
    throw new TransportUnavailableError(
      `usb module unavailable: ${(err as Error).message}`,
    );
  }
}

function transferWithTimeout(
  ep: UsbEndpointLike,
  payload: Buffer,
  timeoutMs: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new PrinterTimeoutError("usb transfer timed out")),
      timeoutMs,
    );
    ep.transfer(payload, (err) => {
      clearTimeout(timer);
      if (err) reject(new PrinterOfflineError(err.message));
      else resolve();
    });
  });
}

function readWithTimeout(
  ep: UsbEndpointLike,
  length: number,
  timeoutMs: number,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new PrinterTimeoutError("usb read timed out")),
      timeoutMs,
    );
    ep.transfer(length, (err, data) => {
      clearTimeout(timer);
      if (err) reject(new PrinterOfflineError(err.message));
      else resolve(data ?? Buffer.alloc(0));
    });
  });
}

async function readProductString(
  device: UsbDeviceLike,
): Promise<string | null> {
  const idx = device.deviceDescriptor.iProduct;
  if (!idx || !device.getStringDescriptor) return null;
  return new Promise((resolve) => {
    device.getStringDescriptor!(idx, (err, value) => {
      if (err || !value) resolve(null);
      else resolve(value);
    });
  });
}
