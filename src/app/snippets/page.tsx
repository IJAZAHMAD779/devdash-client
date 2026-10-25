"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useSnippets } from "@/hooks/use-snippets";
import { useProjects } from "@/hooks/use-projects";
import { Snippet } from "@/types/snippet";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Shared Snippets Components
import { LanguageDot, formatLanguageName } from "@/components/snippets/language-dot";
import { FolderRail, FolderItem } from "@/components/snippets/folder-rail";
import { FolderStrip } from "@/components/snippets/folder-strip";
import { SnippetsTopBar } from "@/components/snippets/snippets-top-bar";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { SnippetListView } from "@/components/snippets/snippet-list-view";
import { EmptyState } from "@/components/snippets/empty-state";
import { SnippetCodeModal } from "@/components/snippets/snippet-code-modal";
import { NewSnippetModal } from "@/components/snippets/new-snippet-modal";
import { EditSnippetModal } from "@/components/snippets/edit-snippet-modal";

export default function SnippetsPage() {
  // 1. View mode: Grid ("cards") or List ("list") - persisted
  const [viewMode, setViewMode] = useState<"cards" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_snippets_view_mode");
      if (saved === "cards" || saved === "list") return saved;
    }
    return "cards";
  });

  // 2. Folder Selection: "all", "starred", or specific language - persisted
  const [selectedFolder, setSelectedFolder] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_snippets_folder");
      if (saved) return saved;
    }
    return "all";
  });

  // 3. Rail Collapse state - persisted
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("devdash_snippets_rail_collapsed") === "true";
    }
    return false;
  });

  // 4. Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // 5. Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [viewingSnippet, setViewingSnippet] = useState<Snippet | null>(null);

  // Data fetching
  const { data: projects } = useProjects();
  const {
    data: allSnippets,
    isLoading,
    isError,
    error,
    refetch,
  } = useSnippets({
    search: debouncedSearch,
  });

  // Persist viewMode
  const handleViewModeChange = (mode: "cards" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_snippets_view_mode", mode);
    }
  };

  // Persist selected folder
  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_snippets_folder", folderId);
    }
  };

  // Persist rail collapse
  const handleToggleRailCollapse = () => {
    setIsRailCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("devdash_snippets_rail_collapsed", String(next));
      }
      return next;
    });
  };

  // Build folder list for rail & strip
  const { folders, totalCount, starredCount } = useMemo(() => {
    const snippets = allSnippets || [];
    const total = snippets.length;
    const starred = snippets.filter((s) => s.favorite).length;

    // Group by language
    const langCountMap = new Map<string, number>();
    snippets.forEach((s) => {
      const lang = s.language?.trim().toLowerCase() || "other";
      langCountMap.set(lang, (langCountMap.get(lang) || 0) + 1);
    });

    const langItems = Array.from(langCountMap.entries())
      .map(([lang, count]) => ({
        id: lang,
        name: lang,
        count,
      }))
      // Sort by count descending, then by name ascending
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

    const folderList: FolderItem[] = [
      { id: "all", name: "All", count: total, isAll: true },
      { id: "starred", name: "Starred", count: starred, isStarred: true },
      ...langItems,
    ];

    return { folders: folderList, totalCount: total, starredCount: starred };
  }, [allSnippets]);

  // Filter snippets based on folder, search, project, and favorite toggle
  const displayedSnippets = useMemo(() => {
    if (!allSnippets) return [];

    return allSnippets.filter((snippet) => {
      // 1. If search is active, search across ALL folders!
      // Otherwise, filter by selected folder
      if (!debouncedSearch.trim()) {
        if (selectedFolder === "starred") {
          if (!snippet.favorite) return false;
        } else if (selectedFolder !== "all") {
          const lang = snippet.language?.trim().toLowerCase() || "other";
          if (lang !== selectedFolder.toLowerCase()) return false;
        }
      }

      // 2. Starred button toggle in top bar
      if (onlyFavorites && !snippet.favorite) {
        return false;
      }

      // 3. Project filter (multi-select)
      if (selectedProjectIds.length > 0) {
        if (!snippet.projectId || !selectedProjectIds.includes(snippet.projectId)) {
          return false;
        }
      }

      return true;
    });
  }, [allSnippets, debouncedSearch, selectedFolder, onlyFavorites, selectedProjectIds]);

  const isSearching = Boolean(debouncedSearch.trim());
  const isInsideLanguageFolder =
    !isSearching && selectedFolder !== "all" && selectedFolder !== "starred";

  // Heading for snippets section
  const sectionTitle = useMemo(() => {
    if (isSearching) {
      return `Search results for "${debouncedSearch}"`;
    }
    if (selectedFolder === "all") return "All Snippets";
    if (selectedFolder === "starred") return "Starred Snippets";
    return `${formatLanguageName(selectedFolder)} Snippets`;
  }, [isSearching, debouncedSearch, selectedFolder]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedProjectIds.length > 0 ||
    onlyFavorites ||
    selectedFolder !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedProjectIds([]);
    setOnlyFavorites(false);
    setSelectedFolder("all");
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full @container">
      {/* Top Bar: Title, Count, View Switcher, Search, Project & Starred Filters */}
      <SnippetsTopBar
        totalCount={totalCount}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onNewSnippet={() => setIsNewModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projects={projects?.map((p) => ({ id: p.id, title: p.title }))}
        selectedProjectIds={selectedProjectIds}
        onProjectIdsChange={setSelectedProjectIds}
        onlyFavorites={onlyFavorites}
        onToggleFavorites={() => setOnlyFavorites(!onlyFavorites)}
        starredCount={starredCount}
        className="mb-4"
      />

      {/* Responsive Folder Strip: Below ~900px container width */}
      <div className="block @[900px]:hidden mb-4">
        <FolderStrip
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={handleSelectFolder}
        />
      </div>

      {/* Main Body: [ Folder Rail 200px ] | [ Snippet Grid or List ] */}
      <div className="flex-1 flex gap-6 items-start">
        {/* Desktop Folder Rail: Visible at 900px+ container width */}
        <div className="hidden @[900px]:block shrink-0">
          <FolderRail
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            isCollapsed={isRailCollapsed}
            onToggleCollapse={handleToggleRailCollapse}
          />
        </div>

        {/* Snippets Area */}
        <main className="flex-1 min-w-0 flex flex-col gap-3">
          {/* List Heading: Folder title + Count */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              {isInsideLanguageFolder && (
                <LanguageDot language={selectedFolder} className="shrink-0" />
              )}
              <h2 className="text-sm font-semibold tracking-[-0.3px] text-ink">
                {sectionTitle}
              </h2>
              <span className="font-mono text-xs text-ink-subtle">
                ({displayedSnippets.length})
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-mono text-ink-subtle hover:text-accent transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            viewMode === "cards" ? (
              <div className="grid grid-cols-1 @[520px]:grid-cols-2 @[900px]:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-surface-1 border border-hairline overflow-hidden p-3 space-y-3"
                  >
                    <Skeleton className="h-[180px] w-full rounded" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-1 border border-hairline divide-y divide-hairline">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-11 px-3 flex items-center gap-3">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            )
          ) : isError ? (
            /* Error State */
            <div className="rounded-lg border border-hairline bg-surface-1 p-6 text-center max-w-md mx-auto my-8">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-ink mb-1">
                Failed to load snippets
              </h3>
              <p className="text-xs text-ink-muted mb-4 font-mono">
                {(error as Error)?.message || "Network error communicating with API"}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[6px] bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-mono text-ink transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : displayedSnippets.length === 0 ? (
            /* Empty States */
            totalCount === 0 ? (
              <EmptyState
                type="no-snippets"
                onNewSnippet={() => setIsNewModalOpen(true)}
              />
            ) : isSearching ? (
              <EmptyState
                type="no-matches"
                searchQuery={debouncedSearch}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <EmptyState
                type="empty-folder"
                folderName={
                  selectedFolder === "starred"
                    ? "Starred"
                    : formatLanguageName(selectedFolder)
                }
                onClearFilters={handleClearFilters}
              />
            )
          ) : viewMode === "cards" ? (
            /* View 1: Grid View */
            <div className="grid grid-cols-1 @[520px]:grid-cols-2 @[900px]:grid-cols-3 gap-4 items-start">
              {displayedSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onView={setViewingSnippet}
                  onEdit={setEditingSnippet}
                  showLanguage={!isInsideLanguageFolder}
                />
              ))}
            </div>
          ) : (
            /* View 2: List View */
            <SnippetListView
              snippets={displayedSnippets}
              onView={setViewingSnippet}
              onEdit={setEditingSnippet}
              showLanguage={!isInsideLanguageFolder}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewSnippetModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        defaultLanguage={isInsideLanguageFolder ? selectedFolder : "typescript"}
      />

      <EditSnippetModal
        snippet={editingSnippet}
        isOpen={Boolean(editingSnippet)}
        onClose={() => setEditingSnippet(null)}
      />

      <SnippetCodeModal
        snippet={viewingSnippet}
        isOpen={Boolean(viewingSnippet)}
        onClose={() => setViewingSnippet(null)}
        onEdit={setEditingSnippet}
      />
    </div>
  );
}
