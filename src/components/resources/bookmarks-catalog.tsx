"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  FolderKanban,
  PanelLeft,
  X,
  Upload,
  Download,
  Eraser,
  FolderPlus,
  Folder,
  FolderOpen,
  Bookmark as BookmarkIcon,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useBookmarks, useDeleteBookmark } from "@/hooks/use-bookmarks";
import { useProjects } from "@/hooks/use-projects";
import { useDebounce } from "@/hooks/use-debounce";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { exportBookmarksToHtml } from "@/lib/bookmark-parser";
import { getBookmarkGridTemplate } from "@/lib/list-columns";

import { BookmarkCard } from "./bookmark-card";
import { BookmarkListRow } from "./bookmark-list-row";
import { BulkActionBar } from "./bulk-action-bar";
import { NewBookmarkModal } from "./new-bookmark-modal";
import { EditBookmarkModal } from "./edit-bookmark-modal";
import { ImportBookmarksModal } from "./import-bookmarks-modal";
import { ClearNotesModal } from "./clear-notes-modal";
import { MoveBookmarksModal } from "./move-bookmarks-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";

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
  const [isEmptyFoldersOpen, setIsEmptyFoldersOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("devdash_bookmarks_empty_folders_expanded") === "true";
    }
    return false;
  });

  // Cross-category bulk selection state
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Custom user-created folders
  const [userCreatedFolders, setUserCreatedFolders] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isClearNotesModalOpen, setIsClearNotesModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  // Popover menus state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const projectFilterRef = useRef<HTMLDivElement>(null);

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

  const handleToggleEmptyFolders = () => {
    sound.playClick(700);
    setIsEmptyFoldersOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "devdash_bookmarks_empty_folders_expanded",
          String(next)
        );
      }
      return next;
    });
  };

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

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (
        projectFilterRef.current &&
        !projectFilterRef.current.contains(e.target as Node)
      ) {
        setIsProjectFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keyboard shortcuts: "/", "N", "G", "L", "Esc"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        sound.playClick(900);
        setIsNewModalOpen(true);
      } else if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        handleToggleViewMode("grid");
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        handleToggleViewMode("list");
      } else if (e.key === "Escape") {
        if (selectedBookmarkIds.size > 0 || isSelectionMode) {
          setSelectedBookmarkIds(new Set());
          setIsSelectionMode(false);
        }
        setIsMoreMenuOpen(false);
        setIsProjectFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBookmarkIds, isSelectionMode]);

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
  const { totalCount, favoriteCount, folderCounts } = useMemo(() => {
    let total = 0;
    let favs = 0;
    const counts: Record<string, number> = {};

    if (allBookmarks) {
      total = allBookmarks.length;
      allBookmarks.forEach((bm) => {
        if (bm.favorite) favs++;
        const cat = (bm.category || "tools").toLowerCase();
        counts[cat] = (counts[cat] || 0) + 1;
      });
    }

    return { totalCount: total, favoriteCount: favs, folderCounts: counts };
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

  // Split folders into non-empty (>0) and empty (==0)
  const { nonEmptyFolders, emptyFolders } = useMemo(() => {
    const allKnown = [
      ...PRESET_BOOKMARK_CATEGORIES.map((p) => ({ id: p.id, label: p.label })),
      ...customFolders.map((c) => ({
        id: c,
        label: c.charAt(0).toUpperCase() + c.slice(1),
      })),
    ];

    const nonEmpty: { id: string; label: string; count: number }[] = [];
    const empty: { id: string; label: string; count: number }[] = [];

    allKnown.forEach((f) => {
      const count = folderCounts[f.id] || 0;
      if (count > 0) {
        nonEmpty.push({ ...f, count });
      } else {
        empty.push({ ...f, count: 0 });
      }
    });

    // Sort non-empty by count (descending) then name
    nonEmpty.sort((a, b) => {
      if (b.count === a.count) return a.label.localeCompare(b.label);
      return b.count - a.count;
    });

    // Sort empty by name
    empty.sort((a, b) => a.label.localeCompare(b.label));

    return { nonEmptyFolders: nonEmpty, emptyFolders: empty };
  }, [folderCounts, customFolders]);

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

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedBookmarkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setIsSelectionMode(false);
      return next;
    });
  }, []);

  const isAllFilteredSelected = useMemo(() => {
    return (
      filteredBookmarks.length > 0 &&
      filteredBookmarks.every((b) => selectedBookmarkIds.has(b.id))
    );
  }, [filteredBookmarks, selectedBookmarkIds]);

  const handleToggleSelectAllFiltered = useCallback(() => {
    sound.playClick(isAllFilteredSelected ? 600 : 850);
    setSelectedBookmarkIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        filteredBookmarks.forEach((b) => next.delete(b.id));
        setIsSelectionMode(false);
      } else {
        filteredBookmarks.forEach((b) => next.add(b.id));
        setIsSelectionMode(true);
      }
      return next;
    });
  }, [filteredBookmarks, isAllFilteredSelected]);

  // Progressive chunking (30 at a time)
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
    setIsMoreMenuOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBookmark) return;
    try {
      await deleteBookmark.mutateAsync(deletingBookmark.id);
      sound.playSuccess();
      toast.success("Bookmark deleted", {
        description: `"${deletingBookmark.title}" removed.`,
      });
      setDeletingBookmark(null);
    } catch {
      toast.error("Failed to delete bookmark");
    }
  };

  // List view column visibility & shared template
  const showCategoryColumn =
    selectedCategory === "ALL" ||
    selectedCategory === "FAVORITES" ||
    !!debouncedSearch.trim();

  const hasAnyTagsInVisible = useMemo(() => {
    return visibleBookmarks.some((b) => b.tags && b.tags.length > 0);
  }, [visibleBookmarks]);

  const listGridTemplate = useMemo(() => {
    return getBookmarkGridTemplate({
      showCategory: showCategoryColumn,
      hasTags: hasAnyTagsInVisible,
    });
  }, [showCategoryColumn, hasAnyTagsInVisible]);

  const activeCategoryTitle =
    selectedCategory === "ALL"
      ? "All Bookmarks"
      : selectedCategory === "FAVORITES"
      ? "Starred"
      : nonEmptyFolders.find((f) => f.id === selectedCategory)?.label ||
        emptyFolders.find((f) => f.id === selectedCategory)?.label ||
        selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden select-none">
      {/* Hidden file input for import mounted OUTSIDE popover so it persists */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        className="hidden"
        onChange={() => setIsImportModalOpen(true)}
      />

      {/* Toolbar: One Row, 36px Controls (h-9), wraps on narrow screens */}
      <div className="h-14 px-4 sm:px-6 border-b border-hairline bg-surface-1/40 flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
        {/* Left: Folders toggle + Search input */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-lg">
          {/* One Folders toggle button */}
          <button
            type="button"
            onClick={handleToggleSidebar}
            title={isSidebarCollapsed ? "Show folders" : "Hide folders"}
            aria-label={isSidebarCollapsed ? "Show folders" : "Hide folders"}
            className={cn(
              "h-9 w-9 rounded-[6px] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-hairline/60",
              !isSidebarCollapsed && "bg-surface-2 text-ink border-hairline"
            )}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Search wrapper with fixed h-9 and / shortcut hint */}
          <div className="relative flex-1 h-9 min-h-9 flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search bookmarks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full pl-8 pr-7 rounded-[6px] bg-surface-2 border border-hairline text-xs text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 p-0.5 text-ink-subtle hover:text-ink rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="absolute right-2 text-[10px] font-mono text-ink-subtle pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Right: Project Filter, Grid/List toggle, "⋯" Menu, Add Bookmark */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Project Filter Popover */}
          <div className="relative" ref={projectFilterRef}>
            <button
              type="button"
              onClick={() => setIsProjectFilterOpen(!isProjectFilterOpen)}
              className={cn(
                "h-9 px-2.5 rounded-[6px] text-xs font-mono transition-colors cursor-pointer border flex items-center gap-1.5",
                selectedProjectId
                  ? "bg-surface-2 text-ink border-hairline"
                  : "bg-surface-2/60 text-ink-muted hover:text-ink hover:bg-surface-2 border-hairline/60"
              )}
              title="Filter by project"
            >
              <FolderKanban className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
              <span className="truncate max-w-[120px]">
                {selectedProject ? selectedProject.title : "Projects"}
              </span>
              {selectedProjectId && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              )}
            </button>

            {isProjectFilterOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-[8px] bg-surface-1 border border-hairline-strong shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId("");
                    setIsProjectFilterOpen(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-surface-2 cursor-pointer text-ink-muted hover:text-ink font-mono"
                >
                  <span>All Projects</span>
                  {!selectedProjectId && (
                    <Check className="w-3.5 h-3.5 text-accent" />
                  )}
                </button>
                {projects?.map((p) => {
                  const isCur = p.id === selectedProjectId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setIsProjectFilterOpen(false);
                      }}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-surface-2 cursor-pointer text-ink-muted hover:text-ink truncate"
                    >
                      <span className="truncate">{p.title}</span>
                      {isCur && (
                        <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grid | List View Toggle */}
          <div className="h-9 inline-flex items-center rounded-[6px] bg-surface-2 p-0.5 border border-hairline shrink-0">
            <button
              type="button"
              onClick={() => handleToggleViewMode("grid")}
              className={cn(
                "h-full px-2 rounded-[4px] transition-all cursor-pointer flex items-center justify-center",
                viewMode === "grid"
                  ? "bg-surface-3 text-ink shadow-xs"
                  : "text-ink-subtle hover:text-ink"
              )}
              title="Grid view (G)"
              aria-label="Grid view (G)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode("list")}
              className={cn(
                "h-full px-2 rounded-[4px] transition-all cursor-pointer flex items-center justify-center",
                viewMode === "list"
                  ? "bg-surface-3 text-ink shadow-xs"
                  : "text-ink-subtle hover:text-ink"
              )}
              title="List view (L)"
              aria-label="List view (L)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* "⋯" Menu: Import, Export, Clear Notes */}
          <div className="relative shrink-0" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="h-9 w-9 rounded-[6px] text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-center border border-hairline/60"
              title="More actions"
              aria-label="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-[8px] bg-surface-1 border border-hairline-strong shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsImportModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-ink-muted hover:text-ink hover:bg-surface-2 text-left cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-ink-subtle" />
                  <span>Import HTML…</span>
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-ink-muted hover:text-ink hover:bg-surface-2 text-left cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-ink-subtle" />
                  <span>Export HTML</span>
                </button>

                <div className="my-1 border-t border-hairline" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsClearNotesModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-danger hover:bg-danger/10 text-left cursor-pointer transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear notes…</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Bookmark: Only accent-filled button on toolbar */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(900);
              setIsNewModalOpen(true);
            }}
            className="h-9 px-3 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium tracking-tight shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Add bookmark (N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bookmark</span>
            <kbd className="hidden sm:inline text-[10px] font-mono opacity-80">N</kbd>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Horizontal Category Strip on narrower displays (<900px) */}
        <div className="lg:hidden px-4 py-2 border-b border-hairline bg-surface-1/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "h-7 px-2.5 rounded-[4px] text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0",
              selectedCategory === "ALL"
                ? "bg-surface-2 text-ink font-semibold border border-hairline"
                : "text-ink-subtle hover:text-ink"
            )}
          >
            <span>All</span>
            <span className="text-[10px] text-ink-subtle">{totalCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("FAVORITES")}
            className={cn(
              "h-7 px-2.5 rounded-[4px] text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0",
              selectedCategory === "FAVORITES"
                ? "bg-surface-2 text-warn font-semibold border border-hairline"
                : "text-ink-subtle hover:text-warn"
            )}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>Starred</span>
            <span className="text-[10px] text-ink-subtle">{favoriteCount}</span>
          </button>

          {nonEmptyFolders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedCategory(f.id)}
              className={cn(
                "h-7 px-2.5 rounded-[4px] text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0",
                selectedCategory === f.id
                  ? "bg-surface-2 text-ink font-semibold border border-hairline"
                  : "text-ink-subtle hover:text-ink"
              )}
            >
              <span>{f.label}</span>
              <span className="text-[10px] text-ink-subtle">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Desktop Folder Navigation Rail (>=900px) */}
        <aside
          className={cn(
            "w-56 shrink-0 border-r border-hairline bg-surface-1/30 flex flex-col p-3 overflow-y-auto",
            isSidebarCollapsed ? "hidden" : "hidden lg:flex"
          )}
        >
          {/* Header: VAULT FOLDERS + New Folder button */}
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle font-semibold">
              Vault Folders
            </span>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(!isCreatingFolder)}
              className="p-1 rounded-[4px] text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="Create new folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inline Folder Creator */}
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="mb-2 px-1">
              <div className="flex items-center gap-1 bg-surface-2 border border-accent/50 rounded-[6px] p-1">
                <input
                  type="text"
                  placeholder="folder-name…"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent px-1.5 py-0.5 text-xs text-ink placeholder:text-ink-subtle focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="p-1 rounded-[4px] bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="p-1 text-ink-subtle hover:text-ink rounded cursor-pointer"
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
              type="button"
              onClick={() => {
                sound.playClick(850);
                setSelectedCategory("ALL");
              }}
              className={cn(
                "relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer",
                selectedCategory === "ALL"
                  ? "bg-surface-2 text-ink font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2/50"
              )}
            >
              {selectedCategory === "ALL" && (
                <span className="absolute inset-y-0 left-0 w-0.5 bg-accent rounded-l" />
              )}
              <div className="flex items-center gap-2 truncate">
                <BookmarkIcon className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                <span className="truncate">All Bookmarks</span>
              </div>
              <span className="text-[11px] font-mono text-ink-subtle">
                {totalCount}
              </span>
            </button>

            {/* Starred */}
            <button
              type="button"
              onClick={() => {
                sound.playClick(850);
                setSelectedCategory("FAVORITES");
              }}
              className={cn(
                "relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer",
                selectedCategory === "FAVORITES"
                  ? "bg-surface-2 text-ink font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2/50"
              )}
            >
              {selectedCategory === "FAVORITES" && (
                <span className="absolute inset-y-0 left-0 w-0.5 bg-accent rounded-l" />
              )}
              <div className="flex items-center gap-2 truncate">
                <Star className="w-3.5 h-3.5 text-warn fill-warn shrink-0" />
                <span className="truncate">Starred</span>
              </div>
              <span className="text-[11px] font-mono text-ink-subtle">
                {favoriteCount}
              </span>
            </button>

            <div className="py-1">
              <div className="h-px bg-hairline mx-1" />
            </div>

            {/* Active / Non-empty folders sorted by count then name */}
            {nonEmptyFolders.map((f) => {
              const isActive = selectedCategory === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    sound.playClick(850);
                    setSelectedCategory(f.id);
                  }}
                  className={cn(
                    "relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer",
                    isActive
                      ? "bg-surface-2 text-ink font-medium"
                      : "text-ink-muted hover:text-ink hover:bg-surface-2/50"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-accent rounded-l" />
                  )}
                  <div className="flex items-center gap-2 truncate">
                    {isActive ? (
                      <FolderOpen className="w-3.5 h-3.5 text-accent shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    )}
                    <span className="truncate">{f.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    {f.count}
                  </span>
                </button>
              );
            })}

            {/* Collapsed-by-default Empty Folders Group */}
            {emptyFolders.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleToggleEmptyFolders}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle hover:text-ink transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    {isEmptyFoldersOpen ? (
                      <ChevronDown className="w-3 h-3 text-ink-subtle" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-ink-subtle" />
                    )}
                    <span>Empty ({emptyFolders.length})</span>
                  </div>
                </button>

                {isEmptyFoldersOpen && (
                  <div className="space-y-0.5 pt-1 pl-1">
                    {emptyFolders.map((f) => {
                      const isActive = selectedCategory === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            sound.playClick(850);
                            setSelectedCategory(f.id);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2 py-1 rounded-[4px] text-xs transition-colors cursor-pointer",
                            isActive
                              ? "bg-surface-2 text-ink font-medium"
                              : "text-ink-subtle hover:text-ink hover:bg-surface-2/40"
                          )}
                        >
                          <span className="truncate">{f.label}</span>
                          <span className="text-[10px] font-mono text-ink-subtle">
                            0
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* List Heading: Folder Name · Count (left), Select action (right) */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-[-0.2px] text-ink">
                {activeCategoryTitle}
              </h2>
              <span className="text-xs font-mono text-ink-subtle">
                · {filteredBookmarks.length}
              </span>

              {searchQuery && (
                <div className="flex items-center gap-1 text-xs text-ink-subtle ml-2">
                  <span>matching</span>
                  <span className="font-mono text-ink bg-surface-2 px-1.5 py-0.5 rounded border border-hairline">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                </div>
              )}
            </div>

            {/* Right: "Select" trigger to enter selection mode */}
            {filteredBookmarks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick(800);
                  if (selectedBookmarkIds.size > 0 || isSelectionMode) {
                    setSelectedBookmarkIds(new Set());
                    setIsSelectionMode(false);
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-[4px] transition-colors cursor-pointer",
                  isSelectionMode || selectedBookmarkIds.size > 0
                    ? "text-accent bg-accent/10"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2"
                )}
              >
                {isSelectionMode || selectedBookmarkIds.size > 0
                  ? "Done"
                  : "Select"}
              </button>
            )}
          </div>

          {/* Loading, Error or Content */}
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-[8px] bg-surface-1 border border-hairline p-3 space-y-2 animate-pulse"
                  >
                    <div className="h-4 bg-surface-2 rounded w-2/3" />
                    <div className="h-3 bg-surface-2 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[8px] border border-hairline bg-surface-1 divide-y divide-hairline">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-[52px] px-3.5 flex items-center justify-between gap-4 animate-pulse"
                  >
                    <div className="h-4 bg-surface-2 rounded w-1/3" />
                    <div className="h-4 bg-surface-2 rounded w-24" />
                  </div>
                ))}
              </div>
            )
          ) : isError ? (
            <div className="rounded-[8px] border border-danger/30 bg-surface-1 p-8 text-center max-w-md mx-auto my-12">
              <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-ink mb-1">
                Failed to load bookmarks
              </h3>
              <p className="text-xs text-ink-subtle mb-4">
                {(error as Error)?.message || "Network error"}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="space-y-6">
              {viewMode === "grid" ? (
                /* Card Grid View (compact ~96-104px cards) */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                  {visibleBookmarks.map((bm) => (
                    <BookmarkCard
                      key={bm.id}
                      bookmark={bm}
                      isSelected={selectedBookmarkIds.has(bm.id)}
                      onToggleSelect={handleToggleSelect}
                      selectionMode={isSelectionMode || selectedBookmarkIds.size > 0}
                      showCategory={showCategoryColumn}
                      onEdit={(b) => setEditingBookmark(b)}
                      onDelete={(b) => setDeletingBookmark(b)}
                    />
                  ))}
                </div>
              ) : (
                /* List View (52px rows with shared template) */
                <div className="rounded-[8px] border border-hairline bg-surface-1 overflow-hidden">
                  {/* Shared List View Header */}
                  <div
                    className="w-full h-8 px-3.5 border-b border-hairline bg-surface-1/80 grid items-center gap-3 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle select-none"
                    style={{ gridTemplateColumns: listGridTemplate }}
                  >
                    <div />
                    <div />
                    <div>Name</div>
                    {showCategoryColumn && <div>Folder</div>}
                    {hasAnyTagsInVisible && <div>Tags</div>}
                    <div className="text-right">Actions</div>
                  </div>

                  {/* 52px Data Rows */}
                  {visibleBookmarks.map((bm) => (
                    <BookmarkListRow
                      key={bm.id}
                      bookmark={bm}
                      isSelected={selectedBookmarkIds.has(bm.id)}
                      onToggleSelect={handleToggleSelect}
                      selectionMode={isSelectionMode || selectedBookmarkIds.size > 0}
                      showCategory={showCategoryColumn}
                      hasAnyTags={hasAnyTagsInVisible}
                      gridTemplate={listGridTemplate}
                      onEdit={(b) => setEditingBookmark(b)}
                      onDelete={(b) => setDeletingBookmark(b)}
                    />
                  ))}
                </div>
              )}

              {/* Progressive Load More Row */}
              {visibleCount < filteredBookmarks.length && (
                <div className="pt-3 pb-2 flex items-center justify-center gap-2 text-xs text-ink-subtle select-none">
                  <span>
                    Showing {visibleBookmarks.length} of {filteredBookmarks.length}
                  </span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(750);
                      setVisibleCount((prev) => prev + 30);
                    }}
                    className="font-medium text-ink hover:text-accent hover:underline cursor-pointer"
                  >
                    Load {Math.min(30, filteredBookmarks.length - visibleBookmarks.length)} more
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty state */
            <div className="py-16 text-center max-w-sm mx-auto select-none">
              <p className="text-xs text-ink-subtle mb-4">
                {searchQuery || selectedCategory !== "ALL" || selectedProjectId
                  ? "No matching bookmarks found."
                  : "No bookmarks saved in your vault."}
              </p>
              <div className="flex items-center justify-center gap-2">
                {(searchQuery || selectedCategory !== "ALL" || selectedProjectId) ? (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(600);
                      setSearchQuery("");
                      setSelectedCategory("ALL");
                      setSelectedProjectId("");
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-surface-2 hover:bg-surface-3 border border-hairline text-ink text-xs font-medium transition-colors cursor-pointer"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(900);
                      setIsNewModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Add bookmark
                  </button>
                )}
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

      <ClearNotesModal
        isOpen={isClearNotesModalOpen}
        onClose={() => setIsClearNotesModalOpen(false)}
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

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedBookmarkIds={selectedBookmarkIds}
        allBookmarks={allBookmarks || []}
        onClearSelection={() => {
          setSelectedBookmarkIds(new Set());
          setIsSelectionMode(false);
        }}
        onOpenMoveModal={() => setIsMoveModalOpen(true)}
        onSelectAll={handleToggleSelectAllFiltered}
        isAllSelected={isAllFilteredSelected}
        totalFilteredCount={filteredBookmarks.length}
      />

      {/* Move Bookmarks Modal */}
      <MoveBookmarksModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        selectedBookmarks={(allBookmarks || []).filter((b) =>
          selectedBookmarkIds.has(b.id)
        )}
        customFolders={customFolders}
        onComplete={() => {
          setSelectedBookmarkIds(new Set());
          setIsSelectionMode(false);
        }}
      />
    </div>
  );
}
