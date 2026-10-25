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
import { cn, stripMarkdown } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { decodeEntities } from "@/lib/decode-entities";

interface BookmarkListRowProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
  selectionMode?: boolean;
  showCategory?: boolean;
  hasAnyTags?: boolean;
  gridTemplate?: string;
}

const getCategoryLabel = (cat: string) => {
  const normalized = (cat || "tools").toLowerCase();
  const preset = PRESET_BOOKMARK_CATEGORIES.find((p) => p.id === normalized);
  return preset ? preset.label : cat.charAt(0).toUpperCase() + cat.slice(1);
};

export function BookmarkListRow({
  bookmark: bm,
  onEdit,
  onDelete,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
  showCategory = true,
  hasAnyTags = true,
  gridTemplate,
}: BookmarkListRowProps) {
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

  // Extract first clean line of notes for second line preview
  const firstLineDescription = decodedNotes
    ? stripMarkdown(decodedNotes.split("\n")[0]).trim()
    : "";

  return (
    <div
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "52px",
      }}
      className={cn(
        "border-b border-hairline/60 transition-colors select-none group flex flex-col",
        isSelected
          ? "bg-surface-2/70"
          : "hover:bg-surface-2/40"
      )}
    >
      {/* 52px Primary Row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full min-h-[52px] h-[52px] px-3.5 flex items-center cursor-pointer text-left"
      >
        <div
          className="w-full grid items-center gap-3"
          style={{
            gridTemplateColumns:
              gridTemplate ||
              `24px 32px minmax(240px, 1fr) ${showCategory ? "112px " : ""}${hasAnyTags ? "168px " : ""}120px`,
          }}
        >
          {/* Col 1: Select Checkbox (24px) */}
          <div
            className="flex items-center justify-center shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSelect) {
                sound.playClick(isSelected ? 600 : 850);
                onToggleSelect(bm.id, e);
              }
            }}
          >
            {onToggleSelect && (
              <div
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                className={cn(
                  "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all cursor-pointer",
                  isSelected
                    ? "bg-accent border-accent text-white"
                    : "border-hairline-strong bg-surface-2 hover:border-accent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                  selectionMode && "opacity-100"
                )}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            )}
          </div>

          {/* Col 2: Star (32px) */}
          <div
            className="flex items-center justify-center shrink-0"
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
          </div>

          {/* Col 3: Name (Favicon + Two-line column: title, domain · desc) */}
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <BookmarkFavicon
              domain={domain}
              url={bm.url}
              variant="row"
              tileSize={22}
              size={14}
            />

            <div className="flex flex-col min-w-0 flex-1 justify-center leading-tight">
              {/* Line 1: Full title */}
              <div className="flex items-center gap-2 min-w-0">
                <a
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[13px] font-medium text-ink hover:text-accent transition-colors truncate cursor-pointer"
                  title={decodedTitle}
                >
                  {decodedTitle}
                </a>

                {bm.project && (
                  <span className="hidden xl:inline-flex items-center gap-1 font-mono text-[10px] text-ink-subtle truncate max-w-[120px] shrink-0">
                    <FolderKanban className="w-2.5 h-2.5 text-ink-subtle shrink-0" />
                    <span className="truncate">{bm.project.title}</span>
                  </span>
                )}
              </div>

              {/* Line 2: mono 11px text-subtle: domain · description */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-subtle truncate min-w-0 mt-0.5">
                <span className="shrink-0">{domain}</span>
                {firstLineDescription && (
                  <>
                    <span className="shrink-0">·</span>
                    <span className="truncate text-ink-subtle">
                      {firstLineDescription}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Col 4: Category (112px, hidden inside specific folder) */}
          {showCategory && (
            <div className="hidden sm:flex items-center min-w-0">
              <span className="text-xs font-mono text-ink-muted truncate">
                {categoryLabel}
              </span>
            </div>
          )}

          {/* Col 5: Tags (168px, quiet mono text) */}
          {hasAnyTags && (
            <div className="hidden lg:flex items-center min-w-0">
              {bm.tags && bm.tags.length > 0 ? (
                <span className="font-mono text-[11px] text-ink-subtle truncate">
                  #{bm.tags[0]}
                  {bm.tags.length > 1 && (
                    <span className="text-ink-subtle/80 ml-1">
                      +{bm.tags.length - 1}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-ink-subtle/40 text-[11px] font-mono">—</span>
              )}
            </div>
          )}

          {/* Col 6: Actions (120px, reserved width so hover causes no layout shift) */}
          <div
            className="flex items-center justify-end gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edit: hover / focus-within */}
            <button
              type="button"
              onClick={() => onEdit(bm)}
              className="w-7 h-7 rounded-[4px] hover:bg-surface-2 text-ink-subtle hover:text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity cursor-pointer"
              title="Edit bookmark"
              aria-label="Edit bookmark"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Copy URL */}
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

            {/* Open External */}
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

            {/* "⋯" Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-7 h-7 rounded-[4px] text-ink-subtle hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer"
                title="More actions"
                aria-label="More actions"
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

            {/* Chevron notes drawer indicator */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-7 flex items-center justify-center text-ink-subtle group-hover:text-ink-muted transition-colors cursor-pointer"
              title={isExpanded ? "Collapse notes" : "Expand notes"}
              aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
            >
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform duration-150",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Notes & Tags Drawer */}
      {isExpanded && (
        <div className="px-14 py-3 border-t border-hairline bg-surface-2/30 text-xs text-ink-muted leading-relaxed space-y-2 select-text">
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
