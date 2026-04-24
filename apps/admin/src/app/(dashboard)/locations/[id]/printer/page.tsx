import { notFound } from "next/navigation";
import { getLocationById } from "@/lib/location-queries";
import {
  getLocationPrinterStatus,
  type PrinterHealthSummary,
} from "@/lib/printer-actions";
import PrinterClient from "./printer-client";

export const metadata = { title: "Printer Settings" };

export default async function LocationPrinterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await getLocationById(id);
  if (!location) notFound();

  const status = await getLocationPrinterStatus(id);

  const initialRow = status.ok ? status.row : null;
  const initialHealth: PrinterHealthSummary | null = status.ok ? status.health : null;

  return (
    <PrinterClient
      locationId={id}
      locationName={location.name}
      locationSlug={location.slug}
      initialRow={initialRow}
      initialHealth={initialHealth}
    />
  );
}
