"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KeycapProps {
  children: React.ReactNode;
  className?: string;
}

export function Keycap({ children, className }: KeycapProps) {
  return (
    <kbd
      className={cn(
        "font-mono text-[11px] font-semibold bg-surface-2 text-text-primary border border-line-strong rounded-[4px] px-1.5 py-0.5 shadow-xs select-none inline-block align-middle",
        className
      )}
    >
      {children}
    </kbd>
  );
}
