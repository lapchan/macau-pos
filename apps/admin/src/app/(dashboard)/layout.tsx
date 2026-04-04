import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-actions";
import { getLocations } from "@/lib/location-queries";
import { getSelectedLocationId } from "@/lib/location-actions";
import { DashboardShell } from "./dashboard-shell";

const ALLOWED_ADMIN_ROLES = ["platform_admin", "merchant_owner", "accountant"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  // No valid session (cookie stale or missing) or wrong role → clear via API route
  if (!session || !ALLOWED_ADMIN_ROLES.includes(session.userRole)) {
    redirect("/api/clear-session");
  }

  // Fetch locations for the location selector
  const [locationsList, selectedLocationId] = await Promise.all([
    getLocations(),
    getSelectedLocationId(),
  ]);

  return (
    <DashboardShell
      userName={session.userName}
      userRole={session.userRole}
      locations={locationsList.map((l) => ({
        id: l.id,
        name: l.name,
        code: l.code,
        isDefault: l.isDefault,
      }))}
      selectedLocationId={selectedLocationId}
    >
      {children}
    </DashboardShell>
  );
}
