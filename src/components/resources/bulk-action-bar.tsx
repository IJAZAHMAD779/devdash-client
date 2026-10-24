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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
        <div className="rounded-full border border-white/10 bg-[#0d0e12]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] ring-1 ring-white/5 px-3 py-2 flex items-center gap-2 text-ink">
          {/* Selected Count & Clear */}
          <div className="flex items-center gap-2 pl-1 pr-3 border-r border-white/10 shrink-0">
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center text-[11px] font-mono font-bold">
              {count}
            </span>
            <span className="text-xs font-medium text-ink-muted hidden sm:inline">
              selected
            </span>
            <button
              onClick={() => {
                sound.playClick(700);
                onClearSelection();
              }}
              title="Clear selection (Esc)"
              className="w-5 h-5 rounded-full hover:bg-white/10 text-ink-subtle hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
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
            className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm shadow-primary/25 inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="Move selected bookmarks to another category"
          >
            <FolderInput className="w-3.5 h-3.5 shrink-0" />
            <span>Move</span>
          </button>

          {/* Copy URLs with Split Dropdown */}
          <div className="relative shrink-0">
            <div className="h-8 inline-flex items-center rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-ink transition-colors whitespace-nowrap">
              <button
                onClick={handleCopyPlain}
                className="h-full inline-flex items-center gap-1.5 px-2.5 hover:text-white transition-colors cursor-pointer"
                title="Copy all URLs to clipboard"
              >
                {copiedMode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                )}
                <span>{copiedMode ? "Copied" : "Copy URLs"}</span>
              </button>
              <div className="h-4 w-px bg-white/10" />
              <button
                onClick={() => setCopyMenuOpen(!copyMenuOpen)}
                className="h-full px-2 hover:bg-white/10 rounded-r-lg text-ink-subtle hover:text-ink cursor-pointer flex items-center justify-center"
                title="More copy options"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>

            {copyMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-48 rounded-xl bg-[#141519] border border-white/10 shadow-2xl p-1 space-y-0.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleCopyPlain}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/10 text-ink text-left cursor-pointer transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                  <span>Plain URLs (newline)</span>
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/10 text-ink text-left cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                  <span>Markdown links</span>
                </button>
              </div>
            )}
          </div>

          {/* Auto-Note with AI */}
          <button
            onClick={handleBatchEnrich}
            disabled={batchEnrich.isPending}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50 whitespace-nowrap"
            title="Generate AI developer notes for selected bookmarks"
          >
            {batchEnrich.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
            <span>AI Notes</span>
          </button>

          {/* Clear Notes */}
          <button
            onClick={handleBatchClearNotes}
            disabled={batchClearNotes.isPending}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-ink-muted hover:text-ink text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50 whitespace-nowrap"
            title="Clear notes on selected bookmarks"
          >
            {batchClearNotes.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <Eraser className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
            )}
            <span>Clear Notes</span>
          </button>

          {/* Delete Action */}
          <button
            onClick={() => {
              sound.playClick(600);
              setShowDeleteConfirm(true);
            }}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 hover:text-rose-200 text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="Delete selected bookmarks"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Delete</span>
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
