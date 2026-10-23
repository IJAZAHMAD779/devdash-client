"use client";

import { useState } from "react";
import {
  Star,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  FolderKanban,
  Tag,
  Globe,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useToggleBookmarkFavorite, useDeleteBookmark } from "@/hooks/use-bookmarks";
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
      badgeClass: preset.badgeClass,
    };
  }
  return {
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    badgeClass: "bg-surface-3 text-ink-muted border-hairline",
  };
};

export function BookmarkListRow({ bookmark: bm, onEdit }: Props) {
  const toggleFavorite = useToggleBookmarkFavorite();
  const deleteBookmark = useDeleteBookmark();

  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      <div className="group flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-surface-1 border-b border-hairline hover:bg-surface-2 transition-colors duration-150 text-xs first:rounded-t-lg last:rounded-b-lg last:border-b-0 select-none">
        {/* Left: Star, Favicon, Title, Domain */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          {/* Star Button */}
          <button
            type="button"
            onClick={handleToggleStar}
            title={bm.favorite ? "Unstar bookmark" : "Star bookmark"}
            aria-label={bm.favorite ? "Unstar bookmark" : "Star bookmark"}
            className="p-1 -ml-1 rounded hover:bg-surface-3 transition-colors text-ink-subtle hover:text-amber-400 shrink-0 cursor-pointer"
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
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt=""
            className="w-4 h-4 rounded-xs shrink-0 object-contain bg-surface-2 p-0.5"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />

          {/* Title & Notes snippet */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick(950)}
                className="font-medium tracking-[-0.1px] text-ink hover:text-primary transition-colors truncate max-w-sm sm:max-w-md"
              >
                {bm.title}
              </a>
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono text-ink-tertiary truncate">
                <Globe className="w-2.5 h-2.5 shrink-0" />
                {domain}
              </span>
            </div>
            {bm.notes && (
              <span className="text-[11px] text-ink-tertiary truncate hidden sm:block">
                {bm.notes}
              </span>
            )}
          </div>
        </div>

        {/* Middle: Category / Folder Badge & Project */}
        <div className="hidden sm:flex items-center gap-2 shrink-0 mr-4">
          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium truncate max-w-[120px]",
              categoryConfig.badgeClass
            )}
          >
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
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0 text-ink-subtle">
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy link"}
            aria-label="Copy link"
            className="p-1.5 rounded hover:bg-surface-3 hover:text-ink transition-colors cursor-pointer"
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
            onClick={() => {
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
            onClick={() => sound.playClick(950)}
            title="Visit URL"
            aria-label="Visit bookmark URL"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium border border-hairline transition-colors ml-1 cursor-pointer"
          >
            <span className="hidden sm:inline text-[11px]">Visit</span>
            <ExternalLink className="w-3 h-3 text-ink-tertiary" />
          </a>
        </div>
      </div>

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
