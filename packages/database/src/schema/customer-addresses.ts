import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  label: varchar("label", { length: 50 }),
  recipientName: varchar("recipient_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  addressLine1: varchar("address_line1", { length: 500 }).notNull(),
  addressLine2: varchar("address_line2", { length: 200 }),
  district: varchar("district", { length: 100 }),
  city: varchar("city", { length: 100 }).default("Macau"),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 50 }).default("MO"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_addresses_customer").on(table.customerId),
]);
