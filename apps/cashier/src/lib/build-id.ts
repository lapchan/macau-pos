import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

// Reads Next.js's build ID. Dev cwd is apps/cashier, prod standalone cwd is /app.
export function getBuildId(): string {
  if (cached) return cached;
  for (const rel of [".next/BUILD_ID", "apps/cashier/.next/BUILD_ID"]) {
    try {
      cached = readFileSync(join(process.cwd(), rel), "utf8").trim();
      if (cached) return cached;
    } catch {}
  }
  cached = "dev";
  return cached;
}
