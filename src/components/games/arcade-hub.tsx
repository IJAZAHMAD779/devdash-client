"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Gamepad2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { sounds } from "./sound-manager";
import { SoundToggle } from "./sound-toggle";
import { GameCard, type GameCatalogItem } from "./game-card";
import { GameFilterTabs } from "./game-filter-tabs";
import { Keycap } from "./keycap";
import { GameStageSkeleton } from "./game-stage-skeleton";
import { cn } from "@/lib/utils";

// Code-split all 8 game components using dynamic imports with skeleton fallback
const DinoGame = dynamic(() => import("./dino/dino-game").then((m) => m.DinoGame), {
  loading: () => <GameStageSkeleton />,
});
const Game2048 = dynamic(() => import("./game-2048/game-2048").then((m) => m.Game2048), {
  loading: () => <GameStageSkeleton />,
});
const SudokuGame = dynamic(() => import("./sudoku/sudoku-game").then((m) => m.SudokuGame), {
  loading: () => <GameStageSkeleton />,
});
const SnakeGame = dynamic(() => import("./snake/snake-game").then((m) => m.SnakeGame), {
  loading: () => <GameStageSkeleton />,
});
const TicTacToeGame = dynamic(() => import("./tic-tac-toe/tic-tac-toe-game").then((m) => m.TicTacToeGame), {
  loading: () => <GameStageSkeleton />,
});
const BalloonPopperGame = dynamic(() => import("./balloon-popper/balloon-popper-game").then((m) => m.BalloonPopperGame), {
  loading: () => <GameStageSkeleton />,
});
const CoinDiceGame = dynamic(() => import("./coin-dice/coin-dice-game").then((m) => m.CoinDiceGame), {
  loading: () => <GameStageSkeleton />,
});
const BreakoutGame = dynamic(() => import("./breakout/breakout-game").then((m) => m.BreakoutGame), {
  loading: () => <GameStageSkeleton />,
});

export type GameKey =
  | "dino"
  | "2048"
  | "sudoku"
  | "snake"
  | "tictactoe"
  | "balloon"
  | "coindice"
  | "breakout";

export interface GameMetadata extends GameCatalogItem {
  key: GameKey;
  category: "Runner" | "Puzzle" | "Logic" | "Arcade" | "Reflex" | "Casual";
}

const GAMES_LIST: GameMetadata[] = [
  {
    key: "dino",
    name: "Chrome Dino",
    category: "Runner",
    tagline: "Endless T-Rex runner dodging cacti & pterodactyls",
    image: "/games/dino.jpg",
    badge: "Popular",
    features: ["Fast-Paced", "Retro Style", "Endless"],
    storageKey: "devdash_dino_highscore",
  },
  {
    key: "2048",
    name: "Classic 2048",
    category: "Puzzle",
    tagline: "Slide and merge numbered blocks strategically (2 → 2048)",
    image: "/games/2048.jpg",
    badge: "Addictive",
    features: ["Math Grid", "Strategic", "Tile 2048"],
    storageKey: "devdash_2048_highscore",
  },
  {
    key: "sudoku",
    name: "Classic Sudoku",
    category: "Logic",
    tagline: "Authentic 9x9 grid with Easy, Medium & Hard modes",
    image: "/games/sudoku.jpg",
    badge: "Mind Focus",
    features: ["Mind Focus", "3 Modes", "Pure Logic"],
  },
  {
    key: "snake",
    name: "Retro Snake",
    category: "Arcade",
    tagline: "Timeless snake eating apples with wrap-around walls",
    image: "/games/snake.jpg",
    badge: "Classic",
    features: ["Nokia Vibe", "Speed Scaling", "Wrap Walls"],
    storageKey: "devdash_snake_highscore",
  },
  {
    key: "tictactoe",
    name: "Tic-Tac-Toe",
    category: "Puzzle",
    tagline: "X vs O with Minimax AI, Casual AI, and 2-Player",
    image: "/games/tictactoe.jpg",
    badge: "Fast 1-Min",
    features: ["Minimax AI", "2-Player", "1-Min Match"],
  },
  {
    key: "balloon",
    name: "Balloon Popper",
    category: "Reflex",
    tagline: "Float & pop balloons with particle burst effects",
    image: "/games/balloon.jpg",
    badge: "Reflex",
    features: ["Reflex Aim", "Particle FX", "30s Blitz"],
    storageKey: "devdash_balloon_highscore",
  },
  {
    key: "coindice",
    name: "Coin & Dice",
    category: "Casual",
    tagline: "3D physics coin flip & tumbling dice for quick decisions",
    image: "/games/coindice.jpg",
    badge: "Decisions",
    features: ["3D Physics", "Lucky Coin", "Quick Pick"],
  },
  {
    key: "breakout",
    name: "Neon Breakout",
    category: "Arcade",
    tagline: "Paddle & ball retro arcade breaking vibrant neon bricks",
    image: "/games/breakout.jpg",
    badge: "New Arcade",
    features: ["Neon Bricks", "Power-Ups", "Retro Synth"],
    storageKey: "devdash_breakout_highscore",
  },
];

