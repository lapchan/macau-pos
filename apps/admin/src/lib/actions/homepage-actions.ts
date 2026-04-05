"use server";

import {
  db,
  storefrontConfigs,
  eq,
  and,
  isNull,
  sql,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "../auth-actions";

type SectionConfig = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("Unauthorized");
  return session.tenantId;
}

export async function getHomepageSections(): Promise<SectionConfig[]> {
  const tenantId = await requireTenantId();

  const [config] = await db
    .select({ homepageSections: storefrontConfigs.homepageSections })
    .from(storefrontConfigs)
    .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
    .limit(1);

  return (config?.homepageSections as SectionConfig[]) || [];
}

export async function saveHomepageSections(
  sections: SectionConfig[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await requireTenantId();

    // Check if config row exists
    const [existing] = await db
      .select({ id: storefrontConfigs.id })
      .from(storefrontConfigs)
      .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
      .limit(1);

    if (existing) {
      await db
        .update(storefrontConfigs)
        .set({ homepageSections: sections, updatedAt: new Date() })
        .where(eq(storefrontConfigs.id, existing.id));
    } else {
      await db.insert(storefrontConfigs).values({
        tenantId,
        locationId: null,
        branding: {},
        header: {},
        homepageSections: sections,
        footer: {},
      });
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to save homepage sections:", error);
    return { success: false, error: "Failed to save" };
  }
}
