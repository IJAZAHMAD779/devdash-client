"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Bookmark } from "@/types/bookmark";
import { toast } from "@/lib/toast";
import { Tabs } from "./tabs";

export interface ScratchpadBookmarksPanelProps {
  scratchpadText: string;
  onScratchpadChange: (text: string) => void;
  bookmarks: Bookmark[];
  className?: string;
}

export function ScratchpadBookmarksPanel({
  scratchpadText,
  onScratchpadChange,
  bookmarks,
  className,
}: ScratchpadBookmarksPanelProps) {
  const [activeTab, setActiveTab] = useState("scratchpad");
  const [copied, setCopied] = useState(false);

  const starredBookmarks = bookmarks?.filter((b) => b.favorite) || [];

  const handleCopy = async () => {
    if (!scratchpadText.trim()) return;
    try {
      await navigator.clipboard.writeText(scratchpadText);
      setCopied(true);
      toast.success("Scratchpad copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy scratchpad");
    }
  };

  const handleClear = () => {
    onScratchpadChange("");
  };

  return (
    <div
      className={cn(
        "bg-surface-1 border border-line rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden",
        className
      )}
    >
      {/* Underline Tabs Header */}
      <Tabs
        tabs={[
          { id: "scratchpad", label: "Scratchpad" },
          { id: "bookmarks", label: "Starred Bookmarks", count: starredBookmarks.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        extra={
          activeTab === "scratchpad" ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy scratchpad text"
                title="Copy scratchpad"
                className="p-1 rounded-[4px] hover:bg-surface-2 text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-ok" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear scratchpad text"
                title="Clear scratchpad"
                className="p-1 rounded-[4px] hover:bg-surface-2 text-muted hover:text-danger transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/resources"
              className="text-xs font-mono text-muted hover:text-text-primary transition-colors flex items-center gap-1"
            >
              <span>View all</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )
        }
      />

      {/* Tab 1: Scratchpad */}
      {activeTab === "scratchpad" && (
        <div className="p-4 space-y-2">
          <textarea
            rows={5}
            value={scratchpadText}
            onChange={(e) => onScratchpadChange(e.target.value)}
            placeholder="Temporary commands, auth tokens, draft notes (auto-saved locally)..."
            className="w-full bg-surface-2 rounded-[6px] p-3 text-xs font-mono text-text-primary placeholder:text-subtle border border-line focus:border-accent focus:outline-none resize-none leading-relaxed transition-colors"
          />
          <div className="flex items-center justify-between text-[11px] font-mono text-subtle px-1">
            <span>Markdown &amp; plain text</span>
            <span>Auto-saved to device</span>
          </div>
        </div>
      )}

      {/* Tab 2: Starred Bookmarks */}
      {activeTab === "bookmarks" && (
        <div className="p-4">
          {starredBookmarks.length === 0 ? (
            <div className="h-[72px] flex items-center justify-center text-xs text-muted">
              Star high-frequency bookmarks for quick access here
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starredBookmarks.slice(0, 6).map((bm) => (
                <a
                  key={bm.id}
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 rounded-[6px] bg-surface-2/60 hover:bg-surface-2 border border-line flex items-center justify-between text-xs group transition-colors"
                >
                  <span className="truncate text-text-primary group-hover:text-white mr-2">
                    {bm.title}
                  </span>
                  <ExternalLink className="w-3 h-3 text-subtle group-hover:text-text-primary shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
