import React from "react";
import { cn } from "@/lib/utils";

export interface TechTagsProps {
  tags: string[];
  maxVisible?: number;
  className?: string;
  tagClassName?: string;
}

export function TechTags({
  tags,
  maxVisible,
  className,
  tagClassName,
}: TechTagsProps) {
  if (!tags || tags.length === 0) {
    return <span className="text-subtle font-mono text-xs">—</span>;
  }

  const visibleTags = typeof maxVisible === "number" ? tags.slice(0, maxVisible) : tags;
  const remainingCount = typeof maxVisible === "number" ? tags.length - maxVisible : 0;

  return (
    <div className={cn("inline-flex items-center flex-wrap gap-1.5", className)}>
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "h-5 px-2 rounded-[6px] bg-surface-2 border border-line text-[11px] font-mono text-muted flex items-center whitespace-nowrap select-none",
            tagClassName
          )}
        >
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className="h-5 px-1.5 rounded-[6px] bg-surface-2 border border-line text-[10px] font-mono text-subtle flex items-center whitespace-nowrap select-none"
          title={tags.slice(maxVisible).join(", ")}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
