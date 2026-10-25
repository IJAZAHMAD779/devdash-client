"use client";

import { useState } from "react";
import {
  X,
  Eraser,
  Loader2,
  Folder,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useClearBookmarkNotes } from "@/hooks/use-bookmarks";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  currentCategory?: string;
}

export function ClearNotesModal({
  isOpen,
  onClose,
  bookmarks,
  currentCategory = "ALL",
}: Props) {
  const clearMutation = useClearBookmarkNotes();

  // Mode: "ALL" or "CATEGORY"
  const [scopeMode, setScopeMode] = useState<"ALL" | "CATEGORY">(
    currentCategory !== "ALL" && currentCategory !== "FAVORITES" ? "CATEGORY" : "ALL"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentCategory !== "ALL" && currentCategory !== "FAVORITES" ? currentCategory.toLowerCase() : "repo"
  );
  const [clearedResult, setClearedResult] = useState<number | null>(null);

  if (!isOpen) return null;

  // Bookmarks that have notes (not null and not empty)
  const bookmarksWithNotes = bookmarks.filter(
    (b) => b.notes && b.notes.trim() !== ""
  );

  const categoryNotesCount = bookmarksWithNotes.filter(
    (b) => (b.category || "tools").toLowerCase() === selectedCategory.toLowerCase()
  ).length;

  const targetCount = scopeMode === "ALL" ? bookmarksWithNotes.length : categoryNotesCount;

  const handleClearNotes = async () => {
    if (targetCount === 0 || clearMutation.isPending) return;

    sound.playClick(900);

    try {
      const response = await clearMutation.mutateAsync({
        category: scopeMode === "ALL" ? undefined : selectedCategory,
      });

      setClearedResult(response.clearedCount);
      sound.playSuccess();
      toast.success("Notes Cleared", {
        description: `Successfully removed notes from ${response.clearedCount} bookmarks.`,
      });
    } catch (err: any) {
      toast.error("Clear Failed", {
        description:
          err?.response?.data?.error?.message ||
          err?.message ||
          "Could not clear bookmark notes. Please try again.",
      });
    }
  };

  const handleClose = () => {
    if (clearMutation.isPending) return;
    sound.playClick(600);
    setClearedResult(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-notes-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
    >
      <div
        className="w-full max-w-md bg-surface-1 border border-hairline-strong rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-hairline flex items-center justify-between bg-surface-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-surface-2 border border-hairline flex items-center justify-center text-danger shrink-0">
              <Eraser className="w-4 h-4" />
            </div>
            <div>
              <h2 id="clear-notes-modal-title" className="text-sm font-semibold text-ink">
                Clear Notes from Bookmarks
              </h2>
              <p className="text-[11px] text-ink-subtle">
                Removes description and note text without deleting bookmarks
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={clearMutation.isPending}
            className="p-1.5 rounded-[6px] text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {clearedResult !== null ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[6px] bg-surface-2 border border-hairline flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-ink">
                    Notes cleared on {clearedResult} {clearedResult === 1 ? "bookmark" : "bookmarks"}!
                  </p>
                  <p className="text-ink-muted mt-1 leading-relaxed text-[11px]">
                    Description and developer notes have been reset to empty. You can generate new AI notes at any time using the AI Note button.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-[0.08em] text-ink-subtle">
                  Choose Scope to Clear
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(800);
                      setScopeMode("ALL");
                    }}
                    className={cn(
                      "p-3 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                      scopeMode === "ALL"
                        ? "bg-surface-2 border-hairline-strong text-ink shadow-xs"
                        : "bg-surface-1 border-hairline text-ink-muted hover:text-ink hover:bg-surface-2"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-ink-subtle" />
                      <span className="text-xs font-semibold">All Bookmarks</span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-subtle">
                      {bookmarksWithNotes.length} with notes
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(800);
                      setScopeMode("CATEGORY");
                    }}
                    className={cn(
                      "p-3 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                      scopeMode === "CATEGORY"
                        ? "bg-surface-2 border-hairline-strong text-ink shadow-xs"
                        : "bg-surface-1 border-hairline text-ink-muted hover:text-ink hover:bg-surface-2"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-ink-subtle" />
                      <span className="text-xs font-semibold">By Folder</span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-subtle">
                      {categoryNotesCount} with notes
                    </span>
                  </button>
                </div>
              </div>

              {/* Category Picker (if category mode active) */}
              {scopeMode === "CATEGORY" && (
                <div className="space-y-1.5 animate-in fade-in duration-100">
                  <label className="block text-xs font-mono uppercase tracking-[0.08em] text-ink-subtle">
                    Select Target Folder
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-surface-2 border border-hairline text-xs text-ink focus:border-accent focus:outline-none"
                  >
                    {PRESET_BOOKMARK_CATEGORIES.map((cat) => {
                      const count = bookmarksWithNotes.filter(
                        (b) => (b.category || "tools").toLowerCase() === cat.id.toLowerCase()
                      ).length;
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({count} notes)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Scope summary callout */}
              <div className="p-3 rounded-[6px] bg-surface-2 border border-hairline text-xs space-y-1">
                <div className="flex items-center justify-between text-ink-muted font-medium">
                  <span>Scope affected:</span>
                  <span className="font-mono text-ink">
                    {targetCount} {targetCount === 1 ? "bookmark" : "bookmarks"}
                  </span>
                </div>
                <p className="text-[11px] text-ink-subtle leading-tight">
                  This will remove description/notes text. Bookmarks, tags, favorites, and project links are not deleted.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hairline bg-surface-1 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={clearMutation.isPending}
            className="px-3.5 py-1.5 rounded-[6px] bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink text-xs font-medium transition-colors cursor-pointer"
          >
            {clearedResult !== null ? "Done" : "Cancel"}
          </button>

          {clearedResult === null && (
            <button
              type="button"
              onClick={handleClearNotes}
              disabled={targetCount === 0 || clearMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-danger hover:bg-danger/90 text-white text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {clearMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Clearing…</span>
                </>
              ) : (
                <>
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear Notes ({targetCount})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
