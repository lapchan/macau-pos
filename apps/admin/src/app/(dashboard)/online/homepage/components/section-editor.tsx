"use client";

import { XIcon } from "lucide-react";
import { SECTION_TYPE_META } from "./section-palette";

type SectionConfig = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

type Props = {
  section: SectionConfig;
  onUpdate: (section: SectionConfig) => void;
  onClose: () => void;
};

// Helper to update nested data
function updateData(section: SectionConfig, key: string, value: unknown): SectionConfig {
  return { ...section, data: { ...section.data, [key]: value } };
}

// ============================================================
// Field components
// ============================================================

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${value ? "bg-indigo-600" : "bg-gray-200"}`}
      >
        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows || 3}
        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
  );
}

// ============================================================
// Dynamic form based on section type
// ============================================================

function SectionFields({ section, onUpdate }: { section: SectionConfig; onUpdate: (s: SectionConfig) => void }) {
  const d = section.data;
  const set = (key: string, value: unknown) => onUpdate(updateData(section, key, value));

  switch (section.type) {
    case "hero_banner":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <TextField label="CTA Text" value={d.ctaText as string} onChange={(v) => set("ctaText", v)} />
          <TextField label="CTA Link" value={d.ctaLink as string} onChange={(v) => set("ctaLink", v)} placeholder="/tc/products" />
          <TextField label="Image URL" value={d.image as string} onChange={(v) => set("image", v)} placeholder="https://..." />
          <SelectField label="Height" value={d.height as string} onChange={(v) => set("height", v)} options={[
            { value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "Extra Large" },
          ]} />
          <NumberField label="Overlay Opacity (0-1)" value={d.overlayOpacity as number} onChange={(v) => set("overlayOpacity", v)} min={0} max={1} />
        </>
      );

    case "featured_section":
    case "split_promo":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <TextField label="CTA Text" value={d.ctaText as string} onChange={(v) => set("ctaText", v)} />
          <TextField label="CTA Link" value={d.ctaLink as string} onChange={(v) => set("ctaLink", v)} />
          <TextField label="Image URL" value={d.image as string} onChange={(v) => set("image", v)} />
        </>
      );

    case "promo_banner":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <TextField label="CTA Text" value={d.ctaText as string} onChange={(v) => set("ctaText", v)} />
          <TextField label="CTA Link" value={d.ctaLink as string} onChange={(v) => set("ctaLink", v)} />
        </>
      );

    case "sale_banner":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="End Date" value={d.endDate as string} onChange={(v) => set("endDate", v)} placeholder="2026-12-31" />
          <TextField label="CTA Text" value={d.ctaText as string} onChange={(v) => set("ctaText", v)} />
        </>
      );

    case "product_grid":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <NumberField label="Product Count" value={d.limit as number} onChange={(v) => set("limit", v)} min={2} max={24} />
          <SelectField label="Columns" value={String(d.columns || 4)} onChange={(v) => set("columns", parseInt(v))} options={[
            { value: "2", label: "2 columns" }, { value: "3", label: "3 columns" }, { value: "4", label: "4 columns" }, { value: "5", label: "5 columns" },
          ]} />
          <SelectField label="Sort By" value={d.sortBy as string} onChange={(v) => set("sortBy", v)} options={[
            { value: "popular", label: "Popular" }, { value: "newest", label: "Newest" }, { value: "price_asc", label: "Price: Low to High" }, { value: "price_desc", label: "Price: High to Low" },
          ]} />
          <TextField label="Category Slug (optional)" value={d.categorySlug as string} onChange={(v) => set("categorySlug", v)} placeholder="beverages" />
          <ToggleField label="Show View All Link" value={d.showViewAll as boolean} onChange={(v) => set("showViewAll", v)} />
        </>
      );

    case "product_carousel":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <NumberField label="Product Count" value={d.limit as number} onChange={(v) => set("limit", v)} min={2} max={20} />
          <SelectField label="Sort By" value={d.sortBy as string} onChange={(v) => set("sortBy", v)} options={[
            { value: "popular", label: "Popular" }, { value: "newest", label: "Newest" }, { value: "price_asc", label: "Price: Low" }, { value: "price_desc", label: "Price: High" },
          ]} />
          <TextField label="Category Slug (optional)" value={d.categorySlug as string} onChange={(v) => set("categorySlug", v)} />
        </>
      );

    case "product_list_simple":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <NumberField label="Product Count" value={d.limit as number} onChange={(v) => set("limit", v)} min={2} max={12} />
        </>
      );

    case "category_grid":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <SelectField label="Columns" value={String(d.columns || 3)} onChange={(v) => set("columns", parseInt(v))} options={[
            { value: "3", label: "3 columns" }, { value: "4", label: "4 columns" }, { value: "6", label: "6 columns" },
          ]} />
        </>
      );

    case "category_scroll":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <ToggleField label="Show Browse All Link" value={d.showBrowseAll as boolean} onChange={(v) => set("showBrowseAll", v)} />
        </>
      );

    case "category_banner":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
        </>
      );

    case "collection_grid":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <p className="text-xs text-gray-500 italic">Collection items can be configured in a future update.</p>
        </>
      );

    case "incentive_grid":
    case "feature_grid":
      return (
        <>
          {section.type === "feature_grid" && (
            <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          )}
          <p className="text-xs text-gray-500 italic">Individual items (icons, titles, descriptions) can be edited in a future update.</p>
        </>
      );

    case "feature_split":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextAreaField label="Description" value={d.description as string} onChange={(v) => set("description", v)} />
          <TextField label="Image URL" value={d.image as string} onChange={(v) => set("image", v)} />
          <SelectField label="Image Position" value={d.imagePosition as string || "right"} onChange={(v) => set("imagePosition", v)} options={[
            { value: "left", label: "Left" }, { value: "right", label: "Right" },
          ]} />
        </>
      );

    case "testimonials":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <p className="text-xs text-gray-500 italic">Individual testimonials can be edited in a future update.</p>
        </>
      );

    case "newsletter":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Subtitle" value={d.subtitle as string} onChange={(v) => set("subtitle", v)} />
          <TextField label="Button Text" value={d.buttonText as string} onChange={(v) => set("buttonText", v)} />
        </>
      );

    case "text_with_image":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextAreaField label="Text" value={d.text as string} onChange={(v) => set("text", v)} />
          <TextField label="Image URL" value={d.image as string} onChange={(v) => set("image", v)} />
          <SelectField label="Image Position" value={d.imagePosition as string || "right"} onChange={(v) => set("imagePosition", v)} options={[
            { value: "left", label: "Left" }, { value: "right", label: "Right" },
          ]} />
        </>
      );

    case "rich_text":
      return (
        <p className="text-xs text-gray-500 italic">Rich text editing will be available in a future update. Content blocks can be configured via JSON.</p>
      );

    case "faq_accordion":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <p className="text-xs text-gray-500 italic">FAQ items (Q&A pairs) can be edited in a future update.</p>
        </>
      );

    case "image_gallery":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <p className="text-xs text-gray-500 italic">Gallery images can be managed in a future update.</p>
        </>
      );

    case "video_embed":
      return (
        <>
          <TextField label="Title" value={d.title as string} onChange={(v) => set("title", v)} />
          <TextField label="Video URL" value={d.videoUrl as string} onChange={(v) => set("videoUrl", v)} placeholder="https://youtube.com/watch?v=..." />
          <SelectField label="Aspect Ratio" value={d.aspectRatio as string || "16:9"} onChange={(v) => set("aspectRatio", v)} options={[
            { value: "16:9", label: "16:9" }, { value: "4:3", label: "4:3" }, { value: "1:1", label: "1:1" },
          ]} />
        </>
      );

    default:
      return <p className="text-sm text-gray-500">No editor available for this section type.</p>;
  }
}

// ============================================================
// Main editor slide-over
// ============================================================

export default function SectionEditor({ section, onUpdate, onClose }: Props) {
  const meta = SECTION_TYPE_META[section.type];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{meta?.icon || "📦"}</span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{meta?.label || section.type}</h2>
              <p className="text-xs text-gray-500">Edit section settings</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <XIcon size={20} />
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-5 px-6 py-6">
          <SectionFields section={section} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
}
