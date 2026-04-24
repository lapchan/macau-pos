import { describe, it, expect } from "vitest";
import { epsonDriver } from "../src/drivers/epson.js";

const bytes = (...n: number[]) => new Uint8Array(n);

describe("epsonDriver — Epson-specific overrides", () => {
  it("inherits init from generic", () => {
    expect(epsonDriver.init()).toEqual(bytes(0x1b, 0x40));
  });

  it("cut('full') emits GS V A 3 (cut after 3 lines)", () => {
    expect(epsonDriver.cut("full")).toEqual(bytes(0x1d, 0x56, 0x41, 0x03));
  });

  it("cut('partial') emits GS V B 3", () => {
    expect(epsonDriver.cut("partial")).toEqual(bytes(0x1d, 0x56, 0x42, 0x03));
  });

  it("queryStatus emits DLE EOT 1 (Epson basic ASB)", () => {
    expect(epsonDriver.queryStatus()).toEqual(bytes(0x10, 0x04, 0x01));
  });

  it("parseStatus respects Epson error bit (0x08)", () => {
    expect(epsonDriver.parseStatus(bytes(0x08))).toEqual({
      paperOut: false,
      coverOpen: false,
      error: true,
    });
  });

  it("parseStatus paperOut bit (0x04)", () => {
    expect(epsonDriver.parseStatus(bytes(0x04))).toEqual({
      paperOut: true,
      coverOpen: false,
      error: false,
    });
  });
});
