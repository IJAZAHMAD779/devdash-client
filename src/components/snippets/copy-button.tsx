"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface CopyButtonProps {
  text?: string;
  textToCopy?: string;
  label?: string;
  showText?: boolean;
  className?: string;
}

export function CopyButton({
  text,
  textToCopy,
  label = "Copy code",
  showText = false,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const contentToCopy = textToCopy ?? text ?? "";

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : label}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 p-1.5 rounded-[4px] text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer select-none",
        copied && "text-ok hover:text-ok",
        className
      )}
    >
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-ok shrink-0 animate-in fade-in zoom-in-75 duration-100" />
      ) : (
        <Copy className="w-3.5 h-3.5 shrink-0" />
      )}
      {showText && (
        <span className="text-xs font-mono">{copied ? "Copied" : "Copy"}</span>
      )}
    </button>
  );
}
