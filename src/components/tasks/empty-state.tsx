import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "py-12 px-4 flex flex-col items-center justify-center text-center gap-2 select-none",
        className
      )}
    >
      <p className="text-xs font-mono text-subtle">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-mono text-accent hover:underline cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
