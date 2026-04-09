import { cookies } from "next/headers";
import { deleteSession } from "@macau-pos/database";
import { NextResponse } from "next/server";

const COOKIE_NAME = "pos_session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  cookieStore.delete(COOKIE_NAME);

  if (token) {
    deleteSession(token).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
