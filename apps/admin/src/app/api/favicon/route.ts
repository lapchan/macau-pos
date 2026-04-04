import { NextRequest, NextResponse } from "next/server";

/**
 * Auto-generate a favicon SVG from tenant initials + accent color.
 * Usage: /api/favicon?name=CountingStars&color=%234f6ef7
 * Returns an SVG that works as a favicon.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") || "RS";
  const color = searchParams.get("color") || "#4f6ef7";

  // Extract initials (first 2 chars of first 2 words, or first 2 chars)
  const initials = getInitials(name);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="${escapeHtml(color)}"/>
  <text x="16" y="21" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="700" font-size="14" fill="white">${escapeHtml(initials)}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  // CamelCase: "CountingStars" → "CS"
  const camelMatch = name.match(/[A-Z]/g);
  if (camelMatch && camelMatch.length >= 2) {
    return (camelMatch[0] + camelMatch[1]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
