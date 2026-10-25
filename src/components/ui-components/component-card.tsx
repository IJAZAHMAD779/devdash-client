"use client";

import React from "react";
import { Star } from "lucide-react";
import { UIComponentItem } from "@/types/component";
import { useToggleComponentFavorite } from "@/hooks/use-components";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { CodePreview } from "@/components/snippets/code-preview";
import { CopyButton } from "@/components/snippets/copy-button";

interface ComponentCardProps {
  component: UIComponentItem;
  onViewCode: (component: UIComponentItem) => void;
  onEdit?: (component: UIComponentItem) => void;
  showCategory?: boolean;
}

export function ComponentCard({
  component,
  onViewCode,
  showCategory = true,
}: ComponentCardProps) {
  const toggleFavorite = useToggleComponentFavorite();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(850);
    toggleFavorite.mutate({
      id: component.id,
      favorite: !component.favorite,
    });
  };

  const getLanguage = () => {
    if (component.framework === "VUE") return "html";
    if (component.framework === "SVELTE") return "html";
    if (component.framework === "HTML_CSS") return "html";
    return "typescript";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        sound.playClick(800);
        onViewCode(component);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewCode(component);
        }
      }}
      className="group relative flex flex-col rounded-lg bg-surface-1 border border-hairline hover:border-hairline-strong transition-colors cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent select-none"
    >
      {/* 1. Code preview fills top: Shiki output, line numbers, ~8-9 lines, bottom fade */}
      <div className="relative w-full overflow-hidden">
        <CodePreview
          code={component.code}
          language={getLanguage()}
          snippetId={component.id}
          updatedAt={component.updatedAt}
          maxLines={8}
        />

        {/* 3. Hover/focus actions (top-right of preview): Copy code & Star */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity max-[768px]:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Copy Button */}
          <CopyButton
            textToCopy={component.code}
            label="Copy code"
            className="h-7 w-7 bg-surface-1/90 backdrop-blur-xs border border-hairline hover:border-hairline-strong"
          />

          {/* Star Toggle Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={component.favorite ? "Unstar component" : "Star component"}
            className={cn(
              "h-7 w-7 rounded-[6px] flex items-center justify-center transition-colors border",
              component.favorite
                ? "bg-surface-1/90 border-warn/40 text-warn !opacity-100"
                : "bg-surface-1/90 border-hairline text-ink-subtle hover:text-ink hover:border-hairline-strong"
            )}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                component.favorite ? "text-warn fill-warn" : ""
              )}
            />
          </button>
        </div>

        {/* If starred, show star badge on top right when not hovered on desktop */}
        {component.favorite && (
          <div className="absolute top-2 right-2 z-0 group-hover:hidden max-[768px]:hidden pointer-events-none">
            <div className="h-7 w-7 rounded-[6px] bg-surface-1/90 border border-warn/30 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-warn fill-warn" />
            </div>
          </div>
        )}
      </div>

      {/* 2. Footer: Name (full name wrap to 2 lines max), framework · styling, category, AI prompt marker */}
      <div className="flex flex-col gap-1.5 p-3 border-t border-hairline bg-surface-1">
        {/* Full name, wrap to 2 lines max, no mid-word ellipsis */}
        <span className="text-sm font-medium text-ink line-clamp-2 leading-snug">
          {component.name}
        </span>

        {/* Meta line: framework · styling, category (if applicable), prompt ✓ */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-ink-subtle truncate pt-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">
              {component.framework.toLowerCase()} · {component.styling.toLowerCase().replace(/_/g, " ")}
            </span>

            {showCategory && component.category && (
              <>
                <span className="text-ink-subtle/50">·</span>
                <span className="capitalize truncate text-ink-muted">
                  {component.category}
                </span>
              </>
            )}
          </div>

          {/* Plain mono marker for AI prompt readiness */}
          {component.aiAgentPrompt && (
            <span
              title="AI prompt generated"
              className="shrink-0 text-ink-subtle/80 text-[10px] bg-surface-2 px-1 py-0.2 rounded border border-hairline"
            >
              prompt ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
