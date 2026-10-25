"use client";

import React, { useRef, useEffect } from "react";
import { Search, Plus, Star, PanelLeftClose } from "lucide-react";
import { Note } from "@/types/note";
import { useToggleNoteFavorite } from "@/hooks/use-notes";
import { sound } from "@/lib/audio";
import { cn, stripMarkdown } from "@/lib/utils";

interface Props {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleCollapse?: () => void;
  className?: string;
}

function buildNoteExcerpt(content: string, title: string): string {
  if (!content) return "Empty note";
  let clean = content.trim();

  // Remove leading heading equal to title (case & whitespace insensitive)
  const normTitle = (title || "").trim().toLowerCase();
  const headingMatch = clean.match(/^#+\s+([^\r\n]+)(?:\r?\n+|$)/);
  if (headingMatch && headingMatch[1].trim().toLowerCase() === normTitle) {
    clean = clean.slice(headingMatch[0].length).trim();
  }

  // Strip markdown formatting to plain text
  let stripped = stripMarkdown(clean).trim();

  // If stripped text still begins with the title, remove that immediate repeat
  if (normTitle && stripped.toLowerCase().startsWith(normTitle)) {
    stripped = stripped.slice(normTitle.length).replace(/^[:\-–—\s]+/, "").trim();
  }

  return stripped || "Empty note";
}

export function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  searchQuery,
  onSearchChange,
  onToggleCollapse,
  className,
}: Props) {
  const toggleFavorite = useToggleNoteFavorite();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleStar = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    sound.playClick(note.favorite ? 600 : 850);
    toggleFavorite.mutate({
      id: note.id,
      favorite: !note.favorite,
    });
  };

  // Starred notes stay pinned at the top, then newest updatedAt / createdAt
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.favorite === b.favorite) {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    }
    return a.favorite ? -1 : 1;
  });

  return (
    <div
      className={cn(
        "w-full md:w-[280px] shrink-0 border-r border-hairline flex flex-col bg-surface-1/40 h-full select-none",
        className
      )}
    >
      {/* Header row: search (h-9, 36px), new note (accent), list collapse toggle */}
      <div className="h-14 px-3 border-b border-hairline flex items-center gap-2 shrink-0">
        <div className="relative flex-1 h-9 min-h-9 flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-full pl-8 pr-7 rounded-[6px] bg-surface-2 border border-hairline text-xs text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none transition-colors"
          />
          {!searchQuery && (
            <kbd className="absolute right-2 text-[10px] font-mono text-ink-subtle pointer-events-none">
              /
            </kbd>
          )}
        </div>

        <button
          onClick={() => {
            sound.playClick(900);
            onNewNote();
          }}
          className="h-9 px-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-sm"
          title="New note (N)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
          <kbd className="hidden sm:inline text-[10px] font-mono opacity-80">N</kbd>
        </button>

        {onToggleCollapse && (
          <button
            onClick={() => {
              sound.playClick(600);
              onToggleCollapse();
            }}
            title="Collapse note list"
            aria-label="Collapse note list"
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-[6px] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y divide-y divide-hairline">
        {sortedNotes.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-ink-subtle">
            {searchQuery ? "No matching notes found" : "No notes yet"}
          </div>
        ) : (
          sortedNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            const excerpt = buildNoteExcerpt(note.content, note.title);
            const dateStr = note.updatedAt || note.createdAt;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "";

            return (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => {
                  sound.playClick(800);
                  onSelectNote(note);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectNote(note);
                  }
                }}
                className={cn(
                  "relative min-h-[64px] max-h-[72px] px-3.5 py-2.5 cursor-pointer transition-colors group flex flex-col justify-between text-left select-none",
                  isSelected
                    ? "bg-surface-2 text-ink font-medium"
                    : "hover:bg-surface-2/50 text-ink-muted hover:text-ink"
                )}
              >
                {/* 2px accent bar on left edge for active item */}
                {isSelected && (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
                )}

                {/* Line 1: Title (14px medium, 1 line, truncate) + EXACTLY ONE STAR on the right */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <h4
                    className="text-[14px] font-medium text-ink truncate flex-1 min-w-0 leading-tight"
                    title={note.title}
                  >
                    {note.title}
                  </h4>

                  <button
                    type="button"
                    onClick={(e) => handleToggleStar(e, note)}
                    className={cn(
                      "p-1 rounded-[4px] transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                      note.favorite
                        ? "text-warn"
                        : "text-ink-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-warn"
                    )}
                    title={note.favorite ? "Unstar note" : "Star note"}
                    aria-label={note.favorite ? "Unstar note" : "Star note"}
                  >
                    <Star
                      className={cn(
                        "w-3.5 h-3.5",
                        note.favorite && "fill-warn"
                      )}
                    />
                  </button>
                </div>

                {/* Line 2: One-line excerpt (13px text-subtle), title removed */}
                <p className="text-[13px] text-ink-subtle truncate leading-tight mt-0.5">
                  {excerpt}
                </p>

                {/* Line 3: Mono 11px text-subtle: Date and project name ONLY IF linked (no Workspace fallback) */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-ink-subtle leading-none mt-1">
                  <span>{formattedDate}</span>
                  {note.project && (
                    <>
                      <span>·</span>
                      <span className="truncate max-w-[130px] text-ink-muted">
                        {note.project.title}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
