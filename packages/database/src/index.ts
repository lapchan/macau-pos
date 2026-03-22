export { db } from "./client";
export type { Database } from "./client";

// Schema exports
export * from "./schema";
export * from "./constants";

// Drizzle operators (re-export for convenience)
export { eq, ne, gt, gte, lt, lte, and, or, isNull, isNotNull, inArray, sql, desc, asc } from "drizzle-orm";
