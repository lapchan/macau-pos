/**
 * Patch script: Reset products that have unsplash placeholder URLs
 * back to null (will show default placeholder in UI).
 * Run: pnpm --filter database exec tsx src/patch-images.ts
 */
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { products } from "./schema";
import { sql } from "drizzle-orm";

const { Pool } = pg;

async function patchImages() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Reset all unsplash placeholder images to null
  const result = await db.update(products)
    .set({ image: null })
    .where(sql`image LIKE 'https://images.unsplash%'`);

  console.log("Reset unsplash placeholders to null (will show default placeholder in UI)");

  // Stats
  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    withLocal: sql<number>`count(*) filter (where image like '/products/%')`,
    withNull: sql<number>`count(*) filter (where image is null or image = '')`,
  }).from(products);

  console.log(stats);
  await pool.end();
}

patchImages().catch(console.error);
