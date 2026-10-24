"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  PanelLeftClose,
} from "lucide-react";
import { Project, ProjectStatus } from "@/types/project";
import { ProjectIcon } from "./project-icon";
import { StatusDot } from "./status-dot";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

export interface ProjectExplorerProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onToggleCollapse?: () => void;
  className?: string;
}

const STATUS_GROUPS: { status: ProjectStatus; label: string }[] = [
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "PLANNING", label: "Planning" },
  { status: "ON_HOLD", label: "On Hold" },
  { status: "COMPLETED", label: "Completed" },
  { status: "ARCHIVED", label: "Archived" },
];

export function ProjectExplorer({
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  onToggleCollapse,
  className,
}: ProjectExplorerProps) {
  const [filterText, setFilterText] = useState("");
  const [groupBy, setGroupBy] = useState<"status" | "tech">("status");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Filter projects by inline filter text
  const filteredProjects = useMemo(() => {
    if (!filterText.trim()) return projects;
    const query = filterText.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.techStack.some((t) => t.toLowerCase().includes(query))
    );
  }, [projects, filterText]);

  // Group projects
  const groupedProjects = useMemo(() => {
    if (groupBy === "status") {
      const map: Record<ProjectStatus, Project[]> = {
        IN_PROGRESS: [],
        PLANNING: [],
        ON_HOLD: [],
        COMPLETED: [],
        ARCHIVED: [],
      };

      for (const p of filteredProjects) {
        if (map[p.status]) {
          map[p.status].push(p);
        } else {
          map.PLANNING.push(p);
        }
      }

      return STATUS_GROUPS.map(({ status, label }) => ({
        key: status,
        label,
        items: map[status],
      })).filter((group) => group.items.length > 0);
    } else {
      // Group by Primary Tech
      const map = new Map<string, Project[]>();
      const other: Project[] = [];

      for (const p of filteredProjects) {
        if (!p.techStack || p.techStack.length === 0) {
          other.push(p);
        } else {
          const primaryTech = p.techStack[0];
          const existing = map.get(primaryTech) || [];
          existing.push(p);
          map.set(primaryTech, existing);
        }
      }

      const groups = Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tech, items]) => ({
          key: tech,
          label: tech,
          items,
        }));

      if (other.length > 0) {
        groups.push({
          key: "General",
          label: "General",
          items: other,
        });
      }

      return groups;
    }
  }, [filteredProjects, groupBy]);

  const toggleGroup = (key: string) => {
    sound.playClick(600);
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside
      className={cn(
        "w-[240px] border-r border-line bg-surface-1 flex flex-col select-none shrink-0 transition-all duration-200 overflow-hidden",
        className
      )}
    >
      {/* 1. Header (clean hairline border, collapse toggle) */}
      <div className="h-11 px-3 border-b border-line flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">
            EXPLORER
          </span>
          <span className="text-[10px] font-mono text-subtle">
            ({projects.length})
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Group By Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(700);
              setGroupBy((prev) => (prev === "status" ? "tech" : "status"));
            }}
            title={`Group by: ${groupBy === "status" ? "Tech Stack" : "Status"}`}
            aria-label={`Group by: ${groupBy === "status" ? "Tech Stack" : "Status"}`}
            className={cn(
              "p-1 rounded-[4px] hover:bg-surface-2 transition-colors cursor-pointer",
              groupBy === "tech" ? "text-accent" : "text-subtle hover:text-text-primary"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          {/* New Project Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(900);
              onNewProject();
            }}
            title="Create Project"
            aria-label="Create Project"
            className="p-1 rounded-[4px] hover:bg-surface-2 text-subtle hover:text-text-primary transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          {/* Collapse Explorer Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={() => {
                sound.playClick(600);
                onToggleCollapse();
              }}
              title="Collapse Explorer"
              aria-label="Collapse Explorer"
              className="p-1 rounded-[4px] hover:bg-surface-2 text-subtle hover:text-text-primary transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Quiet Inline Filter (32px, 6px radius, surface-2) */}
      <div className="p-2 border-b border-line shrink-0">
        <div className="relative">
          <Search className="w-3 h-3 text-subtle absolute left-2.5 top-1/2 -translate-y-1/2 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Filter explorer..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full h-7 pl-7 pr-2.5 text-xs rounded-[6px] bg-surface-2 border border-line text-text-primary placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* 3. Tree View Body */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1 text-xs no-scrollbar">
        {groupedProjects.length === 0 ? (
          <div className="text-center py-8 px-2 text-subtle text-xs">
            {filterText ? "No matching projects" : "No projects created"}
          </div>
        ) : (
          groupedProjects.map((group) => {
            const isGroupCollapsed = Boolean(collapsedGroups[group.key]);

            return (
              <div key={group.key} className="space-y-0.5">
                {/* Group Header (Mono label style) */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded-[4px] text-muted hover:text-text-primary hover:bg-surface-2/60 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3 h-3 text-subtle shrink-0 stroke-[1.5]" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-subtle shrink-0 stroke-[1.5]" />
                    )}
                    <span className="truncate text-[11px] font-mono uppercase tracking-[0.08em] text-muted">
                      {group.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-subtle">
                    {group.items.length}
                  </span>
                </button>

                {/* Project Items in Group (32px rows) */}
                {!isGroupCollapsed && (
                  <div className="space-y-0.5 pl-1.5 my-0.5">
                    {group.items.map((project) => {
                      const isSelected = project.id === selectedProjectId;
                      const showDot = project.status !== "COMPLETED";

                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            sound.playClick(750);
                            onSelectProject(project.id);
                          }}
                          className={cn(
                            "relative w-full h-8 flex items-center justify-between px-2 rounded-[6px] text-left transition-colors cursor-pointer group select-none",
                            isSelected
                              ? "bg-surface-2 text-text-primary font-medium"
                              : "text-muted hover:text-text-primary hover:bg-surface-2/60"
                          )}
                        >
                          {/* 2px Left Accent Bar on Active Item */}
                          {isSelected && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-accent rounded-r" />
                          )}

                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ProjectIcon
                              liveUrl={project.liveUrl}
                              repositoryUrl={project.repositoryUrl}
                              title={project.title}
                              size="sm"
                              tileRadius="sm"
                            />
                            <span className="truncate text-xs tracking-tight">
                              {project.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {showDot && (
                              <StatusDot status={project.status} showLabel={false} />
                            )}
                            {project.favorite && (
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
