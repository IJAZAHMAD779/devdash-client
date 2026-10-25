"use client";

import React from "react";
import { Star, Layers, Folder } from "lucide-react";
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
  className?: string;
}

export function ComponentFolderRail({
  folders,
  selectedFolder,
  onSelectFolder,
  isCollapsed = false,
  className,
}: ComponentFolderRailProps) {
  if (isCollapsed) {
    return null;
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
                "relative group flex items-center justify-between h-8 px-2.5 rounded-[6px] text-xs transition-colors text-left cursor-pointer",
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
                  "font-mono text-[11px] shrink-0 tabular-nums",
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
