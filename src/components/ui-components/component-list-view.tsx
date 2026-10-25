"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { UIComponentItem } from "@/types/component";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";
import { ComponentListRow } from "./component-list-row";
import { getComponentGridTemplate } from "@/lib/list-columns";

interface ComponentListViewProps {
  components: UIComponentItem[];
  onViewCode: (component: UIComponentItem) => void;
  onEdit: (component: UIComponentItem) => void;
  showCategory?: boolean;
  className?: string;
}

type SortField = "name" | "framework" | "updated";
type SortDirection = "asc" | "desc";

export function ComponentListView({
  components,
  onViewCode,
  onEdit,
  showCategory = true,
  className,
}: ComponentListViewProps) {
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

  const sortedComponents = useMemo(() => {
    if (!sortField) return components;

    return [...components].sort((a, b) => {
      let comparison = 0;

      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "framework") {
        comparison = (a.framework || "").localeCompare(b.framework || "");
      } else if (sortField === "updated") {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        comparison = timeA - timeB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [components, sortField, sortDirection]);

  // Dynamic column visibility: hide column only when every currently visible row has no value for it
  const hasCategory = useMemo(() => {
    if (!showCategory) return false;
    return components.some((c) => Boolean(c.category && c.category.trim()));
  }, [components, showCategory]);

  const hasProject = useMemo(() => {
    return components.some((c) => Boolean(c.project?.title || c.projectId));
  }, [components]);

  const gridTemplate = useMemo(() => {
    return getComponentGridTemplate({
      showCategory,
      hasCategory,
      hasProject,
    });
  }, [showCategory, hasCategory, hasProject]);

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
      aria-label="UI components list"
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

        {/* 2. Name column header (sortable) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("name")}
          onClick={() => handleSort("name")}
          className="min-w-0 overflow-hidden flex items-center gap-1 cursor-pointer group hover:text-ink transition-colors"
        >
          <span>Name</span>
          {renderSortIndicator("name")}
        </div>

        {/* 3. Framework column header (sortable) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("framework")}
          onClick={() => handleSort("framework")}
          className="min-w-0 overflow-hidden flex items-center gap-1 cursor-pointer group hover:text-ink transition-colors"
        >
          <span>Framework</span>
          {renderSortIndicator("framework")}
        </div>

        {/* 4. Category column header (conditional) */}
        {showCategory && hasCategory && (
          <div className="min-w-0 overflow-hidden">Category</div>
        )}

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
        {sortedComponents.map((component) => (
          <ComponentListRow
            key={component.id}
            component={component}
            onViewCode={onViewCode}
            onEdit={onEdit}
            showCategory={showCategory}
            hasCategory={hasCategory}
            hasProject={hasProject}
            gridTemplate={gridTemplate}
          />
        ))}
      </div>
    </div>
  );
}
