"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // diameter in px
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function ProgressRing({
  progress,
  size = 32,
  strokeWidth = 3,
  className,
  showText = false,
  textClassName,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] overflow-visible"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-3/80"
        />
        {/* Progress indicator circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500 ease-out",
            clamped >= 100
              ? "text-emerald-500"
              : clamped > 0
              ? "text-primary"
              : "text-transparent"
          )}
        />
      </svg>
      {showText && (
        <span
          className={cn(
            "absolute text-[9px] font-mono font-medium text-ink",
            textClassName
          )}
        >
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
