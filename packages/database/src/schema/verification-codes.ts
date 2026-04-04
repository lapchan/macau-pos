import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const verificationCodes = pgTable("verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 20 }).notNull().default("login"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_verification_target").on(table.tenantId, table.target, table.createdAt),
  index("idx_verification_expires").on(table.expiresAt),
]);
