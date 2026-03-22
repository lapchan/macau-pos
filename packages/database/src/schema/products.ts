import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
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

    // Names (multilingual)
    name: varchar("name", { length: 255 }).notNull(), // English
    nameCn: varchar("name_cn", { length: 255 }), // Chinese Traditional
    nameJa: varchar("name_ja", { length: 255 }), // Japanese
    namePt: varchar("name_pt", { length: 255 }), // Portuguese

    // Identifiers
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    image: varchar("image", { length: 500 }),

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
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
