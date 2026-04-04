"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { EmptyState } from "@/components/shared/empty-state";
import BottomSheet from "@/components/shared/bottom-sheet";
import { createStrategy } from "@/lib/pricing-strategy-actions";
import type { StrategyRow } from "@/lib/pricing-strategy-queries";
import {
  DollarSign,
  Plus,
  MapPin,
  Package,
  ChevronRight,
  X,
} from "lucide-react";

interface Props {
  strategies: StrategyRow[];
}

export default function StrategiesClient({ strategies }: Props) {
  const { locale } = useLocale();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createStrategy(formData);
      if (result.success) {
        setShowAdd(false);
        router.refresh();
        if (result.data?.id) {
          router.push(`/pricing-strategies/${result.data.id}`);
        }
      }
    });
  }

  return (
    <div>
      <PageHeader title="Pricing Strategies" subtitle="Manage product pricing and availability per location">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          New Strategy
        </button>
      </PageHeader>

      {/* Create Strategy — BottomSheet */}
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
              New Pricing Strategy
            </h2>
            <button
              type="submit"
              form="add-strategy-form"
              disabled={isPending}
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isPending ? "..." : "Create"}
            </button>
          </div>
        }
      >
        <form id="add-strategy-form" action={handleCreate} className="px-4 py-5 space-y-5 max-w-lg mx-auto">
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Name <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Airport Premium"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              Description
            </label>
            <input
              name="description"
              placeholder="Optional description"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
        </form>
      </BottomSheet>

      {/* List */}
      {strategies.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No pricing strategies"
          description="Create a pricing strategy to customize product prices and availability per location"
        />
      ) : (
        <div className="space-y-3">
          {strategies.map((strategy) => (
            <Link
              key={strategy.id}
              href={`/pricing-strategies/${strategy.id}`}
              className="block"
            >
              <Card className="hover:border-accent/30 transition-colors cursor-pointer">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      strategy.isActive ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400"
                    )}>
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{strategy.name}</h3>
                      {strategy.description && (
                        <p className="text-xs text-text-tertiary mt-0.5">{strategy.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
                          <Package className="h-3 w-3" />
                          {strategy.itemCount} overrides
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
                          <MapPin className="h-3 w-3" />
                          {strategy.locationCount} locations
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
