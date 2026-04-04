import { getShopSettings } from "@/lib/queries";
import SettingsClient from "./settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  let settings = await getShopSettings().catch((error) => {
    console.error("Failed to fetch settings:", error);
    return null;
  });
  return <SettingsClient settings={settings} />;
}
