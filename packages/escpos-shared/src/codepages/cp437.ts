import iconv from "iconv-lite";

export const cp437 = {
  name: "cp437" as const,
  escposPage: 0,
  requiresChineseMode: false,
  encode(text: string): Uint8Array {
    return new Uint8Array(iconv.encode(text, "cp437"));
  },
};
