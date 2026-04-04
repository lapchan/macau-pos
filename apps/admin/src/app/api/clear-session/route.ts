import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession } from "@macau-pos/database";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pos_session")?.value;

  // Delete DB session if token exists
  if (token) {
    try {
      await deleteSession(token);
    } catch {
      // Ignore — session may already be gone
    }
  }

  cookieStore.delete("pos_session");
  cookieStore.delete("admin_session");
  return NextResponse.redirect(new URL("/login", "http://localhost:3100"));
}
