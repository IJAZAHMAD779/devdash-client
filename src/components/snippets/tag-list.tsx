"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TagListProps {
  tags: string[];
  maxDisplay?: number;
  className?: string;
}

export function TagList({ tags, maxDisplay = 2, className }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-subtle", className)}>
      {displayTags.map((tag) => (
        <span key={tag} className="hover:text-ink-muted transition-colors">
          #{tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-ink-subtle/70" title={tags.slice(maxDisplay).map(t => `#${t}`).join(", ")}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
