"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Gamepad2,
  Play,
  Trophy,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { sounds } from "./sound-manager";
import { DinoGame } from "./dino/dino-game";
import { Game2048 } from "./game-2048/game-2048";
import { SudokuGame } from "./sudoku/sudoku-game";
import { SnakeGame } from "./snake/snake-game";
import { TicTacToeGame } from "./tic-tac-toe/tic-tac-toe-game";
import { BalloonPopperGame } from "./balloon-popper/balloon-popper-game";
import { CoinDiceGame } from "./coin-dice/coin-dice-game";
import { BreakoutGame } from "./breakout/breakout-game";
import { cn } from "@/lib/utils";

export type GameKey = "dino" | "2048" | "sudoku" | "snake" | "tictactoe" | "balloon" | "coindice" | "breakout";

interface GameCardItem {
  key: GameKey;
  name: string;
  category: "Runner" | "Puzzle" | "Logic" | "Arcade" | "Reflex" | "Casual";
  tagline: string;
  image: string;
  badge: string;
  accentColor: string;
  storageKey?: string;
}

const GAMES_LIST: GameCardItem[] = [
  {
    key: "dino",
    name: "Chrome Dino",
    category: "Runner",
    tagline: "Endless T-Rex runner dodging cacti & pterodactyls",
    image: "/games/dino.jpg",
    badge: "Popular",
    accentColor: "from-amber-500/20 to-orange-500/20",
    storageKey: "devdash_dino_highscore",
  },
  {
    key: "2048",
    name: "Classic 2048",
    category: "Puzzle",
    tagline: "Slide and merge numbered blocks (2 → 2048)",
    image: "/games/2048.jpg",
    badge: "Addictive",
    accentColor: "from-blue-500/20 to-indigo-500/20",
    storageKey: "devdash_2048_highscore",
  },
  {
    key: "sudoku",
    name: "Classic Sudoku",
    category: "Logic",
    tagline: "Authentic 9x9 grid with Easy, Medium & Hard modes",
    image: "/games/sudoku.jpg",
    badge: "Mind Focus",
    accentColor: "from-emerald-500/20 to-teal-500/20",
  },
  {
    key: "snake",
    name: "Retro Snake",
    category: "Arcade",
    tagline: "Timeless snake eating apples with wrap-around walls",
    image: "/games/snake.jpg",
    badge: "Classic",
    accentColor: "from-green-500/20 to-emerald-500/20",
    storageKey: "devdash_snake_highscore",
  },
  {
    key: "tictactoe",
    name: "Tic-Tac-Toe",
    category: "Puzzle",
    tagline: "X vs O with Minimax AI, Casual AI, and 2-Player",
    image: "/games/tictactoe.jpg",
    badge: "Fast 1-Min",
    accentColor: "from-cyan-500/20 to-blue-500/20",
  },
  {
    key: "balloon",
    name: "Balloon Popper",
    category: "Reflex",
    tagline: "Float & pop balloons with particle burst effects",
    image: "/games/balloon.jpg",
    badge: "Reflex",
    accentColor: "from-pink-500/20 to-purple-500/20",
    storageKey: "devdash_balloon_highscore",
  },
  {
    key: "coindice",
    name: "Coin & Dice",
    category: "Casual",
    tagline: "3D physics coin flip & tumbling dice for quick decisions",
    image: "/games/coindice.jpg",
    badge: "Decisions",
    accentColor: "from-amber-500/20 to-yellow-500/20",
  },
  {
    key: "breakout",
    name: "Neon Breakout",
    category: "Arcade",
    tagline: "Paddle & ball retro arcade breaking vibrant neon bricks",
    image: "/games/breakout.jpg",
    badge: "New",
    accentColor: "from-cyan-500/20 to-blue-500/20",
    storageKey: "devdash_breakout_highscore",
  },
];