const CATEGORIES = [
  "ALL",
  "Runner",
  "Puzzle",
  "Logic",
  "Arcade",
  "Reflex",
  "Casual",
];

function renderControlsHint(gameKey: GameKey) {
  switch (gameKey) {
    case "dino":
      return (
        <span className="flex items-center gap-1.5 flex-wrap justify-center">
          Controls: <Keycap>Space</Keycap> or <Keycap>↑</Keycap> to Jump (hold for higher), <Keycap>↓</Keycap> to Duck, <Keycap>P</Keycap> to Pause
        </span>
      );
    case "2048":
      return (
        <span className="flex items-center gap-1.5 flex-wrap justify-center">
          Controls: <Keycap>Arrow Keys</Keycap> or swipe to slide tiles, <Keycap>U</Keycap> to Undo move
        </span>
      );
    case "sudoku":
      return (
        <span className="flex items-center gap-1.5 flex-wrap justify-center">
          Controls: <Keycap>1</Keycap>–<Keycap>9</Keycap> to input number, <Keycap>N</Keycap> for Notes mode, <Keycap>U</Keycap> to Undo, <Keycap>Del</Keycap> to Erase
        </span>
      );
    case "snake":
      return (
        <span className="flex items-center gap-1.5 flex-wrap justify-center">
          Controls: <Keycap>Arrow Keys</Keycap> or <Keycap>W</Keycap> <Keycap>A</Keycap> <Keycap>S</Keycap> <Keycap>D</Keycap> to slither, <Keycap>Space</Keycap> to start
        </span>
      );
    case "tictactoe":
      return <span>Click any empty cell to place your mark (X or O)</span>;
    case "balloon":
      return <span>Click or tap balloons before they float away · Chain pops within 1.4s for combos</span>;
    case "coindice":
      return <span>Click coin to toss/spin · Click Roll to roll dice · Click individual dice to hold</span>;
    case "breakout":
      return (
        <span className="flex items-center gap-1.5 flex-wrap justify-center">
          Controls: Move pointer to steer paddle, <Keycap>A</Keycap> / <Keycap>D</Keycap> or <Keycap>←</Keycap> / <Keycap>→</Keycap>, <Keycap>Space</Keycap> to launch ball
        </span>
      );
    default:
      return null;
  }
}

