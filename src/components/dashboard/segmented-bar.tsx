import React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedBarProps {
  total: number;
  active: number;
  className?: string;
}

export function SegmentedBar({ total, active, className }: SegmentedBarProps) {
  // If total is 0, render 1 subtle empty segment
  const segmentCount = Math.max(1, Math.min(total, 24));
  const activeSegments = total > 0 ? Math.round((active / total) * segmentCount) : 0;

  return (
    <div
      className={cn("flex items-center gap-[2px] w-full h-[3px]", className)}
      aria-label={`${active} of ${total} active projects`}
    >
      {Array.from({ length: segmentCount }).map((_, i) => {
        const isFilled = i < activeSegments;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 h-full rounded-[1px] transition-colors duration-200",
              isFilled ? "bg-accent" : "bg-surface-2 border border-line"
            )}
          />
        );
      })}
    </div>
  );
}
