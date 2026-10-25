"use client";

import React from "react";
import { Star, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";
import { LanguageDot, formatLanguageName } from "./language-dot";
import { FolderItem } from "./folder-rail";

interface FolderStripProps {
  folders: FolderItem[];
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  className?: string;
}

export function FolderStrip({
  folders,
  selectedFolder,
  onSelectFolder,
  className,
}: FolderStripProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto no-scrollbar border-b border-hairline py-1 flex items-center gap-1 shrink-0 select-none",
        className
      )}
    >
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
              "relative flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs whitespace-nowrap transition-colors shrink-0",
              isSelected
                ? "text-ink font-medium bg-surface-2/70"
                : "text-ink-muted hover:text-ink hover:bg-surface-2/40"
            )}
          >
            {folder.isAll ? (
              <Code2 className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
            ) : folder.isStarred ? (
              <Star className="w-3.5 h-3.5 text-warn fill-warn shrink-0" />
            ) : (
              <LanguageDot language={folder.id} className="shrink-0" />
            )}

            <span>
              {folder.isAll
                ? "All"
                : folder.isStarred
                ? "Starred"
                : formatLanguageName(folder.name)}
            </span>

            <span className="font-mono text-[10px] text-ink-subtle ml-0.5">
              {folder.count}
            </span>

            {/* Underline active indicator */}
            {isSelected && (
              <span className="absolute bottom-0 inset-x-2 h-[2px] bg-accent rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
