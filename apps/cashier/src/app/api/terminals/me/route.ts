import { NextRequest, NextResponse } from "next/server";
import { db, terminals, eq } from "@macau-pos/database";

export async function GET(request: NextRequest) {
  const terminalId = request.nextUrl.searchParams.get("id");

  if (!terminalId) {
    return NextResponse.json({ success: false, error: "Missing terminal ID" }, { status: 400 });
  }

  try {
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
      return NextResponse.json({ success: false, error: "Terminal not found" }, { status: 404 });
    }

    if (terminal.status === "disabled") {
      return NextResponse.json({
        success: false,
        error: "disabled",
        terminalName: terminal.name,
      });
    }

    return NextResponse.json({
      success: true,
      terminalId: terminal.id,
      terminalName: terminal.name,
      status: terminal.status,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