export function ArcadeHub() {
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsMuted(sounds.getMuted());

    // Read high scores from localStorage
    if (typeof window !== "undefined") {
      const scores: Record<string, number> = {};
      GAMES_LIST.forEach((g) => {
        if (g.storageKey) {
          const val = localStorage.getItem(g.storageKey);
          if (val) scores[g.key] = parseInt(val, 10);
        }
      });
      setHighScores(scores);
    }
  }, []);

  const toggleMute = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const handleOpenGame = (key: GameKey) => {
    sounds.playClick();
    setActiveGame(key);
  };

  const handleBackToCatalog = () => {
    sounds.playClick();
    setActiveGame(null);
  };

  // Keyboard shortcut Esc to return to catalog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeGame !== null) {
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

  const categories = ["ALL", "Runner", "Puzzle", "Logic", "Arcade", "Reflex", "Casual"];

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col overflow-y-auto">
      {/* Top Header — unified h-14 height matching sidebar brand header */}
      <div className="h-14 px-4 sm:px-6 border-b border-hairline flex items-center justify-between gap-4 bg-surface-1/40 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {activeGame ? (
            <button
              onClick={handleBackToCatalog}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer group"
              title="Return to Games Catalog (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-ink-subtle group-hover:text-ink transition-transform group-hover:-translate-x-0.5" />
              <span>All Games</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="p-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <Gamepad2 className="w-4 h-4 text-primary shrink-0" />
            <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-ink truncate">
              {activeGame ? currentGame?.name : "Arcade & Relaxation"}
            </h1>
            {activeGame && currentGame && (
              <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-hairline text-ink-subtle">
                {currentGame.category}
              </span>
            )}
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick game switcher pill when inside a game */}
          {activeGame && (
            <div className="hidden md:flex items-center gap-1 p-0.5 rounded-md bg-surface-2 border border-hairline">
              {GAMES_LIST.map((g) => (
                <button
                  key={g.key}
                  onClick={() => handleOpenGame(g.key)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
                    activeGame === g.key
                      ? "bg-surface-4 text-ink shadow-xs"
                      : "text-ink-subtle hover:text-ink"
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
            title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-ink-subtle" />
                <span className="hidden sm:inline">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary hidden sm:inline">Sound On</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {!activeGame ? (
        /* ── Games Cards Catalog View ────────────────────────────── */
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 flex-1">
          {/* Subheader & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Mini-Games Lounge
              </h2>
              <p className="text-xs text-ink-subtle mt-0.5">
                Take a quick 2-minute break, relax your mind, and recharge your focus
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-hairline overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap cursor-pointer",
                    selectedCategory === cat
                      ? "bg-surface-3 text-ink shadow-xs font-semibold"
                      : "text-ink-subtle hover:text-ink"
                  )}
                >
                  {cat === "ALL" ? "All Games" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Game Cards Grid (Matches Reference Image Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredGames.map((game) => {
              const bestScore = highScores[game.key];
              return (
                <div
                  key={game.key}
                  onClick={() => handleOpenGame(game.key)}
                  className="group relative rounded-2xl bg-surface-1 border border-hairline hover:border-primary/50 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Image Card Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Badge top-left */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-surface-1/90 backdrop-blur-md border border-hairline text-ink shadow-sm">
                        {game.badge}
                      </span>
                    </div>

                    {/* High score badge top-right */}
                    {bestScore !== undefined && bestScore > 0 && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/75 backdrop-blur-md border border-hairline text-amber-400">
                        <Trophy className="w-2.5 h-2.5" />
                        <span>{bestScore}</span>
                      </div>
                    )}

                    {/* Hover Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/35 backdrop-blur-[2px]">
                      <div className="w-13 h-13 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/40 transform scale-75 group-hover:scale-100 transition-transform duration-200">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Content Footer */}
                  <div className="p-4 flex flex-col justify-between flex-1 bg-surface-1">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold tracking-tight text-ink group-hover:text-primary transition-colors truncate">
                          {game.name}
                        </h3>
                        <span className="text-[10px] font-mono text-ink-subtle uppercase px-1.5 py-0.5 rounded bg-surface-2 border border-hairline shrink-0">
                          {game.category}
                        </span>
                      </div>
                      <p className="text-xs text-ink-subtle line-clamp-2 leading-relaxed">
                        {game.tagline}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-hairline/60 flex items-center justify-between text-xs">
                      <span className="text-ink-subtle font-mono text-[11px]">Instant Play</span>
                      <span className="text-primary font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Play Now</span>
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Active Game Stage View ──────────────────────────────── */
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-center items-center animate-in fade-in zoom-in-98 duration-200">
          {activeGame === "dino" && <DinoGame />}
          {activeGame === "2048" && <Game2048 />}
          {activeGame === "sudoku" && <SudokuGame />}
          {activeGame === "snake" && <SnakeGame />}
          {activeGame === "tictactoe" && <TicTacToeGame />}
          {activeGame === "balloon" && <BalloonPopperGame />}
          {activeGame === "coindice" && <CoinDiceGame />}
          {activeGame === "breakout" && <BreakoutGame />}
        </main>
      )}
    </div>
  );
}
