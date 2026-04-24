import type { CodePageDef } from "../codepages/index.js";
import type { PrinterDriverDef } from "../drivers/types.js";

const FS = 0x1c;
const LF = 0x0a;

export function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

export function lf(): Uint8Array {
  return new Uint8Array([LF]);
}

// Emit the sequence that (a) puts the printer into the correct byte-width
// mode and (b) selects the font table.
//
//   Double-byte pages (big5/gb18030/shift_jis):  FS &          + ESC t N
//   Single-byte pages (cp437, cp860, Latin):     FS & + FS .   + ESC t N
//
// The paired FS & + FS . is deliberate: on some Xprinter/generic firmware
// (confirmed on POS-80 2026-04-24) the power-on and post-`ESC @` state is
// DBCS/Chinese, and a bare `FS .` is a no-op unless the printer has first
// seen `FS &`. Forcing `FS &` then `FS .` guarantees we leave DBCS mode
// regardless of prior state. Standards-compliant firmware treats the extra
// `FS &` as a harmless re-entry.
export function selectCodePageBytes(
  driver: PrinterDriverDef,
  cp: CodePageDef,
): Uint8Array {
  const escT = driver.selectCodePage(cp.escposPage);
  const modeToggle = cp.requiresChineseMode
    ? new Uint8Array([FS, 0x26]) // FS & — enter Chinese mode
    : new Uint8Array([FS, 0x26, FS, 0x2e]); // FS & then FS . — force Latin
  return concat(modeToggle, escT);
}

// Visual columns for monospace ESC/POS. ASCII = 1, anything else = 2.
// Good enough for CJK + Latin mix; doesn't handle East-Asian half-width forms.
export function visualWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    w += cp < 0x80 ? 1 : 2;
  }
  return w;
}

export function padRight(text: string, width: number): string {
  const w = visualWidth(text);
  return w >= width ? text : text + " ".repeat(width - w);
}

export function padLeft(text: string, width: number): string {
  const w = visualWidth(text);
  return w >= width ? text : " ".repeat(width - w) + text;
}

// Wrap a string at visual-width `width`. Splits per-character, no word boundaries.
export function wrapToWidth(text: string, width: number): string[] {
  if (width <= 0) return [text];
  const out: string[] = [];
  let line = "";
  let w = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const cw = cp < 0x80 ? 1 : 2;
    if (w + cw > width) {
      out.push(line);
      line = ch;
      w = cw;
    } else {
      line += ch;
      w += cw;
    }
  }
  if (line.length > 0) out.push(line);
  return out.length === 0 ? [""] : out;
}

// Two-column row: name on left (truncated/wrapped), amount on right.
// Returns the formatted *string* (caller encodes via active codepage).
export function twoColRow(left: string, right: string, width: number): string {
  const rightW = visualWidth(right);
  const leftMax = Math.max(1, width - rightW - 1);
  const wrapped = wrapToWidth(left, leftMax);
  const first = wrapped[0] ?? "";
  const head = padRight(first, leftMax) + " " + right;
  if (wrapped.length === 1) return head;
  const rest = wrapped.slice(1).map((s) => padRight(s, width));
  return [head, ...rest].join("\n");
}

export function divider(char: string, width: number): string {
  return char.repeat(width);
}

// Encode text + newline using the supplied codepage encoder.
export function encodeLine(text: string, cp: CodePageDef): Uint8Array {
  return concat(cp.encode(text), lf());
}

// Encode possibly-multiline text (split on \n) — emits each as its own line.
export function encodeBlock(text: string, cp: CodePageDef): Uint8Array {
  const parts = text.split("\n").map((line) => encodeLine(line, cp));
  return concat(...parts);
}
