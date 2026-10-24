"use client";

import React from "react";
import {
  Columns,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types/project";
import { sound } from "@/lib/audio";

export type ViewMode = "workbench" | "table" | "grid";

export interface StatusCountMap {
  ALL: number;
  IN_PROGRESS: number;
  PLANNING: number;
  COMPLETED: number;
  ON_HOLD: number;
  ARCHIVED: number;
}

export interface ProjectsTopBarProps {
  totalCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNewProject: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: ProjectStatus | "ALL";
  onStatusChange: (status: ProjectStatus | "ALL") => void;
  statusCounts: StatusCountMap;
  className?: string;
}

const STATUS_TABS: { id: ProjectStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "PLANNING", label: "Planning" },
  { id: "COMPLETED", label: "Completed" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "ARCHIVED", label: "Archived" },
];

export function ProjectsTopBar({
  totalCount,
  viewMode,
  onViewModeChange,
  onNewProject,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  statusCounts,
  className,
}: ProjectsTopBarProps) {
  return (
    <header className={cn("border-b border-line bg-surface-1/40 flex-shrink-0 select-none", className)}>
      {/* Row 1: Title, View Switcher, New Project */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Title & Count */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-text-primary truncate">
            Projects Hub
          </h1>
          <span className="text-[11px] font-mono text-muted">
            {totalCount}
          </span>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Segmented View Switcher */}
          <div
            className="flex items-center p-0.5 rounded-[6px] bg-surface-1 border border-line"
            role="tablist"
            aria-label="View Switcher"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "workbench"}
              title="Workbench View"
              onClick={() => onViewModeChange("workbench")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors cursor-pointer",
                viewMode === "workbench"
                  ? "bg-surface-2 text-text-primary font-medium"
                  : "text-muted hover:text-text-primary"
              )}
            >
              <Columns className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Workbench</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "table"}
              title="Data Grid View"
              onClick={() => onViewModeChange("table")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-surface-2 text-text-primary font-medium"
                  : "text-muted hover:text-text-primary"
              )}
            >
              <TableIcon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Data Grid</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "grid"}
              title="Cards View"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-surface-2 text-text-primary font-medium"
                  : "text-muted hover:text-text-primary"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          {/* New Project (Single accent-filled button, 6px radius, no glow) */}
          <button
            type="button"
            onClick={onNewProject}
            className="h-8 px-3 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium tracking-tight transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {/* Row 2: Search Input & Underline Status Tabs (For Grid & Cards, and persistent filter state) */}
      <div className="px-4 sm:px-6 py-2.5 border-t border-line flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-1/20">
        {/* Search Input (32px, 6px radius, surface-2) */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-subtle absolute left-2.5 top-1/2 -translate-y-1/2 stroke-[1.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-[6px] bg-surface-2 border border-line text-text-primary placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Status Filter Underline Tabs with Counts */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5">
          {STATUS_TABS.map((tab, idx) => {
            const count = statusCounts[tab.id] ?? 0;
            const isActive = selectedStatus === tab.id;
            const isEmpty = count === 0 && tab.id !== "ALL";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playClick(800);
                  onStatusChange(tab.id);
                }}
                className={cn(
                  "relative pb-1 text-xs font-mono whitespace-nowrap transition-colors cursor-pointer select-none flex items-center gap-1.5",
                  isActive
                    ? "text-text-primary font-medium"
                    : isEmpty
                    ? "text-subtle/60 hover:text-muted"
                    : "text-muted hover:text-text-primary"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn("text-[10px] font-mono", isActive ? "text-muted" : "text-subtle")}>
                  {count}
                </span>

                {/* 2px Accent Underline on Active Tab */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
