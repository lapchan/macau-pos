"use server";

import {
  db,
  storefrontConfigs,
  storefrontPages,
  eq,
  and,
  isNull,
  asc,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "../auth-actions";

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("Unauthorized");
  return session.tenantId;
}

// ============================================================
// Theme Settings (branding)
// ============================================================

export async function getBranding() {
  const tenantId = await requireTenantId();
  const [config] = await db
    .select({ branding: storefrontConfigs.branding, header: storefrontConfigs.header, footer: storefrontConfigs.footer })
    .from(storefrontConfigs)
    .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
    .limit(1);

  return {
    branding: (config?.branding as Record<string, unknown>) || {},
    header: (config?.header as Record<string, unknown>) || {},
    footer: (config?.footer as Record<string, unknown>) || {},
  };
}

export async function saveBranding(branding: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await requireTenantId();
    const [existing] = await db
      .select({ id: storefrontConfigs.id })
      .from(storefrontConfigs)
      .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
      .limit(1);

    if (existing) {
      await db.update(storefrontConfigs).set({ branding, updatedAt: new Date() }).where(eq(storefrontConfigs.id, existing.id));
    } else {
      await db.insert(storefrontConfigs).values({ tenantId, branding, header: {}, homepageSections: [], footer: {} });
    }
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to save" };
  }
}

// ============================================================
// Pages CRUD
// ============================================================

export async function getPages() {
  const tenantId = await requireTenantId();
  return db
    .select()
    .from(storefrontPages)
    .where(eq(storefrontPages.tenantId, tenantId))
    .orderBy(asc(storefrontPages.sortOrder));
}

export async function getPageById(id: string) {
  const tenantId = await requireTenantId();
  const [page] = await db
    .select()
    .from(storefrontPages)
    .where(and(eq(storefrontPages.id, id), eq(storefrontPages.tenantId, tenantId)))
    .limit(1);
  return page || null;
}

export async function createPage(data: {
  title: string;
  slug: string;
  content: unknown[];
  metaDescription?: string;
  isPublished: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const tenantId = await requireTenantId();
    const [page] = await db.insert(storefrontPages).values({
      tenantId,
      title: data.title,
      slug: data.slug,
      content: data.content,
      metaDescription: data.metaDescription || null,
      isPublished: data.isPublished,
      sortOrder: 99,
    }).returning({ id: storefrontPages.id });
    revalidatePath("/", "layout");
    return { success: true, id: page.id };
  } catch (e: any) {
    if (e.message?.includes("unique") || e.code === "23505") {
      return { success: false, error: "A page with this slug already exists" };
    }
    return { success: false, error: "Failed to create page" };
  }
}

export async function updatePage(id: string, data: {
  title?: string;
  slug?: string;
  content?: unknown[];
  metaDescription?: string;
  isPublished?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await requireTenantId();
    await db.update(storefrontPages).set({
      ...data,
      updatedAt: new Date(),
    }).where(and(eq(storefrontPages.id, id), eq(storefrontPages.tenantId, tenantId)));
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e: any) {
    if (e.message?.includes("unique") || e.code === "23505") {
      return { success: false, error: "A page with this slug already exists" };
    }
    return { success: false, error: "Failed to update page" };
  }
}

export async function deletePage(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await requireTenantId();
    await db.delete(storefrontPages).where(and(eq(storefrontPages.id, id), eq(storefrontPages.tenantId, tenantId)));
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete page" };
  }
}

// ============================================================
// Store Preferences
// ============================================================

export async function savePreferences(data: {
  branding?: Record<string, unknown>;
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await requireTenantId();
    const [existing] = await db
      .select({ id: storefrontConfigs.id, branding: storefrontConfigs.branding, header: storefrontConfigs.header, footer: storefrontConfigs.footer })
      .from(storefrontConfigs)
      .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
      .limit(1);

    const merged = {
      branding: { ...(existing?.branding as Record<string, unknown> || {}), ...(data.branding || {}) },
      header: { ...(existing?.header as Record<string, unknown> || {}), ...(data.header || {}) },
      footer: { ...(existing?.footer as Record<string, unknown> || {}), ...(data.footer || {}) },
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(storefrontConfigs).set(merged).where(eq(storefrontConfigs.id, existing.id));
    } else {
      await db.insert(storefrontConfigs).values({ tenantId, ...merged, homepageSections: [] });
    }
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save preferences" };
  }
}
