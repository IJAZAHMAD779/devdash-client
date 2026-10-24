import React from "react";
import { cn } from "@/lib/utils";

export interface ActivityTextProps {
  pushedAt?: string | null;
  className?: string;
  showDot?: boolean;
}

export function formatPushedRelative(dateString: string | null | undefined): {
  text: string;
  isRecent: boolean;
} {
  if (!dateString) return { text: "—", isRecent: false };

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return { text: "—", isRecent: false };

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { text: "pushed today", isRecent: true };
  if (diffDays === 1) return { text: "pushed 1d ago", isRecent: true };
  if (diffDays < 30) return { text: `pushed ${diffDays}d ago`, isRecent: true };

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return { text: `pushed ${diffMonths}mo ago`, isRecent: false };
  }

  const diffYears = Math.floor(diffDays / 365);
  return { text: `pushed ${diffYears}y ago`, isRecent: false };
}

export function ActivityText({ pushedAt, className, showDot = true }: ActivityTextProps) {
  const { text, isRecent } = formatPushedRelative(pushedAt);

  if (text === "—") {
    return <span className={cn("text-subtle font-mono text-xs", className)}>—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono text-muted select-none",
        className
      )}
      title={pushedAt ? `Last commit: ${new Date(pushedAt).toLocaleDateString()}` : undefined}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isRecent ? "bg-ok" : "bg-subtle"
          )}
          aria-hidden="true"
        />
      )}
      <span>{text}</span>
    </span>
  );
}
