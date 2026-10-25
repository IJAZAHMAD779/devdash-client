"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FolderInput,
  Copy,
  Check,
  Trash2,
  BrainCircuit,
  Eraser,
  ChevronUp,
  FileText,
  Link2,
  Loader2,
} from "lucide-react";
import { Bookmark } from "@/types/bookmark";
import {
  useBatchEnrichBookmarks,
  useClearBookmarkNotes,
  useBatchDeleteBookmarks,
} from "@/hooks/use-bookmarks";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  selectedBookmarkIds: Set<string>;
  allBookmarks: Bookmark[];
  onClearSelection: () => void;
  onOpenMoveModal: () => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  totalFilteredCount?: number;
}

export function BulkActionBar({
  selectedBookmarkIds,
  allBookmarks,
  onClearSelection,
  onOpenMoveModal,
  onSelectAll,
  isAllSelected = false,
  totalFilteredCount,
}: Props) {
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copiedMode, setCopiedMode] = useState<"plain" | "markdown" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearNotesConfirm, setShowClearNotesConfirm] = useState(false);

  const copyMenuRef = useRef<HTMLDivElement>(null);
  const clearNotesConfirmRef = useRef<HTMLDivElement>(null);

  const batchEnrich = useBatchEnrichBookmarks();
  const batchClearNotes = useClearBookmarkNotes();
  const batchDelete = useBatchDeleteBookmarks();

  const count = selectedBookmarkIds.size;

  const selectedBookmarks = allBookmarks.filter((b) =>
    selectedBookmarkIds.has(b.id)
  );

  // Keyboard shortcut Esc to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        count > 0 &&
        !showDeleteConfirm &&
        !showClearNotesConfirm
      ) {
        onClearSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, onClearSelection, showDeleteConfirm, showClearNotesConfirm]);

  // Outside click to close popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        copyMenuRef.current &&
        !copyMenuRef.current.contains(e.target as Node)
      ) {
        setCopyMenuOpen(false);
      }
      if (
        clearNotesConfirmRef.current &&
        !clearNotesConfirmRef.current.contains(e.target as Node)
      ) {
        setShowClearNotesConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (count === 0) return null;

  const handleCopyPlain = async () => {
    try {
      const urls = selectedBookmarks.map((b) => b.url).join("\n");
      await navigator.clipboard.writeText(urls);
      sound.playSuccess();
      setCopiedMode("plain");
      toast.success("Copied URLs to clipboard", {
        description: `Copied ${count} ${count === 1 ? "link" : "links"}.`,
      });
      setTimeout(() => setCopiedMode(null), 2000);
      setCopyMenuOpen(false);
    } catch {
      toast.error("Failed to copy URLs");
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      const md = selectedBookmarks
        .map((b) => `- [${b.title}](${b.url})`)
        .join("\n");
      await navigator.clipboard.writeText(md);
      sound.playSuccess();
      setCopiedMode("markdown");
      toast.success("Copied Markdown links", {
        description: `Copied ${count} formatted markdown ${count === 1 ? "link" : "links"}.`,
      });
      setTimeout(() => setCopiedMode(null), 2000);
      setCopyMenuOpen(false);
    } catch {
      toast.error("Failed to copy links");
    }
  };

  const handleBatchEnrich = async () => {
    sound.playClick(900);
    try {
      const res = await batchEnrich.mutateAsync({
        bookmarkIds: Array.from(selectedBookmarkIds),
      });
      sound.playSuccess();
      toast.success("AI Notes Generated", {
        description: `Generated developer notes for ${res.enrichedCount} bookmarks.`,
      });
    } catch {
      toast.error("Could not generate AI notes", {
        description: "Check backend GROQ_API_KEY configuration.",
      });
    }
  };

  const handleConfirmClearNotes = async () => {
    sound.playClick(900);
    try {
      const res = await batchClearNotes.mutateAsync({
        bookmarkIds: Array.from(selectedBookmarkIds),
      });
      sound.playSuccess();
      toast.success("Notes Cleared", {
        description: `Cleared developer notes on ${res.clearedCount} bookmarks.`,
      });
      setShowClearNotesConfirm(false);
    } catch {
      toast.error("Failed to clear notes");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await batchDelete.mutateAsync({
        bookmarkIds: Array.from(selectedBookmarkIds),
      });
      sound.playSuccess();
      toast.success("Bookmarks deleted", {
        description: `Removed ${count} bookmarks.`,
      });
      onClearSelection();
      setShowDeleteConfirm(false);
    } catch {
      toast.error("Failed to delete bookmarks");
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="h-10 px-3 rounded-[8px] border border-hairline-strong bg-surface-1 shadow-2xl flex items-center gap-2 text-ink">
          {/* N selected */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-hairline shrink-0">
            <span className="font-mono text-xs font-semibold text-ink">
              {count}
            </span>
            <span className="text-xs text-ink-subtle hidden sm:inline">
              selected
            </span>

            {/* Select All N toggle if available */}
            {onSelectAll && totalFilteredCount && totalFilteredCount > count && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-xs text-accent hover:underline ml-1 cursor-pointer"
              >
                Select all {totalFilteredCount}
              </button>
            )}
          </div>

          {/* Move to Category */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(900);
              onOpenMoveModal();
            }}
            className="h-7 px-2 rounded-[6px] text-ink-muted hover:text-ink hover:bg-surface-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Move selected to category"
          >
            <FolderInput className="w-4 h-4 shrink-0 text-ink-subtle" />
            <span className="hidden sm:inline">Move</span>
          </button>

          {/* Copy URLs split dropdown */}
          <div className="relative shrink-0" ref={copyMenuRef}>
            <div className="h-7 inline-flex items-center rounded-[6px] hover:bg-surface-2 text-xs font-medium text-ink-muted transition-colors">
              <button
                type="button"
                onClick={handleCopyPlain}
                className="h-full inline-flex items-center gap-1.5 px-2 hover:text-ink cursor-pointer"
                title="Copy URLs to clipboard"
              >
                {copiedMode ? (
                  <Check className="w-3.5 h-3.5 text-ok shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                )}
                <span className="hidden sm:inline">
                  {copiedMode ? "Copied" : "Copy"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCopyMenuOpen(!copyMenuOpen)}
                className="h-full px-1 text-ink-subtle hover:text-ink cursor-pointer flex items-center justify-center border-l border-hairline/60"
                title="Copy options"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>

            {copyMenuOpen && (
              <div className="absolute bottom-full mb-1.5 left-0 w-48 rounded-[8px] bg-surface-1 border border-hairline-strong shadow-xl p-1 space-y-0.5 text-xs z-50">
                <button
                  type="button"
                  onClick={handleCopyPlain}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] hover:bg-surface-2 text-ink text-left cursor-pointer transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                  <span>Plain URLs (newline)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] hover:bg-surface-2 text-ink text-left cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                  <span>Markdown links</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Notes */}
          <button
            type="button"
            onClick={handleBatchEnrich}
            disabled={batchEnrich.isPending}
            className="h-7 px-2 rounded-[6px] text-ink-muted hover:text-ink hover:bg-surface-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Generate AI notes for selected"
          >
            {batchEnrich.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-accent" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5 shrink-0 text-ink-subtle" />
            )}
            <span className="hidden sm:inline">AI Notes</span>
          </button>

          {/* Clear Notes with Confirmation Popover */}
          <div className="relative shrink-0" ref={clearNotesConfirmRef}>
            <button
              type="button"
              onClick={() => setShowClearNotesConfirm(!showClearNotesConfirm)}
              disabled={batchClearNotes.isPending}
              className="h-7 px-2 rounded-[6px] text-ink-muted hover:text-danger hover:bg-surface-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Clear notes on selected bookmarks"
            >
              {batchClearNotes.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Eraser className="w-3.5 h-3.5 shrink-0 text-ink-subtle" />
              )}
              <span className="hidden sm:inline">Clear notes</span>
            </button>

            {/* Inline Confirmation Popover */}
            {showClearNotesConfirm && (
              <div className="absolute bottom-full mb-1.5 right-0 sm:left-1/2 sm:-translate-x-1/2 w-64 rounded-[8px] bg-surface-1 border border-hairline-strong shadow-xl p-3 text-xs space-y-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <p className="font-medium text-ink leading-snug">
                  Remove notes from {count} {count === 1 ? "bookmark" : "bookmarks"}?
                </p>
                <p className="text-[11px] text-ink-subtle leading-tight">
                  This will wipe description and AI notes text. Bookmarks remain intact.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClearNotesConfirm(false)}
                    className="px-2 py-1 rounded-[4px] text-ink-muted hover:text-ink hover:bg-surface-2 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClearNotes}
                    className="px-2.5 py-1 rounded-[4px] bg-danger text-white hover:bg-danger/90 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Action */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              setShowDeleteConfirm(true);
            }}
            className="h-7 px-2 rounded-[6px] text-ink-muted hover:text-danger hover:bg-surface-2 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Delete selected bookmarks"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0 text-ink-subtle" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          {/* ✕ Clear Selection */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(700);
              onClearSelection();
            }}
            title="Clear selection (Esc)"
            aria-label="Clear selection (Esc)"
            className="w-7 h-7 rounded-[4px] text-ink-subtle hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${count} ${count === 1 ? "Bookmark" : "Bookmarks"}?`}
        description={`Are you sure you want to delete ${count} ${
          count === 1 ? "bookmark" : "bookmarks"
        }? This action will permanently remove them from your vault.`}
        confirmText={batchDelete.isPending ? "Deleting…" : "Delete All"}
        variant="danger"
      />
    </>
  );
}
