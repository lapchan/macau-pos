import { NextRequest, NextResponse } from "next/server";
import { db, users, eq } from "@macau-pos/database";
import { verifyPassword } from "@macau-pos/database";

/**
 * POST /api/verify-pin
 * Verifies a user's PIN for screen unlock. Does NOT create a session.
 */
export async function POST(request: NextRequest) {
  try {
    const { pin, userId } = await request.json();

    if (!pin || !userId || pin.length < 4) {
      return NextResponse.json({ success: false, error: "Invalid PIN" });
    }

    const [user] = await db
      .select({ pin: users.pin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.pin) {
      return NextResponse.json({ success: false, error: "PIN not set" });
    }

    const valid = await verifyPassword(pin, user.pin);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid PIN" });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
