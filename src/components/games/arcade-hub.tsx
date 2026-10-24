"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Gamepad2,
  Play,
  Trophy,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
  Brain,
  Zap,
  Bot,
  Target,
  Dices,
  Coins,
  Cpu,
  Users,
  Timer,
  Layers,
  Activity,
  Shield,
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

export type GameKey =
  | "dino"
  | "2048"
  | "sudoku"
  | "snake"
  | "tictactoe"
  | "balloon"
  | "coindice"
  | "breakout";

export interface GameTag {
  label: string;
  icon: React.ElementType;
  iconColor?: string;
}

export interface GameCardItem {
  key: GameKey;
  name: string;
  category: "Runner" | "Puzzle" | "Logic" | "Arcade" | "Reflex" | "Casual";
  tagline: string;
  image: string;
  badge: string;
  badgeIcon: React.ElementType;
  badgeTheme: string;
  plays: string;
  tags: GameTag[];
  buttonGradient: string;
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
    badgeIcon: Flame,
    badgeTheme: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    plays: "2,385",
    tags: [
      { label: "Fast-Paced", icon: Zap, iconColor: "text-amber-400" },
      { label: "Retro Style", icon: Gamepad2, iconColor: "text-cyan-400" },
      { label: "Endless", icon: Star, iconColor: "text-purple-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105",
    accentColor: "from-amber-500/20 to-orange-500/20",
    storageKey: "devdash_dino_highscore",
  },
  {
    key: "2048",
    name: "Classic 2048",
    category: "Puzzle",
    tagline: "Slide and merge numbered blocks strategically (2 → 2048)",
    image: "/games/2048.jpg",
    badge: "Addictive",
    badgeIcon: Star,
    badgeTheme: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    plays: "4,120",
    tags: [
      { label: "Math Grid", icon: Cpu, iconColor: "text-blue-400" },
      { label: "Strategic", icon: Target, iconColor: "text-cyan-400" },
      { label: "Tile 2048", icon: Trophy, iconColor: "text-amber-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-300 hover:to-cyan-300 text-black shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105",
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
    badgeIcon: Brain,
    badgeTheme: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    plays: "1,950",
    tags: [
      { label: "Mind Focus", icon: Brain, iconColor: "text-emerald-400" },
      { label: "3 Modes", icon: Activity, iconColor: "text-teal-400" },
      { label: "Pure Logic", icon: Sparkles, iconColor: "text-amber-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105",
    accentColor: "from-emerald-500/20 to-teal-500/20",
  },
  {
    key: "snake",
    name: "Retro Snake",
    category: "Arcade",
    tagline: "Timeless snake eating apples with wrap-around walls",
    image: "/games/snake.jpg",
    badge: "Classic",
    badgeIcon: Zap,
    badgeTheme: "bg-green-500/10 border-green-500/30 text-green-400",
    plays: "3,480",
    tags: [
      { label: "Nokia Vibe", icon: Gamepad2, iconColor: "text-green-400" },
      { label: "Speed Scaling", icon: Zap, iconColor: "text-amber-400" },
      { label: "Wrap Walls", icon: Shield, iconColor: "text-cyan-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-300 hover:to-emerald-300 text-black shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105",
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
    badgeIcon: Bot,
    badgeTheme: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    plays: "2,840",
    tags: [
      { label: "Minimax AI", icon: Bot, iconColor: "text-cyan-400" },
      { label: "2-Player", icon: Users, iconColor: "text-blue-400" },
      { label: "1-Min Match", icon: Timer, iconColor: "text-purple-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-black shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105",
    accentColor: "from-cyan-500/20 to-blue-500/20",
  },
  {
    key: "balloon",
    name: "Balloon Popper",
    category: "Reflex",
    tagline: "Float & pop balloons with particle burst effects",
    image: "/games/balloon.jpg",
    badge: "Reflex",
    badgeIcon: Target,
    badgeTheme: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    plays: "1,670",
    tags: [
      { label: "Reflex Aim", icon: Target, iconColor: "text-pink-400" },
      { label: "Particle FX", icon: Sparkles, iconColor: "text-amber-400" },
      { label: "30s Blitz", icon: Timer, iconColor: "text-rose-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-300 hover:to-rose-300 text-black shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105",
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
    badgeIcon: Dices,
    badgeTheme: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    plays: "2,110",
    tags: [
      { label: "3D Physics", icon: Dices, iconColor: "text-yellow-400" },
      { label: "Lucky Coin", icon: Coins, iconColor: "text-amber-400" },
      { label: "Quick Pick", icon: Zap, iconColor: "text-orange-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:scale-105",
    accentColor: "from-amber-500/20 to-yellow-500/20",
  },
  {
    key: "breakout",
    name: "Neon Breakout",
    category: "Arcade",
    tagline: "Paddle & ball retro arcade breaking vibrant neon bricks",
    image: "/games/breakout.jpg",
    badge: "New Arcade",
    badgeIcon: Sparkles,
    badgeTheme: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    plays: "3,290",
    tags: [
      { label: "Neon Bricks", icon: Layers, iconColor: "text-cyan-400" },
      { label: "Power-Ups", icon: Zap, iconColor: "text-amber-400" },
      { label: "Retro Synth", icon: Sparkles, iconColor: "text-fuchsia-400" },
    ],
    buttonGradient:
      "bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-black shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105",
    accentColor: "from-cyan-500/20 to-blue-500/20",
    storageKey: "devdash_breakout_highscore",
  },
];

function getCategoryIcon(category: string): React.ElementType {
  switch (category) {
    case "Runner":
      return Activity;
    case "Puzzle":
      return Cpu;
    case "Logic":
      return Brain;
    case "Arcade":
      return Gamepad2;
    case "Reflex":
      return Target;
    case "Casual":
      return Dices;
    default:
      return Sparkles;
  }
}

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
    (g) => selectedCategory === "ALL" || g.category === selectedCategory,
  );

  const categories = [
    "ALL",
    "Runner",
    "Puzzle",
    "Logic",
    "Arcade",
    "Reflex",
    "Casual",
  ];

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
                      : "text-ink-subtle hover:text-ink",
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
                Take a quick 2-minute break, relax your mind, and recharge your
                focus
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
                      : "text-ink-subtle hover:text-ink",
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
              const BadgeIcon = game.badgeIcon;
              const CategoryIcon = getCategoryIcon(game.category);

              return (
                <div
                  key={game.key}
                  onClick={() => handleOpenGame(game.key)}
                  className="group relative rounded-[28px] bg-[#0c0d12]/95 hover:bg-[#11131a] border border-white/[0.08] hover:border-white/20 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1.5 cursor-pointer"
                >
                  {/* Top Bar Header (Above Image) */}
                  <div className="flex items-center justify-between w-full mb-3.5">
                    {/* Left Badge */}
                    <div
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1.5 border shadow-xs backdrop-blur-md",
                        game.badgeTheme
                      )}
                    >
                      <BadgeIcon className="w-3 h-3 shrink-0" />
                      <span>{game.badge}</span>
                    </div>

                    {/* Right Plays / High Score Pill */}
                    <div className="px-2.5 py-1 rounded-full text-[11px] font-mono text-ink-muted bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5 shadow-xs">
                      {bestScore !== undefined && bestScore > 0 ? (
                        <>
                          <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="text-amber-300 font-semibold">{bestScore.toLocaleString()} pts</span>
                        </>
                      ) : (
                        <>
                          <Gamepad2 className="w-3 h-3 text-ink-tertiary shrink-0" />
                          <span>{game.plays}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Squircle Cartridge Shape - Identical across all 8 games for consistent look */}
                  <div className="relative w-full aspect-square rounded-[22px] overflow-hidden bg-[#161820] ring-1 ring-white/10 group-hover:ring-white/25 shadow-xl shadow-black/60 transition-all duration-300 mb-4">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Subtle Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-30 group-hover:opacity-10 transition-opacity pointer-events-none" />

                    {/* Center Play Disc on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/30 backdrop-blur-[2px]">
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-200">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Category Row */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-primary transition-colors truncate">
                        {game.name}
                      </h3>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-ink-subtle shrink-0 flex items-center gap-1.5">
                        <CategoryIcon className="w-3 h-3 text-ink-tertiary shrink-0" />
                        <span>{game.category}</span>
                      </span>
                    </div>

                    {/* Description / Tagline */}
                    <p className="text-xs text-ink-subtle line-clamp-2 leading-relaxed mb-3">
                      {game.tagline}
                    </p>

                    {/* Feature Chips / Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {game.tags.map((tag) => {
                        const TagIcon = tag.icon;
                        return (
                          <span
                            key={tag.label}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] text-ink-muted"
                          >
                            <TagIcon className={cn("w-3 h-3 shrink-0", tag.iconColor || "text-ink-tertiary")} />
                            <span>{tag.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Bar / Bottom Row */}
                  <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs mt-auto">
                    <div className="flex items-center gap-2 text-ink-subtle font-mono text-[11px]">
                      <span className="w-6 h-6 rounded-md border border-white/10 flex items-center justify-center bg-white/[0.04] text-ink-tertiary group-hover:text-ink transition-colors">
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      </span>
                      <span>Instant Play</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGame(game.key);
                      }}
                      className={cn(
                        "rounded-full font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-md transition-all duration-200 cursor-pointer group/btn",
                        game.buttonGradient
                      )}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play Now</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
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
