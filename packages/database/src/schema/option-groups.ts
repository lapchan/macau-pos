import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { products } from "./products";

export const optionGroups = pgTable(
  "option_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    translations: jsonb("translations").default({}),
    displayType: varchar("display_type", { length: 20 }).notNull().default("auto"), // "auto" | "color" | "image" | "text"
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_option_groups_product").on(table.productId, table.sortOrder),
  ]
);

export type OptionGroup = typeof optionGroups.$inferSelect;
export type NewOptionGroup = typeof optionGroups.$inferInsert;
