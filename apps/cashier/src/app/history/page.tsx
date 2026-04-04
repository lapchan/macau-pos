import { getActiveShift } from "@/lib/shift-actions";
import { cookies } from "next/headers";
import type { Locale } from "@/i18n/locales";
import HistoryPageClient from "./history-page-client";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ shiftId?: string }>;
}) {
  const params = await searchParams;
  let shiftId = params.shiftId || null;

  // Resolve "current" to the actual active shift ID
  if (shiftId === "current") {
    const activeShift = await getActiveShift();
    shiftId = activeShift?.id || null;
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("pos-locale")?.value as Locale) || "tc";

  return <HistoryPageClient locale={locale} shiftId={shiftId} />;
}
