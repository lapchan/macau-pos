import {
  pgTable,
  uuid,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { locations } from "./locations";

/**
 * Junction table: which users have access to which locations.
 *
 * Rules:
 * - merchant_owner has NO rows → implicit access to all locations
 * - store_manager / cashier must have explicit rows
 */
export const userLocations = pgTable(
  "user_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_user_locations_unique").on(table.userId, table.locationId),
  ]
);

export type UserLocation = typeof userLocations.$inferSelect;
export type NewUserLocation = typeof userLocations.$inferInsert;
