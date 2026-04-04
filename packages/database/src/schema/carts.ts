import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { customers } from "./customers";

export const carts = pgTable("carts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 255 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("idx_carts_session").on(table.sessionToken)
    .where(sql`${table.sessionToken} IS NOT NULL`),
  uniqueIndex("idx_carts_customer").on(table.customerId)
    .where(sql`${table.customerId} IS NOT NULL`),
  index("idx_carts_expires").on(table.expiresAt)
    .where(sql`${table.customerId} IS NULL`),
]);
