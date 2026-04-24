import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";

const spawnMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

// Imports must come AFTER vi.mock so the mocked spawn is the one captured.
import { CupsAdapter } from "../../src/transport/cups.js";
import { PrinterOfflineError } from "../../src/errors.js";

interface FakeChild extends EventEmitter {
  stdin: { end: (b: Buffer) => void };
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: (signal: string) => void;
}

function makeFakeChild(): FakeChild {
  const e = new EventEmitter() as FakeChild;
  e.stdout = new EventEmitter();
  e.stderr = new EventEmitter();
  e.stdin = {
    end: (_b: Buffer) => {},
  };
  e.kill = () => {};
  return e;
}

describe("CupsAdapter", () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it("U-TX-05 write shells out to 'lp -d <name> -o raw'", async () => {
    const child = makeFakeChild();
    spawnMock.mockReturnValue(child);

    const adapter = new CupsAdapter("Xprinter");
    const write = adapter.write(new Uint8Array([0x1b, 0x40]), { timeoutMs: 500 });

    // Simulate successful exit after a tick
    setImmediate(() => child.emit("close", 0));
    await write;

    expect(spawnMock).toHaveBeenCalled();
    const call = spawnMock.mock.calls[0]!;
    expect(call[0]).toBe("lp");
    expect(call[1]).toEqual(["-d", "Xprinter", "-o", "raw"]);
  });

  it("write rejects with PrinterOfflineError when lp exits non-zero", async () => {
    const child = makeFakeChild();
    spawnMock.mockReturnValue(child);

    const adapter = new CupsAdapter("Xprinter");
    const write = adapter.write(new Uint8Array([1]), { timeoutMs: 500 });
    setImmediate(() => {
      child.stderr.emit("data", Buffer.from("no such printer"));
      child.emit("close", 1);
    });
    await expect(write).rejects.toBeInstanceOf(PrinterOfflineError);
  });

  it("probe runs lpstat -p <name> and parses 'idle'", async () => {
    const child = makeFakeChild();
    spawnMock.mockReturnValue(child);

    const adapter = new CupsAdapter("Xprinter");
    const probe = adapter.probe();
    setImmediate(() => {
      child.stdout.emit("data", Buffer.from("printer Xprinter is idle.  enabled since..."));
      child.emit("close", 0);
    });
    const result = await probe;
    expect(spawnMock).toHaveBeenCalledWith("lpstat", ["-p", "Xprinter"]);
    expect(result.up).toBe(true);
    expect(result.model).toBe("Xprinter");
  });

  it("probe returns up=false when lpstat says disabled", async () => {
    const child = makeFakeChild();
    spawnMock.mockReturnValue(child);

    const adapter = new CupsAdapter("Xprinter");
    const probe = adapter.probe();
    setImmediate(() => {
      child.stdout.emit(
        "data",
        Buffer.from("printer Xprinter disabled since..."),
      );
      child.emit("close", 0);
    });
    const result = await probe;
    expect(result.up).toBe(false);
  });

  it("constructor throws when printer name is empty", () => {
    expect(() => new CupsAdapter("")).toThrow();
  });
});
