import { describe, it, expect, vi } from "vitest";

// Isolated test file so the node:fs mock doesn't affect the real-fs tests.
// The mocked open() returns a handle whose write() never resolves, letting
// us deterministically trigger PrinterTimeoutError.
vi.mock("node:fs", () => ({
  promises: {
    async access(_p: string, _m: number) {
      /* always succeeds so findLpDevice picks the first candidate */
    },
    async open(_p: string, _m: string) {
      return {
        async write() {
          return new Promise(() => {
            /* never resolves */
          });
        },
        async close() {},
      };
    },
    constants: { W_OK: 2 },
  },
  constants: { W_OK: 2 },
}));

import { LinuxLpAdapter } from "../../src/transport/linux-lp.js";
import { PrinterTimeoutError } from "../../src/errors.js";

describe("LinuxLpAdapter — timeout (fs mocked)", () => {
  it("U-TX-03 hung write → PrinterTimeoutError", async () => {
    const adapter = new LinuxLpAdapter({ lpPaths: ["/mock/usb/lp0"] });
    await expect(
      adapter.write(new Uint8Array([1, 2, 3]), { timeoutMs: 20 }),
    ).rejects.toBeInstanceOf(PrinterTimeoutError);
  });
});
