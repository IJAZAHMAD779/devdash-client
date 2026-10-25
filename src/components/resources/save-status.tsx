"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveStatusProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  disabled?: boolean;
  onSave: () => void;
  className?: string;
}

export function SaveStatus({
  hasUnsavedChanges,
  isSaving,
  disabled = false,
  onSave,
  className,
}: SaveStatusProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  const shortcutHint = isMac ? "⌘S" : "Ctrl+S";

  return (
    <div
      className={cn("inline-flex items-center shrink-0", className)}
      aria-live="polite"
    >
      {isSaving ? (
        <span className="h-7 px-2.5 rounded-[6px] text-xs font-medium text-ink-muted inline-flex items-center gap-1.5 select-none bg-surface-2 border border-hairline/60">
          <Loader2 className="w-3 h-3 animate-spin text-ink-subtle shrink-0" />
          <span>Saving…</span>
        </span>
      ) : hasUnsavedChanges ? (
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          className="h-7 px-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium tracking-tight shadow-sm inline-flex items-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
          title={`Save changes (${shortcutHint})`}
        >
          <span>Save</span>
          <kbd className="text-[10px] font-mono opacity-80 tracking-tight">
            {shortcutHint}
          </kbd>
        </button>
      ) : (
        <span
          className="h-7 px-2 text-xs font-mono text-ink-subtle inline-flex items-center gap-1 select-none"
          title="All changes saved"
        >
          <span>Saved</span>
          <span className="text-ok font-bold">✓</span>
        </span>
      )}
    </div>
  );
}
