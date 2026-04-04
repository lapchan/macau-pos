import { NextRequest, NextResponse } from "next/server";
import { db, terminals, eq, and, isNull } from "@macau-pos/database";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { code, deviceInfo } = await request.json();

    if (!code || typeof code !== "string" || code.length < 4) {
      return NextResponse.json(
        { success: false, error: "Invalid activation code" },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // Find terminal by activation code
    const [terminal] = await db
      .select({
        id: terminals.id,
        name: terminals.name,
        tenantId: terminals.tenantId,
        activatedAt: terminals.activatedAt,
        status: terminals.status,
      })
      .from(terminals)
      .where(eq(terminals.activationCode, normalizedCode))
      .limit(1);

    if (!terminal) {
      return NextResponse.json(
        { success: false, error: "Invalid code. Please check and try again." },
        { status: 404 }
      );
    }

    if (terminal.status === "disabled") {
      return NextResponse.json(
        { success: false, error: "This terminal has been disabled by the administrator." },
        { status: 403 }
      );
    }

    // Activate: set activated_at, store device info, clear activation code
    await db
      .update(terminals)
      .set({
        activatedAt: new Date(),
        deviceInfo: deviceInfo || {},
        activationCode: null, // Clear code — one-time use
        lastHeartbeatAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(terminals.id, terminal.id));

    return NextResponse.json({
      success: true,
      terminalId: terminal.id,
      terminalName: terminal.name,
      tenantId: terminal.tenantId,
    });
  } catch (err) {
    console.error("Terminal activation error:", err);
    return NextResponse.json(
      { success: false, error: "Activation failed" },
      { status: 500 }
    );
  }
}
