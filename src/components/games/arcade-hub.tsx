"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, VolumeX, Gamepad2 } from "lucide-react";
import { sounds } from "./sound-manager";
import { DinoGame } from "./dino/dino-game";
import { Game2048 } from "./game-2048/game-2048";
import { SudokuGame } from "./sudoku/sudoku-game";
import { SnakeGame } from "./snake/snake-game";
import { TicTacToeGame } from "./tic-tac-toe/tic-tac-toe-game";
import { BalloonPopperGame } from "./balloon-popper/balloon-popper-game";
import { CoinDiceGame } from "./coin-dice/coin-dice-game";

export type GameKey = "dino" | "2048" | "sudoku" | "snake" | "tictactoe" | "balloon" | "coindice";

interface GameTab {
  key: GameKey;
  name: string;
  emoji: string;
}

const GAME_TABS: GameTab[] = [
  { key: "dino", name: "Chrome Dino", emoji: "🦖" },
  { key: "2048", name: "2048", emoji: "🔢" },
  { key: "sudoku", name: "Sudoku", emoji: "🧩" },
  { key: "snake", name: "Snake", emoji: "🐍" },
  { key: "tictactoe", name: "Tic-Tac-Toe", emoji: "❌" },
  { key: "balloon", name: "Balloon Pop", emoji: "🎈" },
  { key: "coindice", name: "Coin & Dice", emoji: "🎲" },
];

export function ArcadeHub() {
  const [activeGame, setActiveGame] = useState<GameKey>("dino");
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setIsMuted(sounds.getMuted());
  }, []);

  const toggleMute = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col overflow-y-auto">
      {/* Top Horizon Header */}
      <div className="border-b border-hairline bg-surface-1/40 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-ink">
                  Games & Relaxation
                </h1>
              </div>
              <p className="text-xs text-ink-subtle hidden sm:block">
                Take a quick mental reset with lightweight, classic browser games
              </p>
            </div>
          </div>

          {/* Sound & Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors"
              title={isMuted ? "Unmute 8-bit Sound Effects" : "Mute Sound Effects"}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-ink-subtle" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary">Sound On</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar (Sliding Pill) */}
      <div className="border-b border-hairline bg-surface-1/20 px-4 sm:px-6 lg:px-8 py-2.5 overflow-x-auto no-scrollbar">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5">
          {GAME_TABS.map((tab) => {
            const isActive = activeGame === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveGame(tab.key);
                  sounds.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-surface-3 text-ink border border-hairline shadow-xs font-semibold"
                    : "text-ink-subtle hover:text-ink hover:bg-surface-2/60"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Game Stage */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-center items-center">
        {activeGame === "dino" && <DinoGame />}
        {activeGame === "2048" && <Game2048 />}
        {activeGame === "sudoku" && <SudokuGame />}
        {activeGame === "snake" && <SnakeGame />}
        {activeGame === "tictactoe" && <TicTacToeGame />}
        {activeGame === "balloon" && <BalloonPopperGame />}
        {activeGame === "coindice" && <CoinDiceGame />}
      </main>
    </div>
  );
}
