import { describe, it, expect } from "vitest";
import iconv from "iconv-lite";
import { cp437, big5, gb18030, shiftJis } from "../src/codepages/index.js";

describe("codepages — encoders", () => {
  it("U-CP-01 CP437 encodes ASCII as-is", () => {
    expect(Array.from(cp437.encode("ABC"))).toEqual([0x41, 0x42, 0x43]);
  });

  it("U-CP-02 Big5 encodes 中文", () => {
    expect(Array.from(big5.encode("中文"))).toEqual([0xa4, 0xa4, 0xa4, 0xe5]);
  });

  it("U-CP-03 GB18030 encodes 中文", () => {
    expect(Array.from(gb18030.encode("中文"))).toEqual([0xd6, 0xd0, 0xce, 0xc4]);
  });

  it("U-CP-04 Shift_JIS encodes あいう", () => {
    expect(Array.from(shiftJis.encode("あいう"))).toEqual([
      0x82, 0xa0, 0x82, 0xa2, 0x82, 0xa4,
    ]);
  });

  it("U-CP-05 Big5 maps unmappable supplementary char to ?", () => {
    // 𠮷 is U+20BB7 (CJK Extension B), absent from Big5.
    const out = Array.from(big5.encode("中𠮷"));
    expect(out.slice(0, 2)).toEqual([0xa4, 0xa4]);
    expect(out[out.length - 1]).toBe(0x3f);
  });

  it("U-CP-06 ASCII + CJK round-trip via Big5", () => {
    const text = "Order 123 中文";
    const encoded = big5.encode(text);
    const decoded = iconv.decode(Buffer.from(encoded), "big5");
    expect(decoded).toBe(text);
  });

  it("U-CP-07 CP437 encodes Portuguese 'Olá'", () => {
    // á in CP437 = 0xA0
    expect(Array.from(cp437.encode("Olá"))).toEqual([0x4f, 0x6c, 0xa0]);
  });

  it("U-CP-08 empty string returns Uint8Array(0)", () => {
    expect(cp437.encode("").length).toBe(0);
    expect(big5.encode("").length).toBe(0);
    expect(gb18030.encode("").length).toBe(0);
    expect(shiftJis.encode("").length).toBe(0);
  });

  it("U-CP-09 10KB ASCII doesn't OOM", () => {
    const text = "a".repeat(10000);
    expect(cp437.encode(text).length).toBe(10000);
  });

  it("escposPage values match blueprint", () => {
    expect(cp437.escposPage).toBe(0);
    expect(gb18030.escposPage).toBe(52);
  });

  it("requiresChineseMode flags match locale needs", () => {
    expect(cp437.requiresChineseMode).toBe(false);
    expect(big5.requiresChineseMode).toBe(true);
    expect(gb18030.requiresChineseMode).toBe(true);
    expect(shiftJis.requiresChineseMode).toBe(true);
  });
});
