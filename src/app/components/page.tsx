"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Star,
  FolderKanban,
  AlertCircle,
  RefreshCw,
  Palette,
  Folder,
  LayoutGrid,
  List,
  ArrowLeft,
  Layers,
  Blocks,
} from "lucide-react";
import {
  useUIComponents,
  useDeleteComponent,
  useToggleComponentFavorite,
} from "@/hooks/use-components";
import { useProjects } from "@/hooks/use-projects";
import {
  UIComponentItem,
  ComponentFramework,
  ComponentStyling,
} from "@/types/component";
import { FolderCard } from "@/components/ui-components/folder-card";
import { ComponentCard } from "@/components/ui-components/component-card";
import { ComponentCodeModal } from "@/components/ui-components/component-code-modal";
import { ComponentSynthesizerModal } from "@/components/ui-components/component-synthesizer-modal";
import { NewComponentModal } from "@/components/ui-components/new-component-modal";
import { EditComponentModal } from "@/components/ui-components/edit-component-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

const FRAMEWORK_TABS: { id: ComponentFramework | "ALL"; label: string }[] = [
  { id: "ALL", label: "All Frameworks" },
  { id: "REACT", label: "React" },
  { id: "NEXTJS", label: "Next.js" },
  { id: "VUE", label: "Vue" },
  { id: "SVELTE", label: "Svelte" },
  { id: "HTML_CSS", label: "HTML/CSS" },
];

const STYLING_OPTIONS: { id: ComponentStyling | "ALL"; label: string }[] = [
  { id: "ALL", label: "All Styling" },
  { id: "TAILWIND", label: "Tailwind CSS" },
  { id: "CSS_MODULES", label: "CSS Modules" },
  { id: "VANILLA_CSS", label: "Vanilla CSS" },
  { id: "STYLED_COMPONENTS", label: "Styled Components" },
];

