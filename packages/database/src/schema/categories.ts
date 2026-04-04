import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    // Sub-category support: null = top-level, uuid = child of parent
    parentCategoryId: uuid("parent_category_id"),
    // URL slug for storefront (auto-generated from EN translation)
    slug: varchar("slug", { length: 100 }),
    // Category name — always displayed
    name: varchar("name", { length: 100 }).notNull(),
    // Optional translations: { "en": "Beverages", "pt": "Bebidas" }
    translations: jsonb("translations").$type<Record<string, string>>().default({}),
    icon: varchar("icon", { length: 50 }), // lucide icon name
    sortOrder: integer("sort_order").notNull().default(0),
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
    index("idx_categories_tenant").on(table.tenantId, table.sortOrder),
    uniqueIndex("idx_categories_tenant_slug").on(table.tenantId, table.slug)
      .where(sql`${table.slug} IS NOT NULL`),
  ]
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
