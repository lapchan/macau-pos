import type { PrinterDriverDef, PrinterStatusFlags } from "./types.js";
import { genericDriver } from "./generic.js";

const GS = 0x1d;
const DLE = 0x10;
const EOT = 0x04;

// Epson TM-T20/T82 family. ESC/POS native; richer status query.
export const epsonDriver: PrinterDriverDef = {
  ...genericDriver,
  name: "epson",

  // Epson supports GS V m n (cut after feeding n lines). We use the simple form.
  cut: (mode) => new Uint8Array([GS, 0x56, mode === "full" ? 0x41 : 0x42, 0x03]),

  // Epson Auto Status Back: DLE EOT 1 — basic transmit-status request.
  queryStatus: () => new Uint8Array([DLE, EOT, 0x01]),

  // Epson basic status byte: bit 5 (0x20) = drawer/cover, bit 3 (0x08) = error,
  // bit 2 (0x04) = paper-out flag in the simplified ASB layout we use.
  parseStatus: (response): PrinterStatusFlags => {
    const byte = response[0] ?? 0;
    return {
      paperOut: (byte & 0x04) !== 0,
      coverOpen: (byte & 0x20) !== 0,
      error: (byte & 0x08) !== 0,
    };
  },
};
