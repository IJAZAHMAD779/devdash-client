"use client";

import React, { useRef, useEffect } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  FolderKanban,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";
import { SnippetPopover, SnippetPopoverOption } from "./snippet-popover";

interface SnippetsTopBarProps {
  totalCount: number;
  viewMode: "cards" | "list";
  onViewModeChange: (mode: "cards" | "list") => void;
  onNewSnippet: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projects?: { id: string; title: string }[];
  selectedProjectIds: string[];
  onProjectIdsChange: (ids: string[]) => void;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  starredCount: number;
  className?: string;
}

export function SnippetsTopBar({
  totalCount,
  viewMode,
  onViewModeChange,
  onNewSnippet,
  searchQuery,
  onSearchChange,
  projects = [],
  selectedProjectIds,
  onProjectIdsChange,
  onlyFavorites,
  onToggleFavorites,
  starredCount,
  className,
}: SnippetsTopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts: "/" to focus search, "N" for new snippet, "G"/"L" for view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onNewSnippet();
      } else if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        onViewModeChange("cards");
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        onViewModeChange("list");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewSnippet, onViewModeChange]);

  const projectOptions: SnippetPopoverOption<string>[] = projects.map((p) => ({
    value: p.id,
    label: p.title,
    icon: <FolderKanban className="w-3.5 h-3.5 text-ink-subtle" />,
  }));

  return (
    <div className={cn("flex flex-col gap-3 pb-3 border-b border-hairline", className)}>
      {/* Row 1: Title, Count, View Switcher, New Snippet */}
      <div className="flex items-center justify-between gap-3">
        {/* Title + Muted Mono Count */}
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold tracking-[-0.6px] text-ink">
            Code Snippets
          </h1>
          <span className="font-mono text-xs text-ink-subtle">
            {totalCount} {totalCount === 1 ? "snippet" : "snippets"}
          </span>
        </div>

        {/* View Switcher + New Snippet Button */}
        <div className="flex items-center gap-2">
          {/* View Toggle: Segmented control */}
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center p-0.5 rounded-[6px] bg-surface-1 border border-hairline"
          >
            <button
              type="button"
              onClick={() => {
                sound.playClick(850);
                onViewModeChange("cards");
              }}
              title="Grid view (G)"
              aria-label="Grid view (G)"
              aria-pressed={viewMode === "cards"}
              className={cn(
                "p-1.5 rounded-[4px] text-xs transition-colors",
                viewMode === "cards"
                  ? "bg-surface-2 text-ink shadow-sm"
                  : "text-ink-subtle hover:text-ink hover:bg-surface-2/40"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick(850);
                onViewModeChange("list");
              }}
              title="List view (L)"
              aria-label="List view (L)"
              aria-pressed={viewMode === "list"}
              className={cn(
                "p-1.5 rounded-[4px] text-xs transition-colors",
                viewMode === "list"
                  ? "bg-surface-2 text-ink shadow-sm"
                  : "text-ink-subtle hover:text-ink hover:bg-surface-2/40"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Snippet: Accent filled with N shortcut hint */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(900);
              onNewSnippet();
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors shadow-sm focus-visible:ring-1 focus-visible:ring-accent"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Snippet</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-black/25 px-1 py-0.2 rounded font-mono font-normal">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* Row 2: Search, Project Filter, Starred Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input: 32-36px, surface-2, 6px radius, "/" hint */}
        <div className="relative flex-1 min-w-[200px] h-8.5 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search snippets (title, code, tags)..."
            className="w-full h-full pl-8 pr-12 rounded-[6px] bg-surface-2 text-xs text-ink placeholder:text-ink-subtle/60 border border-hairline focus:border-hairline-strong focus:outline-none transition-colors font-mono"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-subtle hover:text-ink"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="text-[10px] font-mono text-ink-subtle/50 border border-hairline px-1 py-0.2 rounded bg-surface-1">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* Project Filter Popover */}
        <SnippetPopover
          mode="multi"
          searchable
          searchPlaceholder="Search projects..."
          placeholder="All Projects"
          options={projectOptions}
          value={selectedProjectIds}
          onChange={onProjectIdsChange}
          onClear={() => onProjectIdsChange([])}
          renderTrigger={(selected, isOpen) => {
            const count = selected.length;
            const isActive = count > 0;

            return (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 h-8.5 px-2.5 rounded-[6px] text-xs font-mono transition-colors border",
                  isOpen
                    ? "bg-surface-2 text-ink border-hairline-strong"
                    : isActive
                    ? "bg-surface-2 text-ink border-accent/40"
                    : "bg-surface-1 text-ink-muted border-hairline hover:bg-surface-2 hover:text-ink"
                )}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                <FolderKanban className="w-3.5 h-3.5 text-ink-subtle" />
                <span className="truncate max-w-[130px]">
                  {count === 0
                    ? "Projects"
                    : count === 1
                    ? selected[0].label
                    : `${count} Projects`}
                </span>
              </button>
            );
          }}
        />

        {/* Starred Filter Toggle */}
        <button
          type="button"
          onClick={() => {
            sound.playClick(750);
            onToggleFavorites();
          }}
          aria-pressed={onlyFavorites}
          className={cn(
            "inline-flex items-center gap-1.5 h-8.5 px-2.5 rounded-[6px] text-xs font-mono transition-colors border",
            onlyFavorites
              ? "bg-surface-2 text-ink border-warn/40"
              : "bg-surface-1 text-ink-muted border-hairline hover:bg-surface-2 hover:text-ink"
          )}
        >
          <Star
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              onlyFavorites ? "text-warn fill-warn" : "text-ink-subtle"
            )}
          />
          <span>Starred</span>
          <span className="text-[11px] text-ink-subtle font-mono">
            {starredCount}
          </span>
        </button>
      </div>
    </div>
  );
}
