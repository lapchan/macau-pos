"use client";

import { cn } from "@/lib/cn";
import {
  Coffee, Cookie, Milk, Apple, Cherry, Pizza,
  IceCreamCone, Wine, Beer, CupSoda, Utensils, Cake,
  Home, Lamp, Shirt, Scissors, SprayCan,
  Heart, Pill, Baby, Sun, Leaf, Flower2,
  ShoppingBag, Package, Gift, Tag, Star, Zap,
  Snowflake, Sparkles, Flame, Box, Gem, Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: { name: string; icon: LucideIcon }[] = [
  // Food & Drink
  { name: "Coffee", icon: Coffee },
  { name: "Cookie", icon: Cookie },
  { name: "Milk", icon: Milk },
  { name: "Apple", icon: Apple },
  { name: "Cherry", icon: Cherry },
  { name: "Pizza", icon: Pizza },
  { name: "IceCreamCone", icon: IceCreamCone },
  { name: "Wine", icon: Wine },
  { name: "Beer", icon: Beer },
  { name: "CupSoda", icon: CupSoda },
  { name: "Utensils", icon: Utensils },
  { name: "Cake", icon: Cake },
  // Household
  { name: "Home", icon: Home },
  { name: "Lamp", icon: Lamp },
  { name: "Shirt", icon: Shirt },
  { name: "Scissors", icon: Scissors },
  { name: "SprayCan", icon: SprayCan },
  // Health & Care
  { name: "Heart", icon: Heart },
  { name: "Pill", icon: Pill },
  { name: "Baby", icon: Baby },
  { name: "Sun", icon: Sun },
  { name: "Leaf", icon: Leaf },
  { name: "Flower2", icon: Flower2 },
  // Retail
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "Package", icon: Package },
  { name: "Gift", icon: Gift },
  { name: "Tag", icon: Tag },
  { name: "Star", icon: Star },
  { name: "Zap", icon: Zap },
  { name: "Snowflake", icon: Snowflake },
  { name: "Sparkles", icon: Sparkles },
  { name: "Flame", icon: Flame },
  { name: "Box", icon: Box },
  { name: "Gem", icon: Gem },
  { name: "Palette", icon: Palette },
];

// Lookup helper for rendering icons by name
export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICONS.map((i) => [i.name, i.icon])
);

type Props = {
  value: string | null;
  onChange: (icon: string) => void;
};

export default function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ICONS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          aria-label={name}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-[var(--radius-sm)] transition-all",
            value === name
              ? "bg-accent text-white ring-2 ring-accent/30"
              : "bg-surface-hover text-text-secondary hover:bg-border hover:text-text-primary"
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
