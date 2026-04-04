import { notFound } from "next/navigation";
import { getLocationDetail } from "@/lib/location-queries";
import { getStrategies } from "@/lib/pricing-strategy-queries";
import { ensureLocationSettings } from "@/lib/location-actions";
import LocationDetailClient from "./location-detail-client";

export const metadata = { title: "Location Details" };

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Ensure shop_settings row exists for this location
  await ensureLocationSettings(id);

  const [detail, strategies] = await Promise.all([
    getLocationDetail(id),
    getStrategies(),
  ]);
  if (!detail) notFound();

  return (
    <LocationDetailClient
      location={detail.location}
      settings={detail.settings}
      strategies={strategies}
    />
  );
}
