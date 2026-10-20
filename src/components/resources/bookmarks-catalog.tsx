"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  ExternalLink,
  Bookmark as BookmarkIcon,
  FolderKanban,
  Tag,
  MoreVertical,
  Trash2,
  Edit2,
  Globe,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Bookmark,
  BookmarkCategory,
  PRESET_BOOKMARK_CATEGORIES,
} from "@/types/bookmark";
import { useBookmarks, useDeleteBookmark } from "@/hooks/use-bookmarks";
import { useProjects } from "@/hooks/use-projects";
import { NewBookmarkModal } from "./new-bookmark-modal";
import { EditBookmarkModal } from "./edit-bookmark-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

const getCategoryBadge = (cat: string) => {
  const normalized = (cat || "tools").toLowerCase();
  const preset = PRESET_BOOKMARK_CATEGORIES.find((p) => p.id === normalized);
  if (preset) {
    return {
      label: preset.label,
      badgeClass: preset.badgeClass,
    };
  }
  return {
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    badgeClass: "bg-surface-3 text-ink-muted border-hairline",
  };
};

export function BookmarksCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data: projects } = useProjects();
  const deleteBookmark = useDeleteBookmark();

  const {
    data: bookmarks,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookmarks({
    category: selectedCategory !== "ALL" ? selectedCategory : undefined,
    projectId: selectedProjectId || undefined,
    search: debouncedSearch,
  });

  // Dynamic tabs: ALL + Presets + Any custom categories found in user bookmarks
  const categoryTabs = useMemo(() => {
    const customCategories = new Set<string>();
    bookmarks?.forEach((bm) => {
      const cat = (bm.category || "tools").toLowerCase();
      if (!PRESET_BOOKMARK_CATEGORIES.some((p) => p.id === cat)) {
        customCategories.add(cat);
      }
    });

    return [
      { id: "ALL", label: "All Bookmarks" },
      ...PRESET_BOOKMARK_CATEGORIES.map((p) => ({ id: p.id, label: p.label })),
      ...Array.from(customCategories).map((c) => ({
        id: c,
        label: c.charAt(0).toUpperCase() + c.slice(1),
      })),
    ];
  }, [bookmarks]);

  const handleDelete = (e: React.MouseEvent, bm: Bookmark) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setDeletingBookmark(bm);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBookmark) return;
    try {
      await deleteBookmark.mutateAsync(deletingBookmark.id);
      toast.success("Bookmark deleted", {
        description: `"${deletingBookmark.title}" removed from bookmarks.`,
      });
      setDeletingBookmark(null);
    } catch {
      toast.error("Failed to delete bookmark");
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
      {/* Top Filter & Search Toolbar */}
      <div className="px-8 py-3.5 border-b border-hairline bg-surface-1/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search bookmarks by title, url, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink placeholder:text-ink-tertiary focus:border-primary focus:outline-none"
          />
        </div>

        {/* Right side: Project Filter & Add button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none"
            >
              <option value="">All Projects</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

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

      {/* Category Pills Bar */}
      <div className="px-8 py-2.5 border-b border-hairline bg-surface-1/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {categoryTabs.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick(850);
                setSelectedCategory(tab.id);
              }}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium tracking-tight whitespace-nowrap transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-white font-semibold"
                  : "bg-surface-2/60 text-ink-muted hover:text-ink hover:bg-surface-2 border border-transparent"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bookmarks Grid Area */}
      <div className="flex-1 min-h-0 p-8 overflow-y-auto">
        {isLoading ? (
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : bookmarks && bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {bookmarks.map((bm) => {
              const categoryConfig = getCategoryBadge(bm.category);
              const isMenuOpen = menuOpenId === bm.id;

              return (
                <div
                  key={bm.id}
                  className="rounded-xl bg-surface-1 border border-hairline hover:border-hairline-strong transition-all duration-200 overflow-hidden shadow-sm flex flex-col group"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-hairline/80 flex items-start justify-between gap-3 bg-surface-1/60">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Favicon */}
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${getHostname(bm.url)}&sz=64`}
                          alt=""
                          className="w-4 h-4 rounded-xs shrink-0 object-contain bg-surface-2 p-0.5"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium",
                            categoryConfig.badgeClass
                          )}
                        >
                          {categoryConfig.label}
                        </span>
                        <span className="text-[11px] font-mono text-ink-tertiary flex items-center gap-1 truncate">
                          <Globe className="w-2.5 h-2.5 shrink-0" />
                          {getHostname(bm.url)}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink truncate group-hover:text-primary transition-colors">
                        {bm.title}
                      </h3>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : bm.id);
                        }}
                        className="p-1 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-28 rounded-lg bg-surface-2 border border-hairline shadow-lg py-1 z-20 text-xs">
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                setEditingBookmark(bm);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-ink-muted hover:text-ink hover:bg-surface-3 text-left transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, bm)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-semantic-error hover:bg-semantic-error/10 text-left transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes / Description */}
                  {bm.notes && (
                    <div className="p-4 text-xs text-ink-muted line-clamp-3 leading-relaxed flex-1">
                      {bm.notes}
                    </div>
                  )}

                  {/* Footer with External Link & Project */}
                  <div className="px-4 py-3 border-t border-hairline/60 bg-surface-1/40 flex items-center justify-between text-xs mt-auto">
                    <div className="flex items-center gap-2 truncate">
                      {bm.project ? (
                        <span className="text-[11px] text-ink-tertiary flex items-center gap-1 truncate">
                          <FolderKanban className="w-3 h-3 shrink-0" />
                          <span className="truncate">{bm.project.title}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-subtle">Workspace</span>
                      )}
                    </div>

                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => sound.playClick(950)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium border border-hairline transition-colors shrink-0 group/link"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3 text-ink-tertiary group-hover/link:text-primary transition-colors" />
                    </a>
                  </div>

                  {/* Tags */}
                  {bm.tags && bm.tags.length > 0 && (
                    <div className="px-4 py-2 border-t border-hairline/40 bg-surface-1/20 flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-2.5 h-2.5 text-ink-subtle shrink-0" />
                      {bm.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-ink-muted border border-hairline"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-muted mb-4 mx-auto">
              <BookmarkIcon className="w-6 h-6 text-primary/70" />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-ink mb-1">
              No bookmarks found
            </h3>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              {searchQuery || selectedCategory !== "ALL" || selectedProjectId
                ? "Try clearing your search query or category filters."
                : "Save high-value API docs, articles, tools, libraries, and tutorial links for 1-click access."}
            </p>
            <div className="flex items-center justify-center gap-2.5">
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
                  setIsNewModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bookmark</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewBookmarkModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <EditBookmarkModal
        bookmark={editingBookmark}
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
      />

      <ConfirmModal
        isOpen={!!deletingBookmark}
        onClose={() => setDeletingBookmark(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Bookmark"
        description={`Are you sure you want to delete "${deletingBookmark?.title}"?`}
        confirmText="Delete Bookmark"
        variant="danger"
        isLoading={deleteBookmark.isPending}
      />
    </div>
  );
}
