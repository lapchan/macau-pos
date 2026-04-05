import { getBranding } from "@/lib/actions/storefront-actions";
import SettingsClient from "./settings-client";

export const metadata = { title: "Theme Settings" };

export default async function ThemeSettingsPage() {
  let config = { branding: {}, header: {}, footer: {} };
  try {
    config = await getBranding();
  } catch (error) {
    console.error("Failed to load branding:", error);
  }
  return <SettingsClient initialConfig={config} />;
}
