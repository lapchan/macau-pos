"use client";

import { useState } from "react";
import { ArrowLeftIcon, EyeIcon } from "lucide-react";
import { saveBranding } from "@/lib/actions/storefront-actions";

type Config = {
  branding: Record<string, unknown>;
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
};

export default function SettingsClient({ initialConfig }: { initialConfig: Config }) {
  const b = initialConfig.branding;
  const [accentColor, setAccentColor] = useState((b.accentColor as string) || "#4f46e5");
  const [fontFamily, setFontFamily] = useState((b.fontFamily as string) || "inter");
  const [headerStyle, setHeaderStyle] = useState((b.headerStyle as string) || "dark");
  const [borderRadius, setBorderRadius] = useState((b.borderRadius as string) || "md");
  const [logoUrl, setLogoUrl] = useState((b.logo as string) || "");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveBranding({
      ...(b as Record<string, unknown>),
      accentColor,
      fontFamily,
      headerStyle,
      borderRadius,
      logo: logoUrl || null,
    });
    setSaving(false);
    setToast(result.success
      ? { type: "success", message: "Settings saved!" }
      : { type: "error", message: result.error || "Failed" }
    );
    setTimeout(() => setToast(null), 3000);
  };

  const inputClass = "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";
  const selectClass = "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionClass = "border-b border-gray-200 pb-8";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/online/themes" className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
            <ArrowLeftIcon size={20} />
          </a>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Theme Settings</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">Customize your store&apos;s colors, fonts, and layout</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="http://localhost:3300/tc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
            <EyeIcon size={16} />
            Preview
          </a>
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl space-y-10">
        {/* Colors */}
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-6">Colors</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 p-1"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className={inputClass + " flex-1"}
                  placeholder="#4f46e5"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Used for buttons, links, and highlights</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-6">Typography</h2>
          <div>
            <label className={labelClass}>Font Family</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className={selectClass}>
              <option value="inter">Inter (Modern)</option>
              <option value="dm-sans">DM Sans (Friendly)</option>
              <option value="system">System Default (Fast)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Applies to all text on your storefront</p>
          </div>
        </section>

        {/* Layout */}
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-6">Layout</h2>
          <div>
            <label className={labelClass}>Border Radius</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: "none", label: "Sharp", preview: "rounded-none" },
                { value: "sm", label: "Subtle", preview: "rounded-sm" },
                { value: "md", label: "Rounded", preview: "rounded-md" },
                { value: "lg", label: "Extra Round", preview: "rounded-xl" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBorderRadius(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${borderRadius === opt.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className={`h-8 w-12 bg-gray-300 ${opt.preview}`} />
                  <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Header */}
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-6">Header</h2>
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Header Style</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "dark", label: "Dark", desc: "Dark background, white text" },
                  { value: "light", label: "Light", desc: "White background, dark text" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setHeaderStyle(opt.value)}
                    className={`flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors ${headerStyle === opt.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className={`mb-2 h-6 w-full rounded ${opt.value === "dark" ? "bg-gray-800" : "bg-gray-100 border border-gray-200"}`}>
                      <div className="flex h-full items-center px-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: accentColor }} />
                        <div className="ml-auto flex gap-1">
                          <div className={`h-1 w-4 rounded-full ${opt.value === "dark" ? "bg-gray-500" : "bg-gray-300"}`} />
                          <div className={`h-1 w-4 rounded-full ${opt.value === "dark" ? "bg-gray-500" : "bg-gray-300"}`} />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                    <span className="text-xs text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Logo URL</label>
              <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputClass} placeholder="https://example.com/logo.png" />
              <p className="mt-1 text-xs text-gray-500">Leave empty to show store initial</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
