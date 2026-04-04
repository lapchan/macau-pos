import { getLocations } from "@/lib/location-queries";
import LocationsClient from "./locations-client";

export const metadata = { title: "Locations" };

export default async function LocationsPage() {
  let locationsList: Awaited<ReturnType<typeof getLocations>> = [];

  try {
    locationsList = await getLocations();
  } catch (error) {
    console.error("Failed to fetch locations:", error);
  }

  return <LocationsClient locations={locationsList} />;
}
