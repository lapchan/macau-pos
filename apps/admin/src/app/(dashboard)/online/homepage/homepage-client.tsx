"use client";

import { useState } from "react";
import { ArrowLeftIcon, EyeIcon, PlusIcon } from "lucide-react";
import { saveHomepageSections } from "@/lib/actions/homepage-actions";
import SectionList from "./components/section-list";
import SectionPalette from "./components/section-palette";
import SectionEditor from "./components/section-editor";

type SectionConfig = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export default function HomepageClient({ initialSections }: { initialSections: SectionConfig[] }) {
  const [sections, setSections] = useState<SectionConfig[]>(initialSections);
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSections = (next: SectionConfig[]) => {
    setSections(next);
    setHasChanges(true);
  };

  // Move section up/down
  const moveSection = (index: number, direction: "up" | "down") => {
    const next = [...sections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateSections(next);
  };

  // Toggle enable/disable
  const toggleSection = (index: number) => {
    const next = [...sections];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    updateSections(next);
  };

  // Delete section
  const deleteSection = (index: number) => {
    updateSections(sections.filter((_, i) => i !== index));
  };

  // Add section from palette
  const addSection = (section: SectionConfig) => {
    updateSections([...sections, section]);
    setPaletteOpen(false);
  };

  // Update section data from editor
  const updateSection = (updated: SectionConfig) => {
    updateSections(sections.map((s) => (s.id === updated.id ? updated : s)));
    setEditingSection(updated);
  };

  // Save to DB
  const handleSave = async () => {
    setSaving(true);
    const result = await saveHomepageSections(sections);
    setSaving(false);
    if (result.success) {
      setHasChanges(false);
      setToast({ type: "success", message: "已儲存！Homepage sections saved." });
    } else {
      setToast({ type: "error", message: result.error || "Failed to save" });
    }
    setTimeout(() => setToast(null), 3000);
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
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Homepage Builder</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Drag and configure sections for your online storefront homepage
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3300/tc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          >
            <EyeIcon size={16} />
            Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="rounded-lg bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {saving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      )}

      {/* Section count + Add button */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--text-secondary)]">
          {sections.length} {sections.length === 1 ? "section" : "sections"} configured
          {sections.length === 0 && " — storefront will show default homepage"}
        </p>
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          <PlusIcon size={16} />
          Add Section
        </button>
      </div>

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-default)] py-16 text-center">
          <div className="rounded-full bg-[var(--bg-surface)] p-4">
            <PlusIcon size={32} className="text-[var(--text-secondary)]" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">No sections configured</h3>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Add sections to build your storefront homepage
          </p>
          <button
            onClick={() => setPaletteOpen(true)}
            className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            Add First Section
          </button>
        </div>
      )}

      {/* Section list */}
      {sections.length > 0 && (
        <SectionList
          sections={sections}
          onMove={moveSection}
          onToggle={toggleSection}
          onEdit={(index) => setEditingSection(sections[index])}
          onDelete={deleteSection}
        />
      )}

      {/* Palette modal */}
      {paletteOpen && (
        <SectionPalette
          onAdd={addSection}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {/* Section editor slide-over */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onUpdate={updateSection}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}
