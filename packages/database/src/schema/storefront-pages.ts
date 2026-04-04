import { pgTable, uuid, varchar, jsonb, boolean, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const storefrontPages = pgTable("storefront_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  titleTranslations: jsonb("title_translations").default({}),
  content: jsonb("content").notNull().default([]),
  contentTranslations: jsonb("content_translations").default({}),
  metaDescription: varchar("meta_description", { length: 500 }),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("idx_sf_pages_slug").on(table.tenantId, table.slug),
  index("idx_sf_pages_published").on(table.tenantId, table.isPublished, table.sortOrder),
]);
