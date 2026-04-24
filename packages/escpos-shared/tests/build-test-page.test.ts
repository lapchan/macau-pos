import { describe, it, expect } from "vitest";
import iconv from "iconv-lite";
import { buildTestPage } from "../src/builder/build-test-page.js";
import type { PrinterCodePage, TestPageInput } from "../src/types.js";

const base: Omit<TestPageInput, "codePage"> = {
  shopName: "Test Shop",
  locationName: "Main",
  timestamp: new Date("2026-04-24T10:00:00Z"),
  driver: "generic",
  paperWidth: 80,
};

describe("buildTestPage", () => {
  it("U-TP-01 produces output for all 4 codepages without throwing", () => {
    const cps: PrinterCodePage[] = ["cp437", "big5", "gb18030", "shift_jis"];
    for (const codePage of cps) {
      const out = buildTestPage({ ...base, codePage });
      expect(out.length).toBeGreaterThan(20);
      expect(out[0]).toBe(0x1b); // ESC
      expect(out[1]).toBe(0x40); // @
    }
  });

  it("U-TP-02 test page contains 中文測試 encoded for the printer's DBCS table", () => {
    // The Traditional sample is emitted in GB18030 so printers without a Big5
    // font can still attempt to render it from their CJK Unified Ideographs
    // glyphs. See build-test-page.ts for the rationale.
    const out = buildTestPage({ ...base, codePage: "big5" });
    const expected = new Uint8Array(iconv.encode("中文測試", "gb18030"));
    let found = false;
    outer: for (let i = 0; i <= out.length - expected.length; i++) {
      for (let j = 0; j < expected.length; j++) {
        if (out[i + j] !== expected[j]) continue outer;
      }
      found = true;
      break;
    }
    expect(found).toBe(true);
  });

  it("U-TP-03 empty shop name doesn't crash", () => {
    const out = buildTestPage({
      ...base,
      shopName: "",
      locationName: "",
      codePage: "cp437",
    });
    expect(out.length).toBeGreaterThan(20);
  });

  it("ends with cut command", () => {
    const out = buildTestPage({ ...base, codePage: "cp437" });
    const tail = out.slice(-3);
    expect(tail[0]).toBe(0x1d);
    expect(tail[1]).toBe(0x56);
  });
});
