import { NextRequest, NextResponse } from "next/server";
import { db, terminals, eq } from "@macau-pos/database";

export async function POST(request: NextRequest) {
  try {
    const { terminalId } = await request.json();

    if (!terminalId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Fetch terminal to check status before updating heartbeat
    const [terminal] = await db
      .select({
        id: terminals.id,
        name: terminals.name,
        status: terminals.status,
        activatedAt: terminals.activatedAt,
      })
      .from(terminals)
      .where(eq(terminals.id, terminalId))
      .limit(1);

    if (!terminal) {
      return NextResponse.json({ success: false, error: "not-found" });
    }

    // Terminal was unlinked — don't update heartbeat
    if (!terminal.activatedAt) {
      return NextResponse.json({ success: false, error: "unlinked" });
    }

    // Terminal was disabled
    if (terminal.status === "disabled") {
      return NextResponse.json({
        success: false,
        error: "disabled",
        terminalName: terminal.name,
      });
    }

    // All good — update heartbeat
    await db
      .update(terminals)
      .set({ lastHeartbeatAt: new Date() })
      .where(eq(terminals.id, terminalId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
