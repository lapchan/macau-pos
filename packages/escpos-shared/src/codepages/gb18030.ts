import iconv from "iconv-lite";

// ESC t 52 (0x34) selects GB18030 on Xprinter / most CN-firmware ESC/POS units.
export const gb18030 = {
  name: "gb18030" as const,
  escposPage: 52,
  requiresChineseMode: true,
  encode(text: string): Uint8Array {
    return new Uint8Array(iconv.encode(text, "gb18030"));
  },
};
