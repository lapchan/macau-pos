import { getBranding } from "@/lib/actions/storefront-actions";
import NavigationClient from "./navigation-client";

export const metadata = { title: "Navigation" };

export default async function NavigationPage() {
  let config = { branding: {}, header: {}, footer: {} };
  try {
    config = await getBranding();
  } catch (error) {
    console.error("Failed to load navigation:", error);
  }
  return <NavigationClient initialConfig={config} />;
}
