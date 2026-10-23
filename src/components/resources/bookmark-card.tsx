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
  MoreVertical,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useToggleBookmarkFavorite } from "@/hooks/use-bookmarks";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
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

export function BookmarkCard({ bookmark: bm, onEdit, onDelete }: BookmarkCardProps) {
  const toggleFavorite = useToggleBookmarkFavorite();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    sound.playClick(bm.favorite ? 600 : 900);
    toggleFavorite.mutate(bm.id);
  };

  const domain = getHostname(bm.url);
  const categoryConfig = getCategoryBadge(bm.category);

  return (
    <div className="rounded-xl bg-surface-1 border border-hairline hover:border-hairline-strong transition-all duration-200 overflow-hidden shadow-sm flex flex-col group relative">
      {/* Card Header */}
      <div className="p-3.5 sm:p-4 border-b border-hairline/80 flex items-start justify-between gap-2.5 bg-surface-1/60">
        <div className="flex-1 min-w-0">
          {/* Domain & Category badges */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt=""
              className="w-4 h-4 rounded-xs shrink-0 object-contain bg-surface-2 p-0.5"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium",
                categoryConfig.badgeClass
              )}
            >
              {categoryConfig.label}
            </span>
            <span className="text-[11px] font-mono text-ink-tertiary flex items-center gap-1 truncate">
              <Globe className="w-2.5 h-2.5 shrink-0" />
              {domain}
            </span>
          </div>

          {/* Title */}
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold tracking-[-0.2px] text-ink hover:text-primary transition-colors line-clamp-1 block cursor-pointer"
            title={bm.title}
          >
            {bm.title}
          </a>
        </div>

        {/* Top Right Actions: Star + Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleStar}
            className={cn(
              "p-1.5 rounded-md transition-all cursor-pointer",
              bm.favorite
                ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-ink-tertiary hover:text-amber-400 hover:bg-surface-2 opacity-60 group-hover:opacity-100"
            )}
            title={bm.favorite ? "Unstar bookmark" : "Star as favorite"}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-150 active:scale-125",
                bm.favorite ? "fill-amber-400 text-amber-400" : "stroke-current"
              )}
            />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-32 rounded-lg bg-surface-2 border border-hairline shadow-lg py-1 z-30 text-xs animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(bm);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-ink-muted hover:text-ink hover:bg-surface-3 text-left transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setMenuOpen(false);
                      onDelete(bm);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-semantic-error hover:bg-semantic-error/10 text-left transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes / Description */}
      {bm.notes && (
        <div className="p-3.5 sm:p-4 text-xs text-ink-muted line-clamp-2 leading-relaxed flex-1">
          {bm.notes}
        </div>
      )}

      {/* Tags */}
      {bm.tags && bm.tags.length > 0 && (
        <div className="px-3.5 sm:px-4 py-2 border-t border-hairline/40 bg-surface-1/20 flex items-center gap-1.5 flex-wrap">
          <Tag className="w-2.5 h-2.5 text-ink-subtle shrink-0" />
          {bm.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-ink-muted border border-hairline"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer with External Link, Copy, and Project Pill */}
      <div className="px-3.5 sm:px-4 py-2.5 border-t border-hairline/60 bg-surface-1/40 flex items-center justify-between text-xs mt-auto">
        <div className="flex items-center gap-2 truncate min-w-0 mr-2">
          {bm.project ? (
            <span className="text-[11px] text-ink-tertiary flex items-center gap-1 truncate font-mono">
              <FolderKanban className="w-3 h-3 shrink-0" />
              <span className="truncate">{bm.project.title}</span>
            </span>
          ) : (
            <span className="text-[11px] text-ink-subtle font-mono">Workspace</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy URL with Icon Swap */}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "p-1.5 rounded-md border text-xs transition-all duration-150 cursor-pointer flex items-center justify-center",
              copied
                ? "bg-semantic-success/15 border-semantic-success/30 text-semantic-success"
                : "bg-surface-2 hover:bg-surface-3 border-hairline text-ink-muted hover:text-ink"
            )}
            title="Copy URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 animate-in zoom-in-75 duration-150" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Visit link */}
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.playClick(950)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium border border-hairline transition-colors shrink-0 group/link"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3 text-ink-tertiary group-hover/link:text-primary transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}
