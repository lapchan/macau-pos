import {
  pgTable,
  uuid,
  decimal,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { pricingStrategies } from "./pricing-strategies";
import { products } from "./products";
import { productVariants } from "./product-variants";

export const pricingStrategyItems = pgTable(
  "pricing_strategy_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id")
      .notNull()
      .references(() => pricingStrategies.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),

    // Price overrides — null means use catalog default
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }),

    // Stock override — null means use catalog default
    stock: integer("stock"),

    // Availability — false hides this product at locations using this strategy
    isAvailable: boolean("is_available").notNull().default(true),

    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Two partial indexes to handle nullable variant_id uniqueness
    uniqueIndex("idx_strategy_items_product").on(
      table.strategyId,
      table.productId
    ),
    index("idx_strategy_items_available").on(
      table.strategyId,
      table.isAvailable
    ),
  ]
);

export type PricingStrategyItem = typeof pricingStrategyItems.$inferSelect;
export type NewPricingStrategyItem = typeof pricingStrategyItems.$inferInsert;
