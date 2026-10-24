"use client";

import { useState, useMemo } from "react";
import {
  X,
  FolderInput,
  FolderPlus,
  Folder,
  FolderOpen,
  Check,
  Search,
  Loader2,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { Bookmark, PRESET_BOOKMARK_CATEGORIES } from "@/types/bookmark";
import { useBatchMoveBookmarks } from "@/hooks/use-bookmarks";
import { useProjects } from "@/hooks/use-projects";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedBookmarks: Bookmark[];
  customFolders: string[];
  onComplete: () => void;
}

export function MoveBookmarksModal({
  isOpen,
  onClose,
  selectedBookmarks,
  customFolders,
  onComplete,
}: Props) {
  const batchMove = useBatchMoveBookmarks();
  const { data: projects } = useProjects();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | "KEEP" | "NONE">("KEEP");

  // Breakdown of selected bookmarks across current categories
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedBookmarks.forEach((b) => {
      const cat = (b.category || "tools").toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [selectedBookmarks]);

  // Combined unique categories: Presets + custom
  const allCategories = useMemo(() => {
    const list: { id: string; label: string; isPreset: boolean }[] = [];
    const seen = new Set<string>();

    PRESET_BOOKMARK_CATEGORIES.forEach((p) => {
      seen.add(p.id.toLowerCase());
      list.push({ id: p.id, label: p.label, isPreset: true });
    });

    customFolders.forEach((c) => {
      const lower = c.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push({
          id: lower,
          label: lower.charAt(0).toUpperCase() + lower.slice(1),
          isPreset: false,
        });
      }
    });

    return list;
  }, [customFolders]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return allCategories;
    const q = search.toLowerCase().trim();
    return allCategories.filter(
      (c) => c.id.includes(q) || c.label.toLowerCase().includes(q)
    );
  }, [allCategories, search]);

  if (!isOpen) return null;

  const count = selectedBookmarks.length;

  const handleExecuteMove = async (targetCategory: string) => {
    const clean = targetCategory
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");

    if (!clean) {
      toast.error("Please specify a valid category name");
      return;
    }

    try {
      const bookmarkIds = selectedBookmarks.map((b) => b.id);
      const payload: {
        bookmarkIds: string[];
        category: string;
        projectId?: string | null;
      } = {
        bookmarkIds,
        category: clean,
      };

      if (selectedProjectId === "NONE") {
        payload.projectId = null;
      } else if (selectedProjectId !== "KEEP") {
        payload.projectId = selectedProjectId;
      }

      await batchMove.mutateAsync(payload);

      sound.playSuccess();
      toast.success("Bookmarks moved successfully", {
        description: `Moved ${count} ${count === 1 ? "bookmark" : "bookmarks"} to "${clean}".`,
      });

      onComplete();
      onClose();
    } catch {
      toast.error("Failed to move bookmarks");
    }
  };

  const handleCreateAndMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    handleExecuteMove(newCategoryName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-xl bg-surface-1 border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-surface-1/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink tracking-tight">
                Move {count} {count === 1 ? "Bookmark" : "Bookmarks"}
              </h3>
              <p className="text-[11px] text-ink-subtle">
                Choose an existing category or create a new one
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick(700);
              onClose();
            }}
            className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source breakdown indicator */}
        <div className="px-5 py-2.5 bg-surface-2/40 border-b border-hairline flex items-center gap-2 flex-wrap text-xs text-ink-subtle">
          <span className="font-mono text-[10px] uppercase text-ink-tertiary">Currently in:</span>
          {Object.entries(sourceBreakdown).map(([cat, n]) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-md bg-surface-2 border border-hairline font-mono text-[11px] text-ink capitalize"
            >
              {cat} ({n})
            </span>
          ))}
        </div>

        {/* Project reassignment option */}
        <div className="px-5 py-2.5 border-b border-hairline bg-surface-1/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-ink-subtle shrink-0">
            <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary" />
            <span>Target Project:</span>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none max-w-[180px] truncate"
          >
            <option value="KEEP">Keep Current Project(s)</option>
            <option value="NONE">No Project (Unassign)</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Search & Create New category toggle */}
        <div className="p-4 border-b border-hairline space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search destination category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-2 border border-hairline text-xs text-ink placeholder:text-ink-tertiary focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Create new category inline form */}
          {isCreatingNew ? (
            <form onSubmit={handleCreateAndMove} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                placeholder="new-category-name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-primary/50 text-xs font-mono text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim() || batchMove.isPending}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {batchMove.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Create & Move</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="p-1.5 text-ink-subtle hover:text-ink rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                sound.playClick(850);
                setIsCreatingNew(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-hairline hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-ink-muted hover:text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create New Category & Move</span>
            </button>
          )}
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[300px]">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-6 text-xs text-ink-subtle">
              No matching categories found. Use &ldquo;Create New Category&rdquo; above.
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const isCurrent = sourceBreakdown[cat.id] === count;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClick(850);
                    setSelectedCategory(cat.id);
                  }}
                  onDoubleClick={() => handleExecuteMove(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left",
                    isSelected
                      ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                      : "hover:bg-surface-2 text-ink-muted hover:text-ink border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isSelected ? (
                      <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-ink-tertiary shrink-0" />
                    )}
                    <span className="truncate">{cat.label}</span>
                    {cat.isPreset ? (
                      <span className="text-[10px] font-mono text-ink-tertiary px-1 py-0.2 rounded bg-surface-2">
                        preset
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-ink-tertiary px-1 py-0.2 rounded bg-surface-2">
                        custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="text-[10px] text-ink-tertiary font-mono">
                        (current)
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-hairline bg-surface-1/60 flex items-center justify-between">
          <span className="text-[11px] text-ink-tertiary">
            Double-click any category to move instantly
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleExecuteMove(selectedCategory)}
              disabled={!selectedCategory || batchMove.isPending}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold shadow-sm shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {batchMove.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderInput className="w-3.5 h-3.5" />
              )}
              <span>Move to {selectedCategory || "Category"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
