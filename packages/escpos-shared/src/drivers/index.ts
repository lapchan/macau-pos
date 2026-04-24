import type { PrinterDriver } from "../types.js";
import type { PrinterDriverDef } from "./types.js";
import { genericDriver } from "./generic.js";
import { starDriver } from "./star.js";
import { epsonDriver } from "./epson.js";

export { genericDriver, starDriver, epsonDriver };
export type { PrinterDriverDef, PrinterStatusFlags } from "./types.js";

export function getDriver(name: PrinterDriver): PrinterDriverDef {
  switch (name) {
    case "generic":
    case "custom":
      return genericDriver;
    case "star":
      return starDriver;
    case "epson":
      return epsonDriver;
  }
}
