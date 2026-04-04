"use server";

import { cookies } from "next/headers";
import {
  db,
  customers,
  customerSessions,
  verificationCodes,
  eq,
  and,
  sql,
  isNull,
  desc,
} from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { redirect } from "next/navigation";

// ============================================================
// Send verification code (step 1)
// ============================================================

export async function sendVerificationCode(
  target: string,
  method: "phone" | "email",
) {
  const tenant = await resolveTenant();
  if (!tenant) return { error: "Tenant not found" };

  // Validate input
  const trimmed = target.trim();
  if (!trimmed) return { error: "Please enter a phone number or email" };

  if (method === "email" && !trimmed.includes("@")) {
    return { error: "Invalid email address" };
  }

  // Rate limit: max 3 codes per target in last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const [recentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.tenantId, tenant.id),
        eq(verificationCodes.target, trimmed),
        sql`${verificationCodes.createdAt} > ${tenMinutesAgo}`,
      )
    );

  if (Number(recentCount.count) >= 3) {
    return { error: "Too many attempts. Please try again later." };
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await db.insert(verificationCodes).values({
    tenantId: tenant.id,
    target: trimmed,
    code,
    purpose: "login",
    expiresAt,
  });

  // TODO: Actually send SMS or email via provider
  // For development, log the code
  console.log(`📲 Verification code for ${trimmed}: ${code}`);

  return { success: true, message: `Code sent to ${trimmed}` };
}

// ============================================================
// Verify code (step 2) — creates session
// ============================================================

export async function verifyCodeAndLogin(
  target: string,
  code: string,
  locale: string = "tc",
) {
  const tenant = await resolveTenant();
  if (!tenant) return { error: "Tenant not found" };

  const trimmed = target.trim();
  const trimmedCode = code.trim();

  if (trimmedCode.length !== 6) return { error: "Invalid code" };

  // Find the latest unexpired, unverified code for this target
  const [verification] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.tenantId, tenant.id),
        eq(verificationCodes.target, trimmed),
        eq(verificationCodes.purpose, "login"),
        isNull(verificationCodes.verifiedAt),
        sql`${verificationCodes.expiresAt} > now()`,
      )
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (!verification) return { error: "Code expired. Please request a new one." };

  // Check attempts
  if (verification.attempts >= verification.maxAttempts) {
    return { error: "Too many attempts. Please request a new code." };
  }

  // Increment attempts
  await db
    .update(verificationCodes)
    .set({ attempts: verification.attempts + 1 })
    .where(eq(verificationCodes.id, verification.id));

  // Check code match
  if (verification.code !== trimmedCode) {
    const remaining = verification.maxAttempts - verification.attempts - 1;
    return { error: `Incorrect code. ${remaining} attempts remaining.` };
  }

  // Mark as verified
  await db
    .update(verificationCodes)
    .set({ verifiedAt: new Date() })
    .where(eq(verificationCodes.id, verification.id));

  // Find or create customer
  const isEmail = trimmed.includes("@");
  let [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenant.id),
        isEmail ? eq(customers.email, trimmed) : eq(customers.phone, trimmed),
        isNull(customers.deletedAt),
      )
    )
    .limit(1);

  if (!customer) {
    // Create new customer (auto-register)
    [customer] = await db
      .insert(customers)
      .values({
        tenantId: tenant.id,
        name: isEmail ? trimmed.split("@")[0] : trimmed,
        email: isEmail ? trimmed : null,
        phone: isEmail ? null : trimmed,
        isVerified: true,
        locale,
      })
      .returning();
  } else if (!customer.isVerified) {
    await db
      .update(customers)
      .set({ isVerified: true })
      .where(eq(customers.id, customer.id));
  }

  // Update last login
  await db
    .update(customers)
    .set({ lastLoginAt: new Date() })
    .where(eq(customers.id, customer.id));

  // Create session token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(customerSessions).values({
    customerId: customer.id,
    token,
    expiresAt,
  });

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("sf_customer_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return { success: true, customerId: customer.id };
}

// ============================================================
// Get current customer from session
// ============================================================

export async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sf_customer_session")?.value;
  if (!token) return null;

  const [session] = await db
    .select()
    .from(customerSessions)
    .where(
      and(
        eq(customerSessions.token, token),
        sql`${customerSessions.expiresAt} > now()`,
      )
    )
    .limit(1);

  if (!session) return null;

  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      locale: customers.locale,
    })
    .from(customers)
    .where(and(eq(customers.id, session.customerId), isNull(customers.deletedAt)))
    .limit(1);

  return customer ?? null;
}

// ============================================================
// Logout
// ============================================================

export async function logout(locale: string = "tc") {
  const cookieStore = await cookies();
  const token = cookieStore.get("sf_customer_session")?.value;

  if (token) {
    await db.delete(customerSessions).where(eq(customerSessions.token, token));
    cookieStore.delete("sf_customer_session");
  }

  redirect(`/${locale}`);
}
