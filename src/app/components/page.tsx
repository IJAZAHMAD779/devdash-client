"use client";

import { useState, useMemo, useEffect } from "react";
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
  Folder,
  LayoutGrid,
  List,
  Code2,
  Trash2,
  Edit2,
  MoreVertical,
} from "lucide-react";
import { useUIComponents, useDeleteComponent, useToggleComponentFavorite } from "@/hooks/use-components";
import { useProjects } from "@/hooks/use-projects";
import {
  UIComponentItem,
  ComponentFramework,
  ComponentStyling,
} from "@/types/component";
import { ComponentCard } from "@/components/ui-components/component-card";
import { ComponentCodeModal } from "@/components/ui-components/component-code-modal";
import { NewComponentModal } from "@/components/ui-components/new-component-modal";
import { EditComponentModal } from "@/components/ui-components/edit-component-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";

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

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<UIComponentItem | null>(null);
  const [viewingComponent, setViewingComponent] =
    useState<UIComponentItem | null>(null);

  const { data: projects } = useProjects();
  const deleteComponent = useDeleteComponent();
  const toggleFavorite = useToggleComponentFavorite();

  const {
    data: components,
    isLoading,
    isError,
    error,
    refetch,
  } = useUIComponents({
    framework: selectedFramework !== "ALL" ? selectedFramework : undefined,
    styling: selectedStyling !== "ALL" ? selectedStyling : undefined,
    category: selectedCategory !== "ALL" ? selectedCategory : undefined,
    projectId: selectedProjectId || undefined,
    favorite: onlyFavorites ? true : undefined,
    search: debouncedSearch,
  });

  // Extract all categories across fetched items
  const categories = useMemo(() => {
    const set = new Set<string>();
    components?.forEach((c) => {
      if (c.category && c.category.trim()) {
        set.add(c.category.trim());
      }
    });
    return Array.from(set);
  }, [components]);

  const handleToggleViewMode = (mode: "cards" | "list") => {
    sound.playClick(850);
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_components_view_mode", mode);
    }
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
      {/* Top Header — unified h-14 height matching sidebar brand header */}
      <div className="h-14 px-4 sm:px-6 border-b border-hairline flex items-center justify-between gap-4 bg-surface-1/40 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-ink truncate">
            UI Component Catalog
          </h1>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-primary/25 hover:shadow-primary/40 transition-all duration-150 flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Component</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-hairline bg-surface-1/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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

          {/* View Mode Toggle: Cards vs List */}
          <div className="flex items-center rounded-md bg-surface-2 p-0.5 border border-hairline shrink-0">
            <button
              onClick={() => handleToggleViewMode("cards")}
              className={cn(
                "p-1.5 rounded transition-all cursor-pointer",
                viewMode === "cards"
                  ? "bg-surface-3 text-ink shadow-xs"
                  : "text-ink-tertiary hover:text-ink"
              )}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleToggleViewMode("list")}
              className={cn(
                "p-1.5 rounded transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-surface-3 text-ink shadow-xs"
                  : "text-ink-tertiary hover:text-ink"
              )}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Folders Bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-hairline bg-surface-1/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-mono text-ink-tertiary uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Folder className="w-3 h-3 text-primary" />
          <span>Folder:</span>
        </span>

        <button
          onClick={() => {
            sound.playClick(850);
            setSelectedCategory("ALL");
          }}
          className={cn(
            "px-2.5 py-1 rounded text-xs font-medium tracking-tight whitespace-nowrap transition-colors cursor-pointer",
            selectedCategory === "ALL"
              ? "bg-primary text-white font-semibold"
              : "bg-surface-2 text-ink-muted hover:text-ink"
          )}
        >
          All Folders
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                sound.playClick(850);
                setSelectedCategory(cat);
              }}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium tracking-tight whitespace-nowrap transition-colors cursor-pointer capitalize",
                isActive
                  ? "bg-primary text-white font-semibold"
                  : "bg-surface-2 text-ink-muted hover:text-ink"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Framework Tabs Bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-hairline bg-surface-1/10 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
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

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-surface-1 border border-hairline p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-full rounded" />
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
          viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {components.map((component) => (
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
            <div className="rounded-xl border border-hairline bg-surface-1 divide-y divide-hairline/60 overflow-hidden">
              {components.map((component) => (
                <div
                  key={component.id}
                  onClick={() => handleViewCode(component)}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors cursor-pointer group"
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
                        <span className="text-[11px] font-mono text-ink-tertiary">·</span>
                        <span className="text-[11px] font-mono text-sky-400">
                          {component.framework}
                        </span>
                        <span className="text-[11px] font-mono text-ink-tertiary">·</span>
                        <span className="text-[11px] font-mono text-cyan-300">
                          {component.styling}
                        </span>
                        <span className="text-[11px] font-mono text-ink-tertiary">·</span>
                        <span className="text-[11px] font-mono text-ink-tertiary capitalize">
                          {component.category || "general"}
                        </span>
                      </div>
                      {component.description && (
                        <p className="text-[11px] text-ink-muted truncate mt-0.5">
                          {component.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {component.project && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-ink-tertiary">
                        <FolderKanban className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{component.project.title}</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCode(component);
                        }}
                        className="p-1.5 rounded hover:bg-surface-3 text-primary text-xs font-mono inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="View code"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">View Code</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditComponent(component);
                        }}
                        className="p-1.5 rounded hover:bg-surface-3 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
                        title="Edit component"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
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
              selectedCategory !== "ALL" ||
              selectedFramework !== "ALL" ||
              selectedStyling !== "ALL" ||
              onlyFavorites
                ? "Try adjusting your filter options or search query to see catalog items."
                : "Your UI catalog is empty. Save buttons, dialogs, cards, navigation bars, and inputs to reuse across apps."}
            </p>
            <div className="flex items-center justify-center gap-2.5">
              {(searchQuery ||
                selectedProjectId ||
                selectedCategory !== "ALL" ||
                selectedFramework !== "ALL" ||
                selectedStyling !== "ALL" ||
                onlyFavorites) && (
                <button
                  onClick={() => {
                    sound.playClick(600);
                    setSearchQuery("");
                    setSelectedProjectId("");
                    setSelectedCategory("ALL");
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

      {/* VS Code Style Code Viewer Modal */}
      <ComponentCodeModal
        component={viewingComponent}
        isOpen={!!viewingComponent}
        onClose={() => setViewingComponent(null)}
        onEdit={handleEditComponent}
      />

      {/* Create / Edit Modals */}
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
