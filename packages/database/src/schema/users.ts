import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userRoleEnum, posRoleEnum } from "./enums";
import { tenants } from "./tenants";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    name: varchar("name", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    pin: varchar("pin", { length: 255 }), // bcrypt-hashed 4-6 digit PIN
    avatar: varchar("avatar", { length: 500 }),
    role: userRoleEnum("role").notNull(),
    posRole: posRoleEnum("pos_role"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_users_email")
      .on(table.email)
      .where(sql`${table.email} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    uniqueIndex("idx_users_phone")
      .on(table.phone)
      .where(sql`${table.phone} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    index("idx_users_tenant_role").on(table.tenantId, table.role),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
