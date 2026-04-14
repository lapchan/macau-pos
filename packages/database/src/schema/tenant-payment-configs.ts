import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const tenantPaymentConfigs = pgTable("tenant_payment_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),

  intellipayEnabled: boolean("intellipay_enabled").notNull().default(false),

  // Credentials issued by Intellipay per operator (one tenant = one operator)
  accessKeyId: varchar("access_key_id", { length: 128 }),
  merchantId: varchar("merchant_id", { length: 128 }),
  operatorId: varchar("operator_id", { length: 128 }),

  // RSA-2048 private key (PKCS#1 or PKCS#8 PEM) encrypted at rest with AES-256-GCM.
  // Plaintext never leaves server memory; decrypted just-in-time for signing.
  privateKeyPemEncrypted: text("private_key_pem_encrypted"),

  // Random slug used in the webhook URL path so webhook URLs are unguessable.
  webhookSlug: varchar("webhook_slug", { length: 64 }),

  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantPaymentConfig = typeof tenantPaymentConfigs.$inferSelect;
export type NewTenantPaymentConfig = typeof tenantPaymentConfigs.$inferInsert;