export default function ComponentsCatalogPage() {
  const [viewLevel, setViewLevel] = useState<"folders" | "components">("folders");
  const [selectedFramework, setSelectedFramework] = useState<
    ComponentFramework | "ALL"
  >("ALL");
  const [selectedStyling, setSelectedStyling] = useState<
    ComponentStyling | "ALL"
  >("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState<"cards" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_components_view_mode");
      if (saved === "cards" || saved === "list") return saved;
    }
    return "cards";
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Auto-switch to components view if user searches
  useEffect(() => {
    if (debouncedSearch.trim()) {
      setViewLevel("components");
    }
  }, [debouncedSearch]);

  const [isSynthesizerOpen, setIsSynthesizerOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<UIComponentItem | null>(null);
  const [viewingComponent, setViewingComponent] =
    useState<UIComponentItem | null>(null);

  const { data: projects } = useProjects();
  const deleteComponent = useDeleteComponent();
  const toggleFavorite = useToggleComponentFavorite();

  // Fetch components across selected framework, styling, project, favorite, search
  const {
    data: allComponents,
    isLoading,
    isError,
    error,
    refetch,
  } = useUIComponents({
    framework: selectedFramework !== "ALL" ? selectedFramework : undefined,
    styling: selectedStyling !== "ALL" ? selectedStyling : undefined,
    projectId: selectedProjectId || undefined,
    favorite: onlyFavorites ? true : undefined,
    search: debouncedSearch,
  });

  // Category counts map for folder view
  const categoryFolders = useMemo(() => {
    const map = new Map<string, number>();
    allComponents?.forEach((c) => {
      const cat = c.category?.trim() || "general";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [allComponents]);

  // Filtered components when inside a folder or viewing all
  const displayedComponents = useMemo(() => {
    if (!allComponents) return [];
    if (selectedCategory === "ALL") return allComponents;
    return allComponents.filter(
      (c) =>
        (c.category?.trim() || "general").toLowerCase() ===
        selectedCategory.toLowerCase()
    );
  }, [allComponents, selectedCategory]);

  const handleToggleViewMode = (mode: "cards" | "list") => {
    sound.playClick(850);
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_components_view_mode", mode);
    }
  };

  const handleSelectFolder = (categoryName: string) => {
    sound.playClick(850);
    setSelectedCategory(categoryName);
    setViewLevel("components");
  };

  const handleBackToFolders = () => {
    sound.playClick(800);
    setSelectedCategory("ALL");
    setViewLevel("folders");
  };

  const handleOpenNewModal = () => {
    sound.playClick(900);
    setIsNewModalOpen(true);
  };

  const handleEditComponent = (comp: UIComponentItem) => {
    sound.playClick(750);
    setEditingComponent(comp);
  };

  const handleViewCode = (comp: UIComponentItem) => {
    sound.playClick(800);
    setViewingComponent(comp);
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Header */}
      <div className="h-14 px-4 sm:px-6 border-b border-hairline flex items-center justify-between gap-4 bg-surface-1/40 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-ink truncate">
            UI Component Catalog
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick(900);
              setIsSynthesizerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium border border-hairline hover:border-hairline-strong transition-all duration-150 flex-shrink-0 cursor-pointer shadow-xs"
            title="Open AI Component Synthesizer & Architect"
          >
            <Blocks className="w-3.5 h-3.5 text-primary" />
            <span>AI Synthesizer</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-primary/25 hover:shadow-primary/40 transition-all duration-150 flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Component</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb & Navigation Subheader */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-hairline bg-surface-1/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Breadcrumbs navigation */}
        <div className="flex items-center gap-2 min-w-0">
          {viewLevel === "components" ? (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleBackToFolders}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer text-xs font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Folders</span>
              </button>
              <span className="text-ink-tertiary">/</span>
              <span className="font-semibold text-ink capitalize truncate">
                {selectedCategory === "ALL" ? "All Components" : selectedCategory}
              </span>
              <span className="text-xs text-ink-tertiary font-mono">
                ({displayedComponents.length})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Folder className="w-3.5 h-3.5 text-primary" />
                <span>Component Folders</span>
                <span className="text-xs font-normal text-ink-muted">
                  ({categoryFolders.length} categories)
                </span>
              </div>
              <span className="text-ink-tertiary">·</span>
              <button
                onClick={() => {
                  sound.playClick(850);
                  setSelectedCategory("ALL");
                  setViewLevel("components");
                }}
                className="text-xs text-primary hover:underline cursor-pointer font-medium"
              >
                Browse all {allComponents?.length || 0} components
              </button>
            </div>
          )}
        </div>

        {/* Right: Search + View mode switch */}
        <div className="flex items-center gap-2.5 justify-end">
          {/* Search bar matching Image 2 */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
            />
          </div>

          {/* Grid / List View Toggle matching Image 2 */}
          {viewLevel === "components" && (
            <div className="flex items-center rounded-lg bg-surface-2 p-0.5 border border-hairline shrink-0">
              <button
                onClick={() => handleToggleViewMode("cards")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                  viewMode === "cards"
                    ? "bg-surface-3 text-ink shadow-xs"
                    : "text-ink-tertiary hover:text-ink"
                )}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid view</span>
              </button>
              <button
                onClick={() => handleToggleViewMode("list")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-surface-3 text-ink shadow-xs"
                    : "text-ink-tertiary hover:text-ink"
                )}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List view</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-hairline bg-surface-1/10 flex flex-wrap items-center justify-between gap-2.5 overflow-x-auto no-scrollbar">
        {/* Framework Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {FRAMEWORK_TABS.map((tab) => {
            const isActive = selectedFramework === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick(850);
                  setSelectedFramework(tab.id);
                }}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium tracking-tight whitespace-nowrap transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-surface-3 text-ink font-semibold border border-hairline"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Styling, Project, Starred Filters */}
        <div className="flex items-center gap-2">
          {/* Styling filter */}
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-ink-tertiary" />
            <select
              value={selectedStyling}
              onChange={(e) =>
                setSelectedStyling(e.target.value as ComponentStyling | "ALL")
              }
              className="px-2 py-1 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none transition-colors"
            >
              {STYLING_OPTIONS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project selector */}
          <div className="flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2 py-1 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">All Projects</option>
              {projects?.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>

          {/* Starred filter */}
          <button
            onClick={() => {
              sound.playClick(800);
              setOnlyFavorites(!onlyFavorites);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all duration-150 cursor-pointer",
              onlyFavorites
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-surface-2 border-hairline text-ink-muted hover:text-ink hover:border-hairline-strong"
            )}
            title="Filter starred components"
          >
            <Star
              className={cn(
                "w-3.5 h-3.5",
                onlyFavorites ? "fill-amber-400 text-amber-400" : "text-ink-tertiary"
              )}
            />
            <span className="hidden sm:inline">Starred</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface-1 border border-hairline p-4 space-y-3 shadow-xs"
              >
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-semantic-error/30 bg-semantic-error/5 p-8 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-semantic-error mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">
              Failed to load components
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              {(error as Error)?.message || "Network error communicating with API"}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : viewLevel === "folders" ? (
          /* LEVEL 1: Folder Collection Grid matching Image 1 (NO 3 colored dots) */
          categoryFolders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {/* "All Components" Folder Card */}
              <FolderCard
                name="All Components"
                count={allComponents?.length || 0}
                onClick={() => {
                  setSelectedCategory("ALL");
                  setViewLevel("components");
                }}
              />

              {/* Individual Category Folder Cards */}
              {categoryFolders.map((folder) => (
                <FolderCard
                  key={folder.name}
                  name={folder.name}
                  count={folder.count}
                  onClick={() => handleSelectFolder(folder.name)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl border border-hairline bg-surface-1/40 p-12 text-center max-w-md mx-auto my-12">
              <Folder className="w-12 h-12 text-ink-tertiary mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-ink mb-1">
                No component folders yet
              </h3>
              <p className="text-xs text-ink-muted mb-4 leading-relaxed">
                Start building your design system by creating your first reusable UI component.
              </p>
              <button
                onClick={handleOpenNewModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Component</span>
              </button>
            </div>
          )
        ) : (
          /* LEVEL 2: Component Catalog Grid matching Image 2 (NO 3 colored dots) */
          displayedComponents.length > 0 ? (
            viewMode === "cards" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
                {displayedComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onEdit={handleEditComponent}
                    onViewCode={handleViewCode}
                  />
                ))}
              </div>
            ) : (
              /* Compact List View */
              <div className="rounded-2xl border border-hairline bg-surface-1 divide-y divide-hairline/60 overflow-hidden">
                {displayedComponents.map((component) => (
                  <div
                    key={component.id}
                    onClick={() => handleViewCode(component)}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite.mutate({
                            id: component.id,
                            favorite: !component.favorite,
                          });
                        }}
                        className="p-1 rounded text-ink-tertiary hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Star
                          className={cn(
                            "w-3.5 h-3.5",
                            component.favorite && "fill-amber-400 text-amber-400"
                          )}
                        />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors truncate">
                            {component.name}
                          </span>
                          <span className="text-ink-tertiary">·</span>
                          <span className="text-xs text-ink-muted capitalize truncate font-normal">
                            {component.category || "general"}
                          </span>
                        </div>
                        {component.description && (
                          <p className="text-[11px] text-ink-tertiary truncate mt-0.5">
                            {component.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-ink-tertiary">
                        {component.framework}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditComponent(component);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-3 text-ink-muted hover:text-ink transition-all text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Empty state inside a folder */
            <div className="rounded-2xl border border-hairline bg-surface-1/40 p-12 text-center max-w-md mx-auto my-12">
              <Blocks className="w-10 h-10 text-ink-tertiary mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-ink mb-1">
                No components found
              </h3>
              <p className="text-xs text-ink-muted mb-4 leading-relaxed">
                {searchQuery
                  ? `No components matched "${searchQuery}".`
                  : `No components found in this category.`}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleBackToFolders}
                  className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  Back to Folders
                </button>
                <button
                  onClick={handleOpenNewModal}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                >
                  Create Component
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <ComponentCodeModal
        component={viewingComponent}
        isOpen={Boolean(viewingComponent)}
        onClose={() => setViewingComponent(null)}
        onEdit={handleEditComponent}
      />

      <ComponentSynthesizerModal
        isOpen={isSynthesizerOpen}
        onClose={() => setIsSynthesizerOpen(false)}
        onSaved={() => refetch()}
      />

      <NewComponentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        initialCategory={selectedCategory !== "ALL" ? selectedCategory : undefined}
      />

      <EditComponentModal
        component={editingComponent}
        isOpen={Boolean(editingComponent)}
        onClose={() => setEditingComponent(null)}
      />
    </div>
  );
}
