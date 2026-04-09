import { cookies } from "next/headers";
import { deleteSession } from "@macau-pos/database";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "pos_session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Delete cookie immediately — don't wait for DB
  cookieStore.delete(COOKIE_NAME);

  // Delete session from DB in background (non-blocking)
  if (token) {
    deleteSession(token).catch(() => {});
  }

  const accept = request.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: NextRequest) {
  return POST(request);
}
