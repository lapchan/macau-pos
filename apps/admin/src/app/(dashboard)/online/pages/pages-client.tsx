"use client";

import { useState } from "react";
import { ArrowLeftIcon, PlusIcon, PencilIcon, Trash2Icon, GlobeIcon, EyeOffIcon, ExternalLinkIcon } from "lucide-react";
import { createPage, updatePage, deletePage } from "@/lib/actions/storefront-actions";
import { useRouter } from "next/navigation";

type PageData = {
  id: string;
  slug: string;
  title: string;
  content: unknown;
  metaDescription: string | null;
  isPublished: boolean;
  updatedAt: string;
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 100);
}

export default function PagesClient({ initialPages }: { initialPages: PageData[] }) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [editing, setEditing] = useState<PageData | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setMetaDesc("");
    setIsPublished(true);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (page: PageData) => {
    setTitle(page.title);
    setSlug(page.slug);
    // Extract text from content array
    const contentArr = Array.isArray(page.content) ? page.content : [];
    const text = contentArr.map((b: any) => b.text || "").join("\n\n");
    setContent(text);
    setMetaDesc(page.metaDescription || "");
    setIsPublished(page.isPublished);
    setCreating(false);
    setEditing(page);
  };

  const closeEditor = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const finalSlug = slug.trim() || slugify(title);
    const contentBlocks = content.split("\n\n").filter(Boolean).map((text) => ({
      type: text.startsWith("# ") || text.startsWith("## ") ? "heading" : "paragraph",
      level: text.startsWith("## ") ? 2 : text.startsWith("# ") ? 1 : undefined,
      text: text.replace(/^#{1,3}\s/, ""),
    }));

    if (creating) {
      const result = await createPage({ title, slug: finalSlug, content: contentBlocks, metaDescription: metaDesc || undefined, isPublished });
      setSaving(false);
      if (result.success) {
        showToast("success", "Page created!");
        closeEditor();
        router.refresh();
      } else {
        showToast("error", result.error || "Failed");
      }
    } else if (editing) {
      const result = await updatePage(editing.id, { title, slug: finalSlug, content: contentBlocks, metaDescription: metaDesc || undefined, isPublished });
      setSaving(false);
      if (result.success) {
        showToast("success", "Page updated!");
        closeEditor();
        router.refresh();
      } else {
        showToast("error", result.error || "Failed");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    const result = await deletePage(id);
    if (result.success) {
      setPages(pages.filter((p) => p.id !== id));
      showToast("success", "Page deleted");
    } else {
      showToast("error", result.error || "Failed");
    }
  };

  const inputClass = "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";

  // ============================================================
  // Editor view
  // ============================================================
  if (creating || editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={closeEditor} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
              {creating ? "New Page" : `Edit: ${editing?.title}`}
            </h1>
          </div>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="rounded-lg bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {toast && (
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {toast.message}
          </div>
        )}

        <div className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); if (creating) setSlug(slugify(e.target.value)); }} className={inputClass} placeholder="About Us" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">/pages/</span>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass + " flex-1"} placeholder="about-us" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className={inputClass} placeholder={"## Our Story\n\nWrite your page content here...\n\nUse ## for headings and blank lines between paragraphs."} />
            <p className="mt-1 text-xs text-gray-500">Use ## for headings. Separate paragraphs with blank lines.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description (SEO)</label>
            <input type="text" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className={inputClass} placeholder="A brief description for search engines..." maxLength={160} />
            <p className="mt-1 text-xs text-gray-500">{metaDesc.length}/160 characters</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Published</label>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isPublished ? "bg-[var(--accent)]" : "bg-gray-200"}`}
            >
              <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // List view
  // ============================================================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/online" className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
            <ArrowLeftIcon size={20} />
          </a>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Pages</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">Manage your storefront pages</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)]">
          <PlusIcon size={16} />
          Add Page
        </button>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      )}

      {/* Pages table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">No pages yet</h3>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Create pages like About, Contact, or FAQ</p>
            <button onClick={openCreate} className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)]">
              Add First Page
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{page.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">/pages/{page.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    {page.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                        <GlobeIcon size={12} />Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                        <EyeOffIcon size={12} />Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`http://localhost:3300/tc/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <ExternalLinkIcon size={16} />
                      </a>
                      <button onClick={() => openEdit(page)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <PencilIcon size={16} />
                      </button>
                      <button onClick={() => handleDelete(page.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2Icon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
