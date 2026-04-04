import { pgTable, uuid, varchar, text, boolean, decimal, jsonb, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { locations } from "./locations";

export const shopSettings = pgTable("shop_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  locationId: uuid("location_id")
    .notNull()
    .unique()
    .references(() => locations.id, { onDelete: "cascade" }),

  // Business info (per-location)
  shopName: varchar("shop_name", { length: 200 }),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 200 }),
  logo: varchar("logo", { length: 500 }),

  // Business hours: JSONB array of { day, open, close, isClosed }
  businessHours: jsonb("business_hours").default("[]"),

  // Tax (per-location)
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),

  // Payment methods enabled (per-location)
  paymentCash: boolean("payment_cash").notNull().default(true),
  paymentCard: boolean("payment_card").notNull().default(true),
  paymentMpay: boolean("payment_mpay").notNull().default(false),
  paymentAlipay: boolean("payment_alipay").notNull().default(false),
  paymentWechat: boolean("payment_wechat").notNull().default(false),

  // Receipt (per-location)
  receiptHeader: text("receipt_header"),
  receiptFooter: text("receipt_footer"),
  receiptShowAddress: boolean("receipt_show_address").notNull().default(true),
  receiptShowPhone: boolean("receipt_show_phone").notNull().default(true),
  receiptShowTax: boolean("receipt_show_tax").notNull().default(false),

  // Print settings (per-location)
  printMode: varchar("print_mode", { length: 20 }).notNull().default("browser"), // "browser" | "escpos" | "both"
  printServerUrl: varchar("print_server_url", { length: 500 }).default("http://localhost:9100"),

  // Online store (per-location)
  onlineEnabled: boolean("online_enabled").notNull().default(false),
  onlineUrl: varchar("online_url", { length: 500 }),
  onlineDescription: text("online_description"),
  onlineBanner: varchar("online_banner", { length: 500 }),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ShopSettings = typeof shopSettings.$inferSelect;
export type NewShopSettings = typeof shopSettings.$inferInsert;
