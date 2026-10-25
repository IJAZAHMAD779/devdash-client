"use client";

import React from "react";
import { Star } from "lucide-react";
import { Snippet } from "@/types/snippet";
import { useToggleSnippetFavorite } from "@/hooks/use-snippets";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { CodePreview } from "./code-preview";
import { CopyButton } from "./copy-button";
import { LanguageDot, formatLanguageName } from "./language-dot";
import { TagList } from "./tag-list";

interface SnippetCardProps {
  snippet: Snippet;
  onView: (snippet: Snippet) => void;
  onEdit?: (snippet: Snippet) => void;
  showLanguage?: boolean;
}

function formatRelativeTime(dateString?: string): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function SnippetCard({
  snippet,
  onView,
  showLanguage = true,
}: SnippetCardProps) {
  const toggleFavorite = useToggleSnippetFavorite();
  const relativeTime = formatRelativeTime(snippet.updatedAt || snippet.createdAt);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(850);
    toggleFavorite.mutate({
      id: snippet.id,
      favorite: !snippet.favorite,
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        sound.playClick(800);
        onView(snippet);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(snippet);
        }
      }}
      className="group relative flex flex-col rounded-lg bg-surface-1 border border-hairline hover:border-hairline-strong transition-colors cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent select-none"
    >
      {/* 1. Code preview fills top: Shiki output, line numbers, 8-9 lines, bottom fade */}
      <div className="relative w-full overflow-hidden">
        <CodePreview
          code={snippet.code}
          language={snippet.language}
          snippetId={snippet.id}
          updatedAt={snippet.updatedAt}
          maxLines={9}
        />

        {/* 3. Hover/focus-within actions (top-right of preview): Copy & Star */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity max-[768px]:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Copy Button */}
          <CopyButton
            textToCopy={snippet.code}
            className="h-7 w-7 bg-surface-1/90 backdrop-blur-xs border border-hairline hover:border-hairline-strong"
          />

          {/* Star Toggle Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={snippet.favorite ? "Unstar snippet" : "Star snippet"}
            className={cn(
              "h-7 w-7 rounded-[6px] flex items-center justify-center transition-colors border",
              snippet.favorite
                ? "bg-surface-1/90 border-warn/40 text-warn !opacity-100"
                : "bg-surface-1/90 border-hairline text-ink-subtle hover:text-ink hover:border-hairline-strong"
            )}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                snippet.favorite ? "text-warn fill-warn" : ""
              )}
            />
          </button>
        </div>

        {/* If starred, show star badge on top right if not hovered on desktop */}
        {snippet.favorite && (
          <div className="absolute top-2 right-2 z-0 group-hover:hidden max-[768px]:hidden pointer-events-none">
            <div className="h-7 w-7 rounded-[6px] bg-surface-1/90 border border-warn/30 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-warn fill-warn" />
            </div>
          </div>
        )}
      </div>

      {/* 2. Footer: Hairline above, title, second line with language/tags/updated */}
      <div className="flex flex-col gap-1 p-3 border-t border-hairline bg-surface-1">
        {/* Title: 14px, medium, truncate */}
        <span className="text-sm font-medium text-ink truncate leading-tight">
          {snippet.title}
        </span>

        {/* Meta line: Language dot + name, tags, relative time */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-ink-subtle truncate pt-0.5">
          <div className="flex items-center gap-2 truncate">
            {showLanguage && (
              <span className="inline-flex items-center gap-1.5 truncate">
                <LanguageDot language={snippet.language} className="shrink-0" />
                <span className="truncate">{formatLanguageName(snippet.language)}</span>
              </span>
            )}

            {snippet.tags && snippet.tags.length > 0 && (
              <TagList tags={snippet.tags} maxDisplay={2} />
            )}
          </div>

          {relativeTime && (
            <span className="shrink-0 text-ink-subtle/80 text-[10px]">
              updated {relativeTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
