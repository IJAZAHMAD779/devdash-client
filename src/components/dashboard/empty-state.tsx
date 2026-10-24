import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "h-[72px] flex items-center justify-center gap-2 px-4 text-xs text-muted font-normal text-center select-none",
        className
      )}
    >
      <span>{message}</span>
      {action && (
        <>
          <span className="text-line-strong">·</span>
          {action.href ? (
            <Link
              href={action.href}
              className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors cursor-pointer"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors cursor-pointer"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
