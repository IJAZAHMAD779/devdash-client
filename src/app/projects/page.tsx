"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  Columns,
  Table as TableIcon,
  FolderKanban,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useProjects,
  useDeleteProject,
  useToggleFavorite,
} from "@/hooks/use-projects";
import { useDebounce } from "@/hooks/use-debounce";
import { Project, ProjectStatus } from "@/types/project";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { ProjectWorkbench } from "@/components/projects/project-workbench";
import { ProjectDataGrid } from "@/components/projects/project-data-grid";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { sound } from "@/lib/audio";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ViewMode = "workbench" | "grid" | "table";

const STATUS_TABS: { id: ProjectStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "PLANNING", label: "Planning" },
  { id: "COMPLETED", label: "Completed" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "ARCHIVED", label: "Archived" },
];

function ProjectsPageInner() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as ViewMode) || "workbench";
  const initialId = searchParams.get("id");

  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialId
  );
  const [mobilePane, setMobilePane] = useState<"explorer" | "details">("explorer");
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
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
  } = useProjects(
    viewMode === "workbench" ? undefined : selectedStatus,
    viewMode === "workbench" ? undefined : debouncedSearch
  );

  const deleteProjectMutation = useDeleteProject();
  const toggleFavoriteMutation = useToggleFavorite();

  // Auto-select first project if none is selected
  useEffect(() => {
    if (projects && projects.length > 0) {
      if (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId)) {
        const favoriteProject = projects.find((p) => p.favorite);
        setSelectedProjectId(favoriteProject ? favoriteProject.id : projects[0].id);
      }
    }
  }, [projects, selectedProjectId]);

  // Sync state with URL without full page reload
  const updateUrlState = (id: string | null, view: ViewMode) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("id", id);
    } else {
      url.searchParams.delete("id");
    }
    url.searchParams.set("view", view);
    window.history.replaceState({}, "", url.toString());
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    updateUrlState(id, viewMode);
    setMobilePane("details");
  };

  const handleViewModeChange = (mode: ViewMode) => {
    sound.playClick(700);
    setViewMode(mode);
    updateUrlState(selectedProjectId, mode);
  };

  // Update sliding pill position
  useEffect(() => {
    const activeTabEl = tabRefs.current[selectedStatus];
    if (activeTabEl) {
      setPillStyle({
        transform: `translateX(${activeTabEl.offsetLeft}px)`,
        width: `${activeTabEl.offsetWidth}px`,
      });
    }
  }, [selectedStatus, viewMode]);

  const handleTabChange = (statusId: ProjectStatus | "ALL") => {
    sound.playClick(800);
    setSelectedStatus(statusId);
  };

  const handleOpenNewModal = () => {
    sound.playClick(900);
    setIsNewModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProjectMutation.mutateAsync(id);
      toast.success("Project deleted", {
        description: "The project has been removed from workspace.",
      });
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleToggleFavorite = (id: string, favorite: boolean) => {
    toggleFavoriteMutation.mutate({ id, favorite });
  };

  // Active project for workbench
  const activeProject = useMemo(() => {
    if (!projects || !selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Header — unified h-14 height matching sidebar brand header */}
      <div className="h-14 px-4 sm:px-6 border-b border-hairline flex items-center justify-between gap-4 bg-surface-1/40 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-ink truncate">
            Projects Hub
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-subtle">
            {projects?.length ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-md bg-surface-2 border border-hairline">
            <button
              onClick={() => handleViewModeChange("workbench")}
              title="Workbench View (Dual-Pane Explorer)"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer",
                viewMode === "workbench"
                  ? "bg-surface-4 text-ink shadow-sm font-medium"
                  : "text-ink-tertiary hover:text-ink"
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workbench</span>
            </button>

            <button
              onClick={() => handleViewModeChange("table")}
              title="Data Grid (Spreadsheet View)"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-surface-4 text-ink shadow-sm font-medium"
                  : "text-ink-tertiary hover:text-ink"
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Data Grid</span>
            </button>

            <button
              onClick={() => handleViewModeChange("grid")}
              title="Card Grid View"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-surface-4 text-ink shadow-sm font-medium"
                  : "text-ink-tertiary hover:text-ink"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          {/* New Project CTA */}
          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-primary/25 hover:shadow-primary/40 transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar for Table and Grid Views */}
      {viewMode !== "workbench" && (
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 border-b border-hairline bg-surface-1/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search projects by name, tags, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong transition-all"
            />
          </div>

          {/* Right: Sliding Tabs Segmented Control */}
          <div className="t-tabs overflow-x-auto no-scrollbar" role="tablist">
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
                  className="t-tab whitespace-nowrap text-xs"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && !isError && (
          <>
            {/* Empty Workspace State */}
            {(!projects || projects.length === 0) && (
              <div className="text-center py-16 px-4 max-w-sm mx-auto my-auto">
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mx-auto mb-4">
                  <FolderKanban className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-ink mb-1 tracking-[-0.2px]">
                  No projects in workspace
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-5">
                  Create your first project container to organize tasks, code snippets, and UI components.
                </p>
                <button
                  onClick={handleOpenNewModal}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm shadow-primary/25 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </button>
              </div>
            )}

            {/* View 1: Workbench Dual-Pane (Explorer + Command Center) */}
            {projects && projects.length > 0 && viewMode === "workbench" && (
              <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)] min-h-0">
                <div
                  className={cn(
                    "h-full",
                    mobilePane === "details"
                      ? "hidden md:flex"
                      : "flex w-full md:w-auto"
                  )}
                >
                  <ProjectExplorer
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={handleSelectProject}
                    onNewProject={handleOpenNewModal}
                    isCollapsed={isExplorerCollapsed}
                    onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
                    className="w-full md:w-72 lg:w-80"
                  />
                </div>
                <div
                  className={cn(
                    "h-full flex-1 min-w-0",
                    mobilePane === "explorer"
                      ? "hidden md:flex"
                      : "flex"
                  )}
                >
                  <ProjectWorkbench
                    project={activeProject}
                    onEdit={(p) => setEditingProject(p)}
                    onDelete={handleDeleteProject}
                    onToggleFavorite={handleToggleFavorite}
                    onBackToExplorer={() => setMobilePane("explorer")}
                  />
                </div>
              </div>
            )}

            {/* View 2: High-Density Data Grid (Spreadsheet) */}
            {projects && projects.length > 0 && viewMode === "table" && (
              <div className="p-3.5 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                <ProjectDataGrid
                  projects={projects}
                  onSelectProject={(id) => {
                    handleSelectProject(id);
                    handleViewModeChange("workbench");
                  }}
                  onEdit={(p) => setEditingProject(p)}
                  onDelete={handleDeleteProject}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}

            {/* View 3: Classic Card Grid */}
            {projects && projects.length > 0 && viewMode === "grid" && (
              <div className="p-3.5 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={(p) => setEditingProject(p)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Project Modal */}
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

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-screen bg-canvas p-8 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProjectsPageInner />
    </Suspense>
  );
}
