import { getCurrentThemeId } from "@/lib/actions/theme-actions";
import ThemesClient from "./themes-client";

export const metadata = { title: "Themes" };

export default async function ThemesPage() {
  let currentThemeId = "modern";
  try {
    currentThemeId = await getCurrentThemeId();
  } catch (error) {
    console.error("Failed to load current theme:", error);
  }
  return <ThemesClient currentThemeId={currentThemeId} />;
}
