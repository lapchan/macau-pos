import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { LinuxLpAdapter } from "../../src/transport/linux-lp.js";
import { PrinterOfflineError } from "../../src/errors.js";

describe("LinuxLpAdapter — real fs on temp files", () => {
  let tmpFile: string;

  beforeEach(async () => {
    tmpFile = path.join(
      os.tmpdir(),
      `lp-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    );
    await fs.promises.writeFile(tmpFile, "");
  });

  afterEach(async () => {
    await fs.promises.rm(tmpFile, { force: true });
  });

  it("U-TX-01 findLpDevice returns the first writable path in the list", async () => {
    const missing = path.join(os.tmpdir(), `missing-${Date.now()}`);
    const adapter = new LinuxLpAdapter({ lpPaths: [missing, tmpFile] });
    expect(await adapter.findLpDevice()).toBe(tmpFile);
  });

  it("findLpDevice returns null when no path is writable", async () => {
    const adapter = new LinuxLpAdapter({
      lpPaths: [
        path.join(os.tmpdir(), `missing-a-${Date.now()}`),
        path.join(os.tmpdir(), `missing-b-${Date.now()}`),
      ],
    });
    expect(await adapter.findLpDevice()).toBeNull();
  });

  it("U-TX-02 write with no device available → PrinterOfflineError", async () => {
    const missing = path.join(os.tmpdir(), `missing-${Date.now()}`);
    const adapter = new LinuxLpAdapter({ lpPaths: [missing] });
    await expect(
      adapter.write(new Uint8Array([1, 2, 3]), { timeoutMs: 500 }),
    ).rejects.toBeInstanceOf(PrinterOfflineError);
  });

  it("write to a real file emits bytes", async () => {
    const adapter = new LinuxLpAdapter({ lpPaths: [tmpFile] });
    await adapter.init();
    const payload = new Uint8Array([0x1b, 0x40, 0x41, 0x42]);
    await adapter.write(payload, { timeoutMs: 1000 });
    const written = await fs.promises.readFile(tmpFile);
    expect(Array.from(written)).toEqual([0x1b, 0x40, 0x41, 0x42]);
  });

  it("probe returns up=true when device exists, false otherwise", async () => {
    const adapter = new LinuxLpAdapter({ lpPaths: [tmpFile] });
    const ok = await adapter.probe();
    expect(ok.up).toBe(true);
    expect(ok.model).toBe(tmpFile);

    const missing = path.join(os.tmpdir(), `missing-${Date.now()}-${Math.random()}`);
    const adapter2 = new LinuxLpAdapter({ lpPaths: [missing] });
    const bad = await adapter2.probe();
    expect(bad.up).toBe(false);
  });
});
