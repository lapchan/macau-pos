import { z } from "zod";

// Max ESC/POS payload we accept per job (64 KiB). Receipts are typically
// 2–6 KiB; this cap protects against a malformed cashier flooding the bridge.
export const MAX_BYTES_BASE64_BYTES = 64 * 1024;
// base64 expansion ratio = 4/3 bytes, so the encoded string is bounded by
// MAX_BYTES_BASE64_BYTES * 4/3 + 4 (padding).
export const MAX_BYTES_BASE64_CHARS = Math.ceil(MAX_BYTES_BASE64_BYTES * 1.34) + 4;

export const PrintRequestSchema = z
  .object({
    bytesBase64: z
      .string()
      .min(1, "bytesBase64 is required")
      .max(MAX_BYTES_BASE64_CHARS, "bytesBase64 exceeds 64 KiB decoded"),
    copies: z.number().int().min(1).max(10).optional().default(1),
    kickDrawer: z.boolean().optional().default(false),
    driver: z.string().optional(),
    timeoutMs: z.number().int().min(100).max(60_000).optional().default(3000),
  })
  .strict();

export type PrintRequest = z.infer<typeof PrintRequestSchema>;

export const TestRequestSchema = z
  .object({
    jobId: z.string().uuid().optional(),
    driver: z.enum(["generic", "star", "epson", "custom"]).optional(),
    paperWidth: z.union([z.literal(58), z.literal(80)]).optional(),
    codePage: z.enum(["cp437", "gb18030", "big5", "shift_jis"]).optional(),
    shopName: z.string().max(200).optional(),
    locationName: z.string().max(200).optional(),
    kickDrawer: z.boolean().optional().default(false),
    timeoutMs: z.number().int().min(100).max(60_000).optional().default(3000),
  })
  .strict();

export type TestRequest = z.infer<typeof TestRequestSchema>;
