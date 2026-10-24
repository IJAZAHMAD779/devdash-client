import React from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

export function Panel({
  children,
  className,
  as: Component = "div",
  ...props
}: PanelProps) {
  return (
    <Component
      className={cn(
        "bg-surface-1 border border-line rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-text-primary",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
