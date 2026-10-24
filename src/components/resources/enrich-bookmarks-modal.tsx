"use client";

import { useState } from "react";
import {
  X,
  BrainCircuit,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Folder,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useBatchEnrichBookmarks } from "@/hooks/use-bookmarks";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  currentCategory?: string;
}

export function EnrichBookmarksModal({
  isOpen,
  onClose,
  bookmarks,
  currentCategory = "ALL",
}: Props) {
  const enrichMutation = useBatchEnrichBookmarks();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentCategory !== "FAVORITES" ? currentCategory : "ALL"
  );
  const [batchLimit, setBatchLimit] = useState<number>(25);
  const [lastResult, setLastResult] = useState<{
    enrichedCount: number;
    bookmarks: Bookmark[];
  } | null>(null);

  if (!isOpen) return null;

  // Filter bookmarks without notes or with legacy template/fallback notes
  const isEligibleForEnrichment = (bm: Bookmark) =>
    !bm.notes ||
    bm.notes.trim() === "" ||
    bm.notes.startsWith("Developer bookmark for") ||
    bm.notes.includes("Web resource and developer utility.");

  const emptyNoteBookmarks = bookmarks.filter(isEligibleForEnrichment);
  const categoryEmptyBookmarks =
    selectedCategory === "ALL"
      ? emptyNoteBookmarks
      : emptyNoteBookmarks.filter(
          (bm) => (bm.category || "tools").toLowerCase() === selectedCategory.toLowerCase()
        );

  const handleStartEnrichment = async () => {
    if (categoryEmptyBookmarks.length === 0 || enrichMutation.isPending) return;

    sound.playClick(900);
    setLastResult(null);

    try {
      const response = await enrichMutation.mutateAsync({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        limit: batchLimit,
      });

      setLastResult(response);
      sound.playSuccess();
      toast.success("AI Notes Generated", {
        description: `Successfully enriched ${response.enrichedCount} bookmarks with developer notes.`,
      });
    } catch (err: any) {
      toast.error("Enrichment Failed", {
        description:
          err?.response?.data?.error?.message ||
          err?.message ||
          "Could not auto-generate notes. Please check that GROQ_API_KEY is configured on the backend.",
      });
    }
  };

  const handleClose = () => {
    if (enrichMutation.isPending) return;
    sound.playClick(600);
    setLastResult(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrich-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg bg-surface-1 border border-hairline-strong rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-hairline flex items-center justify-between bg-surface-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 id="enrich-modal-title" className="text-sm font-semibold text-ink">
                Auto-Generate Notes with AI
              </h2>
              <p className="text-[11px] text-ink-muted">
                Synthesize concise developer summaries and tags for imported links
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={enrichMutation.isPending}
            className="p-1.5 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Metric Card */}
          <div className="p-3.5 rounded-lg bg-surface-2 border border-hairline flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-ink-tertiary uppercase tracking-wider block">
                Bookmarks Needing Notes
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-semibold text-ink">
                  {categoryEmptyBookmarks.length}
                </span>
                <span className="text-xs text-ink-muted">
                  out of {bookmarks.length} total bookmarks
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Groq AI Engine
              </span>
            </div>
          </div>

          {lastResult ? (
            /* Results Screen */
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-300">
                    Enriched {lastResult.enrichedCount} bookmarks!
                  </p>
                  <p className="text-emerald-400/80 mt-0.5">
                    Developer notes and tags have been automatically saved to your workspace.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lastResult.bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-2.5 rounded-md bg-surface-2 border border-hairline text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink truncate">{bm.title}</span>
                      <span className="text-[10px] font-mono text-ink-tertiary uppercase">
                        {bm.category}
                      </span>
                    </div>
                    {bm.notes && (
                      <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">
                        {bm.notes}
                      </p>
                    )}
                    {bm.tags && bm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {bm.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-3 text-ink-subtle"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Configuration Form */
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Target Folder / Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="ALL">All Categories ({emptyNoteBookmarks.length} empty)</option>
                  {PRESET_BOOKMARK_CATEGORIES.map((cat) => {
                    const count = emptyNoteBookmarks.filter(
                      (b) => (b.category || "tools").toLowerCase() === cat.id
                    ).length;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({count} empty)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Batch Limit */}
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Batch Processing Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBatchLimit(size)}
                      className={cn(
                        "py-2 px-3 rounded-md border text-xs font-medium transition-colors text-center cursor-pointer",
                        batchLimit === size
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-surface-2 border-hairline text-ink-muted hover:text-ink"
                      )}
                    >
                      {size} bookmarks
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-lg bg-surface-2/60 border border-hairline text-[11px] text-ink-muted leading-relaxed">
                <p>
                  <strong>Zero-effort note generation:</strong> DevDash AI scans each URL domain and
                  page title to synthesize a concise 1-2 sentence developer summary and 2-3 tags.
                  Existing notes will never be overwritten.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 px-5 border-t border-hairline flex items-center justify-between bg-surface-1 shrink-0">
          <button
            onClick={handleClose}
            disabled={enrichMutation.isPending}
            className="px-3.5 py-1.5 rounded-md border border-hairline text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            {lastResult ? "Done" : "Cancel"}
          </button>

          {!lastResult && (
            <button
              onClick={handleStartEnrichment}
              disabled={categoryEmptyBookmarks.length === 0 || enrichMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium tracking-tight shadow-sm shadow-indigo-600/25 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              {enrichMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating AI Notes...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>
                    Auto-Note {Math.min(batchLimit, categoryEmptyBookmarks.length)} Bookmarks
                  </span>
                </>
              )}
            </button>
          )}

          {lastResult && categoryEmptyBookmarks.length > 0 && (
            <button
              onClick={handleStartEnrichment}
              disabled={enrichMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Enrich Next Batch ({categoryEmptyBookmarks.length} remaining)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
