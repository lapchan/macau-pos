import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "suspended",
  "cancelled",
]);

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "inactive",
  "sold_out",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "completed",
  "refunded",
  "voided",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "tap",
  "insert",
  "qr",
  "cash",
  "online",
]);

export const shiftStatusEnum = pgEnum("shift_status", [
  "open",
  "pending_approval",
  "closed",
  "flagged",
]);

export const terminalStatusEnum = pgEnum("terminal_status", [
  "active",
  "disabled",
  "maintenance",
]);

export const userRoleEnum = pgEnum("user_role", [
  "platform_admin",
  "merchant_owner",
  "cashier",
  "customer",
  "promoter",
  "accountant",
  "potential_customer",
]);

export const posRoleEnum = pgEnum("pos_role", [
  "store_manager",
]);
