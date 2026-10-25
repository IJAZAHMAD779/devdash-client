import React from "react";
import { cn } from "@/lib/utils";
import { Priority } from "@/types/task";

export interface PriorityConfig {
  id: Priority;
  label: string;
  dotClass: string;
  textClass: string;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  URGENT: {
    id: "URGENT",
    label: "Urgent",
    dotClass: "bg-danger",
    textClass: "text-danger font-medium",
  },
  HIGH: {
    id: "HIGH",
    label: "High",
    dotClass: "bg-warn",
    textClass: "text-warn font-medium",
  },
  MEDIUM: {
    id: "MEDIUM",
    label: "Medium",
    dotClass: "bg-zinc-400",
    textClass: "text-muted",
  },
  LOW: {
    id: "LOW",
    label: "Low",
    dotClass: "bg-zinc-600",
    textClass: "text-subtle",
  },
};

export const ALL_PRIORITIES: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

interface PriorityLabelProps {
  priority: Priority;
  showDot?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function PriorityLabel({
  priority,
  showDot = true,
  showLabel = true,
  className,
}: PriorityLabelProps) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-mono select-none", className)}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotClass)}
          aria-hidden="true"
        />
      )}
      {showLabel && <span className={cfg.textClass}>{cfg.label}</span>}
    </span>
  );
}
