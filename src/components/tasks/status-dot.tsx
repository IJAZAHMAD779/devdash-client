import React from "react";
import { cn } from "@/lib/utils";
import { TaskStatus } from "@/types/task";

export interface StatusConfig {
  id: TaskStatus;
  label: string;
  dotClass: string;
  textClass: string;
}

export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  TODO: {
    id: "TODO",
    label: "To Do",
    dotClass: "bg-zinc-500",
    textClass: "text-muted",
  },
  IN_PROGRESS: {
    id: "IN_PROGRESS",
    label: "In Progress",
    dotClass: "bg-accent",
    textClass: "text-text-primary",
  },
  IN_REVIEW: {
    id: "IN_REVIEW",
    label: "In Review",
    dotClass: "bg-purple-400",
    textClass: "text-text-primary",
  },
  DONE: {
    id: "DONE",
    label: "Done",
    dotClass: "bg-emerald-500/70",
    textClass: "text-subtle",
  },
};

export const ALL_TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

interface StatusDotProps {
  status: TaskStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusDot({ status, size = "sm", className }: StatusDotProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;
  const sizeClass = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span
      className={cn("rounded-full shrink-0", sizeClass, cfg.dotClass, className)}
      aria-hidden="true"
    />
  );
}
