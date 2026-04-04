import { getShopSettings } from "@/lib/queries";
import OnlineClient from "./online-client";

export const metadata = { title: "Online" };

export default async function OnlinePage() {
  let settings = null;
  try {
    settings = await getShopSettings();
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }
  return <OnlineClient settings={settings} />;
}
