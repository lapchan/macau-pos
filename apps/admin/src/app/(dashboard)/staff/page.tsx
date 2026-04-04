import { getStaffList } from "@/lib/queries";
import { getLocations } from "@/lib/location-queries";
import StaffClient from "./staff-client";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  let staff: Awaited<ReturnType<typeof getStaffList>> = [];
  let locationList: Awaited<ReturnType<typeof getLocations>> = [];

  try {
    [staff, locationList] = await Promise.all([getStaffList(), getLocations()]);
  } catch (error) {
    console.error("Failed to fetch staff:", error);
  }

  return <StaffClient staff={staff} locations={locationList} />;
}
