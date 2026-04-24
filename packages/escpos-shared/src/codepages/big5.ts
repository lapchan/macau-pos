import iconv from "iconv-lite";

// Big5 has no canonical ESC t page across vendors. Most TW/HK firmware
// switches to Big5 automatically when FS & (Chinese mode) is sent.
// We pass page=0 so the driver still emits ESC t 0 as a no-op safe default.
export const big5 = {
  name: "big5" as const,
  escposPage: 0,
  requiresChineseMode: true,
  encode(text: string): Uint8Array {
    return new Uint8Array(iconv.encode(text, "big5"));
  },
};
