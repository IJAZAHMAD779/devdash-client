"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useUIComponents } from "@/hooks/use-components";
import { useProjects } from "@/hooks/use-projects";
import {
  UIComponentItem,
  ComponentFramework,
  ComponentStyling,
} from "@/types/component";
import { ComponentsTopBar } from "@/components/ui-components/components-top-bar";
import {
  ComponentFolderRail,
  ComponentFolderItem,
} from "@/components/ui-components/component-folder-rail";
import { ComponentFolderStrip } from "@/components/ui-components/component-folder-strip";
import dynamic from "next/dynamic";
import { ComponentCard } from "@/components/ui-components/component-card";
import { ComponentListView } from "@/components/ui-components/component-list-view";

const ComponentCodeModal = dynamic(
  () => import("@/components/ui-components/component-code-modal").then((m) => m.ComponentCodeModal),
  { ssr: false }
);
const ComponentSynthesizerModal = dynamic(
  () => import("@/components/ui-components/component-synthesizer-modal").then((m) => m.ComponentSynthesizerModal),
  { ssr: false }
);
const NewComponentModal = dynamic(
  () => import("@/components/ui-components/new-component-modal").then((m) => m.NewComponentModal),
  { ssr: false }
);
const EditComponentModal = dynamic(
  () => import("@/components/ui-components/edit-component-modal").then((m) => m.EditComponentModal),
  { ssr: false }
);
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ComponentsCatalogPage() {
  // Navigation & Filter state
  const [selectedFolder, setSelectedFolder] = useState<string>("all"); // "all" | "starred" | lowercase category
  const [selectedFrameworks, setSelectedFrameworks] = useState<ComponentFramework[]>([]);
  const [selectedStylings, setSelectedStylings] = useState<ComponentStyling[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);

  // View mode persistence ("cards" | "list")
  const [viewMode, setViewMode] = useState<"cards" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_components_view_mode");
      if (saved === "cards" || saved === "list") return saved;
    }
    return "cards";
  });

  const handleViewModeChange = (mode: "cards" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_components_view_mode", mode);
    }
  };

  // Modal states
  const [isSynthesizerOpen, setIsSynthesizerOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<UIComponentItem | null>(null);
  const [viewingComponent, setViewingComponent] = useState<UIComponentItem | null>(null);

  // Queries
  const { data: allComponents, isLoading, isError, error, refetch } = useUIComponents();
  const { data: projects } = useProjects();

  // Extract unique frameworks & stylings available in current dataset
  const availableFrameworks = useMemo<ComponentFramework[]>(() => {
    if (!allComponents) return ["REACT", "NEXTJS", "VUE", "SVELTE", "HTML_CSS"];
    const set = new Set<ComponentFramework>();
    allComponents.forEach((c) => {
      if (c.framework) set.add(c.framework);
    });
    return set.size > 0 ? Array.from(set) : ["REACT", "NEXTJS", "VUE", "SVELTE", "HTML_CSS"];
  }, [allComponents]);

  const availableStylings = useMemo<ComponentStyling[]>(() => {
    if (!allComponents) return ["TAILWIND", "CSS_MODULES", "VANILLA_CSS", "STYLED_COMPONENTS"];
    const set = new Set<ComponentStyling>();
    allComponents.forEach((c) => {
      if (c.styling) set.add(c.styling);
    });
    return set.size > 0 ? Array.from(set) : ["TAILWIND", "CSS_MODULES", "VANILLA_CSS", "STYLED_COMPONENTS"];
  }, [allComponents]);

  // Starred count
  const starredCount = useMemo(() => {
    return allComponents?.filter((c) => c.favorite).length || 0;
  }, [allComponents]);

  // Case-insensitive category grouping for the folder rail/strip
  const folderItems = useMemo<ComponentFolderItem[]>(() => {
    if (!allComponents) return [];

    // Map: lowercase -> { displayName, count }
    const catMap = new Map<string, { displayName: string; count: number }>();

    allComponents.forEach((c) => {
      const raw = (c.category || "general").trim();
      const lower = raw.toLowerCase();
      const existing = catMap.get(lower);
      if (existing) {
        existing.count += 1;
      } else {
        catMap.set(lower, { displayName: raw, count: 1 });
      }
    });

    // Sort categories: count descending, then name ascending
    const sortedCategories = Array.from(catMap.entries())
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => {
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count;
        }
        return a[1].displayName.localeCompare(b[1].displayName);
      })
      .map(([lowerKey, data]) => ({
        id: lowerKey,
        displayName: data.displayName,
        count: data.count,
      }));

    return [
      {
        id: "all",
        displayName: "All",
        count: allComponents.length,
        isAll: true,
      },
      {
        id: "starred",
        displayName: "Starred",
        count: starredCount,
        isStarred: true,
      },
      ...sortedCategories,
    ];
  }, [allComponents, starredCount]);

  // Filtered components calculation
  const filteredComponents = useMemo(() => {
    if (!allComponents) return [];

    const query = searchQuery.trim().toLowerCase();

    return allComponents.filter((comp) => {
      // 1. Search Query: If non-empty, matches across ALL folders
      if (query) {
        const nameMatch = comp.name.toLowerCase().includes(query);
        const catMatch = (comp.category || "").toLowerCase().includes(query);
        const descMatch = (comp.description || "").toLowerCase().includes(query);
        const tagMatch = comp.tags?.some((t) => t.toLowerCase().includes(query));
        const codeMatch = comp.code.toLowerCase().includes(query);

        if (!nameMatch && !catMatch && !descMatch && !tagMatch && !codeMatch) {
          return false;
        }
      } else {
        // 2. Folder Navigation (only applies when search is empty)
        if (selectedFolder === "starred") {
          if (!comp.favorite) return false;
        } else if (selectedFolder !== "all") {
          const compCat = (comp.category || "general").trim().toLowerCase();
          if (compCat !== selectedFolder.toLowerCase()) {
            return false;
          }
        }
      }

      // 3. Framework Filter
      if (selectedFrameworks.length > 0 && !selectedFrameworks.includes(comp.framework)) {
        return false;
      }

      // 4. Styling Filter
      if (selectedStylings.length > 0 && !selectedStylings.includes(comp.styling)) {
        return false;
      }

      // 5. Project Filter
      if (selectedProjectIds.length > 0 && (!comp.projectId || !selectedProjectIds.includes(comp.projectId))) {
        return false;
      }

      // 6. Starred Toggle
      if (onlyFavorites && !comp.favorite) {
        return false;
      }

      return true;
    });
  }, [
    allComponents,
    searchQuery,
    selectedFolder,
    selectedFrameworks,
    selectedStylings,
    selectedProjectIds,
    onlyFavorites,
  ]);

  const handleClearFilters = () => {
    sound.playClick(650);
    setSelectedFolder("all");
    setSelectedFrameworks([]);
    setSelectedStylings([]);
    setSelectedProjectIds([]);
    setOnlyFavorites(false);
    setSearchQuery("");
  };

  const handleEdit = (comp: UIComponentItem) => {
    sound.playClick(750);
    setEditingComponent(comp);
  };

  const handleViewCode = (comp: UIComponentItem) => {
    sound.playClick(800);
    setViewingComponent(comp);
  };

  const showCategoryLabel =
    selectedFolder === "all" ||
    selectedFolder === "starred" ||
    Boolean(searchQuery.trim());

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col @container">
      {/* Top Bar with Single-Row Filters & Actions */}
      <div className="px-4 sm:px-6 pt-4 pb-2 bg-canvas shrink-0">
        <ComponentsTopBar
          totalCount={allComponents?.length || 0}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onOpenSynthesizer={() => setIsSynthesizerOpen(true)}
          onNewComponent={() => setIsNewModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableFrameworks={availableFrameworks}
          selectedFrameworks={selectedFrameworks}
          onFrameworksChange={setSelectedFrameworks}
          availableStylings={availableStylings}
          selectedStylings={selectedStylings}
          onStylingsChange={setSelectedStylings}
          isRailCollapsed={isRailCollapsed}
          onToggleRail={() => setIsRailCollapsed(!isRailCollapsed)}
          projects={projects?.map((p) => ({ id: p.id, title: p.title || "Project" }))}
          selectedProjectIds={selectedProjectIds}
          onProjectIdsChange={setSelectedProjectIds}
          onlyFavorites={onlyFavorites}
          onToggleFavorites={() => setOnlyFavorites(!onlyFavorites)}
          starredCount={starredCount}
        />
      </div>

      {/* Responsive Horizontal Folder Strip (visible on container width < 900px) */}
      <div className="px-4 sm:px-6 block @[900px]:hidden">
        <ComponentFolderStrip
          folders={folderItems}
          selectedFolder={selectedFolder}
          onSelectFolder={(id) => setSelectedFolder(id)}
        />
      </div>

      {/* Main Body: Slim Folder Rail + Component Grid / List */}
      <div className="flex-1 flex px-4 sm:px-6 py-4 gap-6 min-w-0">
        {/* Slim Folder Rail (visible on container width >= 900px when not collapsed) */}
        {!isRailCollapsed && (
          <div className="hidden @[900px]:block shrink-0">
            <ComponentFolderRail
              folders={folderItems}
              selectedFolder={selectedFolder}
              onSelectFolder={(id) => setSelectedFolder(id)}
            />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {isLoading ? (
            /* Skeletons matching final dimensions */
            viewMode === "cards" ? (
              <div className="grid grid-cols-1 @[520px]:grid-cols-2 @[900px]:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-surface-1 border border-hairline p-3 flex flex-col gap-3"
                  >
                    <Skeleton className="h-32 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-1 border border-hairline divide-y divide-hairline overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-11 px-4 flex items-center justify-between gap-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            )
          ) : isError ? (
            /* Quiet error state */
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-danger font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to load components: {(error as Error)?.message || "API error"}</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 inline-flex items-center gap-1 text-ink underline hover:text-ink-muted cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredComponents.length === 0 ? (
            /* Quiet single-line empty state */
            <div className="py-12 px-4 rounded-lg bg-surface-1/40 border border-hairline/60 flex items-center justify-center text-center">
              {allComponents?.length === 0 ? (
                <p className="text-xs text-ink-muted font-mono">
                  No components yet in your catalog.{" "}
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(true)}
                    className="text-accent hover:underline font-medium cursor-pointer"
                  >
                    New Component
                  </button>
                </p>
              ) : (
                <p className="text-xs text-ink-muted font-mono">
                  No components match the active filters or search.{" "}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-accent hover:underline font-medium cursor-pointer"
                  >
                    Clear filters
                  </button>
                </p>
              )}
            </div>
          ) : viewMode === "cards" ? (
            /* Grid View: Responsive by container width 1 (<520px), 2 (520-900px), 3 (>900px) */
            <div className="grid grid-cols-1 @[520px]:grid-cols-2 @[900px]:grid-cols-3 gap-4 items-start">
              {filteredComponents.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onViewCode={handleViewCode}
                  onEdit={handleEdit}
                  showCategory={showCategoryLabel}
                />
              ))}
            </div>
          ) : (
            /* List View: 44px uniform rows, sortable headers */
            <ComponentListView
              components={filteredComponents}
              onViewCode={handleViewCode}
              onEdit={handleEdit}
              showCategory={showCategoryLabel}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ComponentCodeModal
        component={viewingComponent}
        isOpen={Boolean(viewingComponent)}
        onClose={() => setViewingComponent(null)}
        onEdit={handleEdit}
      />

      <ComponentSynthesizerModal
        isOpen={isSynthesizerOpen}
        onClose={() => setIsSynthesizerOpen(false)}
        onSaved={() => refetch()}
      />

      <NewComponentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        initialCategory={
          selectedFolder !== "all" && selectedFolder !== "starred"
            ? selectedFolder
            : undefined
        }
      />

      <EditComponentModal
        component={editingComponent}
        isOpen={Boolean(editingComponent)}
        onClose={() => setEditingComponent(null)}
      />
    </div>
  );
}
