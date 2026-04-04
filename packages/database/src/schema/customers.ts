import { pgTable, uuid, varchar, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatar: varchar("avatar", { length: 500 }),
  isVerified: boolean("is_verified").notNull().default(false),
  locale: varchar("locale", { length: 10 }).default("tc"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("idx_customers_email").on(table.tenantId, table.email)
    .where(sql`${table.email} IS NOT NULL AND ${table.deletedAt} IS NULL`),
  uniqueIndex("idx_customers_phone").on(table.tenantId, table.phone)
    .where(sql`${table.phone} IS NOT NULL AND ${table.deletedAt} IS NULL`),
  index("idx_customers_tenant").on(table.tenantId, table.createdAt),
]);
