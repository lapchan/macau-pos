import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { subscriptionStatusEnum } from "./enums";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .notNull()
    .default("trial"),
  // Locales the merchant wants translation fields for (e.g. {en,pt,ja})
  supportedLocales: text("supported_locales")
    .array()
    .notNull()
    .default(sql`'{en}'`),

  // Org-wide settings (shared across all locations)
  currency: varchar("currency", { length: 10 }).notNull().default("MOP"),
  defaultLocale: varchar("default_locale", { length: 10 }).default("tc"),
  accentColor: varchar("accent_color", { length: 20 }).default("#4f6ef7"),
  theme: varchar("theme", { length: 20 }).default("light"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
