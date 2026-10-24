import React from "react";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types/project";

export interface StatusDotProps {
  status: ProjectStatus;
  showLabel?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  IN_PROGRESS: {
    label: "In Progress",
    dotClass: "bg-accent",
    textClass: "text-text-primary",
  },
  PLANNING: {
    label: "Planning",
    dotClass: "bg-muted",
    textClass: "text-muted",
  },
  ON_HOLD: {
    label: "On Hold",
    dotClass: "bg-warn",
    textClass: "text-warn",
  },
  COMPLETED: {
    label: "Completed",
    dotClass: "bg-subtle",
    textClass: "text-muted",
  },
  ARCHIVED: {
    label: "Archived",
    dotClass: "bg-subtle/50",
    textClass: "text-subtle",
  },
};

export function StatusDot({ status, showLabel = true, className }: StatusDotProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono select-none",
        config.textClass,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotClass)}
        aria-hidden="true"
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
