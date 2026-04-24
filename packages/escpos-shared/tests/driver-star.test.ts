import { describe, it, expect } from "vitest";
import { starDriver } from "../src/drivers/star.js";

const bytes = (...n: number[]) => new Uint8Array(n);

describe("starDriver — Star-specific overrides", () => {
  it("inherits init from generic", () => {
    expect(starDriver.init()).toEqual(bytes(0x1b, 0x40));
  });

  it("cut('full') emits ESC d 0 (Star line-mode)", () => {
    expect(starDriver.cut("full")).toEqual(bytes(0x1b, 0x64, 0x00));
  });

  it("cut('partial') emits ESC d 1 (Star line-mode)", () => {
    expect(starDriver.cut("partial")).toEqual(bytes(0x1b, 0x64, 0x01));
  });

  it("kickDrawer emits BEL (0x07)", () => {
    expect(starDriver.kickDrawer()).toEqual(bytes(0x07));
  });

  it("inherits column count from generic", () => {
    expect(starDriver.columns(58)).toBe(32);
    expect(starDriver.columns(80)).toBe(48);
  });
});
