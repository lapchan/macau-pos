export { db } from "./client";
export type { Database } from "./client";

// Schema exports
export * from "./schema";
export * from "./constants";
export { getDisplayName } from "./utils";

// Auth exports
export {
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  deleteSession,
  deleteAllUserSessions,
  loginWithEmailPassword,
  loginWithPhonePassword,
  loginWithPin,
} from "./auth";
export type { AuthSession } from "./auth";

// Cash log
export { logCashEvent, getCashLogByShift } from "./cash-log";
export type { CashEventParams } from "./cash-log";

// Drizzle operators (re-export for convenience)
export { eq, ne, gt, gte, lt, lte, and, or, isNull, isNotNull, inArray, sql, desc, asc, count, sum } from "drizzle-orm";
