"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  FolderKanban,
  PanelLeft,
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
  // Rail toggle
  isRailCollapsed?: boolean;
  onToggleRail?: () => void;
  // Project filter
  projects?: { id: string; title: string }[];
  selectedProjectIds: string[];
  onProjectIdsChange: (ids: string[]) => void;
  // Starred toggle
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
  isRailCollapsed = false,
  onToggleRail,
  projects = [],
  selectedProjectIds,
  onProjectIdsChange,
  onlyFavorites,
  onToggleFavorites,
  starredCount,
  className,
}: SnippetsTopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Keyboard shortcuts: "/" search, "N" new snippet, "G"/"L" view toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <div className={cn("flex flex-col gap-4 pb-4 border-b border-hairline", className)}>
      {/* Row 1: Title, Total Count, View switcher, New Snippet */}
      <div className="flex items-center justify-between gap-3">
        {/* Title + Muted Mono Total Count */}
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold tracking-[-0.6px] text-ink">
            Code Snippets Vault
          </h1>
          <span className="font-mono text-xs text-ink-subtle">
            {totalCount} {totalCount === 1 ? "snippet" : "snippets"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="h-9 p-0.5 rounded-[6px] bg-surface-1 border border-hairline inline-flex items-center"
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
                "h-8 w-8 inline-flex items-center justify-center rounded-[4px] text-xs transition-colors cursor-pointer",
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
                "h-8 w-8 inline-flex items-center justify-center rounded-[4px] text-xs transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-surface-2 text-ink shadow-sm"
                  : "text-ink-subtle hover:text-ink hover:bg-surface-2/40"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Snippet: Accent-filled button with quiet N hint */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(900);
              onNewSnippet();
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors shadow-sm focus-visible:ring-1 focus-visible:ring-accent cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Snippet</span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-white/70 ml-0.5">
              N
            </span>
          </button>
        </div>
      </div>

      {/* Row 2: Rail Toggle, Search, Project Filter, Starred Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Rail Toggle Button (leftmost in toolbar row) */}
        {onToggleRail && (
          <button
            type="button"
            onClick={onToggleRail}
            title={isRailCollapsed ? "Show folders" : "Hide folders"}
            aria-label={isRailCollapsed ? "Show folders" : "Hide folders"}
            className="h-9 w-9 shrink-0 rounded-[6px] inline-flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-surface-2 border border-hairline transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Search Input: fixed h-9 (36px), min-h-9, shrink-0, items-center, px-3, 6px radius, surface-2 */}
        <div className="relative flex-1 min-w-[220px] max-w-[420px] h-9 min-h-9 shrink-0 flex items-center px-3 rounded-[6px] bg-surface-2 border border-hairline focus-within:border-hairline-strong transition-colors">
          <Search className="w-3.5 h-3.5 text-ink-subtle shrink-0 pointer-events-none mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search snippets (title, code, tags)..."
            className="h-full w-full bg-transparent focus:outline-none text-xs text-ink placeholder:text-ink-subtle/60 font-mono"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="p-0.5 rounded text-ink-subtle hover:text-ink shrink-0 ml-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : !isSearchFocused ? (
            <span className="font-mono text-[11px] text-ink-subtle pointer-events-none shrink-0 ml-1">
              /
            </span>
          ) : null}
        </div>

        {/* Project Filter Popover */}
        <SnippetPopover<string>
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
                  "inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-[13px] font-mono transition-colors border cursor-pointer",
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
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-[13px] font-mono transition-colors border whitespace-nowrap cursor-pointer",
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
          <span className="text-[11px] text-ink-subtle font-mono tabular-nums">{starredCount}</span>
        </button>
      </div>
    </div>
  );
}
