"use client";

import { useState, useEffect } from "react";
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
}

export function BulkActionBar({
  selectedBookmarkIds,
  allBookmarks,
  onClearSelection,
  onOpenMoveModal,
}: Props) {
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copiedMode, setCopiedMode] = useState<"plain" | "markdown" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const batchEnrich = useBatchEnrichBookmarks();
  const batchClearNotes = useClearBookmarkNotes();
  const batchDelete = useBatchDeleteBookmarks();

  const count = selectedBookmarkIds.size;

  // Selected bookmark objects
  const selectedBookmarks = allBookmarks.filter((b) =>
    selectedBookmarkIds.has(b.id)
  );

  // Keyboard shortcut Esc to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && count > 0 && !showDeleteConfirm) {
        onClearSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, onClearSelection, showDeleteConfirm]);

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

  const handleBatchClearNotes = async () => {
    sound.playClick(900);
    try {
      const res = await batchClearNotes.mutateAsync({
        bookmarkIds: Array.from(selectedBookmarkIds),
      });
      sound.playSuccess();
      toast.success("Notes Cleared", {
        description: `Cleared developer notes on ${res.clearedCount} bookmarks.`,
      });
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="rounded-xl border border-hairline-strong bg-surface-1/95 backdrop-blur-md shadow-2xl p-1.5 sm:px-3 sm:py-2 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 text-ink">
          {/* Selected Count & Clear */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-hairline shrink-0">
            <span className="w-5 h-5 rounded-md bg-primary/20 text-primary flex items-center justify-center text-xs font-mono font-bold">
              {count}
            </span>
            <span className="text-xs font-medium text-ink hidden sm:inline">
              selected
            </span>
            <button
              onClick={() => {
                sound.playClick(700);
                onClearSelection();
              }}
              title="Clear selection (Esc)"
              className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Move to Category CTA */}
          <button
            onClick={() => {
              sound.playClick(900);
              onOpenMoveModal();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer shrink-0"
            title="Move selected bookmarks to another category"
          >
            <FolderInput className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          {/* Copy URLs with Dropdown */}
          <div className="relative">
            <div className="inline-flex items-center rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors">
              <button
                onClick={handleCopyPlain}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 hover:text-primary transition-colors cursor-pointer"
                title="Copy all URLs to clipboard"
              >
                {copiedMode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-ink-subtle" />
                )}
                <span className="hidden md:inline">
                  {copiedMode ? "Copied" : "Copy URLs"}
                </span>
                <span className="md:hidden">Copy</span>
              </button>
              <button
                onClick={() => setCopyMenuOpen(!copyMenuOpen)}
                className="px-1.5 py-1.5 border-l border-hairline hover:bg-surface-3 rounded-r-lg text-ink-subtle hover:text-ink cursor-pointer"
                title="More copy options"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>

            {copyMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-48 rounded-lg bg-surface-1 border border-hairline shadow-xl p-1 space-y-0.5 text-xs z-50">
                <button
                  onClick={handleCopyPlain}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-2 text-ink text-left cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-ink-subtle" />
                  <span>Plain URLs (newline)</span>
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-2 text-ink text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-ink-subtle" />
                  <span>Markdown links</span>
                </button>
              </div>
            )}
          </div>

          {/* Auto-Note with AI */}
          <button
            onClick={handleBatchEnrich}
            disabled={batchEnrich.isPending}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Generate AI developer notes for selected bookmarks"
          >
            {batchEnrich.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>AI Notes</span>
          </button>

          {/* Clear Notes */}
          <button
            onClick={handleBatchClearNotes}
            disabled={batchClearNotes.isPending}
            className="hidden xl:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Clear notes on selected bookmarks"
          >
            {batchClearNotes.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Eraser className="w-3 h-3" />
            )}
            <span>Clear Notes</span>
          </button>

          {/* Delete Action */}
          <button
            onClick={() => {
              sound.playClick(600);
              setShowDeleteConfirm(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-medium transition-colors cursor-pointer shrink-0"
            title="Delete selected bookmarks"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Delete</span>
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
        confirmText={batchDelete.isPending ? "Deleting..." : "Delete All"}
        variant="danger"
      />
    </>
  );
}
