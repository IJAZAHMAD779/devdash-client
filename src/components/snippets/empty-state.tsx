"use client";

import React from "react";
import { Plus } from "lucide-react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "no-snippets" | "no-matches" | "empty-folder";
  folderName?: string;
  searchQuery?: string;
  onNewSnippet?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

export function EmptyState({
  type,
  folderName,
  searchQuery,
  onNewSnippet,
  onClearFilters,
  className,
}: EmptyStateProps) {
  if (type === "no-snippets") {
    return (
      <div
        className={cn(
          "w-full h-44 rounded-lg border border-dashed border-hairline flex flex-col items-center justify-center p-6 text-center gap-3",
          className
        )}
      >
        <p className="text-xs text-ink-muted font-mono">
          Your code vault is empty. No snippets saved yet.
        </p>
        {onNewSnippet && (
          <button
            type="button"
            onClick={() => {
              sound.playClick(850);
              onNewSnippet();
            }}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[6px] text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Snippet</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-36 rounded-lg border border-dashed border-hairline flex flex-col items-center justify-center p-6 text-center gap-2",
        className
      )}
    >
      <p className="text-xs text-ink-muted font-mono">
        {type === "no-matches"
          ? searchQuery
            ? `No snippets matching "${searchQuery}".`
            : "No snippets match the selected filters."
          : `No snippets found in ${folderName || "this folder"}.`}
      </p>
      {onClearFilters && (
        <button
          type="button"
          onClick={() => {
            sound.playClick(650);
            onClearFilters();
          }}
          className="text-xs font-mono text-accent hover:text-accent/80 transition-colors underline underline-offset-4"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
