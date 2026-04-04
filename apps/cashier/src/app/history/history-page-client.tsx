"use client";

import { useRouter } from "next/navigation";
import HistorySheet from "@/components/history/history-sheet";
import type { Locale } from "@/i18n/locales";

type Props = {
  locale: Locale;
  shiftId: string | null;
};

export default function HistoryPageClient({ locale, shiftId }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-pos-bg">
      <HistorySheet
        open={true}
        onClose={() => router.push("/")}
        shiftId={shiftId}
        locale={locale}
      />
    </div>
  );
}
