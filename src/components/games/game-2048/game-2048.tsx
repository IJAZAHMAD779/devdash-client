"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Undo2, Trophy } from "lucide-react";
import { sounds } from "../sound-manager";

type Board = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string; shadow?: string }> = {
  2: { bg: "bg-[#1e293b]", text: "text-[#f8fafc]" },
  4: { bg: "bg-[#334155]", text: "text-[#f8fafc]" },
  8: { bg: "bg-[#ea580c]", text: "text-white", shadow: "shadow-[0_0_12px_rgba(234,88,12,0.3)]" },
  16: { bg: "bg-[#f97316]", text: "text-white", shadow: "shadow-[0_0_14px_rgba(249,115,22,0.35)]" },
  32: { bg: "bg-[#ef4444]", text: "text-white", shadow: "shadow-[0_0_16px_rgba(239,68,68,0.4)]" },
  64: { bg: "bg-[#dc2626]", text: "text-white", shadow: "shadow-[0_0_18px_rgba(220,38,38,0.45)]" },
  128: { bg: "bg-[#eab308]", text: "text-white", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.5)]" },
  256: { bg: "bg-[#facc15]", text: "text-slate-900", shadow: "shadow-[0_0_22px_rgba(250,204,21,0.55)]" },
  512: { bg: "bg-[#10b981]", text: "text-white", shadow: "shadow-[0_0_24px_rgba(16,185,129,0.6)]" },
  1024: { bg: "bg-[#06b6d4]", text: "text-white", shadow: "shadow-[0_0_26px_rgba(6,182,212,0.65)]" },
  2048: { bg: "bg-[#2563eb]", text: "text-white", shadow: "shadow-[0_0_30px_rgba(37,99,235,0.8)]" },
};

