import React from "react";
import { Bell } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface ReminderLabelProps {
  date: string | null | undefined;
  showIcon?: boolean;
  emptyText?: string;
  className?: string;
}

export function ReminderLabel({
  date,
  showIcon = true,
  emptyText = "No reminder",
  className,
}: ReminderLabelProps) {
  if (!date) {
    return (
      <span className={cn("text-subtle font-mono text-xs select-none", className)}>
        {emptyText}
      </span>
    );
  }

  // Check if reminder is in the past
  const isPast = new Date(date).getTime() < Date.now();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs select-none",
        isPast ? "text-warn" : "text-muted",
        className
      )}
      title={isPast ? "Past reminder" : "Scheduled reminder"}
    >
      {showIcon && (
        <Bell
          className={cn("w-3 h-3 shrink-0", isPast ? "text-warn" : "text-subtle")}
          aria-hidden="true"
        />
      )}
      <span>{formatDate(date)}</span>
    </span>
  );
}
