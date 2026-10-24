import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ progress, className, barClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={cn(
        "h-[3px] w-full bg-surface-2 rounded-full overflow-hidden",
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full bg-accent transition-all duration-300 ease-out",
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
