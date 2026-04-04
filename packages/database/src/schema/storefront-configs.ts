import { pgTable, uuid, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { locations } from "./locations";

export const storefrontConfigs = pgTable("storefront_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }),
  branding: jsonb("branding").notNull().default({}),
  header: jsonb("header").notNull().default({}),
  homepageSections: jsonb("homepage_sections").notNull().default([]),
  footer: jsonb("footer").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, () => [
  // Partial unique indexes + check constraints added via raw SQL in migration
]);
