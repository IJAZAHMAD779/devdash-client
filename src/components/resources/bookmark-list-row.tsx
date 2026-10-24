"use client";

import { useState } from "react";
import {
  Star,
  ArrowUpRight,
  Copy,
  Check,
  Edit2,
  Trash2,
  FolderKanban,
  Tag,
  Globe,
  ChevronDown,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useToggleBookmarkFavorite, useDeleteBookmark, useEnrichBookmark } from "@/hooks/use-bookmarks";
import { BookmarkFavicon } from "./bookmark-favicon";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Props {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
}

const getCategoryBadge = (cat: string) => {
  const normalized = (cat || "tools").toLowerCase();
  const preset = PRESET_BOOKMARK_CATEGORIES.find((p) => p.id === normalized);
  if (preset) {
    return {
      label: preset.label,
    };
  }
  return {
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
  };
};

export function BookmarkListRow({
  bookmark: bm,
  onEdit,
  isSelected = false,
  onToggleSelect,
}: Props) {
  const toggleFavorite = useToggleBookmarkFavorite();
  const deleteBookmark = useDeleteBookmark();
  const enrichBookmark = useEnrichBookmark();

  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuickEnrich = async (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(900);
    try {
      await enrichBookmark.mutateAsync(bm.id);
      setIsExpanded(true);
      sound.playSuccess();
      toast.success("AI Note Generated", {
        description: `Note generated for "${bm.title}".`,
      });
    } catch {
      toast.error("Could not generate note", {
        description: "Check backend GROQ_API_KEY configuration.",
      });
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(bm.url);
      sound.playSuccess();
      setCopied(true);
      toast.success("Link copied", { description: bm.url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate(bm.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBookmark.mutateAsync(bm.id);
      toast.success("Bookmark deleted", {
        description: `"${bm.title}" removed from vault.`,
      });
    } catch {
      toast.error("Failed to delete bookmark");
    }
  };

  const categoryConfig = getCategoryBadge(bm.category);
  const domain = getHostname(bm.url);

  return (
    <>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "group flex items-center justify-between px-3.5 sm:px-4 py-2.5 transition-colors duration-150 text-xs border-b border-hairline first:rounded-t-lg last:rounded-b-lg last:border-b-0 cursor-pointer",
          isSelected
            ? "bg-primary/[0.04] border-primary/40 ring-1 ring-inset ring-primary/30"
            : "bg-surface-1 hover:bg-surface-2/70"
        )}
      >
        {/* Left: Checkbox, Star, Favicon, Title, Domain, Project */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-4">
          {/* Checkbox */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick(isSelected ? 600 : 850);
                onToggleSelect(bm.id, e);
              }}
              className={cn(
                "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer shrink-0 -ml-1",
                isSelected
                  ? "bg-primary border-primary text-white shadow-xs"
                  : "border-hairline-strong bg-surface-2 hover:border-primary/60 opacity-50 group-hover:opacity-100"
              )}
              title={isSelected ? "Deselect bookmark" : "Select bookmark"}
              aria-checked={isSelected}
              role="checkbox"
            >
              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </button>
          )}

          {/* Star Button */}
          <button
            type="button"
            onClick={handleToggleStar}
            title={bm.favorite ? "Unstar bookmark" : "Star bookmark"}
            aria-label={bm.favorite ? "Unstar bookmark" : "Star bookmark"}
            className="p-1 -ml-1 transition-colors text-ink-subtle hover:text-amber-400 shrink-0 cursor-pointer"
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                bm.favorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-ink-tertiary hover:text-amber-400"
              )}
            />
          </button>

          {/* Favicon */}
          <BookmarkFavicon domain={domain} url={bm.url} size={16} />

          {/* Title & Notes snippet & Project */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick(950);
                }}
                className="font-medium tracking-[-0.1px] text-ink hover:text-primary transition-colors truncate max-w-sm sm:max-w-md cursor-pointer"
              >
                {bm.title}
              </a>
              {bm.project && (
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-3 border border-hairline font-mono text-[9px] text-ink-muted truncate max-w-[120px] shrink-0">
                  <FolderKanban className="w-2.5 h-2.5 text-primary shrink-0" />
                  <span className="truncate">{bm.project.title}</span>
                </span>
              )}
            </div>
            {!isExpanded && bm.notes && (
              <span className="text-[11px] text-ink-tertiary truncate hidden sm:block">
                {bm.notes}
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Category (Strictly Fixed Width) */}
        <div className="hidden sm:flex w-20 md:w-24 shrink-0 items-center justify-start">
          <span className="text-xs font-semibold text-ink tracking-tight truncate">
            {categoryConfig.label}
          </span>
        </div>

        {/* Column 3: Tags (Strictly Fixed Width — Placeheld if Missing) */}
        <div className="hidden lg:flex w-28 xl:w-32 shrink-0 items-center justify-start">
          {bm.tags && bm.tags.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-hairline font-mono text-[10px] text-ink-subtle truncate max-w-full">
              <Tag className="w-2 h-2 text-ink-tertiary shrink-0" />
              <span className="truncate">{bm.tags[0]}</span>
              {bm.tags.length > 1 && (
                <span className="text-ink-tertiary shrink-0">+{bm.tags.length - 1}</span>
              )}
            </span>
          ) : (
            <div className="w-full h-4" aria-hidden="true" />
          )}
        </div>

        {/* Column 4: Details Expand Chevron (Strictly Fixed Width) */}
        <div className="w-6 shrink-0 flex items-center justify-center">
          <span className="text-ink-tertiary group-hover:text-ink-muted transition-colors">
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-150",
                isExpanded && "rotate-180"
              )}
            />
          </span>
        </div>

        {/* Column 5: Action Buttons (Strictly Fixed Width) */}
        <div
          className="w-28 shrink-0 flex items-center justify-end gap-0.5 text-ink-subtle"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy link"}
            aria-label="Copy link"
            className="p-1.5 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-ink-tertiary hover:text-ink" />
            )}
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick(750);
              onEdit(bm);
            }}
            title="Edit bookmark"
            aria-label="Edit bookmark"
            className="p-1.5 rounded hover:bg-surface-3 hover:text-ink transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-ink-tertiary hover:text-ink" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            title="Delete bookmark"
            aria-label="Delete bookmark"
            className="p-1.5 rounded hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-ink-tertiary hover:text-rose-400" />
          </button>

          {/* External Visit Button */}
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick(950);
            }}
            title="Visit URL"
            aria-label="Visit bookmark URL"
            className="p-1.5 rounded text-ink-muted hover:text-primary transition-colors cursor-pointer flex items-center justify-center ml-0.5"
          >
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Expandable Notes & Tags Drawer */}
      {isExpanded && (
        <div className="px-4 py-2.5 bg-surface-2/40 border-b border-hairline/60 text-xs text-ink-muted leading-relaxed space-y-1.5 animate-in fade-in duration-150">
          {bm.notes ? (
            <p className="whitespace-pre-wrap">{bm.notes}</p>
          ) : (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[11px] text-ink-tertiary">No developer notes for this bookmark.</span>
              <button
                type="button"
                onClick={handleQuickEnrich}
                disabled={enrichBookmark.isPending}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer py-1 px-2.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 shrink-0"
                title="Generate developer note with AI"
              >
                {enrichBookmark.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                ) : (
                  <BrainCircuit className="w-3 h-3 text-indigo-400" />
                )}
                <span>Generate AI Note</span>
              </button>
            </div>
          )}
          {bm.tags && bm.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <Tag className="w-2.5 h-2.5 text-ink-subtle shrink-0" />
              {bm.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 text-ink-muted border border-hairline"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Bookmark"
        description={`Are you sure you want to remove "${bm.title}" from your bookmarks vault?`}
        confirmText="Delete Bookmark"
      />
    </>
  );
}
