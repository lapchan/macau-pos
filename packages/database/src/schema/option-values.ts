import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { optionGroups } from "./option-groups";

export const optionValues = pgTable(
  "option_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => optionGroups.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 100 }).notNull(),
    translations: jsonb("translations").default({}),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("idx_option_values_group").on(table.groupId, table.sortOrder),
  ]
);

export type OptionValue = typeof optionValues.$inferSelect;
export type NewOptionValue = typeof optionValues.$inferInsert;
