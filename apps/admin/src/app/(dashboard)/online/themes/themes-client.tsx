"use client";

import { useState } from "react";
import { ArrowLeftIcon, CheckIcon, EyeIcon } from "lucide-react";
import { applyTheme } from "@/lib/actions/theme-actions";

type ThemeCard = {
  id: string;
  name: string;
  description: string;
  colors: { accent: string; bg: string; surface: string; text: string };
  fontLabel: string;
  headerStyle: string;
  radiusLabel: string;
};

const THEMES: ThemeCard[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary with indigo accents. Dark navigation, rounded corners.",
    colors: { accent: "#4f46e5", bg: "#ffffff", surface: "#f8f9fa", text: "#212529" },
    fontLabel: "Inter",
    headerStyle: "Dark",
    radiusLabel: "Rounded",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless elegance with sharp corners and a light header. Clean and professional.",
    colors: { accent: "#1a1a1a", bg: "#ffffff", surface: "#fafafa", text: "#111111" },
    fontLabel: "System",
    headerStyle: "Light",
    radiusLabel: "Sharp",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Vibrant red accents with large rounded corners. Eye-catching and energetic.",
    colors: { accent: "#dc2626", bg: "#ffffff", surface: "#fef2f2", text: "#1a1a1a" },
    fontLabel: "DM Sans",
    headerStyle: "Dark",
    radiusLabel: "Extra Round",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Less is more. Clean product focus with subtle gray accents and light header.",
    colors: { accent: "#6b7280", bg: "#ffffff", surface: "#f9fafb", text: "#374151" },
    fontLabel: "Inter",
    headerStyle: "Light",
    radiusLabel: "Subtle",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Amber accents with a cozy, welcoming feel. Perfect for lifestyle and food stores.",
    colors: { accent: "#b45309", bg: "#fffbeb", surface: "#fef3c7", text: "#451a03" },
    fontLabel: "System",
    headerStyle: "Light",
    radiusLabel: "Rounded",
  },
];

export default function ThemesClient({ currentThemeId }: { currentThemeId: string }) {
  const [activeTheme, setActiveTheme] = useState(currentThemeId);
  const [applying, setApplying] = useState<string | null>(null);
  const [confirmTheme, setConfirmTheme] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleApply = async (themeId: string) => {
    setApplying(themeId);
    setConfirmTheme(null);
    const result = await applyTheme(themeId);
    setApplying(null);
    if (result.success) {
      setActiveTheme(themeId);
      setToast({ type: "success", message: `Theme "${THEMES.find(t => t.id === themeId)?.name}" applied! Visit your store to see changes.` });
    } else {
      setToast({ type: "error", message: result.error || "Failed to apply theme" });
    }
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/online" className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
            <ArrowLeftIcon size={20} />
          </a>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Themes</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Choose a theme for your online storefront
            </p>
          </div>
        </div>
        <a
          href="http://localhost:3300/tc"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
        >
          <EyeIcon size={16} />
          View Store
        </a>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      )}

      {/* Current theme indicator */}
      <div className="rounded-lg bg-[var(--bg-surface)] px-4 py-3">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Current theme: <span className="font-semibold text-[var(--text-primary)]">{THEMES.find(t => t.id === activeTheme)?.name || activeTheme}</span>
        </p>
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((theme) => {
          const isCurrent = theme.id === activeTheme;
          const isApplying = applying === theme.id;

          return (
            <div
              key={theme.id}
              className={`relative overflow-hidden rounded-xl border-2 transition-colors ${isCurrent ? "border-[var(--accent)] shadow-md" : "border-[var(--border-default)] hover:border-gray-300"}`}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-white">
                  <CheckIcon size={12} />
                  Current
                </div>
              )}

              {/* Theme preview */}
              <div className="relative h-40 overflow-hidden" style={{ backgroundColor: theme.colors.surface }}>
                {/* Mini mockup */}
                <div className="absolute inset-x-4 top-4 bottom-0 overflow-hidden rounded-t-lg shadow-sm" style={{ backgroundColor: theme.colors.bg }}>
                  {/* Mini header */}
                  <div className="h-6 flex items-center px-3" style={{ backgroundColor: theme.headerStyle === "Dark" ? "#1f2937" : theme.colors.bg, borderBottom: theme.headerStyle === "Light" ? "1px solid #e5e7eb" : "none" }}>
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                    <div className="ml-auto flex gap-1.5">
                      <div className="h-1.5 w-6 rounded-full bg-gray-300" />
                      <div className="h-1.5 w-6 rounded-full bg-gray-300" />
                    </div>
                  </div>
                  {/* Mini hero */}
                  <div className="mx-3 mt-3 h-14 rounded flex items-center justify-center" style={{ backgroundColor: theme.colors.accent + "15" }}>
                    <div className="h-2 w-20 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                  </div>
                  {/* Mini product grid */}
                  <div className="mx-3 mt-2 grid grid-cols-3 gap-1.5">
                    <div className="h-8 rounded" style={{ backgroundColor: theme.colors.surface }} />
                    <div className="h-8 rounded" style={{ backgroundColor: theme.colors.surface }} />
                    <div className="h-8 rounded" style={{ backgroundColor: theme.colors.surface }} />
                  </div>
                </div>
              </div>

              {/* Theme info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{theme.name}</h3>
                  {/* Color dots */}
                  <div className="flex gap-1.5">
                    <span className="size-4 rounded-full border border-gray-200" style={{ backgroundColor: theme.colors.accent }} />
                    <span className="size-4 rounded-full border border-gray-200" style={{ backgroundColor: theme.colors.bg }} />
                    <span className="size-4 rounded-full border border-gray-200" style={{ backgroundColor: theme.colors.surface }} />
                  </div>
                </div>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)] line-clamp-2">{theme.description}</p>

                {/* Details */}
                <div className="mt-3 flex gap-3 text-[11px] text-[var(--text-secondary)]">
                  <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5">{theme.fontLabel}</span>
                  <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5">{theme.headerStyle} Nav</span>
                  <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5">{theme.radiusLabel}</span>
                </div>

                {/* Apply button */}
                <div className="mt-4">
                  {isCurrent ? (
                    <button disabled className="w-full rounded-lg bg-[var(--bg-surface)] py-2 text-[13px] font-medium text-[var(--text-secondary)]">
                      Active Theme
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmTheme(theme.id)}
                      disabled={isApplying}
                      className="w-full rounded-lg bg-[var(--accent)] py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                      {isApplying ? "Applying..." : "Apply Theme"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      {confirmTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setConfirmTheme(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Apply theme?</h3>
            <p className="mt-2 text-sm text-gray-500">
              This will update your store's colors, fonts, and reset homepage sections to the theme defaults. Your custom section data will be replaced.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmTheme(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApply(confirmTheme)}
                className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
