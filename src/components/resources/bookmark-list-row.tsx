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

export function BookmarkListRow({ bookmark: bm, onEdit }: Props) {
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
  const hasDetails = Boolean(bm.notes || (bm.tags && bm.tags.length > 0));

  return (
    <>
      <div
        onClick={() => {
          if (hasDetails) setIsExpanded(!isExpanded);
        }}
        className={cn(
          "group flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-surface-1 border-b border-hairline hover:bg-surface-2/70 transition-colors duration-150 text-xs first:rounded-t-lg last:rounded-b-lg last:border-b-0",
          hasDetails && "cursor-pointer"
        )}
      >
        {/* Left: Star, Favicon, Title, Domain */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
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

          {/* Title & Notes snippet */}
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
            </div>
            {!isExpanded && bm.notes && (
              <span className="text-[11px] text-ink-tertiary truncate hidden sm:block">
                {bm.notes}
              </span>
            )}
          </div>
        </div>

        {/* Middle: Category & Project */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0 mr-4">
          <span className="text-xs font-bold text-ink tracking-tight truncate max-w-[120px]">
            {categoryConfig.label}
          </span>

          {bm.project && (
            <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-3 border border-hairline font-mono text-[10px] text-ink-muted truncate max-w-[120px]">
              <FolderKanban className="w-2.5 h-2.5 text-primary shrink-0" />
              <span className="truncate">{bm.project.title}</span>
            </span>
          )}

          {bm.tags && bm.tags.length > 0 && (
            <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-hairline font-mono text-[10px] text-ink-subtle">
              <Tag className="w-2 h-2 text-ink-tertiary" />
              <span>{bm.tags[0]}</span>
              {bm.tags.length > 1 && (
                <span className="text-ink-tertiary">+{bm.tags.length - 1}</span>
              )}
            </span>
          )}

          {hasDetails ? (
            <span className="text-ink-tertiary group-hover:text-ink-muted transition-colors">
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-150",
                  isExpanded && "rotate-180"
                )}
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={handleQuickEnrich}
              disabled={enrichBookmark.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer py-0.5 px-2 rounded hover:bg-indigo-500/10 shrink-0"
              title="Generate developer note with AI"
            >
              {enrichBookmark.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              ) : (
                <BrainCircuit className="w-3 h-3 text-indigo-400" />
              )}
              <span className="hidden sm:inline">AI Note</span>
            </button>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1 shrink-0 text-ink-subtle" onClick={(e) => e.stopPropagation()}>
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

          {/* External Visit Button - diagonal arrow with no background */}
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
      {isExpanded && hasDetails && (
        <div className="px-4 py-2.5 bg-surface-2/40 border-b border-hairline/60 text-xs text-ink-muted leading-relaxed space-y-1.5 animate-in fade-in duration-150">
          {bm.notes && <p className="whitespace-pre-wrap">{bm.notes}</p>}
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
