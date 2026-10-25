"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface GameFilterItem {
  category: string;
}

interface GameFilterTabsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  games: GameFilterItem[];
  className?: string;
}

export function GameFilterTabs({
  categories,
  selectedCategory,
  onSelectCategory,
  games,
  className,
}: GameFilterTabsProps) {
  // Compute category counts dynamically
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: games.length };
    games.forEach((g) => {
      map[g.category] = (map[g.category] || 0) + 1;
    });
    return map;
  }, [games]);

  // Filter out any categories with 0 items
  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (cat === "ALL") return true;
      return (counts[cat] || 0) > 0;
    });
  }, [categories, counts]);

  return (
    <div
      role="tablist"
      aria-label="Filter games by category"
      className={cn(
        "flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar border-b border-line w-full select-none",
        className
      )}
    >
      {visibleCategories.map((cat) => {
        const isActive = selectedCategory === cat;
        const count = counts[cat] ?? 0;
        const label = cat === "ALL" ? "All" : cat;

        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(cat)}
            className={cn(
              "min-h-[36px] py-2 px-1 inline-flex items-center gap-1.5 text-xs whitespace-nowrap transition-colors duration-150 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
              isActive
                ? "text-text-primary border-accent font-medium"
                : "text-muted hover:text-text-primary border-transparent font-normal"
            )}
          >
            <span>{label}</span>
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                isActive ? "text-text-primary" : "text-subtle"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
