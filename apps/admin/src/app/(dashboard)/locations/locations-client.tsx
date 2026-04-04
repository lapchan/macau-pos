"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { EmptyState } from "@/components/shared/empty-state";
import BottomSheet from "@/components/shared/bottom-sheet";
import {
  MapPin,
  Plus,
  Phone,
  Mail,
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createLocation, toggleLocationActive } from "@/lib/location-actions";
import type { LocationRow } from "@/lib/location-queries";

interface LocationsClientProps {
  locations: LocationRow[];
}

export default function LocationsClient({ locations }: LocationsClientProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createLocation(formData);
      if (result.success) {
        setShowAdd(false);
        router.refresh();
      }
    });
  }

  function handleToggle(locationId: string, isActive: boolean) {
    startTransition(async () => {
      await toggleLocationActive(locationId, !isActive);
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        title={t(locale, "locations.title") || "Locations"}
        subtitle={t(locale, "locations.subtitle") || "Manage your physical store locations"}
      >
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          {t(locale, "locations.add") || "Add Location"}
        </button>
      </PageHeader>

      {/* Add Location — BottomSheet */}
      <BottomSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        header={
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-[15px] font-semibold text-text-primary">
              {t(locale, "locations.addNew") || "New Location"}
            </h2>
            <button
              type="submit"
              form="add-location-form"
              disabled={isPending}
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isPending ? "..." : t(locale, "common.save") || "Save"}
            </button>
          </div>
        }
      >
        <form id="add-location-form" action={handleCreate} className="px-4 py-5 space-y-5 max-w-lg mx-auto">
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "locations.nameLabel") || "Name"} <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Main Store"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Slug <span className="text-danger">*</span>
            </label>
            <input
              name="slug"
              required
              placeholder="e.g. main-store"
              pattern="[a-z0-9-]+"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "locations.addressLabel") || "Address"}
            </label>
            <input
              name="address"
              placeholder="Street address"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "locations.phoneLabel") || "Phone"}
            </label>
            <input
              name="phone"
              placeholder="+853 2800 0000"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "locations.emailLabel") || "Email"}
            </label>
            <input
              name="email"
              type="email"
              placeholder="store@example.mo"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
        </form>
      </BottomSheet>

      {/* Location List */}
      {locations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No locations yet"
          description="Create your first location to get started"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="relative">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      location.isActive ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400"
                    )}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{location.name}</h3>
                      <span className="text-xs text-text-tertiary font-mono">{location.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {location.isDefault && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                        Default
                      </span>
                    )}
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      location.isActive
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-gray-100 text-gray-500"
                    )}>
                      {location.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-text-secondary">
                  {location.address && (
                    <p className="truncate">{location.address}</p>
                  )}
                  {location.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-text-tertiary" />
                      <span>{location.phone}</span>
                    </div>
                  )}
                  {location.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-text-tertiary" />
                      <span>{location.email}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <Link
                    href={`/locations/${location.id}`}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Manage
                  </Link>
                  {!location.isDefault && (
                    <button
                      onClick={() => handleToggle(location.id, location.isActive)}
                      disabled={isPending}
                      className={cn(
                        "text-xs hover:underline",
                        location.isActive ? "text-amber-600" : "text-emerald-600"
                      )}
                    >
                      {location.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
