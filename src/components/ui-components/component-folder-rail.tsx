"use client";

import React from "react";
import { Star, Layers, Folder, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

export interface ComponentFolderItem {
  id: string; // "all" | "starred" | category name lowercase
  displayName: string;
  count: number;
  isStarred?: boolean;
  isAll?: boolean;
}

interface ComponentFolderRailProps {
  folders: ComponentFolderItem[];
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function ComponentFolderRail({
  folders,
  selectedFolder,
  onSelectFolder,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: ComponentFolderRailProps) {
  if (isCollapsed) {
    return (
      <aside
        className={cn(
          "w-10 shrink-0 border-r border-hairline py-3 flex flex-col items-center gap-2",
          className
        )}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              onToggleCollapse();
            }}
            title="Expand folders"
            aria-label="Expand folders"
            className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "w-[200px] shrink-0 border-r border-hairline py-3 pr-3 flex flex-col gap-4 select-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] font-mono tracking-[0.08em] uppercase text-ink-subtle font-semibold">
          Folders
        </span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              onToggleCollapse();
            }}
            title="Collapse folders rail"
            aria-label="Collapse folders rail"
            className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav list */}
      <nav className="flex flex-col gap-0.5" aria-label="Component folders">
        {folders.map((folder) => {
          const isSelected = selectedFolder.toLowerCase() === folder.id.toLowerCase();

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                sound.playClick(750);
                onSelectFolder(folder.id);
              }}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "relative group flex items-center justify-between h-8 px-2.5 rounded-[6px] text-xs transition-colors text-left",
                isSelected
                  ? "bg-surface-2 text-ink font-medium"
                  : "text-ink-muted hover:bg-surface-2/60 hover:text-ink"
              )}
            >
              {/* 2px accent bar on the left edge when active */}
              {isSelected && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-accent rounded-r" />
              )}

              <div className="flex items-center gap-2 truncate pr-2">
                {folder.isAll ? (
                  <Layers className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                ) : folder.isStarred ? (
                  <Star className="w-3.5 h-3.5 text-warn fill-warn shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                )}

                <span className="truncate capitalize">{folder.displayName}</span>
              </div>

              {/* Mono count */}
              <span
                className={cn(
                  "font-mono text-[11px] shrink-0",
                  isSelected ? "text-ink-muted" : "text-ink-subtle"
                )}
              >
                {folder.count}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
