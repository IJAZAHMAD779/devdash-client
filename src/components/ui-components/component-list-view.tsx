"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { UIComponentItem } from "@/types/component";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";
import { ComponentListRow } from "./component-list-row";

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
      {/* Table Header */}
      <div
        role="row"
        className="flex items-center h-8 px-3 border-b border-hairline bg-surface-2/40 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle"
      >
        {/* Star column placeholder */}
        <div className="w-8 shrink-0" />

        {/* Name column header (sortable) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("name")}
          onClick={() => handleSort("name")}
          className="flex-1 min-w-0 pr-3 flex items-center gap-1 cursor-pointer group hover:text-ink transition-colors"
        >
          <span>Name</span>
          {renderSortIndicator("name")}
        </div>

        {/* Framework column header (sortable) */}
        <div
          role="columnheader"
          aria-sort={getAriaSort("framework")}
          onClick={() => handleSort("framework")}
          className="hidden sm:flex items-center gap-1 w-36 shrink-0 cursor-pointer group hover:text-ink transition-colors"
        >
          <span>Framework</span>
          {renderSortIndicator("framework")}
        </div>

        {/* Category column header */}
        {showCategory && <div className="hidden md:block w-28 shrink-0">Category</div>}

        {/* Project column header */}
        <div className="hidden lg:block w-28 shrink-0">Project</div>

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
        {sortedComponents.map((component) => (
          <ComponentListRow
            key={component.id}
            component={component}
            onViewCode={onViewCode}
            onEdit={onEdit}
            showCategory={showCategory}
          />
        ))}
      </div>
    </div>
  );
}
