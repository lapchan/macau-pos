import { NextRequest, NextResponse } from "next/server";
import { db, terminals, eq } from "@macau-pos/database";

export async function POST(request: NextRequest) {
  try {
    const { terminalId } = await request.json();

    if (!terminalId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await db
      .update(terminals)
      .set({ lastHeartbeatAt: new Date() })
      .where(eq(terminals.id, terminalId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
