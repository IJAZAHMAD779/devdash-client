"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ExternalLink,
  Bookmark as BookmarkIcon,
  FolderKanban,
  Tag,
  Folder,
  FolderOpen,
  FolderPlus,
  Star,
  LayoutGrid,
  List,
  Upload,
  Download,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  BrainCircuit,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useBookmarks, useDeleteBookmark } from "@/hooks/use-bookmarks";
import { useProjects } from "@/hooks/use-projects";
import { BookmarkCard } from "./bookmark-card";
import { BookmarkListRow } from "./bookmark-list-row";
import { NewBookmarkModal } from "./new-bookmark-modal";
import { EditBookmarkModal } from "./edit-bookmark-modal";
import { ImportBookmarksModal } from "./import-bookmarks-modal";
import { EnrichBookmarksModal } from "./enrich-bookmarks-modal";
import { exportBookmarksToHtml } from "@/lib/bookmark-parser";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/lib/toast";

export function BookmarksCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash-bookmark-view-mode");
      if (saved === "list" || saved === "grid") return saved;
    }
    return "grid";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_bookmarks_sidebar_collapsed");
      if (saved === "true") setIsSidebarCollapsed(true);
    }
  }, []);

  const handleToggleSidebar = () => {
    sound.playClick(700);
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("devdash_bookmarks_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // Custom user-created folders for quick workflow
  const [userCreatedFolders, setUserCreatedFolders] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEnrichModalOpen, setIsEnrichModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 250);
  const [visibleCount, setVisibleCount] = useState(30);

  // Reset pagination when category, project, or search query changes
  useEffect(() => {
    setVisibleCount(30);
  }, [selectedCategory, selectedProjectId, debouncedSearch]);

  const handleToggleViewMode = (mode: "grid" | "list") => {
    sound.playClick(850);
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash-bookmark-view-mode", mode);
    }
  };

  const { data: projects } = useProjects();
  const deleteBookmark = useDeleteBookmark();

  // Fetch all bookmarks for the selected project (or all projects)
  const {
    data: allBookmarks,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookmarks({
    projectId: selectedProjectId || undefined,
  });

  // Calculate folder counts across all fetched bookmarks
  const { totalCount, favoriteCount, folderCounts, emptyNotesCount } = useMemo(() => {
    let total = 0;
    let favs = 0;
    let emptyNotes = 0;
    const counts: Record<string, number> = {};

    if (allBookmarks) {
      total = allBookmarks.length;
      allBookmarks.forEach((bm) => {
        if (bm.favorite) favs++;
        if (!bm.notes || bm.notes.trim() === "") emptyNotes++;
        const cat = (bm.category || "tools").toLowerCase();
        counts[cat] = (counts[cat] || 0) + 1;
      });
    }

    return { totalCount: total, favoriteCount: favs, folderCounts: counts, emptyNotesCount: emptyNotes };
  }, [allBookmarks]);

  // Discovered custom folders
  const customFolders = useMemo(() => {
    const customSet = new Set<string>();
    userCreatedFolders.forEach((f) => customSet.add(f.toLowerCase()));
    allBookmarks?.forEach((bm) => {
      const cat = (bm.category || "tools").toLowerCase();
      if (!PRESET_BOOKMARK_CATEGORIES.some((p) => p.id === cat)) {
        customSet.add(cat);
      }
    });
    return Array.from(customSet);
  }, [allBookmarks, userCreatedFolders]);

  // Filtered bookmarks based on active folder/category and debounced search
  const filteredBookmarks = useMemo(() => {
    if (!allBookmarks) return [];
    return allBookmarks.filter((bm) => {
      // Folder / Starred filter
      if (selectedCategory === "FAVORITES") {
        if (!bm.favorite) return false;
      } else if (selectedCategory !== "ALL") {
        if ((bm.category || "tools").toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const titleMatch = bm.title.toLowerCase().includes(q);
        const urlMatch = bm.url.toLowerCase().includes(q);
        const notesMatch = bm.notes?.toLowerCase().includes(q);
        const tagsMatch = bm.tags?.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !urlMatch && !notesMatch && !tagsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allBookmarks, selectedCategory, debouncedSearch]);

  // Progressive chunking for fast DOM performance on large bookmark sets
  const visibleBookmarks = useMemo(() => {
    return filteredBookmarks.slice(0, visibleCount);
  }, [filteredBookmarks, visibleCount]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");
    if (!clean) return;

    if (!userCreatedFolders.includes(clean)) {
      setUserCreatedFolders((prev) => [...prev, clean]);
    }
    setSelectedCategory(clean);
    setNewFolderName("");
    setIsCreatingFolder(false);
    sound.playSuccess();
    toast.success("Folder created", {
      description: `Switched to folder "${clean}".`,
    });
  };

  const handleExport = () => {
    const listToExport = filteredBookmarks.length > 0 ? filteredBookmarks : (allBookmarks || []);
    if (!listToExport.length) {
      toast.error("No bookmarks to export");
      return;
    }
    exportBookmarksToHtml(listToExport);
    sound.playSuccess();
    toast.success("Export successful", {
      description: `Downloaded ${listToExport.length} bookmarks in standard HTML format.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingBookmark) return;
    try {
      await deleteBookmark.mutateAsync(deletingBookmark.id);
      toast.success("Bookmark deleted", {
        description: `"${deletingBookmark.title}" removed.`,
      });
      setDeletingBookmark(null);
    } catch {
      toast.error("Failed to delete bookmark");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
      {/* Top Filter & Actions Toolbar */}
      <div className="px-4 sm:px-8 py-3 border-b border-hairline bg-surface-1/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search bookmarks by title, url, tags, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink placeholder:text-ink-tertiary focus:border-primary focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-ink-tertiary hover:text-ink rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Project Filter, View Mode, Import/Export & Add */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
          {/* Toggle Folder Sidebar */}
          <button
            onClick={handleToggleSidebar}
            title={isSidebarCollapsed ? "Show Folders Sidebar" : "Hide Folders Sidebar"}
            className="hidden md:inline-flex items-center justify-center p-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-3.5 h-3.5 text-primary" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5 text-ink-tertiary" />
            )}
          </button>

          {/* Project Filter */}
          <div className="flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none max-w-[140px] truncate"
            >
              <option value="">All Projects</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center rounded-md bg-surface-2 p-0.5 border border-hairline shrink-0">
            <button
              onClick={() => handleToggleViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition-all cursor-pointer",
                viewMode === "grid"
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

          {/* Import & Export Netscape HTML buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                sound.playClick(900);
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs text-ink-muted hover:text-ink font-medium transition-colors cursor-pointer"
              title="Import Chrome / Browser HTML Bookmarks"
            >
              <Upload className="w-3.5 h-3.5 text-ink-tertiary" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs text-ink-muted hover:text-ink font-medium transition-colors cursor-pointer"
              title="Export Bookmarks as HTML"
            >
              <Download className="w-3.5 h-3.5 text-ink-tertiary" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* AI Auto-Note Batch Generation */}
          {emptyNotesCount > 0 && (
            <button
              onClick={() => {
                sound.playClick(900);
                setIsEnrichModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 font-medium transition-colors cursor-pointer shrink-0"
              title={`Auto-generate developer notes with AI for ${emptyNotesCount} bookmarks`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Auto-Note</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-200">
                {emptyNotesCount}
              </span>
            </button>
          )}

          {/* Add Bookmark CTA */}
          <button
            onClick={() => {
              sound.playClick(900);
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bookmark</span>
          </button>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Horizontal Category Strip */}
        <div className="md:hidden px-4 py-2 border-b border-hairline bg-surface-1/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
              selectedCategory === "ALL"
                ? "bg-primary text-white font-semibold"
                : "bg-surface-2 text-ink-muted hover:text-ink"
            )}
          >
            <span>All</span>
            <span className="text-[10px] font-mono opacity-80">({totalCount})</span>
          </button>

          <button
            onClick={() => setSelectedCategory("FAVORITES")}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
              selectedCategory === "FAVORITES"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                : "bg-surface-2 text-ink-muted hover:text-ink"
            )}
          >
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>Starred</span>
            <span className="text-[10px] font-mono opacity-80">({favoriteCount})</span>
          </button>

          {PRESET_BOOKMARK_CATEGORIES.map((preset) => {
            const count = folderCounts[preset.id] || 0;
            const isActive = selectedCategory === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedCategory(preset.id)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-primary text-white font-semibold"
                    : "bg-surface-2 text-ink-muted hover:text-ink"
                )}
              >
                <span>{preset.label}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}

          {customFolders.map((folder) => {
            const count = folderCounts[folder] || 0;
            const isActive = selectedCategory === folder;
            return (
              <button
                key={folder}
                onClick={() => setSelectedCategory(folder)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-primary text-white font-semibold"
                    : "bg-surface-2 text-ink-muted hover:text-ink"
                )}
              >
                <span>{folder}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Folder Navigation Sidebar */}
        <aside
          className={cn(
            "w-56 shrink-0 border-r border-hairline bg-surface-1/30 flex-col p-3 overflow-y-auto",
            isSidebarCollapsed ? "hidden" : "hidden md:flex"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary">
              Vault Folders
            </span>
            <button
              onClick={() => setIsCreatingFolder(!isCreatingFolder)}
              className="p-1 rounded text-ink-tertiary hover:text-primary hover:bg-surface-2 transition-colors cursor-pointer"
              title="Create New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inline Folder Creator */}
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="mb-2.5 px-1">
              <div className="flex items-center gap-1 bg-surface-2 border border-primary/50 rounded-md p-1">
                <input
                  type="text"
                  placeholder="folder-name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-tertiary focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="p-1 rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="p-1 text-ink-muted hover:text-ink rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </form>
          )}

          {/* Folder items */}
          <div className="space-y-0.5 flex-1">
            {/* All Bookmarks */}
            <button
              onClick={() => {
                sound.playClick(850);
                setSelectedCategory("ALL");
              }}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                selectedCategory === "ALL"
                  ? "bg-surface-2 text-ink font-semibold border border-hairline"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2/60 border border-transparent"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <BookmarkIcon className={cn("w-3.5 h-3.5", selectedCategory === "ALL" ? "text-primary" : "text-ink-tertiary")} />
                <span className="truncate">All Bookmarks</span>
              </div>
              <span className="text-[10px] font-mono text-ink-tertiary">
                {totalCount}
              </span>
            </button>

            {/* Starred / Favorites */}
            <button
              onClick={() => {
                sound.playClick(850);
                setSelectedCategory("FAVORITES");
              }}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                selectedCategory === "FAVORITES"
                  ? "bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/25"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2/60 border border-transparent"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Star className={cn("w-3.5 h-3.5", selectedCategory === "FAVORITES" ? "text-amber-400 fill-amber-400" : "text-ink-tertiary")} />
                <span className="truncate">Starred</span>
              </div>
              <span className="text-[10px] font-mono text-ink-tertiary">
                {favoriteCount}
              </span>
            </button>

            <div className="pt-2 pb-1">
              <div className="h-px bg-hairline/80 mx-2" />
            </div>

            {/* Presets Folders */}
            {PRESET_BOOKMARK_CATEGORIES.map((cat) => {
              const count = folderCounts[cat.id] || 0;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClick(850);
                    setSelectedCategory(cat.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-surface-2 text-ink font-semibold border border-hairline"
                      : "text-ink-muted hover:text-ink hover:bg-surface-2/60 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isActive ? (
                      <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
                    )}
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-tertiary">
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Discovered & User Custom Folders */}
            {customFolders.length > 0 && (
              <>
                <div className="pt-2 pb-1">
                  <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">
                    Custom Folders
                  </span>
                </div>
                {customFolders.map((folder) => {
                  const count = folderCounts[folder] || 0;
                  const isActive = selectedCategory === folder;

                  return (
                    <button
                      key={folder}
                      onClick={() => {
                        sound.playClick(850);
                        setSelectedCategory(folder);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize",
                        isActive
                          ? "bg-surface-2 text-ink font-semibold border border-hairline"
                          : "text-ink-muted hover:text-ink hover:bg-surface-2/60 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isActive ? (
                          <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
                        )}
                        <span className="truncate">{folder}</span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-tertiary">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </aside>

        {/* Content Canvas */}
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Active Folder Header info */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-[-0.2px] text-ink capitalize">
                {selectedCategory === "ALL"
                  ? "All Bookmarks"
                  : selectedCategory === "FAVORITES"
                  ? "Starred Favorites"
                  : selectedCategory}
              </span>
              <span className="text-xs font-mono text-ink-tertiary">
                ({filteredBookmarks.length} {filteredBookmarks.length === 1 ? "link" : "links"})
              </span>
            </div>

            {searchQuery && (
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span>Filtered by:</span>
                <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  &ldquo;{searchQuery}&rdquo;
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-ink-tertiary hover:text-ink ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Loading state */}
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-surface-1 border border-hairline p-5 space-y-3 animate-pulse"
                  >
                    <div className="h-4 bg-surface-2 rounded w-2/3" />
                    <div className="h-3 bg-surface-2 rounded w-1/2" />
                    <div className="h-10 bg-surface-2 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-hairline bg-surface-1 divide-y divide-hairline">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between gap-4 animate-pulse">
                    <div className="h-4 bg-surface-2 rounded w-1/3" />
                    <div className="h-4 bg-surface-2 rounded w-24" />
                  </div>
                ))}
              </div>
            )
          ) : isError ? (
            <div className="rounded-xl border border-semantic-error/30 bg-semantic-error/5 p-8 text-center max-w-md mx-auto my-12">
              <AlertCircle className="w-10 h-10 text-semantic-error mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-ink mb-1">
                Failed to load bookmarks
              </h3>
              <p className="text-xs text-ink-muted mb-4">
                {(error as Error)?.message || "Network error"}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="space-y-6">
              {viewMode === "grid" ? (
                /* Grid view */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                  {visibleBookmarks.map((bm) => (
                    <BookmarkCard
                      key={bm.id}
                      bookmark={bm}
                      onEdit={(b) => setEditingBookmark(b)}
                      onDelete={(b) => setDeletingBookmark(b)}
                    />
                  ))}
                </div>
              ) : (
                /* Compact List view */
                <div className="rounded-xl border border-hairline bg-surface-1 divide-y divide-hairline shadow-sm overflow-hidden">
                  {visibleBookmarks.map((bm) => (
                    <BookmarkListRow
                      key={bm.id}
                      bookmark={bm}
                      onEdit={(b) => setEditingBookmark(b)}
                    />
                  ))}
                </div>
              )}

              {/* Progressive Load More Trigger */}
              {visibleCount < filteredBookmarks.length && (
                <div className="pt-4 pb-2 flex flex-col items-center justify-center gap-2">
                  <p className="text-xs font-mono text-ink-tertiary">
                    Showing {visibleBookmarks.length} of {filteredBookmarks.length} bookmarks
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(750);
                      setVisibleCount((prev) => prev + 30);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
                  >
                    <span>Load More Bookmarks</span>
                    <span className="font-mono text-[10px] text-ink-tertiary">
                      (+{Math.min(30, filteredBookmarks.length - visibleBookmarks.length)})
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <div className="py-20 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-muted mb-4 mx-auto">
                <BookmarkIcon className="w-6 h-6 text-primary/70" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-ink mb-1">
                No bookmarks found
              </h3>
              <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                {searchQuery || selectedCategory !== "ALL" || selectedProjectId
                  ? "Try resetting your search query or selecting a different folder."
                  : "Organize docs, tools, design assets, and cheat sheets for instant 1-click access."}
              </p>
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                {(searchQuery || selectedCategory !== "ALL" || selectedProjectId) && (
                  <button
                    onClick={() => {
                      sound.playClick(600);
                      setSearchQuery("");
                      setSelectedCategory("ALL");
                      setSelectedProjectId("");
                    }}
                    className="px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink text-xs font-medium transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => {
                    sound.playClick(900);
                    setIsImportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink text-xs font-medium transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  <span>Import HTML</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClick(900);
                    setIsNewModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bookmark</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <NewBookmarkModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        defaultCategory={
          selectedCategory !== "ALL" && selectedCategory !== "FAVORITES"
            ? selectedCategory
            : undefined
        }
      />

      <EditBookmarkModal
        bookmark={editingBookmark}
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
      />

      <ImportBookmarksModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <EnrichBookmarksModal
        isOpen={isEnrichModalOpen}
        onClose={() => setIsEnrichModalOpen(false)}
        bookmarks={allBookmarks || []}
        currentCategory={selectedCategory}
      />

      <ConfirmModal
        isOpen={!!deletingBookmark}
        onClose={() => setDeletingBookmark(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Bookmark"
        description={`Are you sure you want to delete "${deletingBookmark?.title}"? This cannot be undone.`}
        confirmText="Delete Bookmark"
        variant="danger"
        isLoading={deleteBookmark.isPending}
      />
    </div>
  );
}
