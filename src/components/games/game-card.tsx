"use client";

import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GameCatalogItem {
  key: string;
  name: string;
  category: string;
  tagline: string;
  image: string;
  badge?: string;
  features: string[];
  storageKey?: string;
}

interface GameCardProps {
  game: GameCatalogItem;
  bestScore?: number;
  onPlay: () => void;
  className?: string;
}

export function GameCard({ game, bestScore, onPlay, className }: GameCardProps) {
  // Determine if tag duplicates category
  const isDuplicateTag =
    game.badge && game.badge.toLowerCase() === game.category.toLowerCase();
  const displayTag = game.badge && !isDuplicateTag ? game.badge : null;

  // Real score vs "Not played"
  const hasRealScore = typeof bestScore === "number" && bestScore > 0;

  return (
    <button
      type="button"
      onClick={onPlay}
      className={cn(
        "group w-full text-left rounded-[8px] bg-surface-1 border border-line hover:border-line-strong p-3 flex flex-col justify-between transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer select-none",
        className
      )}
    >
      <div className="w-full">
        {/* 1. Artwork - uncropped, 6px radius, full width minus padding */}
        <div className="relative w-full aspect-square rounded-[6px] overflow-hidden bg-surface-2 mb-3">
          <Image
            src={game.image}
            alt=""
            fill
            sizes="(max-width: 520px) 100vw, (max-width: 860px) 50vw, (max-width: 1180px) 33vw, 25vw"
            className="object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* 2. Title - wraps to 2 lines max, never truncated by siblings */}
        <h3 className="text-base font-semibold text-text-primary tracking-[-0.3px] line-clamp-2 leading-snug">
          {game.name}
        </h3>

        {/* 3. Meta line - mono 11px text-subtle */}
        <div className="font-mono text-[11px] text-subtle uppercase tracking-wider mt-0.5">
          <span>{game.category}</span>
          {displayTag && (
            <span className="normal-case text-subtle"> · {displayTag}</span>
          )}
        </div>

        {/* 4. Description - 2 lines max, reserved height for alignment */}
        <p className="text-[13px] text-muted line-clamp-2 leading-relaxed min-h-[38px] mt-2">
          {game.tagline}
        </p>

        {/* 5. Features - single mono line separated by · */}
        <div className="font-mono text-[11px] text-subtle truncate mt-2">
          {game.features.join(" · ")}
        </div>
      </div>

      {/* 6. Footer - hairline above */}
      <div className="pt-2.5 mt-3 border-t border-line flex items-center justify-between w-full pointer-events-none">
        {/* Left: Real Best or "Not played" */}
        <div className="font-mono text-xs tabular-nums">
          {hasRealScore ? (
            <span className="text-muted">Best {bestScore.toLocaleString()}</span>
          ) : (
            <span className="text-subtle">Not played</span>
          )}
        </div>

        {/* Right: Play affordance - ghost button taking accent on card hover */}
        <div className="h-7 px-2.5 rounded-[6px] bg-surface-2 border border-line text-muted group-hover:border-accent group-hover:text-accent transition-colors flex items-center gap-1.5 text-xs font-medium">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Play</span>
        </div>
      </div>
    </button>
  );
}
