// Auth library — password hashing, session management, login/logout
// Blueprint: PLAN.md §3 | Planning: §5 Auth APIs, §10 Security

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./client";
import { users, sessions, tenants, terminals, locations } from "./schema";
import { eq, and, isNull, gt } from "drizzle-orm";

const SALT_ROUNDS = 12;
const SESSION_DURATION_DAYS = 7;

// ─── Password Hashing ─────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Session Management ───────────────────────────────────

function generateToken(): string {
  return crypto.randomUUID();
}

function getExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DURATION_DAYS);
  return d;
}

export async function createSession(
  userId: string,
  terminalId?: string | null
): Promise<string | { error: string }> {
  // Resolve locationId from terminal (cashier sessions)
  let locationId: string | null = null;
  if (terminalId) {
    const [terminal] = await db
      .select({ locationId: terminals.locationId })
      .from(terminals)
      .where(eq(terminals.id, terminalId))
      .limit(1);
    locationId = terminal?.locationId ?? null;

    // Enforce single session per terminal
    const existingSessions = await db
      .select({ id: sessions.id, userId: sessions.userId, token: sessions.token })
      .from(sessions)
      .where(
        and(
          eq(sessions.terminalId, terminalId),
          gt(sessions.expiresAt, new Date())
        )
      );

    for (const existing of existingSessions) {
      if (existing.userId !== userId) {
        // Another user has an active session on this terminal
        return { error: "Terminal is in use by another user. They must log out first." };
      }
      // Same user re-logging in — clean up stale session
      await db.delete(sessions).where(eq(sessions.id, existing.id));
    }
  }

  const token = generateToken();
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt: getExpiryDate(),
    ...(terminalId ? { terminalId } : {}),
    ...(locationId ? { locationId } : {}),
  });

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));

  return token;
}

export async function getSession(token: string) {
  if (!token) return null;

  const [result] = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      userName: users.name,
      userAvatar: users.avatar,
      userEmail: users.email,
      userPhone: users.phone,
      userRole: users.role,
      userPosRole: users.posRole,
      tenantId: users.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantCurrency: tenants.currency,
      terminalId: sessions.terminalId,
      terminalName: terminals.name,
      terminalCode: terminals.code,
      locationId: sessions.locationId,
      locationName: locations.name,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .leftJoin(terminals, eq(sessions.terminalId, terminals.id))
    .leftJoin(locations, eq(sessions.locationId, locations.id))
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date()),
        eq(users.isActive, true),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  return result || null;
}

export type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ─── Login Functions ──────────────────────────────────────

export async function loginWithEmailPassword(
  email: string,
  password: string,
  terminalId?: string | null
): Promise<{ token: string; user: AuthSession } | { error: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email.toLowerCase()),
        eq(users.isActive, true),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (!user) return { error: "Invalid credentials" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials" };

  const tokenOrError = await createSession(user.id, terminalId);
  if (typeof tokenOrError !== "string") return tokenOrError;
  const session = await getSession(tokenOrError);
  if (!session) return { error: "Session creation failed" };

  return { token: tokenOrError, user: session };
}

export async function loginWithPhonePassword(
  phone: string,
  password: string,
  terminalId?: string | null
): Promise<{ token: string; user: AuthSession } | { error: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.phone, phone),
        eq(users.isActive, true),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (!user) return { error: "Invalid credentials" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials" };

  const tokenOrError = await createSession(user.id, terminalId);
  if (typeof tokenOrError !== "string") return tokenOrError;
  const session = await getSession(tokenOrError);
  if (!session) return { error: "Session creation failed" };

  return { token: tokenOrError, user: session };
}

export async function loginWithPin(
  tenantSlug: string,
  pin: string,
  terminalId?: string | null,
  userId?: string | null
): Promise<{ token: string; user: AuthSession } | { error: string }> {
  // First find the tenant
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) return { error: "Shop not found" };

  // If userId is provided, verify PIN against that specific user
  if (userId) {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.tenantId, tenant.id),
          eq(users.isActive, true),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (!user || !user.pin) return { error: "Invalid PIN" };

    const valid = await verifyPassword(pin, user.pin);
    if (!valid) return { error: "Invalid PIN" };

    const tokenOrError = await createSession(user.id, terminalId);
    if (typeof tokenOrError !== "string") return tokenOrError;
    const session = await getSession(tokenOrError);
    if (!session) return { error: "Session creation failed" };
    return { token: tokenOrError, user: session };
  }

  // Fallback: try all users (for password-mode or legacy)
  const cashiers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenant.id),
        eq(users.isActive, true),
        isNull(users.deletedAt)
      )
    );

  for (const user of cashiers) {
    if (!user.pin) continue;
    const valid = await verifyPassword(pin, user.pin);
    if (valid) {
      const tokenOrError = await createSession(user.id, terminalId);
      if (typeof tokenOrError !== "string") return tokenOrError;
      const session = await getSession(tokenOrError);
      if (!session) return { error: "Session creation failed" };
      return { token: tokenOrError, user: session };
    }
  }

  return { error: "Invalid PIN" };
}