export function Game2048() {
  const [board, setBoard] = useState<Board>(() => getEmptyBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [previousState, setPreviousState] = useState<{ board: Board; score: number } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Touch tracking for mobile swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function getEmptyBoard(): Board {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  }

  // Load high score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_2048_highscore");
      if (saved) setBestScore(parseInt(saved, 10));
    }
  }, []);

  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const startNewGame = useCallback(() => {
    let newBoard = getEmptyBoard();
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setPreviousState(null);
    setIsGameOver(false);
    setHasWon(false);
  }, []);

  // Initialize board on mount
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const checkGameOver = (b: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
      }
    }
    return true;
  };

  const slideRow = (row: number[]): { newRow: number[]; gainedScore: number } => {
    const filtered = row.filter((n) => n !== 0);
    const newRow: number[] = [];
    let gainedScore = 0;

    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        newRow.push(mergedVal);
        gainedScore += mergedVal;
        i++;
      } else {
        newRow.push(filtered[i]);
      }
    }

    while (newRow.length < 4) {
      newRow.push(0);
    }

    return { newRow, gainedScore };
  };

  const move = useCallback(
    (direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
      if (isGameOver) return;

      let moved = false;
      let totalGained = 0;
      const newBoard = getEmptyBoard();

      if (direction === "LEFT" || direction === "RIGHT") {
        for (let r = 0; r < 4; r++) {
          const row = [...board[r]];
          if (direction === "RIGHT") row.reverse();

          const { newRow, gainedScore } = slideRow(row);
          if (direction === "RIGHT") newRow.reverse();

          for (let c = 0; c < 4; c++) {
            if (board[r][c] !== newRow[c]) moved = true;
            newBoard[r][c] = newRow[c];
          }
          totalGained += gainedScore;
        }
      } else {
        // UP or DOWN
        for (let c = 0; c < 4; c++) {
          const col: number[] = [];
          for (let r = 0; r < 4; r++) {
            col.push(board[r][c]);
          }
          if (direction === "DOWN") col.reverse();

          const { newRow, gainedScore } = slideRow(col);
          if (direction === "DOWN") newRow.reverse();

          for (let r = 0; r < 4; r++) {
            if (board[r][c] !== newRow[r]) moved = true;
            newBoard[r][c] = newRow[r];
          }
          totalGained += gainedScore;
        }
      }

      if (moved) {
        setPreviousState({ board, score });
        sounds.playClick();
        if (totalGained >= 16) sounds.playScore();

        const boardWithNew = addRandomTile(newBoard);
        setBoard(boardWithNew);

        const newScore = score + totalGained;
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          if (typeof window !== "undefined") {
            localStorage.setItem("devdash_2048_highscore", String(newScore));
          }
        }

        // Check 2048 win
        if (!hasWon) {
          for (const row of boardWithNew) {
            if (row.includes(2048)) {
              setHasWon(true);
              sounds.playScore();
              break;
            }
          }
        }

        if (checkGameOver(boardWithNew)) {
          setIsGameOver(true);
          sounds.playGameOver();
        }
      }
    },
    [board, score, bestScore, isGameOver, hasWon]
  );

  const undoMove = () => {
    if (!previousState) return;
    setBoard(previousState.board);
    setScore(previousState.score);
    setPreviousState(null);
    setIsGameOver(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          move("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          move("RIGHT");
          break;
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          move("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          move("DOWN");
          break;
        case "u":
        case "U":
          e.preventDefault();
          undoMove();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      if (dx > 0) move("RIGHT");
      else move("LEFT");
    } else if (Math.abs(dy) > 30) {
      if (dy > 0) move("DOWN");
      else move("UP");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 select-none">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink font-mono">2048</h2>
          <p className="text-xs text-ink-subtle">Join numbers to reach 2048</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Score card */}
          <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[70px]">
            <span className="block text-[10px] uppercase font-mono text-ink-subtle">Score</span>
            <span className="text-sm font-bold font-mono text-ink">{score}</span>
          </div>

          {/* Best card */}
          <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[70px]">
            <span className="text-[10px] uppercase font-mono text-ink-subtle flex items-center justify-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-amber-500" /> Best
            </span>
            <span className="text-sm font-bold font-mono text-ink">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="w-full flex items-center justify-between text-xs">
        <div className="text-ink-subtle">
          Use <kbd className="font-mono bg-surface-2 px-1 py-0.5 rounded border border-hairline text-ink">Arrow Keys</kbd> or swipe
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undoMove}
            disabled={!previousState}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed border border-hairline text-ink text-xs font-medium transition-colors"
            title="Undo move (U)"
          >
            <Undo2 className="w-3.5 h-3.5 text-ink-subtle" />
            <span>Undo</span>
          </button>

          <button
            onClick={startNewGame}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm shadow-primary/25"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </div>

      {/* Board 4x4 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-square max-w-[380px] bg-surface-2 p-3 rounded-2xl border border-hairline shadow-2xl grid grid-cols-4 grid-rows-4 gap-2.5"
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const style = val > 0 ? TILE_COLORS[val] || { bg: "bg-primary", text: "text-white" } : null;
            return (
              <div
                key={`${r}-${c}`}
                className={`rounded-xl flex items-center justify-center transition-all duration-100 font-bold font-mono ${
                  val === 0
                    ? "bg-surface-1/60 border border-hairline/40"
                    : `${style?.bg} ${style?.text} ${style?.shadow || ""} scale-100 shadow-md`
                } ${val >= 1024 ? "text-lg sm:text-xl" : val >= 128 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}
              >
                {val > 0 ? val : ""}
              </div>
            );
          })
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-surface-1/90 rounded-2xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-xs animate-in fade-in duration-200">
            <span className="text-xl font-bold text-ink font-mono">Game Over!</span>
            <p className="text-xs text-ink-subtle">No more legal moves available</p>
            <button
              onClick={startNewGame}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* 2048 Win Banner */}
        {hasWon && !isGameOver && (
          <div className="absolute top-4 left-4 right-4 bg-primary/95 text-white px-3 py-2 rounded-lg text-center shadow-lg text-xs font-semibold z-10 flex items-center justify-between">
            <span>🎉 You achieved 2048! Keep going for higher records!</span>
            <button onClick={() => setHasWon(false)} className="underline ml-2 text-[11px]">
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
