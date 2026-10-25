"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Star,
  ArrowUpRight,
  Copy,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  BrainCircuit,
  Loader2,
  MoreHorizontal,
  FolderKanban,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useToggleBookmarkFavorite, useEnrichBookmark } from "@/hooks/use-bookmarks";
import { BookmarkFavicon } from "./bookmark-favicon";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { decodeEntities } from "@/lib/decode-entities";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  selectionMode?: boolean;
  showCategory?: boolean;
}

const getCategoryLabel = (cat: string) => {
  const normalized = (cat || "tools").toLowerCase();
  const preset = PRESET_BOOKMARK_CATEGORIES.find((p) => p.id === normalized);
  return preset ? preset.label : cat.charAt(0).toUpperCase() + cat.slice(1);
};

export function BookmarkCard({
  bookmark: bm,
  onEdit,
  onDelete,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
  showCategory = false,
}: BookmarkCardProps) {
  const toggleFavorite = useToggleBookmarkFavorite();
  const enrichBookmark = useEnrichBookmark();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [menuOpen]);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
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
  const categoryLabel = getCategoryLabel(bm.category);
  const decodedTitle = decodeEntities(bm.title);
  const decodedNotes = decodeEntities(bm.notes);

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "104px",
      }}
      className={cn(
        "rounded-[8px] bg-surface-1 border transition-all duration-150 overflow-hidden flex flex-col group relative select-none cursor-pointer",
        isSelected
          ? "border-accent/60 bg-surface-2/60 ring-1 ring-accent/40 shadow-xs"
          : "border-hairline hover:border-hairline-strong hover:bg-surface-1/80"
      )}
    >
      {/* Top Main Section */}
      <div className="p-3 pb-2 flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Row 1: Checkbox (hover/selection) + Favicon + Title + Actions (Star & Menu) */}
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Checkbox: hidden until hover/focus-within or selectionMode */}
          {onToggleSelect && (
            <div
              className={cn(
                "pt-0.5 shrink-0 transition-opacity duration-150",
                isSelected || selectionMode
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick(isSelected ? 600 : 850);
                onToggleSelect(bm.id, e);
              }}
            >
              <div
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                className={cn(
                  "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all cursor-pointer",
                  isSelected
                    ? "bg-accent border-accent text-white"
                    : "border-hairline-strong bg-surface-2 hover:border-accent"
                )}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
          )}

          {/* Favicon tile (28px light neutral tile with 20px icon) */}
          <BookmarkFavicon
            domain={domain}
            url={bm.url}
            variant="card"
            tileSize={28}
            size={18}
          />

          {/* Title */}
          <div className="flex-1 min-w-0">
            <a
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[14px] font-medium tracking-tight text-ink hover:text-accent transition-colors line-clamp-2 leading-snug cursor-pointer"
              title={decodedTitle}
            >
              {decodedTitle}
            </a>
          </div>

          {/* Top-right actions: Star + ⋯ Menu */}
          <div
            className="flex items-center gap-0.5 shrink-0 -mt-0.5 -mr-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleToggleStar}
              className={cn(
                "p-1 rounded-[4px] transition-all cursor-pointer",
                bm.favorite
                  ? "text-warn"
                  : "text-ink-subtle opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-warn"
              )}
              title={bm.favorite ? "Unstar bookmark" : "Star bookmark"}
              aria-label={bm.favorite ? "Unstar bookmark" : "Star bookmark"}
            >
              <Star
                className={cn("w-3.5 h-3.5", bm.favorite && "fill-warn")}
              />
            </button>

            {/* "⋯" Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-[4px] text-ink-subtle opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-ink hover:bg-surface-2 transition-all cursor-pointer"
                title="Bookmark actions"
                aria-label="Bookmark actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 rounded-[8px] bg-surface-1 border border-hairline-strong shadow-xl py-1 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(bm);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 text-ink-muted hover:text-ink hover:bg-surface-2 text-left cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-ink-subtle" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(bm);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 text-danger hover:bg-danger/10 text-left cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: mono 11px text-subtle: domain and category only when showCategory is true */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-ink-subtle leading-tight pl-[38px]">
          <span className="truncate">{domain}</span>
          {showCategory && (
            <>
              <span>·</span>
              <span className="truncate text-ink-muted">{categoryLabel}</span>
            </>
          )}
          {bm.project && (
            <>
              <span>·</span>
              <span className="truncate text-ink-muted flex items-center gap-1">
                <FolderKanban className="w-2.5 h-2.5 text-ink-subtle shrink-0" />
                <span>{bm.project.title}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Footer: Notes expander indicator + Right Action Buttons */}
      <div className="px-3 py-1.5 border-t border-hairline/60 bg-surface-1/40 flex items-center justify-between text-xs mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-subtle group-hover:text-ink-muted transition-colors">
          <span>{isExpanded ? "Hide notes" : "Notes"}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 transition-transform duration-150",
              isExpanded && "rotate-180"
            )}
          />
        </div>

        {/* Right Actions: Copy & Open */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="w-7 h-7 rounded-[4px] hover:bg-surface-2 text-ink-subtle hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
            title="Copy URL"
            aria-label="Copy URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-ok" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.playClick(950)}
            className="w-7 h-7 rounded-[4px] hover:bg-surface-2 text-ink-subtle hover:text-accent flex items-center justify-center transition-colors cursor-pointer"
            title="Open link"
            aria-label="Open link"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Expandable Notes & Tags Drawer */}
      {isExpanded && (
        <div className="p-3 border-t border-hairline bg-surface-2/30 text-xs text-ink-muted leading-relaxed space-y-2.5 select-text">
          {decodedNotes ? (
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed">
              {decodedNotes}
            </p>
          ) : (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[11px] text-ink-subtle">
                No developer notes for this bookmark.
              </span>
              <button
                type="button"
                onClick={handleQuickEnrich}
                disabled={enrichBookmark.isPending}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent hover:underline transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Generate developer note with AI"
              >
                {enrichBookmark.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BrainCircuit className="w-3 h-3" />
                )}
                <span>Generate AI Note</span>
              </button>
            </div>
          )}

          {/* Tags */}
          {bm.tags && bm.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {bm.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-surface-2 text-ink-subtle border border-hairline select-none"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