export function ArcadeHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Read high scores from localStorage (updates whenever activeGame changes back to null)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const scores: Record<string, number> = {};
      GAMES_LIST.forEach((g) => {
        if (g.storageKey) {
          const val = localStorage.getItem(g.storageKey);
          if (val) {
            const parsed = parseInt(val, 10);
            if (!isNaN(parsed) && parsed > 0) {
              scores[g.key] = parsed;
            }
          }
        }
      });
      setHighScores(scores);
    }
  }, [activeGame]);

  // Listen to browser fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    sounds.playClick();
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any)?.webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to CSS fullscreen overlay if browser restricts API
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleOpenGame = (key: GameKey) => {
    sounds.playClick();
    setActiveGame(key);
  };

  const handleBackToCatalog = async () => {
    sounds.playClick();
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
    setIsFullscreen(false);
    setActiveGame(null);
  };

  // Keyboard shortcut Esc to return to catalog (when not in native fullscreen, as browser handles Esc for fullscreen exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeGame !== null && !document.fullscreenElement) {
        handleBackToCatalog();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGame]);

  const currentGame = GAMES_LIST.find((g) => g.key === activeGame);

  const filteredGames = GAMES_LIST.filter(
    (g) => selectedCategory === "ALL" || g.category === selectedCategory
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 min-h-screen bg-canvas text-ink flex flex-col overflow-y-auto",
        isFullscreen && "fixed inset-0 z-50 w-screen h-screen bg-[#010102]"
      )}
    >
      {/* ── Top Bar (One row, 36px controls matching design tokens) ── */}
      <header className="h-14 px-4 sm:px-6 border-b border-line flex items-center justify-between gap-4 bg-surface-1/40 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {activeGame ? (
            <button
              onClick={handleBackToCatalog}
              className="h-9 px-3 rounded-[6px] bg-surface-1 hover:bg-surface-2 border border-line hover:border-line-strong text-xs font-medium text-muted hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              title="Return to Games Catalog (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-subtle" />
              <span>All games</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="h-9 w-9 rounded-[6px] bg-surface-1 hover:bg-surface-2 border border-line hover:border-line-strong text-subtle hover:text-text-primary transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              title="Return to Dashboard"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <Gamepad2 className="w-4 h-4 text-muted shrink-0" />
            <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-text-primary truncate">
              {activeGame ? currentGame?.name : "Arcade & Relaxation"}
            </h1>
            {activeGame && currentGame ? (
              <span className="font-mono text-[11px] text-subtle uppercase tracking-wider ml-1">
                {currentGame.category}
              </span>
            ) : (
              <span className="font-mono text-[11px] text-subtle ml-1">
                {GAMES_LIST.length} games
              </span>
            )}
          </div>
        </div>

        {/* Top Bar Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Fullscreen Toggle in Active Game */}
          {activeGame && (
            <button
              onClick={toggleFullscreen}
              className="h-9 px-3 rounded-[6px] bg-surface-1 hover:bg-surface-2 border border-line hover:border-line-strong text-xs font-medium text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen Mode"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-muted" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-muted" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>
          )}

          {/* Unified Sound Toggle */}
          <SoundToggle />
        </div>
      </header>

      {/* ── Main Content Area ── */}
      {!activeGame ? (
        /* ── Games Lounge View ────────────────────────────────────────── */
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 @container">
          {/* Subtitle (One muted 13px line directly beneath the top bar) */}
          <div className="space-y-4">
            <p className="text-[13px] text-muted">
              Take a quick 2-minute break, relax your mind, and recharge your focus
            </p>

            {/* Filter Tabs with Dynamic Counts */}
            <GameFilterTabs
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              games={GAMES_LIST}
            />
          </div>

          {/* Container-based Game Cards Grid */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 @[520px]:grid-cols-2 @[860px]:grid-cols-3 @[1180px]:grid-cols-4 gap-4">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.key}
                  game={game}
                  bestScore={highScores[game.key]}
                  onPlay={() => handleOpenGame(game.key)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-16 text-center text-sm text-subtle">
              No games found in this category.{" "}
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className="text-accent hover:underline ml-1 cursor-pointer font-medium"
              >
                Show all
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Active Game Stage View ──────────────────────────────────── */
        <main
          className={cn(
            "max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-8 flex-1 flex flex-col items-center justify-start",
            isFullscreen && "max-w-none p-4 sm:p-6 justify-center"
          )}
        >
          {/* Stage Panel */}
          <div className="w-full rounded-[8px] bg-surface-1 border border-line p-4 sm:p-6 flex flex-col items-center justify-center">
            {activeGame === "dino" && <DinoGame />}
            {activeGame === "2048" && <Game2048 />}
            {activeGame === "sudoku" && <SudokuGame />}
            {activeGame === "snake" && <SnakeGame />}
            {activeGame === "tictactoe" && <TicTacToeGame />}
            {activeGame === "balloon" && <BalloonPopperGame />}
            {activeGame === "coindice" && <CoinDiceGame />}
            {activeGame === "breakout" && <BreakoutGame />}
          </div>

          {/* Controls Hint Under Stage */}
          <div className="mt-4 text-center text-xs text-muted flex items-center justify-center gap-1.5 flex-wrap">
            {renderControlsHint(activeGame)}
          </div>
        </main>
      )}
    </div>
  );
}
