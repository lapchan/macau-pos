import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { categories } from "./categories";
import { productStatusEnum } from "./enums";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    // Product name — always displayed, not tied to any language
    name: varchar("name", { length: 255 }).notNull(),
    // Optional translations: { "en": "Pocari Sweat", "pt": "..." }
    // Shown INSTEAD of name when user's locale matches a key
    translations: jsonb("translations").$type<Record<string, string>>().default({}),

    // Description
    description: varchar("description", { length: 1000 }),
    descTranslations: jsonb("desc_translations").$type<Record<string, string>>().default({}),

    // URL slug for storefront (auto-generated from EN translation)
    slug: varchar("slug", { length: 200 }),

    // Identifiers
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    image: varchar("image", { length: 500 }), // legacy single image (admin/cashier still read this)
    images: jsonb("images").$type<{ url: string; alt?: string; altTranslations?: Record<string, string>; variantId?: string; sortOrder: number }[]>().default([]),

    // Pricing
    sellingPrice: decimal("selling_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }),

    // Stock
    stock: integer("stock"), // null = unlimited

    // Status & flags
    status: productStatusEnum("status").notNull().default("active"),
    isPopular: boolean("is_popular").notNull().default(false),
    hasVariants: boolean("has_variants").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    // Optimistic locking
    version: integer("version").notNull().default(1),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete
  },
  (table) => [
    index("idx_products_tenant_cat").on(
      table.tenantId,
      table.categoryId,
      table.status
    ),
    index("idx_products_tenant_status").on(table.tenantId, table.status),
    index("idx_products_barcode").on(table.tenantId, table.barcode),
    uniqueIndex("idx_products_tenant_slug").on(table.tenantId, table.slug)
      .where(sql`${table.slug} IS NOT NULL AND ${table.deletedAt} IS NULL`),
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
