"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Star,
  FolderKanban,
  AlertCircle,
  RefreshCw,
  Folder,
  LayoutGrid,
  List,
  ArrowLeft,
  Copy,
  Edit2,
  Code2,
  Layers,
} from "lucide-react";
import { useSnippets, useToggleSnippetFavorite } from "@/hooks/use-snippets";
import { useProjects } from "@/hooks/use-projects";
import { Snippet } from "@/types/snippet";
import {
  SnippetFolderCard,
  formatLanguageLabel,
} from "@/components/snippets/snippet-folder-card";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { SnippetCodeModal } from "@/components/snippets/snippet-code-modal";
import { NewSnippetModal } from "@/components/snippets/new-snippet-modal";
import { EditSnippetModal } from "@/components/snippets/edit-snippet-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";

export default function SnippetsPage() {
  const [viewLevel, setViewLevel] = useState<"folders" | "snippets">("folders");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState<"cards" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_snippets_view_mode");
      if (saved === "cards" || saved === "list") return saved;
    }
    return "cards";
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Auto-switch to snippets catalog view if user types in search
  useEffect(() => {
    if (debouncedSearch.trim()) {
      setViewLevel("snippets");
    }
  }, [debouncedSearch]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [viewingSnippet, setViewingSnippet] = useState<Snippet | null>(null);

  const { data: projects } = useProjects();
  const toggleFavorite = useToggleSnippetFavorite();

  // Fetch snippets (when at folders level, fetch all without language filter so we calculate folder counts)
  const {
    data: allSnippets,
    isLoading,
    isError,
    error,
    refetch,
  } = useSnippets({
    projectId: selectedProjectId || undefined,
    favorite: onlyFavorites ? true : undefined,
    search: debouncedSearch,
  });

  // Calculate dynamic language counts for Level 1 folders
  const languageFolders = useMemo(() => {
    const map = new Map<string, number>();
    allSnippets?.forEach((s) => {
      const lang = s.language?.trim().toLowerCase() || "other";
      map.set(lang, (map.get(lang) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);
  }, [allSnippets]);

  // Filtered snippets for Level 2
  const displayedSnippets = useMemo(() => {
    if (!allSnippets) return [];
    if (selectedLanguage === "ALL") return allSnippets;
    return allSnippets.filter(
      (s) => (s.language?.trim().toLowerCase() || "other") === selectedLanguage.toLowerCase()
    );
  }, [allSnippets, selectedLanguage]);

  const handleToggleViewMode = (mode: "cards" | "list") => {
    sound.playClick(850);
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_snippets_view_mode", mode);
    }
  };

  const handleSelectFolder = (languageName: string) => {
    sound.playClick(850);
    setSelectedLanguage(languageName);
    setViewLevel("snippets");
  };

  const handleOpenNewModal = () => {
    sound.playClick(900);
    setIsNewModalOpen(true);
  };

  const handleEditSnippet = (snippet: Snippet) => {
    sound.playClick(750);
    setEditingSnippet(snippet);
  };

  const handleViewSnippet = (snippet: Snippet) => {
    sound.playClick(800);
    setViewingSnippet(snippet);
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Header — unified h-14 height */}
      <div className="h-14 px-4 sm:px-6 border-b border-hairline flex items-center justify-between gap-4 bg-surface-1/40 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-ink truncate">
            Code Snippets Vault
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-muted">
            {allSnippets?.length || 0} Saved
          </span>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-primary/25 hover:shadow-primary/40 transition-all duration-150 flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Snippet</span>
        </button>
      </div>

      {/* Toolbar: Breadcrumbs + Search + Filters */}
      <div className="px-4 sm:px-8 py-3 sm:py-4 border-b border-hairline bg-surface-1/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Breadcrumbs or Back to Folders */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewLevel === "snippets" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(700);
                  setSelectedLanguage("ALL");
                  setViewLevel("folders");
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-ink-muted" />
                <span>All Languages</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="text-ink-tertiary">/</span>
                <span className="text-ink font-semibold flex items-center gap-1 capitalize">
                  <Folder className="w-3.5 h-3.5 text-primary" />
                  {formatLanguageLabel(selectedLanguage)}
                </span>
                <span className="text-[10px] font-mono text-ink-tertiary">
                  ({displayedSnippets.length})
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-ink-muted font-medium">
              <Folder className="w-3.5 h-3.5 text-primary" />
              <span>Language Collections</span>
              <span className="text-[10px] font-mono text-ink-tertiary">
                ({languageFolders.length} collections)
              </span>
            </div>
          )}
        </div>

        {/* Right: Search + Filters + View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search title, code, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
            />
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

          {/* Starred filter */}
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
            title="Filter starred snippets"
          >
            <Star
              className={cn(
                "w-3.5 h-3.5",
                onlyFavorites ? "fill-amber-400 text-amber-400" : "text-ink-tertiary"
              )}
            />
            <span>Starred</span>
          </button>

          {/* Segmented [ Cards | List ] Toggle */}
          {viewLevel === "snippets" && (
            <div className="flex items-center rounded-lg bg-surface-2 p-1 border border-hairline">
              <button
                type="button"
                onClick={() => handleToggleViewMode("cards")}
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === "cards"
                    ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                    : "text-ink-tertiary hover:text-ink"
                )}
                title="Cards view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode("list")}
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === "list"
                    ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                    : "text-ink-tertiary hover:text-ink"
                )}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface-1 border border-hairline p-5 space-y-3.5 shadow-xs"
              >
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-semantic-error/30 bg-semantic-error/5 p-8 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-semantic-error mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">
              Failed to load snippets
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
        ) : viewLevel === "folders" && !debouncedSearch.trim() ? (
          /* LEVEL 1: LANGUAGE FOLDERS COLLECTION */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink">Language Collections</h2>
                <p className="text-xs text-ink-muted">
                  Organized by syntax and programming language. Select a collection to explore.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playClick(850);
                  setSelectedLanguage("ALL");
                  setViewLevel("snippets");
                }}
                className="text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View all snippets ({allSnippets?.length || 0})</span>
                <span>→</span>
              </button>
            </div>

            {languageFolders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {languageFolders.map((folder) => (
                  <SnippetFolderCard
                    key={folder.language}
                    language={folder.language}
                    count={folder.count}
                    onClick={() => handleSelectFolder(folder.language)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-muted mb-4">
                  <Code2 className="w-6 h-6 text-primary/70" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-ink mb-1">
                  Vault is empty
                </h3>
                <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                  Save reusable boilerplate, HTML templates, regexes, and algorithms here for instant access.
                </p>
                <button
                  onClick={handleOpenNewModal}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Snippet</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* LEVEL 2: SNIPPETS CATALOG (CARDS OR LIST) */
          <div>
            {displayedSnippets.length > 0 ? (
              viewMode === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
                  {displayedSnippets.map((snippet) => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      onEdit={handleEditSnippet}
                      onView={handleViewSnippet}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-hairline bg-surface-1 overflow-hidden divide-y divide-hairline">
                  {displayedSnippets.map((snippet) => (
                    <div
                      key={snippet.id}
                      onClick={() => handleViewSnippet(snippet)}
                      className="group flex items-center justify-between p-3.5 hover:bg-surface-2/60 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick(850);
                            toggleFavorite.mutate({
                              id: snippet.id,
                              favorite: !snippet.favorite,
                            });
                          }}
                          className="text-ink-tertiary hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                          title={snippet.favorite ? "Starred" : "Star snippet"}
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              snippet.favorite && "fill-amber-400 text-amber-400"
                            )}
                          />
                        </button>
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors truncate">
                            {snippet.title}
                          </span>
                          <span className="text-ink-tertiary select-none">·</span>
                          <span className="text-[10px] font-mono uppercase text-ink-muted px-1.5 py-0.5 rounded bg-surface-2 border border-hairline shrink-0">
                            {snippet.language}
                          </span>
                          {snippet.project && (
                            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-ink-muted shrink-0">
                              <FolderKanban className="w-2.5 h-2.5 text-primary" />
                              <span>{snippet.project.title}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            sound.playClick(900);
                            try {
                              await navigator.clipboard.writeText(snippet.code);
                              toast.success("Snippet code copied");
                            } catch {
                              toast.error("Failed to copy code");
                            }
                          }}
                          className="p-1.5 rounded-md hover:bg-surface-3 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                          title="Copy code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick(750);
                            handleEditSnippet(snippet);
                          }}
                          className="p-1.5 rounded-md hover:bg-surface-3 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                          title="Edit snippet"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-muted mb-4">
                  <Code2 className="w-6 h-6 text-primary/70" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-ink mb-1">
                  No snippets found
                </h3>
                <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                  {searchQuery || selectedProjectId || selectedLanguage !== "ALL" || onlyFavorites
                    ? "Try clearing your filters or search keywords to see your snippets."
                    : "No snippets exist in this collection yet."}
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  {(searchQuery || selectedProjectId || selectedLanguage !== "ALL" || onlyFavorites) && (
                    <button
                      onClick={() => {
                        sound.playClick(600);
                        setSearchQuery("");
                        setSelectedProjectId("");
                        setSelectedLanguage("ALL");
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
                    <span>Create Snippet</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewSnippetModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <EditSnippetModal
        snippet={editingSnippet}
        isOpen={!!editingSnippet}
        onClose={() => setEditingSnippet(null)}
      />

      {/* LEVEL 3: CODE & LIVE HTML PREVIEW DETAIL MODAL */}
      <SnippetCodeModal
        snippet={viewingSnippet}
        isOpen={!!viewingSnippet}
        onClose={() => setViewingSnippet(null)}
        onEdit={handleEditSnippet}
      />
    </div>
  );
}
