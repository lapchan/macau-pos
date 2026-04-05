"use server";

import {
  db,
  storefrontConfigs,
  eq,
  and,
  isNull,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "../auth-actions";

// Theme presets — duplicated from storefront to avoid cross-app imports
// In production, this would be a shared package
type ThemeBranding = {
  themeId: string;
  accentColor: string;
  fontFamily: string;
  headerStyle: string;
  borderRadius: string;
};

type ThemePreset = {
  id: string;
  name: string;
  branding: ThemeBranding;
  defaultSections: any[];
};

const THEMES: Record<string, ThemePreset> = {
  modern: {
    id: "modern", name: "Modern",
    branding: { themeId: "modern", accentColor: "#4f46e5", fontFamily: "inter", headerStyle: "dark", borderRadius: "md" },
    defaultSections: [], // Will be populated from storefront themes.ts at runtime
  },
  classic: {
    id: "classic", name: "Classic",
    branding: { themeId: "classic", accentColor: "#1a1a1a", fontFamily: "system", headerStyle: "light", borderRadius: "none" },
    defaultSections: [],
  },
  bold: {
    id: "bold", name: "Bold",
    branding: { themeId: "bold", accentColor: "#dc2626", fontFamily: "dm-sans", headerStyle: "dark", borderRadius: "lg" },
    defaultSections: [],
  },
  minimal: {
    id: "minimal", name: "Minimal",
    branding: { themeId: "minimal", accentColor: "#6b7280", fontFamily: "inter", headerStyle: "light", borderRadius: "sm" },
    defaultSections: [],
  },
  warm: {
    id: "warm", name: "Warm",
    branding: { themeId: "warm", accentColor: "#b45309", fontFamily: "system", headerStyle: "light", borderRadius: "md" },
    defaultSections: [],
  },
};

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("Unauthorized");
  return session.tenantId;
}

export async function getCurrentThemeId(): Promise<string> {
  const tenantId = await requireTenantId();
  const [config] = await db
    .select({ branding: storefrontConfigs.branding })
    .from(storefrontConfigs)
    .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
    .limit(1);

  const branding = config?.branding as Record<string, unknown> | null;
  return (branding?.themeId as string) || "modern";
}

export async function applyTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await requireTenantId();
    const theme = THEMES[themeId];
    if (!theme) return { success: false, error: "Theme not found" };

    // Check if config row exists
    const [existing] = await db
      .select({ id: storefrontConfigs.id })
      .from(storefrontConfigs)
      .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
      .limit(1);

    if (existing) {
      await db
        .update(storefrontConfigs)
        .set({
          branding: theme.branding,
          homepageSections: [], // Clear custom sections so theme defaults take over via merge logic
          updatedAt: new Date(),
        })
        .where(eq(storefrontConfigs.id, existing.id));
    } else {
      await db.insert(storefrontConfigs).values({
        tenantId,
        locationId: null,
        branding: theme.branding,
        header: {},
        homepageSections: [],
        footer: {},
      });
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to apply theme:", error);
    return { success: false, error: "Failed to apply theme" };
  }
}
