"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Component as ComponentIcon,
  Star,
  FolderKanban,
  Filter,
  AlertCircle,
  RefreshCw,
  Layers,
  Palette,
} from "lucide-react";
import { useUIComponents } from "@/hooks/use-components";
import { useProjects } from "@/hooks/use-projects";
import {
  UIComponentItem,
  ComponentFramework,
  ComponentStyling,
} from "@/types/component";
import { ComponentCard } from "@/components/ui-components/component-card";
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
  const [selectedFramework, setSelectedFramework] = useState<
    ComponentFramework | "ALL"
  >("ALL");
  const [selectedStyling, setSelectedStyling] = useState<
    ComponentStyling | "ALL"
  >("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<UIComponentItem | null>(null);

  const { data: projects } = useProjects();
  const {
    data: components,
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

  const totalCount = components?.length ?? 0;
  const favoriteCount = components?.filter((c) => c.favorite).length ?? 0;

  const handleOpenNewModal = () => {
    sound.playClick(900);
    setIsNewModalOpen(true);
  };

  const handleEditComponent = (comp: UIComponentItem) => {
    sound.playClick(750);
    setEditingComponent(comp);
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-[-0.6px] text-ink">
              UI Component Catalog
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-subtle">
              {totalCount} Component{totalCount === 1 ? "" : "s"}
            </span>
            {favoriteCount > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {favoriteCount}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            Reusable frontend building blocks, animations, and micro-interactions categorized by framework and styling engine.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-primary/25 hover:shadow-primary/40 transition-all duration-150 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Component</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-hairline bg-surface-1/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search component, code, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
          />
        </div>

        {/* Right filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Styling Engine Dropdown */}
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-ink-tertiary" />
            <select
              value={selectedStyling}
              onChange={(e) =>
                setSelectedStyling(e.target.value as ComponentStyling | "ALL")
              }
              className="px-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none transition-colors"
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
              className="px-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">All Projects</option>
              {projects?.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>

          {/* Favorites toggle */}
          <button
            onClick={() => {
              sound.playClick(800);
              setOnlyFavorites(!onlyFavorites);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all duration-150 cursor-pointer",
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
            <span>Starred</span>
          </button>
        </div>
      </div>

      {/* Framework Tabs Bar */}
      <div className="px-8 py-2.5 border-b border-hairline bg-surface-1/20 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
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
                "px-3 py-1 rounded text-xs font-medium tracking-tight whitespace-nowrap transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-primary text-white shadow-xs font-semibold"
                  : "bg-surface-2/60 text-ink-muted hover:text-ink hover:bg-surface-2 border border-transparent"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-surface-1 border border-hairline p-5 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-semantic-error/30 bg-semantic-error/5 p-8 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-semantic-error mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">
              Failed to load components
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              {(error as Error)?.message || "Network error communicating with API"}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : components && components.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onEdit={handleEditComponent}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-muted mb-4">
              <ComponentIcon className="w-6 h-6 text-primary/70" />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-ink mb-1">
              No components found
            </h3>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              {searchQuery ||
              selectedProjectId ||
              selectedFramework !== "ALL" ||
              selectedStyling !== "ALL" ||
              onlyFavorites
                ? "Try adjusting your filter options or search query to see catalog items."
                : "Your UI catalog is empty. Save buttons, dialogs, cards, navigation bars, and inputs to reuse across apps."}
            </p>
            <div className="flex items-center justify-center gap-2.5">
              {(searchQuery ||
                selectedProjectId ||
                selectedFramework !== "ALL" ||
                selectedStyling !== "ALL" ||
                onlyFavorites) && (
                <button
                  onClick={() => {
                    sound.playClick(600);
                    setSearchQuery("");
                    setSelectedProjectId("");
                    setSelectedFramework("ALL");
                    setSelectedStyling("ALL");
                    setOnlyFavorites(false);
                  }}
                  className="px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink text-xs font-medium transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={handleOpenNewModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Component</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewComponentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <EditComponentModal
        component={editingComponent}
        isOpen={!!editingComponent}
        onClose={() => setEditingComponent(null)}
      />
    </div>
  );
}
