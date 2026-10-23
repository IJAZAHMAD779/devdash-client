"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  PanelLeftClose,
} from "lucide-react";
import { Project, ProjectStatus } from "@/types/project";
import { ProjectFavicon } from "./project-favicon";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface ProjectExplorerProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onToggleCollapse?: () => void;
  className?: string;
}

const STATUS_ORDER: { status: ProjectStatus; label: string; dotClass: string }[] = [
  { status: "IN_PROGRESS", label: "In Progress", dotClass: "bg-primary animate-pulse" },
  { status: "PLANNING", label: "Planning", dotClass: "bg-blue-400" },
  { status: "ON_HOLD", label: "On Hold", dotClass: "bg-amber-400" },
  { status: "COMPLETED", label: "Completed", dotClass: "bg-emerald-400" },
  { status: "ARCHIVED", label: "Archived", dotClass: "bg-ink-tertiary" },
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

  // Group projects according to selected mode
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

      return STATUS_ORDER.map(({ status, label, dotClass }) => ({
        key: status,
        label,
        dotClass,
        items: map[status],
      })).filter((group) => group.items.length > 0);
    } else {
      // Group by Tech Stack
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
          dotClass: "bg-primary/70",
          items,
        }));

      if (other.length > 0) {
        groups.push({
          key: "General",
          label: "General / Other",
          dotClass: "bg-ink-tertiary",
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
    <div
      className={cn(
        "w-72 lg:w-80 border-r border-hairline bg-surface-1 flex flex-col select-none shrink-0 transition-all duration-200 overflow-hidden",
        className
      )}
    >
      {/* Explorer Header */}
      <div className="px-3.5 py-3 border-b border-hairline flex items-center justify-between bg-surface-1/90 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold tracking-[-0.2px] text-ink uppercase">
            Explorer
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 border border-hairline text-ink-subtle">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Group By Toggle */}
          <button
            onClick={() => {
              sound.playClick(700);
              setGroupBy((prev) => (prev === "status" ? "tech" : "status"));
            }}
            title={`Group by: ${groupBy === "status" ? "Tech Stack" : "Status"}`}
            className={cn(
              "p-1.5 rounded hover:bg-surface-2 text-xs transition-colors cursor-pointer",
              groupBy === "tech" ? "text-primary" : "text-ink-tertiary hover:text-ink"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* New Project Button */}
          <button
            onClick={() => {
              sound.playClick(900);
              onNewProject();
            }}
            title="Create Project"
            className="p-1.5 rounded hover:bg-surface-2 text-ink-subtle hover:text-ink transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Collapse Sidebar Button (Desktop) */}
          {onToggleCollapse && (
            <button
              onClick={() => {
                sound.playClick(600);
                onToggleCollapse();
              }}
              title="Collapse Explorer"
              aria-label="Collapse Explorer"
              className="hidden md:flex p-1.5 rounded hover:bg-surface-2 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Quick Filter */}
      <div className="p-2 border-b border-hairline bg-surface-1/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-tertiary absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter explorer..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded bg-surface-2 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong transition-all"
          />
        </div>
      </div>

      {/* Tree View Body */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1 text-xs">
        {groupedProjects.length === 0 ? (
          <div className="text-center py-8 px-4 text-ink-tertiary text-xs">
            {filterText ? "No projects match filter" : "No projects created"}
          </div>
        ) : (
          groupedProjects.map((group) => {
            const isGroupCollapsed = Boolean(collapsedGroups[group.key]);

            return (
              <div key={group.key} className="space-y-0.5">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded text-ink-muted hover:text-ink hover:bg-surface-2/60 transition-colors text-left font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
                    )}
                    <span
                      className={cn("w-1.5 h-1.5 rounded-full shrink-0", group.dotClass)}
                    />
                    <span className="truncate text-[11px] font-mono uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-tertiary">
                    {group.items.length}
                  </span>
                </button>

                {/* Project Items in Group */}
                {!isGroupCollapsed && (
                  <div className="pl-2 space-y-0.5 border-l border-hairline/50 ml-3.5 my-0.5">
                    {group.items.map((project) => {
                      const isSelected = project.id === selectedProjectId;

                      return (
                        <button
                          key={project.id}
                          onClick={() => {
                            sound.playClick(750);
                            onSelectProject(project.id);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-all duration-150 cursor-pointer group relative",
                            isSelected
                              ? "bg-surface-3 text-ink font-medium shadow-xs"
                              : "text-ink-muted hover:text-ink hover:bg-surface-2/70"
                          )}
                        >
                          {/* Active border bar */}
                          {isSelected && (
                            <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                          )}

                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ProjectFavicon
                              liveUrl={project.liveUrl}
                              repositoryUrl={project.repositoryUrl}
                              title={project.title}
                              size={15}
                            />
                            <span className="truncate text-xs tracking-[-0.1px]">
                              {project.title}
                            </span>
                          </div>

                          {project.favorite && (
                            <div className="flex items-center gap-1 shrink-0 ml-1.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </div>
                          )}
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
    </div>
  );
}
