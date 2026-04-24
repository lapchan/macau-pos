import type { PrinterDriverDef } from "./types.js";
import { genericDriver } from "./generic.js";

const ESC = 0x1b;
const BEL = 0x07;

// Star Micronics line-mode emulation. Most ESC/POS commands work; cut + drawer differ.
export const starDriver: PrinterDriverDef = {
  ...genericDriver,
  name: "star",

  // Star uses ESC d n for cut: n=0 full, n=1 partial.
  cut: (mode) => new Uint8Array([ESC, 0x64, mode === "full" ? 0x00 : 0x01]),

  // Star opens the cash drawer with BEL on RJ11 pin 2.
  kickDrawer: () => new Uint8Array([BEL]),
};
