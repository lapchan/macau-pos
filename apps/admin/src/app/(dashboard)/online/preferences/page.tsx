import { getBranding } from "@/lib/actions/storefront-actions";
import PreferencesClient from "./preferences-client";

export const metadata = { title: "Store Preferences" };

export default async function PreferencesPage() {
  let config = { branding: {}, header: {}, footer: {} };
  try {
    config = await getBranding();
  } catch (error) {
    console.error("Failed to load preferences:", error);
  }
  return <PreferencesClient initialConfig={config} />;
}
