export { db } from "./client";
export type { Database } from "./client";

// Schema exports
export * from "./schema";
export * from "./constants";
export { getDisplayName } from "./utils";
export { normalizePhone, phoneSearchCandidates, formatPhoneDisplay } from "./phone";

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

// Crypto (AES-256-GCM for secrets at rest)
export { encryptSecret, decryptSecret } from "./crypto";

// Intellipay (simpaylicity) payment gateway signing + client
export * from "./intellipay";

// Cash log
export { logCashEvent, getCashLogByShift } from "./cash-log";
export type { CashEventParams } from "./cash-log";

// Drizzle operators (re-export for convenience)
export { eq, ne, gt, gte, lt, lte, and, or, isNull, isNotNull, inArray, sql, desc, asc, count, sum } from "drizzle-orm";
