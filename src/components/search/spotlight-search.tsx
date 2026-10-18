"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FolderKanban,
  CheckSquare,
  Code2,
  Component as ComponentIcon,
  BookOpen,
  Bookmark as BookmarkIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useGlobalSearch } from "@/hooks/use-search";
import { SearchEntityType, SearchResultItem } from "@/types/search";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

const FILTER_TYPES: { id: SearchEntityType; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PROJECT", label: "Projects" },
  { id: "TASK", label: "Tasks" },
  { id: "SNIPPET", label: "Snippets" },
  { id: "COMPONENT", label: "Components" },
  { id: "NOTE", label: "Notes" },
  { id: "BOOKMARK", label: "Bookmarks" },
];

const TYPE_CONFIG: Record<
  SearchResultItem["type"],
  { label: string; icon: React.ElementType; color: string }
> = {
  PROJECT: { label: "Project", icon: FolderKanban, color: "text-blue-400" },
  TASK: { label: "Task", icon: CheckSquare, color: "text-emerald-400" },
  SNIPPET: { label: "Snippet", icon: Code2, color: "text-purple-400" },
  COMPONENT: {
    label: "Component",
    icon: ComponentIcon,
    color: "text-cyan-400",
  },
  NOTE: { label: "Note", icon: BookOpen, color: "text-amber-400" },
  BOOKMARK: { label: "Bookmark", icon: BookmarkIcon, color: "text-rose-400" },
};

export function SpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<SearchEntityType>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const { data: searchData, isLoading } = useGlobalSearch(query, activeType);
  const results = searchData?.results || [];

  // Global keyboard shortcut listener: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        sound.playClick(950);
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset index when query or type changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeType]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleNavigate = (item: SearchResultItem) => {
    sound.playClick(850);
    handleClose();
    router.push(item.url);
  };

  // Keyboard navigation within list (ArrowUp, ArrowDown, Enter)
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      sound.playClick(700);
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      sound.playClick(700);
      setSelectedIndex(
        (prev) => (prev - 1 + results.length) % Math.max(1, results.length)
      );
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleNavigate(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-2xl bg-surface-1 border border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Search Input */}
        <div className="px-4 py-3.5 border-b border-hairline flex items-center gap-3 bg-surface-1/90">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, snippets, components, notes... (or type #tag)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-tertiary focus:outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded text-ink-muted hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-hairline text-ink-tertiary">
              ESC
            </kbd>
          )}
        </div>

        {/* Filter Pills Bar */}
        <div className="px-4 py-2 border-b border-hairline bg-surface-1/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {FILTER_TYPES.map((filter) => {
            const isActive = activeType === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => {
                  sound.playClick(850);
                  setActiveType(filter.id);
                }}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium tracking-tight whitespace-nowrap transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-white font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="max-h-96 overflow-y-auto p-2 divide-y divide-hairline/40"
        >
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-ink-muted text-xs">
              <Sparkles className="w-6 h-6 text-primary/40 mx-auto mb-2" />
              <p>Type at least 2 characters to search across your workspace</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-surface-2/60 animate-pulse"
                />
              ))}
            </div>
          ) : results.length > 0 ? (
            results.map((item, index) => {
              const config = TYPE_CONFIG[item.type];
              const Icon = config.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleNavigate(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-100",
                    isSelected
                      ? "bg-surface-2 text-ink"
                      : "hover:bg-surface-2/50 text-ink-muted"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md bg-surface-3 flex items-center justify-center shrink-0 border border-hairline",
                        config.color
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-ink-muted truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-3 border border-hairline text-ink-tertiary">
                      {config.label}
                    </span>
                    <ArrowRight
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-150",
                        isSelected
                          ? "text-primary translate-x-0.5"
                          : "text-ink-subtle opacity-0"
                      )}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-ink-muted text-xs">
              No results found for &quot;<span className="text-ink">{query}</span>&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-hairline bg-surface-2/60 flex items-center justify-between text-[11px] text-ink-tertiary">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-hairline font-mono text-[10px] text-ink-muted mr-1">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-hairline font-mono text-[10px] text-ink-muted mr-1.5">
                ↓
              </kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-3 border border-hairline font-mono text-[10px] text-ink-muted mr-1">
                ↵
              </kbd>
              Open
            </span>
          </div>
          <span>DevDash Spotlight</span>
        </div>
      </div>
    </div>
  );
}
