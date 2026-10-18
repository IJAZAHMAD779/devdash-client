"use client";

import { useState, useEffect } from "react";
import { X, Plus, Bookmark as BookmarkIcon, Loader2, Link2 } from "lucide-react";
import { useCreateBookmark } from "@/hooks/use-bookmarks";
import { useProjects } from "@/hooks/use-projects";
import { BookmarkCategory } from "@/types/bookmark";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: BookmarkCategory; label: string }[] = [
  { id: "DOCS", label: "Documentation" },
  { id: "ARTICLE", label: "Article / Post" },
  { id: "TOOL", label: "Developer Tool" },
  { id: "LIBRARY", label: "Library / SDK" },
  { id: "VIDEO", label: "Video" },
  { id: "TUTORIAL", label: "Tutorial" },
];

export function NewBookmarkModal({ isOpen, onClose }: Props) {
  const createBookmark = useCreateBookmark();
  const { data: projects } = useProjects();

  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<BookmarkCategory>("DOCS");
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setUrl("");
      setCategory("DOCS");
      setNotes("");
      setProjectId("");
      setTags([]);
      setTagInput("");
      setError(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Bookmark title is required");
      return;
    }
    if (!url.trim()) {
      setError("Bookmark URL is required");
      return;
    }

    try {
      await createBookmark.mutateAsync({
        title: title.trim(),
        url: url.trim(),
        category,
        notes: notes.trim() || undefined,
        projectId: projectId || null,
        tags,
      });

      sound.playSuccess();
      handleClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e?.response?.data?.error?.message || "Failed to create bookmark");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-150",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-surface-1 border border-hairline rounded-xl shadow-2xl overflow-hidden transition-all duration-150 flex flex-col",
          isClosing
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-surface-1/80">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold tracking-[-0.3px] text-ink">
              Add URL Bookmark
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Title <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Next.js 14 App Router Docs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              URL <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
              <input
                type="url"
                placeholder="https://nextjs.org/docs"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookmarkCategory)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Link to Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink transition-colors"
              >
                <option value="">No Project Linked</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Personal Notes (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Key insights, how to install, or why this was saved..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-surface-2 border border-hairline focus-within:border-primary transition-colors">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 text-ink border border-hairline"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-ink-muted hover:text-ink cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={
                  tags.length === 0
                    ? "Type tag and press Enter..."
                    : "Add more..."
                }
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={createBookmark.isPending}
              className="px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBookmark.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {createBookmark.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Bookmark</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
