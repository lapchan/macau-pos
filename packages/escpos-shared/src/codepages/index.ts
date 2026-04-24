import type { PrinterCodePage } from "../types.js";
import { cp437 } from "./cp437.js";
import { big5 } from "./big5.js";
import { gb18030 } from "./gb18030.js";
import { shiftJis } from "./shift-jis.js";

export interface CodePageDef {
  // Usually one of the PrinterCodePage strings, but the interface accepts
  // any identifier — some code pages (e.g. cp860) are used internally by
  // the test-page builder without being part of the operator-facing enum.
  readonly name: string;
  readonly escposPage: number;
  readonly requiresChineseMode: boolean;
  encode(text: string): Uint8Array;
}

export { cp437, big5, gb18030, shiftJis };

export function getCodePage(name: PrinterCodePage): CodePageDef {
  switch (name) {
    case "cp437":
      return cp437;
    case "big5":
      return big5;
    case "gb18030":
      return gb18030;
    case "shift_jis":
      return shiftJis;
  }
}
