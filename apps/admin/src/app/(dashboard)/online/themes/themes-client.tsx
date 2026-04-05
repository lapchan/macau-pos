"use client";

import { useState } from "react";
import { ArrowLeftIcon, CheckCircleIcon, EyeIcon, PaletteIcon } from "lucide-react";
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
  { id: "modern", name: "Modern", description: "Clean and contemporary with indigo accents. Dark navigation, rounded corners.", colors: { accent: "#4f46e5", bg: "#ffffff", surface: "#f8f9fa", text: "#212529" }, fontLabel: "Inter", headerStyle: "Dark", radiusLabel: "Rounded" },
  { id: "classic", name: "Classic", description: "Timeless elegance with sharp corners and a light header. Clean and professional.", colors: { accent: "#1a1a1a", bg: "#ffffff", surface: "#fafafa", text: "#111111" }, fontLabel: "System", headerStyle: "Light", radiusLabel: "Sharp" },
  { id: "bold", name: "Bold", description: "Vibrant red accents with large rounded corners. Eye-catching and energetic.", colors: { accent: "#dc2626", bg: "#ffffff", surface: "#fef2f2", text: "#1a1a1a" }, fontLabel: "DM Sans", headerStyle: "Dark", radiusLabel: "Extra Round" },
  { id: "minimal", name: "Minimal", description: "Less is more. Clean product focus with subtle gray accents and light header.", colors: { accent: "#6b7280", bg: "#ffffff", surface: "#f9fafb", text: "#374151" }, fontLabel: "Inter", headerStyle: "Light", radiusLabel: "Subtle" },
  { id: "warm", name: "Warm", description: "Amber accents with a cozy, welcoming feel. Perfect for lifestyle and food stores.", colors: { accent: "#b45309", bg: "#fffbeb", surface: "#fef3c7", text: "#451a03" }, fontLabel: "System", headerStyle: "Light", radiusLabel: "Rounded" },
];

function ThemePreview({ theme, size = "sm" }: { theme: ThemeCard; size?: "sm" | "lg" }) {
  const h = size === "lg" ? "h-52" : "h-36";
  return (
    <div className={`${h} w-full overflow-hidden rounded-lg`} style={{ backgroundColor: theme.colors.surface }}>
      <div className="mx-auto h-full max-w-[90%] pt-3">
        <div className="h-full overflow-hidden rounded-t-md shadow-sm" style={{ backgroundColor: theme.colors.bg }}>
          {/* Mini header */}
          <div className="flex h-5 items-center px-2.5" style={{ backgroundColor: theme.headerStyle === "Dark" ? "#1f2937" : theme.colors.bg, borderBottom: theme.headerStyle === "Light" ? "1px solid #e5e7eb" : "none" }}>
            <div className="size-2 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
            <div className="ml-auto flex gap-1">
              <div className="h-1 w-5 rounded-full bg-gray-300" />
              <div className="h-1 w-5 rounded-full bg-gray-300" />
              <div className="h-1 w-5 rounded-full bg-gray-300" />
            </div>
          </div>
          {/* Mini hero */}
          <div className="mx-2.5 mt-2 flex h-12 items-center justify-center rounded" style={{ backgroundColor: theme.colors.accent + "18" }}>
            <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
          </div>
          {/* Mini product grid */}
          <div className="mx-2.5 mt-1.5 grid grid-cols-3 gap-1">
            <div className="h-6 rounded" style={{ backgroundColor: theme.colors.surface }} />
            <div className="h-6 rounded" style={{ backgroundColor: theme.colors.surface }} />
            <div className="h-6 rounded" style={{ backgroundColor: theme.colors.surface }} />
          </div>
          <div className="mx-2.5 mt-1 grid grid-cols-3 gap-1">
            <div className="h-1 rounded-full bg-gray-200" />
            <div className="h-1 rounded-full bg-gray-200" />
            <div className="h-1 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemesClient({ currentThemeId }: { currentThemeId: string }) {
  const [activeTheme, setActiveTheme] = useState(currentThemeId);
  const [applying, setApplying] = useState<string | null>(null);
  const [confirmTheme, setConfirmTheme] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const currentTheme = THEMES.find((t) => t.id === activeTheme) || THEMES[0];
  const otherThemes = THEMES.filter((t) => t.id !== activeTheme);

  const handleApply = async (themeId: string) => {
    setApplying(themeId);
    setConfirmTheme(null);
    const result = await applyTheme(themeId);
    setApplying(null);
    if (result.success) {
      setActiveTheme(themeId);
      setToast({ type: "success", message: `Theme "${THEMES.find(t => t.id === themeId)?.name}" applied!` });
    } else {
      setToast({ type: "error", message: result.error || "Failed to apply theme" });
    }
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/online" className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
            <ArrowLeftIcon size={20} />
          </a>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Themes</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">Choose a theme for your online storefront</p>
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

      {/* ============================================================ */}
      {/* Current theme — large card (Shopify style)                   */}
      {/* ============================================================ */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
        {/* Large preview */}
        <ThemePreview theme={currentTheme} size="lg" />

        {/* Info row */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{currentTheme.name}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                <CheckCircleIcon size={12} />
                Current theme
              </span>
            </div>
            {/* Color dots */}
            <div className="flex gap-1 ml-3">
              <span className="size-3.5 rounded-full border border-gray-200" style={{ backgroundColor: currentTheme.colors.accent }} />
              <span className="size-3.5 rounded-full border border-gray-200" style={{ backgroundColor: currentTheme.colors.bg }} />
              <span className="size-3.5 rounded-full border border-gray-200" style={{ backgroundColor: currentTheme.colors.surface }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/online/homepage"
              className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            >
              Customize
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Theme library — grid of other themes                         */}
      {/* ============================================================ */}
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Theme library</h2>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Switching themes will update your store&apos;s colors, fonts, and homepage layout.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {otherThemes.map((theme) => {
            const isApplying = applying === theme.id;
            return (
              <div key={theme.id} className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
                <ThemePreview theme={theme} />
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{theme.name}</h3>
                      <div className="flex gap-1">
                        <span className="size-3 rounded-full border border-gray-200" style={{ backgroundColor: theme.colors.accent }} />
                        <span className="size-3 rounded-full border border-gray-200" style={{ backgroundColor: theme.colors.surface }} />
                      </div>
                    </div>
                    <div className="mt-1 flex gap-2 text-[11px] text-[var(--text-secondary)]">
                      <span>{theme.fontLabel}</span>
                      <span>·</span>
                      <span>{theme.headerStyle} Nav</span>
                      <span>·</span>
                      <span>{theme.radiusLabel}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmTheme(theme.id)}
                    disabled={isApplying}
                    className="rounded-lg border border-[var(--border-default)] px-4 py-1.5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-50"
                  >
                    {isApplying ? "..." : "Apply"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Confirmation dialog                                          */}
      {/* ============================================================ */}
      {confirmTheme && (() => {
        const theme = THEMES.find((t) => t.id === confirmTheme);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30" onClick={() => setConfirmTheme(null)} />
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
              {/* Preview strip */}
              {theme && (
                <div className="h-3" style={{ backgroundColor: theme.colors.accent }} />
              )}
              <div className="p-6">
                <h3 className="text-base font-semibold text-gray-900">
                  Switch to {theme?.name}?
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  This will update your store&apos;s colors, fonts, and reset homepage sections to the theme defaults.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setConfirmTheme(null)}
                    className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApply(confirmTheme)}
                    disabled={!!applying}
                    className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: theme?.colors.accent || "#4f46e5" }}
                  >
                    {applying ? "Applying..." : "Apply Theme"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
