"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Snippet } from "@/types/snippet";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";
import { SnippetListRow } from "./snippet-list-row";

interface SnippetListViewProps {
  snippets: Snippet[];
  onView: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  showLanguage?: boolean;
  className?: string;
}

type SortField = "title" | "language" | "updated";
type SortDirection = "asc" | "desc";

export function SnippetListView({
  snippets,
  onView,
  onEdit,
  showLanguage = true,
  className,
}: SnippetListViewProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    sound.playClick(750);
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedSnippets = useMemo(() => {
    if (!sortField) return snippets;

    return [...snippets].sort((a, b) => {
      let comparison = 0;

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "language") {
        comparison = (a.language || "").localeCompare(b.language || "");
      } else if (sortField === "updated") {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        comparison = timeA - timeB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [snippets, sortField, sortDirection]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-ink-subtle/40 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-accent" />
    ) : (
      <ArrowDown className="w-3 h-3 text-accent" />
    );
  };

  const getAriaSort = (field: SortField): "ascending" | "descending" | "none" => {
    if (sortField !== field) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  return (
    <div
      role="table"
      aria-label="Code snippets list"
      className={cn(
        "w-full rounded-lg bg-surface-1 border border-hairline overflow-hidden select-none",
        className
      )}
    >
      {/* Table Header */}
      <div
        role="row"
        className="flex items-center h-8 px-3 border-b border-hairline bg-surface-2/40 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle"
      >
        {/* Star column placeholder */}
        <div className="w-8 shrink-0" />

        {/* Title column header (sortable) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("title")}
          onClick={() => handleSort("title")}
          className="flex-1 min-w-0 pr-3 flex items-center gap-1 cursor-pointer group hover:text-ink transition-colors"
        >
          <span>Title</span>
          {renderSortIndicator("title")}
        </div>

        {/* Language column header (sortable, hidden if inside language folder) */}
        {showLanguage && (
          <div
            role="columnheader"
            aria-sort={getAriaSort("language")}
            onClick={() => handleSort("language")}
            className="hidden sm:flex items-center gap-1 w-28 shrink-0 cursor-pointer group hover:text-ink transition-colors"
          >
            <span>Language</span>
            {renderSortIndicator("language")}
          </div>
        )}

        {/* Tags column header */}
        <div className="hidden sm:block w-28 shrink-0">Tags</div>

        {/* Project column header */}
        <div className="hidden md:block w-28 shrink-0">Project</div>

        {/* Updated column header (sortable) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("updated")}
          onClick={() => handleSort("updated")}
          className="hidden lg:flex items-center justify-end gap-1 w-20 shrink-0 cursor-pointer group hover:text-ink transition-colors text-right"
        >
          <span>Updated</span>
          {renderSortIndicator("updated")}
        </div>

        {/* Actions column header placeholder */}
        <div className="w-20 shrink-0 text-right pr-2">Actions</div>
      </div>

      {/* Rows */}
      <div role="rowgroup">
        {sortedSnippets.map((snippet) => (
          <SnippetListRow
            key={snippet.id}
            snippet={snippet}
            onView={onView}
            onEdit={onEdit}
            showLanguage={showLanguage}
          />
        ))}
      </div>
    </div>
  );
}
