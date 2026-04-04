"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  loginWithPin,
  loginWithPhonePassword,
  loginWithEmailPassword,
  verifyPassword,
  getSession,
  deleteSession,
  db,
  users,
  sessions,
  terminals,
  tenants,
  eq,
  and,
  gt,
  type AuthSession,
} from "@macau-pos/database";

const COOKIE_NAME = "pos_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/** Check if user has POS access: posRole is set, or role is merchant_owner (implicit) */
function hasPosAccess(session: AuthSession): boolean {
  return !!session.userPosRole || session.userRole === "merchant_owner";
}

/** Resolve tenant slug from terminal ID */
async function getTenantSlugFromTerminal(terminalId: string): Promise<string | null> {
  const [row] = await db
    .select({ slug: tenants.slug })
    .from(terminals)
    .innerJoin(tenants, eq(terminals.tenantId, tenants.id))
    .where(eq(terminals.id, terminalId))
    .limit(1);
  return row?.slug ?? null;
}

export async function loginPin(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const pin = formData.get("pin") as string;
  const terminalId = formData.get("terminalId") as string | null;
  const userId = formData.get("userId") as string | null;

  if (!pin || pin.length < 4) {
    return { error: "Please enter a valid PIN" };
  }

  // Resolve tenant from terminal (no more hardcoded slug)
  if (!terminalId) {
    return { error: "Terminal not activated. Please activate first." };
  }
  const tenantSlug = await getTenantSlugFromTerminal(terminalId);
  if (!tenantSlug) {
    return { error: "Terminal not found. Please re-activate." };
  }

  const result = await loginWithPin(tenantSlug, pin, terminalId, userId);

  if ("error" in result) {
    return { error: result.error };
  }

  // Enforce POS access
  if (!hasPosAccess(result.user)) {
    await deleteSession(result.token);
    return { error: "This account does not have POS access." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Return success instead of redirect — allows client-side transition animation
  return { success: true };
}

export async function loginPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const identifier = (formData.get("identifier") as string)?.trim();
  const password = formData.get("password") as string;
  const terminalId = formData.get("terminalId") as string | null;

  if (!identifier || !password) {
    return { error: "Please enter your credentials" };
  }

  // Determine if identifier is email or phone
  const isEmail = identifier.includes("@");
  const result = isEmail
    ? await loginWithEmailPassword(identifier, password, terminalId)
    : await loginWithPhonePassword(identifier, password, terminalId);

  if ("error" in result) {
    return { error: result.error };
  }

  // Enforce POS access
  if (!hasPosAccess(result.user)) {
    await deleteSession(result.token);
    return { error: "This account does not have POS access." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await deleteSession(token);
  }

  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

/** Logout without redirect — for client-side transition animations */
export async function logoutSilent() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await deleteSession(token);
  }

  cookieStore.delete(COOKIE_NAME);
  // No redirect — caller handles navigation after animation
  return { success: true };
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSession(token);
}

/** Verify PIN for screen unlock — does NOT create a session, just checks the PIN */
export async function verifyPinForUnlock(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const pin = formData.get("pin") as string;
  const userId = formData.get("userId") as string;

  if (!pin || pin.length < 4 || !userId) {
    return { error: "Invalid PIN" };
  }

  // Fetch user's PIN hash
  const [user] = await db
    .select({ pin: users.pin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.pin) {
    return { error: "PIN not set for this user" };
  }

  const valid = await verifyPassword(pin, user.pin);
  if (!valid) {
    return { error: "Invalid PIN" };
  }

  return { success: true };
}
