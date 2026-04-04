import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { pricingStrategies } from "./pricing-strategies";

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Identity
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(), // URL-safe, unique per tenant
    code: varchar("code", { length: 20 }).notNull(), // e.g. "L-001", unique per tenant

    // Contact info
    address: varchar("address", { length: 500 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),

    // Pricing strategy assignment
    pricingStrategyId: uuid("pricing_strategy_id").references(
      () => pricingStrategies.id,
      { onDelete: "set null" }
    ),

    // Flags
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_locations_tenant_slug").on(table.tenantId, table.slug),
    uniqueIndex("idx_locations_tenant_code").on(table.tenantId, table.code),
    index("idx_locations_tenant_active").on(table.tenantId, table.isActive),
  ]
);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
