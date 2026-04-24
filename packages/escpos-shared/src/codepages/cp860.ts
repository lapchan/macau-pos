import iconv from "iconv-lite";

// PC860 "Portuguese" DOS code page. ESC t 3 on most ESC/POS firmware (Epson,
// Xprinter, most clones that ship Portuguese fonts). Provides uppercase
// accented characters (À É Í Ó Ú) that CP437 lacks — required for Macau/PT
// shops. Not part of the public PrinterCodePage union because operator
// configuration doesn't need to surface it; the test page uses it directly
// to prove Portuguese rendering works.
export const cp860 = {
  name: "cp860" as const,
  escposPage: 3,
  requiresChineseMode: false,
  encode(text: string): Uint8Array {
    return new Uint8Array(iconv.encode(text, "cp860"));
  },
};
