import type { TestPageInput } from "../types.js";
import { getDriver } from "../drivers/index.js";
import { getCodePage, type CodePageDef } from "../codepages/index.js";
import { cp860 } from "../codepages/cp860.js";
import {
  concat,
  divider,
  encodeBlock,
  encodeLine,
  selectCodePageBytes,
} from "./commands.js";

export function buildTestPage(input: TestPageInput): Uint8Array {
  const driver = getDriver(input.driver);
  const cp = getCodePage(input.codePage);
  const cols = driver.columns(input.paperWidth);
  const parts: Uint8Array[] = [];

  parts.push(driver.init());
  parts.push(selectCodePageBytes(driver, cp));

  parts.push(encodeLine(divider("=", cols), cp));
  parts.push(driver.align("center"));
  parts.push(driver.emphasis(true));
  parts.push(encodeLine(input.shopName || "(no shop name)", cp));
  parts.push(encodeLine(input.locationName || "(no location)", cp));
  parts.push(driver.emphasis(false));
  parts.push(encodeLine(divider("=", cols), cp));

  parts.push(driver.align("left"));
  parts.push(encodeLine(`Driver:    ${input.driver}`, cp));
  parts.push(encodeLine(`Paper:     ${input.paperWidth}mm`, cp));
  parts.push(encodeLine(`Codepage:  ${input.codePage}`, cp));
  parts.push(encodeLine(`Time:      ${input.timestamp.toISOString()}`, cp));
  parts.push(encodeLine("", cp));

  parts.push(encodeLine("CJK test:", cp));
  // Encoding strategy for the per-language samples:
  //
  //   - All CJK samples use GB18030 rather than Big5 / Shift-JIS. Chinese-
  //     market printers typically ship ONE double-byte font (GB18030), and
  //     emitting `ESC t N` for a page the firmware doesn't have (e.g.
  //     `ESC t 8` for Shift-JIS on the POS-80) corrupts state so that later
  //     `FS .` / `ESC t N` calls are partially ignored. GB18030 is a
  //     Unicode-compatible superset; its byte sequences for Traditional
  //     kanji, Simplified kanji, and Japanese kana all have a chance of
  //     rendering from the printer's Chinese font. A GBK-only font may
  //     fall back to Simplified glyphs for Traditional characters
  //     (readable but dialect-wrong).
  //   - Portuguese uses PC860 (ESC t 3). CP437 lacks uppercase À É Í Ó Ú
  //     and iconv silently substitutes those with "?".
  const perLanguage: Array<{ line: string; cp: CodePageDef }> = [
    { line: "  中文測試 (Traditional)", cp: getCodePage("gb18030") },
    { line: "  中文测试 (Simplified)", cp: getCodePage("gb18030") },
    { line: "  日本語テスト (Japanese)", cp: getCodePage("gb18030") },
    { line: "  ÀÉÍÓÚ ñç (Portuguese)", cp: cp860 },
  ];
  for (const { line, cp: lineCp } of perLanguage) {
    parts.push(selectCodePageBytes(driver, lineCp));
    parts.push(encodeLine(line, lineCp));
  }
  // Restore the operator-selected code page so the footer encodes consistently.
  parts.push(selectCodePageBytes(driver, cp));
  parts.push(encodeLine("", cp));

  parts.push(encodeLine("If you can read this,", cp));
  parts.push(encodeLine("your printer is healthy.", cp));
  parts.push(encodeLine(divider("=", cols), cp));

  parts.push(driver.feed(3));
  parts.push(driver.cut("partial"));

  return concat(...parts);
}
