import React from "react";
import { cn } from "@/lib/utils";

export interface DayMetric {
  day: string; // e.g. "Mon", "Tue"
  dateStr: string; // "2026-10-24"
  count: number;
  isToday?: boolean;
}

export interface ActivityBarsProps {
  data: DayMetric[];
  className?: string;
}

export function ActivityBars({ data, className }: ActivityBarsProps) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const hasAnyActivity = data.some((d) => d.count > 0);

  if (!hasAnyActivity) {
    return (
      <div className="h-14 flex items-center justify-center text-xs text-muted">
        Complete a task to see activity
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-end justify-between gap-2 h-14 pt-2">
        {data.map((item, idx) => {
          const heightPercent = item.count > 0 ? Math.max(15, Math.round((item.count / maxCount) * 100)) : 6;
          const isLast = idx === data.length - 1;

          return (
            <div
              key={item.dateStr || idx}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-surface-2 border border-line text-[10px] font-mono text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {item.count} {item.count === 1 ? "task" : "tasks"}
              </div>

              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-[2px] transition-all duration-200",
                  item.count > 0
                    ? isLast
                      ? "bg-accent"
                      : "bg-surface-2 hover:bg-line-strong"
                    : "bg-surface-2/40"
                )}
                style={{ height: `${heightPercent}%` }}
              />

              {/* Day Label */}
              <span
                className={cn(
                  "text-[10px] font-mono",
                  isLast ? "text-text-primary font-medium" : "text-subtle"
                )}
              >
                {item.day.slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  points,
  width = 64,
  height = 18,
  className,
}: SparklineProps) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * (width - 4) + 2;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible inline-block shrink-0", className)}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="rgba(59, 130, 246, 0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}
