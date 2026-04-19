import { NextRequest, NextResponse } from "next/server";
import { db, terminals, eq } from "@macau-pos/database";
import { getBuildId } from "@/lib/build-id";

export async function POST(request: NextRequest) {
  try {
    const { terminalId } = await request.json();
    const buildId = getBuildId();

    if (!terminalId) {
      return NextResponse.json({ success: false, buildId }, { status: 400 });
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
      return NextResponse.json({ success: false, error: "not-found", buildId });
    }

    // Terminal was unlinked — don't update heartbeat
    if (!terminal.activatedAt) {
      return NextResponse.json({ success: false, error: "unlinked", buildId });
    }

    // Terminal was disabled
    if (terminal.status === "disabled") {
      return NextResponse.json({
        success: false,
        error: "disabled",
        terminalName: terminal.name,
        buildId,
      });
    }

    // All good — update heartbeat
    await db
      .update(terminals)
      .set({ lastHeartbeatAt: new Date() })
      .where(eq(terminals.id, terminalId));

    return NextResponse.json({ success: true, buildId });
  } catch {
    return NextResponse.json({ success: false, buildId: getBuildId() }, { status: 500 });
  }
}
