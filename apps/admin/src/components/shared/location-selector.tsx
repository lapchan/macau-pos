"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { setSelectedLocation } from "@/lib/location-actions";

export type LocationOption = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
};

interface LocationSelectorProps {
  locations: LocationOption[];
  selectedLocationId: string | null;
}

export function LocationSelector({ locations, selectedLocationId }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open]);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const label = selectedLocation ? selectedLocation.name : "All Locations";

  function handleSelect(locationId: string | null) {
    setOpen(false);
    startTransition(async () => {
      await setSelectedLocation(locationId);
      router.refresh();
    });
  }

  // Don't render if only 1 location
  if (locations.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-lg",
          "text-sm font-medium text-text-secondary",
          "border border-border bg-surface hover:bg-surface-hover",
          "transition-colors",
          isPending && "opacity-60"
        )}
      >
        <MapPin className="h-4 w-4 text-text-tertiary" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[220px] rounded-lg border border-border bg-surface shadow-lg z-50">
          <div className="py-1">
            {/* "All Locations" option */}
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                "hover:bg-surface-hover transition-colors",
                !selectedLocationId && "text-accent font-medium"
              )}
            >
              <MapPin className="h-4 w-4 text-text-tertiary" />
              <span className="flex-1">All Locations</span>
              {!selectedLocationId && <Check className="h-4 w-4 text-accent" />}
            </button>

            <div className="h-px bg-border mx-2 my-1" />

            {/* Individual locations */}
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelect(location.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                  "hover:bg-surface-hover transition-colors",
                  selectedLocationId === location.id && "text-accent font-medium"
                )}
              >
                <span className="text-xs text-text-tertiary font-mono w-8">{location.code}</span>
                <span className="flex-1">{location.name}</span>
                {selectedLocationId === location.id && <Check className="h-4 w-4 text-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
