import { describe, it, expect } from "vitest";
import iconv from "iconv-lite";
import { buildReceipt } from "../src/builder/build-receipt.js";
import type { BuildOptions, ReceiptInput } from "../src/types.js";

const baseOpts80Big5: BuildOptions = {
  driver: "generic",
  paperWidth: 80,
  codePage: "big5",
};

const baseOpts58Cp437: BuildOptions = {
  driver: "generic",
  paperWidth: 58,
  codePage: "cp437",
};

function fixtureBig5(): ReceiptInput {
  return {
    shopName: "藥房",
    shopAddress: "新口岸",
    shopPhone: "+853 12345678",
    orderNumber: "ORD-001",
    timestamp: new Date("2026-04-24T10:00:00Z"),
    items: [
      { name: "口罩 50片", quantity: 2, unitPrice: 5000, lineTotal: 10000 },
      { name: "酒精搓手液", quantity: 1, unitPrice: 3500, lineTotal: 3500 },
    ],
    subtotal: 13500,
    discountAmount: 0,
    taxAmount: 0,
    total: 13500,
    paymentMethod: "cash",
    cashReceived: 15000,
    change: 1500,
    currency: "MOP",
    locale: "tc",
  };
}

function fixtureCp437(): ReceiptInput {
  return {
    shopName: "Joe's Cafe",
    orderNumber: "0042",
    timestamp: new Date("2026-04-24T10:00:00Z"),
    items: [{ name: "Coffee", quantity: 1, unitPrice: 3000, lineTotal: 3000 }],
    subtotal: 3000,
    total: 3000,
    paymentMethod: "tap",
    currency: "HKD",
    locale: "en",
  };
}

function findSubsequence(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

describe("buildReceipt", () => {
  it("U-RCP-01 80mm generic Big5 — produces deterministic byte stream", () => {
    const out1 = buildReceipt(baseOpts80Big5, fixtureBig5());
    const out2 = buildReceipt(baseOpts80Big5, fixtureBig5());
    expect(out1).toEqual(out2);
    expect(out1.length).toBeGreaterThan(50);

    // Header: ESC @ then FS & (Chinese mode) then ESC t 0
    expect(out1[0]).toBe(0x1b);
    expect(out1[1]).toBe(0x40);
    expect(out1[2]).toBe(0x1c);
    expect(out1[3]).toBe(0x26);

    // Shop name "藥房" encoded in Big5 must appear somewhere
    const shopBytes = new Uint8Array(iconv.encode("藥房", "big5"));
    expect(findSubsequence(out1, shopBytes)).toBeGreaterThan(-1);

    // Ends with cut command (GS V 0/1)
    const tail = out1.slice(-3);
    expect(tail[0]).toBe(0x1d);
    expect(tail[1]).toBe(0x56);
  });

  it("U-RCP-02 58mm generic CP437 English — header + cut", () => {
    const out = buildReceipt(baseOpts58Cp437, fixtureCp437());
    // ESC @ at start
    expect(out[0]).toBe(0x1b);
    expect(out[1]).toBe(0x40);
    // FS & + FS . forces Latin mode (paired for firmware that ignores a
    // bare FS . — see commands.ts selectCodePageBytes)
    expect(out[2]).toBe(0x1c);
    expect(out[3]).toBe(0x26);
    expect(out[4]).toBe(0x1c);
    expect(out[5]).toBe(0x2e);
    // ESC t 0 — CP437
    expect(out[6]).toBe(0x1b);
    expect(out[7]).toBe(0x74);
    expect(out[8]).toBe(0x00);

    // Shop name as CP437
    const shopBytes = new Uint8Array(iconv.encode("Joe's Cafe", "cp437"));
    expect(findSubsequence(out, shopBytes)).toBeGreaterThan(-1);
  });

  it("U-RCP-03 discount line appears indented when item has discount", () => {
    const input = fixtureCp437();
    input.items = [
      {
        name: "Coffee",
        quantity: 1,
        unitPrice: 3000,
        lineTotal: 2700,
        discount: "-10%",
      },
    ];
    const out = buildReceipt(baseOpts58Cp437, input);
    const discountBytes = new Uint8Array(iconv.encode("  -10%", "cp437"));
    expect(findSubsequence(out, discountBytes)).toBeGreaterThan(-1);
  });

  it("U-RCP-04 cash payment renders Received + Change rows", () => {
    const out = buildReceipt(baseOpts58Cp437, {
      ...fixtureCp437(),
      paymentMethod: "cash",
      cashReceived: 5000,
      change: 2000,
    });
    expect(findSubsequence(out, new Uint8Array(iconv.encode("Received", "cp437"))))
      .toBeGreaterThan(-1);
    expect(findSubsequence(out, new Uint8Array(iconv.encode("Change", "cp437"))))
      .toBeGreaterThan(-1);
  });

  it("U-RCP-05 kickDrawer adds drawer-pulse bytes before cut", () => {
    const out = buildReceipt(
      { ...baseOpts58Cp437, kickDrawer: true },
      fixtureCp437(),
    );
    // ESC p 0 25 25 (1B 70 00 19 19)
    const kick = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0x19]);
    const idx = findSubsequence(out, kick);
    expect(idx).toBeGreaterThan(-1);
    // drawer-kick must come before final cut command
    const cutIdx = out.length - 3;
    expect(idx).toBeLessThan(cutIdx);
  });

  it("U-RCP-06 custom footer text is rendered", () => {
    const out = buildReceipt(baseOpts58Cp437, {
      ...fixtureCp437(),
      footer: "Come again!",
    });
    expect(
      findSubsequence(out, new Uint8Array(iconv.encode("Come again!", "cp437"))),
    ).toBeGreaterThan(-1);
  });

  it("U-RCP-07 locale=ja prints JP thank-you", () => {
    const out = buildReceipt(
      { driver: "generic", paperWidth: 58, codePage: "shift_jis" },
      { ...fixtureCp437(), locale: "ja" },
    );
    const jp = new Uint8Array(
      iconv.encode("ありがとうございました", "shift_jis"),
    );
    expect(findSubsequence(out, jp)).toBeGreaterThan(-1);
  });

  it("U-RCP-08 empty items array still produces valid output", () => {
    const out = buildReceipt(baseOpts58Cp437, {
      ...fixtureCp437(),
      items: [],
      subtotal: 0,
      total: 0,
    });
    expect(out.length).toBeGreaterThan(20);
    expect(
      findSubsequence(out, new Uint8Array(iconv.encode("Subtotal", "cp437"))),
    ).toBeGreaterThan(-1);
  });

  it("U-RCP-09 long item name wraps within column width", () => {
    const longName = "A".repeat(50);
    const out = buildReceipt(baseOpts58Cp437, {
      ...fixtureCp437(),
      items: [{ name: longName, quantity: 1, unitPrice: 100, lineTotal: 100 }],
    });
    // Total occurrences of byte 0x41 ('A') must be ≥ 50 across wrapped lines.
    const aCount = out.reduce((n, b) => (b === 0x41 ? n + 1 : n), 0);
    expect(aCount).toBeGreaterThanOrEqual(50);
    // A long contiguous run of A's must appear (i.e., one wrapped chunk).
    const longRun = new Uint8Array(iconv.encode("A".repeat(20), "cp437"));
    expect(findSubsequence(out, longRun)).toBeGreaterThan(-1);
  });
});
