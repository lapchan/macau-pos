import iconv from "iconv-lite";

// Page 8 selects Shift_JIS (Katakana/Kanji) on most JP-firmware printers.
export const shiftJis = {
  name: "shift_jis" as const,
  escposPage: 8,
  requiresChineseMode: true,
  encode(text: string): Uint8Array {
    return new Uint8Array(iconv.encode(text, "shift_jis"));
  },
};
