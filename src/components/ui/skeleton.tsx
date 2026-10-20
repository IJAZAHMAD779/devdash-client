import React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable Linear-styled skeleton placeholder component.
 * Uses pulse animation with calibrated surface tokens (transitions-dev 14-skeleton-reveal).
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-2/80 border border-hairline/30",
        className
      )}
      {...props}
    />
  );
}
