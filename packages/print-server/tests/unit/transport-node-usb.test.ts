import { describe, it, expect, vi } from "vitest";
import { NodeUsbAdapter } from "../../src/transport/node-usb.js";
import type {
  UsbDeviceLike,
  UsbEndpointLike,
  UsbInterfaceLike,
  UsbModuleLike,
} from "../../src/transport/node-usb.js";

function makeFakeDevice(opts: {
  statusByte: number;
  bidirectional?: boolean;
  writeErr?: string;
}): UsbDeviceLike {
  const writes: Buffer[] = [];
  const epOut: UsbEndpointLike = {
    direction: "out",
    transferType: 2,
    transfer(data, cb) {
      if (opts.writeErr) {
        cb(new Error(opts.writeErr));
        return;
      }
      if (Buffer.isBuffer(data)) writes.push(data);
      cb(undefined);
    },
  };
  const epIn: UsbEndpointLike = {
    direction: "in",
    transferType: 2,
    transfer(_lenOrData, cb) {
      cb(undefined, Buffer.from([opts.statusByte]));
    },
  };
  const printerIface: UsbInterfaceLike = {
    descriptor: { bInterfaceClass: 7, bInterfaceProtocol: 2 },
    endpoints: opts.bidirectional === false ? [epOut] : [epOut, epIn],
    claim: () => {},
    release: (_close, cb) => cb(),
    isKernelDriverActive: () => false,
  };
  const device: UsbDeviceLike = {
    deviceDescriptor: {
      idVendor: 0x1234,
      idProduct: 0x5678,
      iProduct: 2,
    },
    configDescriptor: { bNumInterfaces: 1 },
    interfaces: [printerIface],
    open: () => {},
    close: () => {},
    getStringDescriptor: (_idx, cb) => cb(undefined, "Fake Printer"),
  };
  (device as unknown as { __writes: Buffer[] }).__writes = writes;
  return device;
}

function makeFakeUsb(devices: UsbDeviceLike[]): UsbModuleLike {
  return {
    getDeviceList: () => devices,
  };
}

describe("NodeUsbAdapter", () => {
  it("U-TX-04 probe parses status byte 0x04 → paperOut=true", async () => {
    const device = makeFakeDevice({ statusByte: 0x04 });
    const adapter = new NodeUsbAdapter({ usbModule: makeFakeUsb([device]) });
    await adapter.init();
    const result = await adapter.probe();
    expect(result.paperOut).toBe(true);
    expect(result.coverOpen).toBe(false);
    expect(result.up).toBe(false);
    expect(result.model).toBe("Fake Printer");
  });

  it("probe returns paperOut=false, coverOpen=true on 0x20", async () => {
    const device = makeFakeDevice({ statusByte: 0x20 });
    const adapter = new NodeUsbAdapter({ usbModule: makeFakeUsb([device]) });
    await adapter.init();
    const result = await adapter.probe();
    expect(result.paperOut).toBe(false);
    expect(result.coverOpen).toBe(true);
    expect(result.up).toBe(false);
  });

  it("probe returns up=true on 0x00 (all clear)", async () => {
    const device = makeFakeDevice({ statusByte: 0x00 });
    const adapter = new NodeUsbAdapter({ usbModule: makeFakeUsb([device]) });
    await adapter.init();
    const result = await adapter.probe();
    expect(result.up).toBe(true);
    expect(result.paperOut).toBe(false);
    expect(result.coverOpen).toBe(false);
  });

  it("unidirectional interface (no IN endpoint) → probe skips status query", async () => {
    const device = makeFakeDevice({ statusByte: 0x00, bidirectional: false });
    const adapter = new NodeUsbAdapter({ usbModule: makeFakeUsb([device]) });
    await adapter.init();
    const result = await adapter.probe();
    expect(result.up).toBe(true);
  });

  it("init throws PrinterOfflineError when no printer-class device found", async () => {
    const noPrinter: UsbDeviceLike = {
      deviceDescriptor: { idVendor: 1, idProduct: 2 },
      configDescriptor: null,
      interfaces: [
        {
          descriptor: { bInterfaceClass: 3, bInterfaceProtocol: 0 },
          endpoints: [],
          claim: () => {},
          release: (_c, cb) => cb(),
        },
      ],
      open: () => {},
      close: () => {},
    };
    const adapter = new NodeUsbAdapter({
      usbModule: makeFakeUsb([noPrinter]),
    });
    await expect(adapter.init()).rejects.toThrow(
      /no USB printer-class device|printer interface/,
    );
  });

  it("write(bytes) emits to OUT endpoint", async () => {
    const device = makeFakeDevice({ statusByte: 0x00 });
    const adapter = new NodeUsbAdapter({ usbModule: makeFakeUsb([device]) });
    await adapter.init();
    await adapter.write(new Uint8Array([0x1b, 0x40]), { timeoutMs: 500 });
    const writes = (device as unknown as { __writes: Buffer[] }).__writes;
    expect(Array.from(writes[0]!)).toEqual([0x1b, 0x40]);
  });

  it("vendorId filter selects the matching device", async () => {
    const a = makeFakeDevice({ statusByte: 0x00 });
    a.deviceDescriptor.idVendor = 0x1111;
    const b = makeFakeDevice({ statusByte: 0x00 });
    b.deviceDescriptor.idVendor = 0x2222;
    const adapter = new NodeUsbAdapter({
      usbModule: makeFakeUsb([a, b]),
      vendorId: 0x2222,
    });
    await adapter.init();
    expect((adapter as unknown as { device: UsbDeviceLike }).device).toBe(b);
  });
});
