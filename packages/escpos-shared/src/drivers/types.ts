import type { PaperWidth } from "../types.js";

export interface PrinterStatusFlags {
  paperOut: boolean;
  coverOpen: boolean;
  error: boolean;
}

export interface PrinterDriverDef {
  readonly name: string;
  init(): Uint8Array;
  align(alignment: "left" | "center" | "right"): Uint8Array;
  emphasis(on: boolean): Uint8Array;
  doubleSize(on: boolean): Uint8Array;
  selectCodePage(page: number): Uint8Array;
  feed(lines: number): Uint8Array;
  cut(mode: "full" | "partial"): Uint8Array;
  kickDrawer(): Uint8Array;
  queryStatus(): Uint8Array;
  parseStatus(response: Uint8Array): PrinterStatusFlags;
  columns(paperWidth: PaperWidth): number;
}
