"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { savePreferences } from "@/lib/actions/storefront-actions";

type Config = {
  branding: Record<string, unknown>;
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
};

export default function PreferencesClient({ initialConfig }: { initialConfig: Config }) {
  const b = initialConfig.branding;
  const f = initialConfig.footer;

  const [seoTitle, setSeoTitle] = useState((b.seoTitle as string) || "");
  const [seoDescription, setSeoDescription] = useState((b.seoDescription as string) || "");
  const [ogImage, setOgImage] = useState((b.ogImage as string) || "");
  const [copyright, setCopyright] = useState((f.copyright as string) || "");
  const [showNewsletter, setShowNewsletter] = useState((f.showNewsletter as boolean) !== false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    const result = await savePreferences({
      branding: { seoTitle, seoDescription, ogImage: ogImage || null },
      footer: { copyright, showNewsletter },
    });
    setSaving(false);
    setToast(result.success
      ? { type: "success", message: "Preferences saved!" }
      : { type: "error", message: result.error || "Failed" }
    );
    setTimeout(() => setToast(null), 3000);
  };

  const inputClass = "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionClass = "border-b border-gray-200 pb-8";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/online" className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
            <ArrowLeftIcon size={20} />
          </a>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Preferences</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">SEO, social sharing, and store settings</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl space-y-10">
        {/* SEO */}
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Search engine listing</h2>
          <p className="text-sm text-gray-500 mb-6">This is how your store appears in search results like Google.</p>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Homepage title</label>
              <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} placeholder="CountingStars | 澳門便利店" maxLength={70} />
              <p className="mt-1 text-xs text-gray-500">{seoTitle.length}/70 characters</p>
            </div>

            <div>
              <label className={labelClass}>Homepage meta description</label>
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} className={inputClass} placeholder="Describe your store for search engines..." maxLength={160} />
              <p className="mt-1 text-xs text-gray-500">{seoDescription.length}/160 characters</p>
            </div>

            {/* Preview */}
            {(seoTitle || seoDescription) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-400 mb-2">Search preview</p>
                <p className="text-base text-blue-700 font-medium truncate">{seoTitle || "Your Store Name"}</p>
                <p className="text-xs text-green-700 truncate">https://countingstars.retailos.app</p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{seoDescription || "No description set"}</p>
              </div>
            )}
          </div>
        </section>

        {/* Social sharing */}
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Social sharing image</h2>
          <p className="text-sm text-gray-500 mb-6">This image appears when your store is shared on social media.</p>

          <div>
            <label className={labelClass}>Image URL</label>
            <input type="text" value={ogImage} onChange={(e) => setOgImage(e.target.value)} className={inputClass} placeholder="https://example.com/og-image.jpg" />
            <p className="mt-1 text-xs text-gray-500">Recommended size: 1200 x 630 pixels</p>
          </div>
        </section>

        {/* Footer */}
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Footer</h2>
          <p className="text-sm text-gray-500 mb-6">Settings for your store footer.</p>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Copyright text</label>
              <input type="text" value={copyright} onChange={(e) => setCopyright(e.target.value)} className={inputClass} placeholder="© 2026 CountingStars" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Show newsletter signup</label>
                <p className="text-xs text-gray-500">Display email subscription form in footer</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewsletter(!showNewsletter)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${showNewsletter ? "bg-[var(--accent)]" : "bg-gray-200"}`}
              >
                <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform ${showNewsletter ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
