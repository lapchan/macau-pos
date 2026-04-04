"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Plus, X, ChevronDown, Globe } from "lucide-react";
import { Flag } from "@/components/shared/flags";

// ─── Supported Languages ───────────────────────────────────
export type LangCode = "en" | "tc" | "sc" | "pt" | "ja";

type LangOption = {
  code: LangCode;
  label: string;
};

const LANGUAGES: LangOption[] = [
  { code: "en", label: "English" },
  { code: "tc", label: "繁體中文" },
  { code: "sc", label: "简体中文" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
];

// ─── Types ─────────────────────────────────────────────────
export type LangEntry = {
  lang: LangCode;
  value: string;
};

type MultiLangInputProps = {
  name: string;
  value: LangEntry[];
  onChange: (entries: LangEntry[]) => void;
  placeholder?: string;
  multiline?: boolean;
  label?: string;
  required?: boolean;
  onDirty?: () => void;
  /** i18n labels */
  addLanguageLabel?: string;
  removeLabel?: string;
};

// ─── Add Language Picker ───────────────────────────────────
// A "+" button that opens a dropdown showing all unused languages.
// One click to add any language directly — no sequential adding.
function AddLanguagePicker({
  usedLanguages,
  onAdd,
  label,
}: {
  usedLanguages: LangCode[];
  onAdd: (code: LangCode) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const available = LANGUAGES.filter((l) => !usedLanguages.includes(l.code));
  if (available.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius-sm)] text-[12px] font-medium text-text-secondary hover:text-accent hover:bg-accent-light border border-dashed border-border hover:border-accent/40 transition-all"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-44 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg py-1 animate-[scaleIn_0.15s_ease-out]">
            {available.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onAdd(lang.code);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              >
                <Flag code={lang.code} />
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Language Selector (on each row) ───────────────────────
// Dropdown to change the language of an existing row.
function LanguageSelector({
  selected,
  usedLanguages,
  onChange,
}: {
  selected: LangCode;
  usedLanguages: LangCode[];
  onChange: (code: LangCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === selected);
  const available = LANGUAGES.filter(
    (l) => l.code === selected || !usedLanguages.includes(l.code)
  );

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-10 px-2.5 rounded-l-[var(--radius-md)] border border-r-0 border-border text-[13px] font-medium bg-background text-text-secondary hover:bg-surface-hover cursor-pointer transition-colors min-w-[108px]"
      >
        <Flag code={selected} />
        <span className="truncate">{current?.label}</span>
        <ChevronDown className="h-3 w-3 ml-auto shrink-0 text-text-tertiary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-44 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg py-1 animate-[scaleIn_0.15s_ease-out]">
            {available.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onChange(lang.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors",
                  lang.code === selected
                    ? "bg-accent-light text-accent font-medium"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                <Flag code={lang.code} />
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function MultiLangInput({
  name,
  value,
  onChange,
  placeholder = "{lang} name",
  multiline = false,
  label,
  required,
  onDirty,
  addLanguageLabel = "Add language",
  removeLabel = "Remove translation",
}: MultiLangInputProps) {
  const newInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [focusNew, setFocusNew] = useState(false);

  // Auto-focus newly added row
  useEffect(() => {
    if (focusNew && newInputRef.current) {
      newInputRef.current.focus();
      setFocusNew(false);
    }
  }, [focusNew, value.length]);

  const usedLanguages = value.map((e) => e.lang);

  const handleLangChange = useCallback(
    (index: number, code: LangCode) => {
      const next = [...value];
      next[index] = { ...next[index], lang: code };
      onChange(next);
      onDirty?.();
    },
    [value, onChange, onDirty]
  );

  const handleValueChange = useCallback(
    (index: number, val: string) => {
      const next = [...value];
      next[index] = { ...next[index], value: val };
      onChange(next);
      onDirty?.();
    },
    [value, onChange, onDirty]
  );

  const handleRemove = useCallback(
    (index: number) => {
      // Allow removing any row, but keep at least 1
      if (value.length <= 1) return;
      const next = value.filter((_, i) => i !== index);
      onChange(next);
      onDirty?.();
    },
    [value, onChange, onDirty]
  );

  const handleAdd = useCallback(
    (code: LangCode) => {
      if (usedLanguages.includes(code)) return;
      onChange([...value, { lang: code, value: "" }]);
      setFocusNew(true);
      onDirty?.();
    },
    [value, usedLanguages, onChange, onDirty]
  );

  return (
    <div>
      {/* Label */}
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-3.5 w-3.5 text-text-tertiary" />
          <label className="text-[13px] font-medium text-text-primary">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-2">
        {value.map((entry, i) => {
          const langName = LANGUAGES.find((l) => l.code === entry.lang)?.label || entry.lang;
          const ph = placeholder?.replace("{lang}", langName) || `${langName} text`;
          const isLastAdded = i === value.length - 1;

          return (
            <div key={`${entry.lang}-${i}`} className="flex items-start gap-0 group animate-[fadeIn_0.2s_ease-out]">
              {/* Language selector — any row can change language */}
              <LanguageSelector
                selected={entry.lang}
                usedLanguages={usedLanguages}
                onChange={(code) => handleLangChange(i, code)}
              />

              {/* Text input */}
              {multiline ? (
                <textarea
                  ref={isLastAdded ? (newInputRef as React.RefObject<HTMLTextAreaElement>) : undefined}
                  value={entry.value}
                  onChange={(e) => handleValueChange(i, e.target.value)}
                  placeholder={ph}
                  rows={2}
                  className="flex-1 min-w-0 px-3 py-2.5 text-[14px] bg-background border border-border rounded-r-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                />
              ) : (
                <input
                  ref={isLastAdded ? (newInputRef as React.RefObject<HTMLInputElement>) : undefined}
                  type="text"
                  value={entry.value}
                  onChange={(e) => handleValueChange(i, e.target.value)}
                  placeholder={ph}
                  className="flex-1 min-w-0 h-10 px-3 text-[14px] bg-background border border-border rounded-r-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              )}

              {/* Remove button — visible on hover, hidden if only 1 row */}
              <div className="ml-1 pt-1.5 shrink-0">
                {value.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={removeLabel}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="h-7 w-7" /> // Spacer to keep alignment
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add language picker — always visible below rows */}
      {usedLanguages.length < LANGUAGES.length && (
        <div className="mt-2">
          <AddLanguagePicker usedLanguages={usedLanguages} onAdd={handleAdd} label={addLanguageLabel} />
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(
          value.reduce((acc, e) => {
            if (e.value.trim()) acc[e.lang] = e.value.trim();
            return acc;
          }, {} as Record<string, string>)
        )}
      />
    </div>
  );
}
