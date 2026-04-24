import type { PaperWidth } from "../types.js";
import type { PrinterDriverDef, PrinterStatusFlags } from "./types.js";

const ESC = 0x1b;
const GS = 0x1d;
const DLE = 0x10;
const EOT = 0x04;

const ALIGN: Record<"left" | "center" | "right", number> = {
  left: 0,
  center: 1,
  right: 2,
};

export const genericDriver: PrinterDriverDef = {
  name: "generic",

  init: () => new Uint8Array([ESC, 0x40]),

  align: (a) => new Uint8Array([ESC, 0x61, ALIGN[a]]),

  emphasis: (on) => new Uint8Array([ESC, 0x45, on ? 1 : 0]),

  // ESC ! n — select print mode. 0x30 sets double-height + double-width bits.
  doubleSize: (on) => new Uint8Array([ESC, 0x21, on ? 0x30 : 0x00]),

  selectCodePage: (page) => new Uint8Array([ESC, 0x74, page & 0xff]),

  feed: (lines) => new Uint8Array([ESC, 0x64, Math.max(0, Math.min(255, lines))]),

  cut: (mode) => new Uint8Array([GS, 0x56, mode === "full" ? 0x00 : 0x01]),

  kickDrawer: () => new Uint8Array([ESC, 0x70, 0x00, 0x19, 0x19]),

  queryStatus: () => new Uint8Array([DLE, EOT, 0x04]),

  parseStatus: (response): PrinterStatusFlags => {
    const byte = response[0] ?? 0;
    return {
      paperOut: (byte & 0x04) !== 0,
      coverOpen: (byte & 0x20) !== 0,
      error: (byte & 0x40) !== 0,
    };
  },

  columns: (paperWidth: PaperWidth) => (paperWidth === 58 ? 32 : 48),
};
