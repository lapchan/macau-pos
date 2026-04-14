import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { tenants, tenantPaymentConfigs } from "../schema";
import { encryptSecret } from "../crypto";

interface Args {
  tenant: string;
  accessKey: string;
  merchantId?: string;
  operatorId?: string;
  privateKeyPath: string;
  enable: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Record<string, string | boolean> = { enable: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--enable") {
      out.enable = true;
      continue;
    }
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const val = argv[i + 1];
    if (!val || val.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    out[key] = val;
    i++;
  }
  const required = ["tenant", "access-key", "private-key"];
  for (const k of required) {
    if (!out[k]) throw new Error(`Missing --${k}`);
  }
  return {
    tenant: out["tenant"] as string,
    accessKey: out["access-key"] as string,
    merchantId: out["merchant-id"] as string | undefined,
    operatorId: out["operator-id"] as string | undefined,
    privateKeyPath: out["private-key"] as string,
    enable: out.enable === true,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.INTELLIPAY_KMS_KEY) {
    throw new Error("INTELLIPAY_KMS_KEY is not set in .env");
  }

  const pem = readFileSync(args.privateKeyPath, "utf8");
  if (!pem.includes("PRIVATE KEY")) {
    throw new Error(`${args.privateKeyPath} does not look like a PEM private key`);
  }
  const privateKeyPemEncrypted = encryptSecret(pem);

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, args.tenant))
    .limit(1);
  if (!tenant) {
    throw new Error(`Tenant not found: ${args.tenant}`);
  }

  const webhookSlug = randomBytes(12).toString("hex");

  const [existing] = await db
    .select()
    .from(tenantPaymentConfigs)
    .where(eq(tenantPaymentConfigs.tenantId, tenant.id))
    .limit(1);

  if (existing) {
    await db
      .update(tenantPaymentConfigs)
      .set({
        intellipayEnabled: args.enable,
        accessKeyId: args.accessKey,
        merchantId: args.merchantId ?? existing.merchantId,
        operatorId: args.operatorId ?? existing.operatorId,
        privateKeyPemEncrypted,
        webhookSlug: existing.webhookSlug ?? webhookSlug,
      })
      .where(eq(tenantPaymentConfigs.tenantId, tenant.id));
    console.log(`Updated intellipay config for tenant "${args.tenant}"`);
    console.log(`  webhook slug: ${existing.webhookSlug ?? webhookSlug}`);
  } else {
    await db.insert(tenantPaymentConfigs).values({
      tenantId: tenant.id,
      intellipayEnabled: args.enable,
      accessKeyId: args.accessKey,
      merchantId: args.merchantId ?? null,
      operatorId: args.operatorId ?? null,
      privateKeyPemEncrypted,
      webhookSlug,
    });
    console.log(`Created intellipay config for tenant "${args.tenant}"`);
    console.log(`  webhook slug: ${webhookSlug}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
