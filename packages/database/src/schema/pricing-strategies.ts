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

export const pricingStrategies = pgTable(
  "pricing_strategies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }),

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
    uniqueIndex("idx_pricing_strategies_tenant_name").on(
      table.tenantId,
      table.name
    ),
    index("idx_pricing_strategies_tenant_active").on(
      table.tenantId,
      table.isActive
    ),
  ]
);

export type PricingStrategy = typeof pricingStrategies.$inferSelect;
export type NewPricingStrategy = typeof pricingStrategies.$inferInsert;
