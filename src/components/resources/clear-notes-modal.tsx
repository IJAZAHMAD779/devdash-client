"use client";

import { useState } from "react";
import {
  X,
  Eraser,
  Loader2,
  AlertTriangle,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md bg-surface-1 border border-hairline-strong rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-hairline flex items-center justify-between bg-surface-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <Eraser className="w-4 h-4" />
            </div>
            <div>
              <h2 id="clear-notes-modal-title" className="text-sm font-semibold text-ink">
                Remove Bookmark Notes
              </h2>
              <p className="text-[11px] text-ink-muted">
                Clear developer summaries all at once or by category
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={clearMutation.isPending}
            className="p-1.5 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {clearedResult !== null ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-300">
                    Notes cleared on {clearedResult} bookmark{clearedResult === 1 ? "" : "s"}!
                  </p>
                  <p className="text-emerald-400/80 mt-1 leading-relaxed">
                    Their developer notes have been reset to blank. You can re-generate new notes at
                    any time using the Auto-Note button.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ink-muted">
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
                      "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                      scopeMode === "ALL"
                        ? "bg-red-500/10 border-red-500/40 text-ink shadow-xs"
                        : "bg-surface-2 border-hairline text-ink-muted hover:text-ink hover:bg-surface-3"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-semibold">All Bookmarks</span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-tertiary">
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
                      "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                      scopeMode === "CATEGORY"
                        ? "bg-red-500/10 border-red-500/40 text-ink shadow-xs"
                        : "bg-surface-2 border-hairline text-ink-muted hover:text-ink hover:bg-surface-3"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-semibold">By Category</span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-tertiary">
                      Select folder below
                    </span>
                  </button>
                </div>
              </div>

              {/* Category Selector (if in CATEGORY mode) */}
              {scopeMode === "CATEGORY" && (
                <div className="space-y-1.5 animate-in fade-in duration-100">
                  <label className="block text-xs font-medium text-ink-muted">
                    Target Category / Folder
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:outline-hidden focus:border-red-500 transition-colors cursor-pointer"
                  >
                    {PRESET_BOOKMARK_CATEGORIES.map((cat) => {
                      const count = bookmarksWithNotes.filter(
                        (b) => (b.category || "tools").toLowerCase() === cat.id
                      ).length;
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({count} with notes)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Warning Banner */}
              <div className="p-3 rounded-lg bg-surface-2/80 border border-hairline flex items-start gap-2.5 text-[11px] text-ink-muted leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  This action will erase the existing notes on{" "}
                  <strong className="text-ink">{targetCount} bookmark{targetCount === 1 ? "" : "s"}</strong>.
                  Bookmarks themselves and their URLs will not be deleted. You can re-run Auto-Note
                  afterwards to generate fresh, accurate notes.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 px-5 border-t border-hairline flex items-center justify-between bg-surface-1 shrink-0">
          <button
            onClick={handleClose}
            disabled={clearMutation.isPending}
            className="px-3.5 py-1.5 rounded-md border border-hairline text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            {clearedResult !== null ? "Done" : "Cancel"}
          </button>

          {clearedResult === null && (
            <button
              onClick={handleClearNotes}
              disabled={targetCount === 0 || clearMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-medium tracking-tight shadow-sm shadow-red-600/25 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              {clearMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Clearing Notes...</span>
                </>
              ) : (
                <>
                  <Eraser className="w-3.5 h-3.5" />
                  <span>
                    Clear Notes ({targetCount})
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
