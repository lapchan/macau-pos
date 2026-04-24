import { describe, it, expect } from "vitest";
import { genericDriver } from "../src/drivers/generic.js";

const bytes = (...n: number[]) => new Uint8Array(n);

describe("genericDriver — ESC/POS primitives", () => {
  it("U-ESC-01 init() emits ESC @", () => {
    expect(genericDriver.init()).toEqual(bytes(0x1b, 0x40));
  });

  it("U-ESC-02 align('center') emits ESC a 1", () => {
    expect(genericDriver.align("center")).toEqual(bytes(0x1b, 0x61, 0x01));
  });

  it("U-ESC-03 align('right') emits ESC a 2", () => {
    expect(genericDriver.align("right")).toEqual(bytes(0x1b, 0x61, 0x02));
  });

  it("align('left') emits ESC a 0", () => {
    expect(genericDriver.align("left")).toEqual(bytes(0x1b, 0x61, 0x00));
  });

  it("U-ESC-04 emphasis(true) emits ESC E 1", () => {
    expect(genericDriver.emphasis(true)).toEqual(bytes(0x1b, 0x45, 0x01));
  });

  it("emphasis(false) emits ESC E 0", () => {
    expect(genericDriver.emphasis(false)).toEqual(bytes(0x1b, 0x45, 0x00));
  });

  it("U-ESC-05 doubleSize(true) emits ESC ! 0x30", () => {
    expect(genericDriver.doubleSize(true)).toEqual(bytes(0x1b, 0x21, 0x30));
  });

  it("doubleSize(false) emits ESC ! 0", () => {
    expect(genericDriver.doubleSize(false)).toEqual(bytes(0x1b, 0x21, 0x00));
  });

  it("U-ESC-06 selectCodePage(0) emits ESC t 0 (CP437)", () => {
    expect(genericDriver.selectCodePage(0)).toEqual(bytes(0x1b, 0x74, 0x00));
  });

  it("U-ESC-07 selectCodePage(52) emits ESC t 0x34 (GB18030)", () => {
    expect(genericDriver.selectCodePage(52)).toEqual(bytes(0x1b, 0x74, 0x34));
  });

  it("U-ESC-08 feed(3) emits ESC d 3", () => {
    expect(genericDriver.feed(3)).toEqual(bytes(0x1b, 0x64, 0x03));
  });

  it("feed clamps over 255 to 255", () => {
    expect(genericDriver.feed(999)).toEqual(bytes(0x1b, 0x64, 0xff));
  });

  it("U-ESC-09 cut('full') emits GS V 0", () => {
    expect(genericDriver.cut("full")).toEqual(bytes(0x1d, 0x56, 0x00));
  });

  it("U-ESC-10 cut('partial') emits GS V 1", () => {
    expect(genericDriver.cut("partial")).toEqual(bytes(0x1d, 0x56, 0x01));
  });

  it("U-ESC-11 kickDrawer() emits ESC p 0 25 25", () => {
    expect(genericDriver.kickDrawer()).toEqual(
      bytes(0x1b, 0x70, 0x00, 0x19, 0x19),
    );
  });

  it("U-ESC-12 queryStatus() emits DLE EOT 4", () => {
    expect(genericDriver.queryStatus()).toEqual(bytes(0x10, 0x04, 0x04));
  });

  it("U-ESC-13 columns(58) = 32", () => {
    expect(genericDriver.columns(58)).toBe(32);
  });

  it("U-ESC-14 columns(80) = 48", () => {
    expect(genericDriver.columns(80)).toBe(48);
  });

  it("U-ESC-15 parseStatus(0x04) → paperOut only", () => {
    expect(genericDriver.parseStatus(bytes(0x04))).toEqual({
      paperOut: true,
      coverOpen: false,
      error: false,
    });
  });

  it("parseStatus(0x20) → coverOpen only", () => {
    expect(genericDriver.parseStatus(bytes(0x20))).toEqual({
      paperOut: false,
      coverOpen: true,
      error: false,
    });
  });

  it("parseStatus(0x40) → error only", () => {
    expect(genericDriver.parseStatus(bytes(0x40))).toEqual({
      paperOut: false,
      coverOpen: false,
      error: true,
    });
  });

  it("parseStatus(0x00) → all clear", () => {
    expect(genericDriver.parseStatus(bytes(0x00))).toEqual({
      paperOut: false,
      coverOpen: false,
      error: false,
    });
  });

  it("parseStatus(empty) → all clear", () => {
    expect(genericDriver.parseStatus(new Uint8Array(0))).toEqual({
      paperOut: false,
      coverOpen: false,
      error: false,
    });
  });
});
