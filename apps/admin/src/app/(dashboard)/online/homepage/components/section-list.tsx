"use client";

import { ChevronUpIcon, ChevronDownIcon, PencilIcon, Trash2Icon, GripVerticalIcon } from "lucide-react";
import { SECTION_TYPE_META } from "./section-palette";

type SectionConfig = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

type Props = {
  sections: SectionConfig[];
  onMove: (index: number, direction: "up" | "down") => void;
  onToggle: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
};

export default function SectionList({ sections, onMove, onToggle, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-2">
      {sections.map((section, i) => {
        const meta = SECTION_TYPE_META[section.type];
        const title = (section.data.title as string) || (section.data.titleTranslations as Record<string, string>)?.tc || meta?.label || section.type;

        return (
          <div
            key={section.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${section.enabled ? "border-[var(--border-default)] bg-white" : "border-dashed border-gray-300 bg-gray-50 opacity-60"}`}
          >
            {/* Grip icon */}
            <GripVerticalIcon size={16} className="shrink-0 text-gray-300" />

            {/* Up/Down arrows */}
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                onClick={() => onMove(i, "up")}
                disabled={i === 0}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronUpIcon size={14} />
              </button>
              <button
                onClick={() => onMove(i, "down")}
                disabled={i === sections.length - 1}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              >
                <ChevronDownIcon size={14} />
              </button>
            </div>

            {/* Section type badge + title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-lg">{meta?.icon || "📦"}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-gray-900">{title}</p>
                  <p className="text-[11px] text-gray-500">{meta?.label || section.type}</p>
                </div>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => onToggle(i)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${section.enabled ? "bg-[var(--accent)]" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition-transform ${section.enabled ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>

            {/* Edit button */}
            <button
              onClick={() => onEdit(i)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <PencilIcon size={16} />
            </button>

            {/* Delete button */}
            <button
              onClick={() => onDelete(i)}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2Icon size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
