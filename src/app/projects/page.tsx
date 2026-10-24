"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, FolderKanban, AlertCircle, RefreshCw } from "lucide-react";
import {
  useProjects,
  useDeleteProject,
  useToggleFavorite,
} from "@/hooks/use-projects";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsTelemetryRateLimited } from "@/hooks/use-repo-telemetry";
import { Project, ProjectStatus } from "@/types/project";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { ProjectWorkbench } from "@/components/projects/project-workbench";
import { ProjectDataGrid } from "@/components/projects/project-data-grid";
import { ProjectsTopBar, ViewMode, StatusCountMap } from "@/components/projects/projects-top-bar";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { sound } from "@/lib/audio";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function ProjectsPageInner() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const urlView = searchParams.get("view") as ViewMode;
      if (urlView && ["workbench", "table", "grid"].includes(urlView)) return urlView;
      const saved = localStorage.getItem("devdash_projects_view_mode") as ViewMode;
      if (saved && ["workbench", "table", "grid"].includes(saved)) return saved;
    }
    return (searchParams.get("view") as ViewMode) || "workbench";
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialId);
  const [mobilePane, setMobilePane] = useState<"explorer" | "details">("explorer");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);

  const isRateLimited = useIsTelemetryRateLimited();

  // Load explorer collapse state with smart default: if content width < 900px, collapse by default
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_projects_sidebar_collapsed");
      if (saved !== null) {
        setIsExplorerCollapsed(saved === "true");
      } else if (window.innerWidth < 900) {
        setIsExplorerCollapsed(true);
      }
    }
  }, []);

  const handleToggleExplorerCollapse = () => {
    setIsExplorerCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("devdash_projects_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // Fetch all projects for consistent counts and fast zero-latency client filtering
  const {
    data: allProjects,
    isLoading,
    isError,
    error,
    refetch,
  } = useProjects();

  const deleteProjectMutation = useDeleteProject();
  const toggleFavoriteMutation = useToggleFavorite();

  // Status counts map for top bar tabs
  const statusCounts = useMemo((): StatusCountMap => {
    const counts: StatusCountMap = {
      ALL: allProjects?.length ?? 0,
      IN_PROGRESS: 0,
      PLANNING: 0,
      COMPLETED: 0,
      ON_HOLD: 0,
      ARCHIVED: 0,
    };
    allProjects?.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });
    return counts;
  }, [allProjects]);

  // Filtered projects based on selected status and search query
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    return allProjects.filter((p) => {
      // Status filter
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
        return false;
      }
      // Search filter
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchDesc = p.description?.toLowerCase().includes(query);
        const matchTech = p.techStack?.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchTech) return false;
      }
      return true;
    });
  }, [allProjects, selectedStatus, debouncedSearch]);

  // Auto-select first project in workbench if none is selected
  useEffect(() => {
    if (allProjects && allProjects.length > 0) {
      if (!selectedProjectId || !allProjects.some((p) => p.id === selectedProjectId)) {
        const favoriteProject = allProjects.find((p) => p.favorite);
        setSelectedProjectId(favoriteProject ? favoriteProject.id : allProjects[0].id);
      }
    }
  }, [allProjects, selectedProjectId]);

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
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_projects_view_mode", mode);
    }
    updateUrlState(selectedProjectId, mode);
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
    if (!allProjects || !selectedProjectId) return null;
    return allProjects.find((p) => p.id === selectedProjectId) || null;
  }, [allProjects, selectedProjectId]);

  return (
    <div className="flex-1 min-h-screen bg-dashboard-canvas text-text-primary flex flex-col">
      {/* Shared Projects Top Bar (Two rows: Title/View/New Project + Search/Underline Status Tabs) */}
      <ProjectsTopBar
        totalCount={allProjects?.length ?? 0}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onNewProject={handleOpenNewModal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusCounts={statusCounts}
        isRateLimited={isRateLimited}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-36 rounded-[8px] bg-surface-1 border border-line p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="h-4 w-3/5 rounded bg-surface-2" />
                  <div className="h-3 w-4/5 rounded bg-surface-2/60" />
                </div>
                <div className="h-3 w-1/3 rounded bg-surface-2/40" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-[8px] bg-surface-1 border border-danger/30 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-danger mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Failed to load projects
            </h3>
            <p className="text-xs text-muted mb-4">
              {(error as any)?.message || "Could not reach the backend API."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-surface-2 border border-line text-text-primary text-xs hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 stroke-[1.5]" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && !isError && (
          <>
            {/* Empty Workspace State */}
            {(!allProjects || allProjects.length === 0) && (
              <div className="text-center py-16 px-4 max-w-sm mx-auto my-auto">
                <div className="w-10 h-10 rounded-[6px] bg-surface-2 border border-line flex items-center justify-center text-muted mx-auto mb-3">
                  <FolderKanban className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  No projects in workspace
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  Create your first project container to organize tasks, code snippets, and UI components.
                </p>
                <button
                  type="button"
                  onClick={handleOpenNewModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </button>
              </div>
            )}

            {/* View 1: Workbench Dual-Pane (Explorer + Command Center) */}
            {allProjects && allProjects.length > 0 && viewMode === "workbench" && (
              <div className="flex-1 flex overflow-hidden h-[calc(100vh-6.5rem)] min-h-0">
                <div
                  className={cn(
                    "h-full shrink-0 transition-all duration-200",
                    isExplorerCollapsed
                      ? "hidden"
                      : mobilePane === "details"
                      ? "hidden md:flex"
                      : "flex w-full md:w-auto"
                  )}
                >
                  <ProjectExplorer
                    projects={filteredProjects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={handleSelectProject}
                    onNewProject={handleOpenNewModal}
                    onToggleCollapse={handleToggleExplorerCollapse}
                  />
                </div>
                <div
                  className={cn(
                    "h-full flex-1 min-w-0",
                    mobilePane === "explorer" ? "hidden md:flex" : "flex"
                  )}
                >
                  <ProjectWorkbench
                    project={activeProject}
                    onEdit={(p) => setEditingProject(p)}
                    onDelete={handleDeleteProject}
                    onToggleFavorite={handleToggleFavorite}
                    onBackToExplorer={() => setMobilePane("explorer")}
                    isExplorerCollapsed={isExplorerCollapsed}
                    onToggleExplorer={handleToggleExplorerCollapse}
                  />
                </div>
              </div>
            )}

            {/* View 2: High-Density Data Grid (Spreadsheet) */}
            {allProjects && allProjects.length > 0 && viewMode === "table" && (
              <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto no-scrollbar @container">
                <div className="max-w-7xl mx-auto w-full">
                  <ProjectDataGrid
                    projects={filteredProjects}
                    onSelectProject={(id) => {
                      handleSelectProject(id);
                      handleViewModeChange("workbench");
                    }}
                    onEdit={(p) => setEditingProject(p)}
                    onDelete={handleDeleteProject}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              </div>
            )}

            {/* View 3: Cards Grid */}
            {allProjects && allProjects.length > 0 && viewMode === "grid" && (
              <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto no-scrollbar @container">
                <div className="max-w-7xl mx-auto w-full">
                  {filteredProjects.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-xs text-muted border border-line rounded-[8px] bg-surface-1">
                      No projects match the selected criteria.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 gap-4">
                      {filteredProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onEdit={(p) => setEditingProject(p)}
                          onSelect={(id) => {
                            handleSelectProject(id);
                            handleViewModeChange("workbench");
                          }}
                          filterStatus={selectedStatus}
                        />
                      ))}
                    </div>
                  )}
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
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProjectsPageInner />
    </Suspense>
  );
}
