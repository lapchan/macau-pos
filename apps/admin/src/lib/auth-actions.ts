"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  loginWithEmailPassword,
  loginWithPhonePassword,
  getSession,
  deleteSession,
} from "@macau-pos/database";

const COOKIE_NAME = "pos_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const identifier = (formData.get("identifier") as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Please enter your email/phone and password" };
  }

  // Determine if identifier is email or phone
  const isEmail = identifier.includes("@");
  const result = isEmail
    ? await loginWithEmailPassword(identifier, password)
    : await loginWithPhonePassword(identifier, password);

  if ("error" in result) {
    return { error: result.error };
  }

  // Check role — only admin-allowed roles (cashier role = POS only, no admin access)
  const allowedAdminRoles = [
    "platform_admin",
    "merchant_owner",
    "accountant",
  ];
  if (!allowedAdminRoles.includes(result.user.userRole)) {
    await deleteSession(result.token);
    return { error: "Access denied. This account cannot access the admin panel." };
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/");
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

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await getSession(token);
  return session;
}
