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
  MoreVertical,
  ChevronDown,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useToggleBookmarkFavorite, useEnrichBookmark } from "@/hooks/use-bookmarks";
import { BookmarkFavicon } from "./bookmark-favicon";
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
    };
  }
  return {
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
  };
};

export function BookmarkCard({ bookmark: bm, onEdit, onDelete }: BookmarkCardProps) {
  const toggleFavorite = useToggleBookmarkFavorite();
  const enrichBookmark = useEnrichBookmark();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const domain = getHostname(bm.url);
  const categoryConfig = getCategoryBadge(bm.category);
  const hasDetails = Boolean(bm.notes || (bm.tags && bm.tags.length > 0));

  return (
    <div
      onClick={() => {
        if (hasDetails) setIsExpanded(!isExpanded);
      }}
      className={cn(
        "rounded-xl bg-surface-1 border border-hairline hover:border-primary/40 hover:shadow-[0_0_24px_-4px_rgba(37,99,235,0.12)] transition-all duration-200 overflow-hidden flex flex-col group relative",
        hasDetails && "cursor-pointer"
      )}
    >
      {/* Card Header */}
      <div className="p-3.5 sm:p-4 border-b border-hairline/80 flex items-start justify-between gap-2.5 bg-surface-1/60">
        <div className="flex-1 min-w-0">
          {/* Domain & Category label */}
          <div className="flex items-center gap-2 mb-2">
            <BookmarkFavicon domain={domain} url={bm.url} size={16} />
            <span className="text-xs font-bold text-ink tracking-tight">
              {categoryConfig.label}
            </span>
          </div>

          {/* Title */}
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold tracking-[-0.2px] text-ink hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] flex items-center cursor-pointer"
            title={bm.title}
          >
            {bm.title}
          </a>
        </div>

        {/* Top Right Actions: Star + Menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleToggleStar}
            className={cn(
              "p-1 transition-all cursor-pointer",
              bm.favorite
                ? "text-amber-400"
                : "text-ink-tertiary hover:text-amber-400 opacity-60 group-hover:opacity-100"
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

      {/* Notes & Tags Drawer (Expands/Collapses on Click) */}
      {isExpanded && hasDetails && (
        <div className="p-3.5 border-t border-hairline/60 bg-surface-2/40 text-xs text-ink-muted leading-relaxed space-y-2 animate-in fade-in duration-150">
          {bm.notes && <p className="whitespace-pre-wrap">{bm.notes}</p>}
          {bm.tags && bm.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
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

      {/* Footer with External Link, Copy, and Project Pill */}
      <div className="px-3.5 sm:p-4 py-2.5 border-t border-hairline/60 bg-surface-1/40 flex items-center justify-between text-xs mt-auto">
        <div className="flex items-center gap-2 truncate min-w-0 mr-2">
          {bm.project && (
            <span className="text-[11px] text-ink-tertiary flex items-center gap-1 truncate font-mono">
              <FolderKanban className="w-3 h-3 shrink-0" />
              <span className="truncate">{bm.project.title}</span>
            </span>
          )}
          {hasDetails ? (
            <span className="text-[11px] text-ink-tertiary group-hover:text-ink flex items-center gap-1 font-mono transition-colors">
              <span>{isExpanded ? "Hide notes" : "Notes"}</span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform duration-150",
                  isExpanded && "rotate-180"
                )}
              />
            </span>
          ) : (
            <button
              type="button"
              onClick={handleQuickEnrich}
              disabled={enrichBookmark.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-indigo-500/10 shrink-0"
              title="Generate developer note with AI"
            >
              {enrichBookmark.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              ) : (
                <BrainCircuit className="w-3 h-3 text-indigo-400" />
              )}
              <span>AI Note</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Copy URL with Icon Swap */}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "p-1.5 text-xs transition-all duration-150 cursor-pointer flex items-center justify-center",
              copied
                ? "text-emerald-400"
                : "text-ink-muted hover:text-ink"
            )}
            title="Copy URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 animate-in zoom-in-75 duration-150" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Visit link - diagonal arrow with no background */}
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.playClick(950)}
            className="p-1.5 rounded-md text-ink-muted hover:text-primary transition-colors cursor-pointer flex items-center justify-center"
            title="Visit URL"
          >
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
