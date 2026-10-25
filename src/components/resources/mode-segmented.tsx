"use client";

import React from "react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

export type NoteViewMode = "edit" | "split" | "preview";

interface ModeSegmentedProps {
  viewMode: NoteViewMode;
  onChange: (mode: NoteViewMode) => void;
  className?: string;
}

export function ModeSegmented({
  viewMode,
  onChange,
  className,
}: ModeSegmentedProps) {
  const options: { id: NoteViewMode; label: string; hideOnMobile?: boolean }[] = [
    { id: "edit", label: "Edit" },
    { id: "split", label: "Split", hideOnMobile: true },
    { id: "preview", label: "Preview" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Editor view mode"
      className={cn(
        "inline-flex items-center h-7 p-0.5 rounded-[6px] bg-surface-1 border border-hairline select-none",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = viewMode === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              if (viewMode !== opt.id) {
                sound.playClick(800);
                onChange(opt.id);
              }
            }}
            className={cn(
              "h-6 px-2.5 rounded-[4px] text-xs font-medium transition-all duration-150 cursor-pointer",
              opt.hideOnMobile && "hidden md:inline-flex items-center",
              isActive
                ? "bg-surface-2 text-ink shadow-xs border border-hairline/80 font-semibold"
                : "text-ink-muted hover:text-ink hover:bg-surface-2/40"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
