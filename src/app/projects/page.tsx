"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  FolderKanban,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useDebounce } from "@/hooks/use-debounce";
import { Project, ProjectStatus } from "@/types/project";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectListRow } from "@/components/projects/project-list-row";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: ProjectStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "PLANNING", label: "Planning" },
  { id: "COMPLETED", label: "Completed" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "ARCHIVED", label: "Archived" },
];

export default function ProjectsPage() {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Tabs Sliding Pill state & refs (from 16-tabs-sliding.md)
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [pillStyle, setPillStyle] = useState<{ transform: string; width: string }>({
    transform: "translateX(0px)",
    width: "0px",
  });

  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
  } = useProjects(selectedStatus, debouncedSearch);

  // Update sliding pill position
  useEffect(() => {
    const activeTabEl = tabRefs.current[selectedStatus];
    if (activeTabEl) {
      setPillStyle({
        transform: `translateX(${activeTabEl.offsetLeft}px)`,
        width: `${activeTabEl.offsetWidth}px`,
      });
    }
  }, [selectedStatus]);

  const handleTabChange = (statusId: ProjectStatus | "ALL") => {
    sound.playClick(800);
    setSelectedStatus(statusId);
  };

  const handleOpenNewModal = () => {
    sound.playClick(900);
    setIsNewModalOpen(true);
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col">
      {/* Page Header */}
      <div className="px-8 pt-8 pb-6 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-[-0.6px] text-ink">
              Projects Hub
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-subtle">
              {projects?.length ?? 0}
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            Anchor for repositories, kanban tasks, code snippets, and architecture notes.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-primary/25 hover:shadow-primary/40 transition-all duration-150 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="px-8 py-4 border-b border-hairline bg-surface-1/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search projects by name or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong transition-all"
          />
        </div>

        {/* Right: Sliding Tabs + View Mode Toggles */}
        <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
          {/* Sliding Tabs Segmented Control (16-tabs-sliding.md) */}
          <div className="t-tabs overflow-x-auto" role="tablist">
            <span
              className="t-tabs-pill"
              aria-hidden="true"
              style={pillStyle}
            />
            {STATUS_TABS.map((tab) => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleTabChange(tab.id)}
                  className="t-tab whitespace-nowrap"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center p-0.5 rounded-md bg-surface-2 border border-hairline">
            <button
              onClick={() => {
                sound.playClick(700);
                setViewMode("grid");
              }}
              title="Grid view"
              className={cn(
                "p-1.5 rounded text-xs transition-colors",
                viewMode === "grid"
                  ? "bg-surface-4 text-ink shadow-sm"
                  : "text-ink-tertiary hover:text-ink"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick(700);
                setViewMode("list");
              }}
              title="List view"
              className={cn(
                "p-1.5 rounded text-xs transition-colors",
                viewMode === "list"
                  ? "bg-surface-4 text-ink shadow-sm"
                  : "text-ink-tertiary hover:text-ink"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 rounded-lg bg-surface-1 border border-hairline p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="h-4 w-3/5 rounded bg-surface-3" />
                  <div className="h-3 w-4/5 rounded bg-surface-2" />
                  <div className="h-3 w-1/2 rounded bg-surface-2" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-hairline/40">
                  <div className="h-3 w-24 rounded bg-surface-2" />
                  <div className="h-3 w-12 rounded bg-surface-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-lg bg-surface-1 border border-rose-500/20 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">
              Failed to load projects
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              {(error as any)?.message || "Could not reach the backend API."}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs hover:bg-surface-3 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Loaded State */}
        {!isLoading && !isError && (
          <>
            {/* Empty State */}
            {(!projects || projects.length === 0) && (
              <div className="text-center py-16 px-4 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mx-auto mb-4">
                  <FolderKanban className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-ink mb-1 tracking-[-0.2px]">
                  {searchQuery || selectedStatus !== "ALL"
                    ? "No matching projects found"
                    : "No projects in workspace"}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-5">
                  {searchQuery || selectedStatus !== "ALL"
                    ? "Try adjusting your search terms or status filters."
                    : "Create your first project container to organize tasks, code snippets, and UI components."}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink text-xs font-medium transition-colors cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    onClick={handleOpenNewModal}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm shadow-primary/25 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Project</span>
                  </button>
                </div>
              </div>
            )}

            {/* Grid View */}
            {projects && projects.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={(p) => setEditingProject(p)}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {projects && projects.length > 0 && viewMode === "list" && (
              <div className="rounded-lg border border-hairline divide-y divide-hairline bg-surface-1">
                {projects.map((project) => (
                  <ProjectListRow
                    key={project.id}
                    project={project}
                    onEdit={(p) => setEditingProject(p)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Project Modal (06-modal.md) */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        project={editingProject}
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
      />
    </div>
  );
}
