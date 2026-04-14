import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { tenants, tenantPaymentConfigs } from "../schema";
import { fetchMerchantInfo } from "./client";

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: pnpm db:intellipay:smoke <tenant-slug>");
    process.exit(1);
  }
  if (!process.env.INTELLIPAY_KMS_KEY) {
    throw new Error("INTELLIPAY_KMS_KEY is not set");
  }
  if (!process.env.INTELLIPAY_BASE_URL) {
    throw new Error("INTELLIPAY_BASE_URL is not set");
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const [row] = await db
    .select({
      accessKeyId: tenantPaymentConfigs.accessKeyId,
      privateKeyPemEncrypted: tenantPaymentConfigs.privateKeyPemEncrypted,
      enabled: tenantPaymentConfigs.intellipayEnabled,
      webhookSlug: tenantPaymentConfigs.webhookSlug,
    })
    .from(tenantPaymentConfigs)
    .innerJoin(tenants, eq(tenants.id, tenantPaymentConfigs.tenantId))
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!row) {
    console.error(`No intellipay config for tenant "${slug}"`);
    process.exit(1);
  }
  if (!row.accessKeyId || !row.privateKeyPemEncrypted) {
    console.error(`Tenant "${slug}" has no accessKeyId / private key provisioned`);
    process.exit(1);
  }

  console.log(`Calling /v1/retailai/merchant/info for ${slug} (enabled=${row.enabled}, webhook_slug=${row.webhookSlug})`);
  const result = await fetchMerchantInfo({
    accessKeyId: row.accessKeyId,
    privateKeyPemEncrypted: row.privateKeyPemEncrypted,
  });

  if (result.ok) {
    console.log(`OK (${result.status}) request_id=${result.requestId}`);
    console.log(JSON.stringify(result.data, null, 2));
    await db
      .update(tenantPaymentConfigs)
      .set({ lastVerifiedAt: new Date() })
      .where(eq(tenantPaymentConfigs.accessKeyId, row.accessKeyId));
  } else {
    console.error(
      `FAIL status=${result.status} code=${result.errorCode} type=${result.errorType} request_id=${result.requestId}`,
    );
    console.error(result.message);
    if (result.raw) console.error(JSON.stringify(result.raw, null, 2));
    process.exit(2);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(1);
});
