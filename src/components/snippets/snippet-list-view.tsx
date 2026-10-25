"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Snippet } from "@/types/snippet";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";
import { SnippetListRow } from "./snippet-list-row";
import { getSnippetGridTemplate } from "@/lib/list-columns";

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

  // Dynamic column visibility: hide column only when every currently visible row has no value for it
  const hasTags = useMemo(() => {
    return snippets.some((s) => s.tags && s.tags.length > 0);
  }, [snippets]);

  const hasProject = useMemo(() => {
    return snippets.some((s) => Boolean(s.project?.title || s.projectId));
  }, [snippets]);

  const gridTemplate = useMemo(() => {
    return getSnippetGridTemplate({
      showLanguage,
      hasTags,
      hasProject,
    });
  }, [showLanguage, hasTags, hasProject]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-ink-subtle/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
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
      {/* Table Header: sharing the exact same gridTemplate as every row */}
      <div
        role="row"
        style={{ gridTemplateColumns: gridTemplate }}
        className="grid items-center gap-4 h-8 px-3 border-b border-hairline bg-surface-2/40 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle"
      >
        {/* 1. Star column placeholder (40px) */}
        <div className="min-w-0 overflow-hidden" />

        {/* 2. Title column header (sortable) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("title")}
          onClick={() => handleSort("title")}
          className="min-w-0 overflow-hidden flex items-center gap-1 cursor-pointer group hover:text-ink transition-colors"
        >
          <span>Title</span>
          {renderSortIndicator("title")}
        </div>

        {/* 3. Language column header (sortable, conditional) */}
        {showLanguage && (
          <div
            role="columnheader"
            aria-sort={getAriaSort("language")}
            onClick={() => handleSort("language")}
            className="min-w-0 overflow-hidden flex items-center gap-1 cursor-pointer group hover:text-ink transition-colors"
          >
            <span>Language</span>
            {renderSortIndicator("language")}
          </div>
        )}

        {/* 4. Tags column header (conditional) */}
        {hasTags && <div className="min-w-0 overflow-hidden">Tags</div>}

        {/* 5. Project column header (conditional) */}
        {hasProject && <div className="min-w-0 overflow-hidden">Project</div>}

        {/* 6. Updated column header (sortable, right-aligned) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("updated")}
          onClick={() => handleSort("updated")}
          className="min-w-0 overflow-hidden flex items-center justify-end gap-1 cursor-pointer group hover:text-ink transition-colors text-right"
        >
          <span>Updated</span>
          {renderSortIndicator("updated")}
        </div>

        {/* 7. Actions column header (right-aligned) */}
        <div className="min-w-0 overflow-hidden text-right flex items-center justify-end pr-1">
          Actions
        </div>
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
            hasTags={hasTags}
            hasProject={hasProject}
            gridTemplate={gridTemplate}
          />
        ))}
      </div>
    </div>
  );
}
