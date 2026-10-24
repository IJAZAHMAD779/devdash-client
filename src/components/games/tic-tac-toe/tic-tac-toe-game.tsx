"use client";

import React, { useState, useCallback, useMemo } from "react";
import { RotateCcw, User, Bot, Users } from "lucide-react";
import { sounds } from "../sound-manager";

type Player = "X" | "O";
type Board = (Player | null)[];
type GameMode = "ai_smart" | "ai_casual" | "pvp";

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");
  const [mode, setMode] = useState<GameMode>("ai_smart");
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });

  const checkWinner = (b: Board): { winner: Player | "tie" | null; line: number[] | null } => {
    for (const combo of WINNING_COMBOS) {
      const [a, bIndex, c] = combo;
      if (b[a] && b[a] === b[bIndex] && b[a] === b[c]) {
        return { winner: b[a], line: combo };
      }
    }
    if (b.every((cell) => cell !== null)) {
      return { winner: "tie", line: null };
    }
    return { winner: null, line: null };
  };

  const gameResult = useMemo(() => checkWinner(board), [board]);

  // Minimax Algorithm for unbeatable AI
  const minimax = (b: Board, depth: number, isMaximizing: boolean): number => {
    const res = checkWinner(b);
    if (res.winner === "O") return 10 - depth;
    if (res.winner === "X") return depth - 10;
    if (res.winner === "tie") return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = "O";
          const score = minimax(b, depth + 1, false);
          b[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = "X";
          const score = minimax(b, depth + 1, true);
          b[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getAiMove = (currentBoard: Board, isSmart: boolean): number => {
    const emptyIndices: number[] = [];
    currentBoard.forEach((val, idx) => {
      if (!val) emptyIndices.push(idx);
    });

    if (emptyIndices.length === 0) return -1;

    // In casual mode, 35% chance to make random move
    if (!isSmart && Math.random() < 0.35) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    let bestScore = -Infinity;
    let move = emptyIndices[0];

    for (const idx of emptyIndices) {
      currentBoard[idx] = "O";
      const score = minimax(currentBoard, 0, false);
      currentBoard[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        move = idx;
      }
    }

    return move;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || gameResult.winner) return;

    sounds.playClick();

    const newBoard = [...board];
    newBoard[index] = turn;

    const afterMoveRes = checkWinner(newBoard);

    if (afterMoveRes.winner) {
      setBoard(newBoard);
      updateScore(afterMoveRes.winner);
      return;
    }

    if (mode === "pvp") {
      setBoard(newBoard);
      setTurn(turn === "X" ? "O" : "X");
    } else {
      // AI turn
      setBoard(newBoard);
      setTurn("O");

      setTimeout(() => {
        const aiIndex = getAiMove(newBoard, mode === "ai_smart");
        if (aiIndex !== -1) {
          newBoard[aiIndex] = "O";
          sounds.playClick();
          const aiRes = checkWinner(newBoard);
          setBoard([...newBoard]);
          setTurn("X");

          if (aiRes.winner) {
            updateScore(aiRes.winner);
          }
        }
      }, 300);
    }
  };

  const updateScore = (winner: Player | "tie") => {
    if (winner === "X") {
      sounds.playScore();
      setScores((s) => ({ ...s, x: s.x + 1 }));
    } else if (winner === "O") {
      sounds.playGameOver();
      setScores((s) => ({ ...s, o: s.o + 1 }));
    } else {
      sounds.playClick();
      setScores((s) => ({ ...s, ties: s.ties + 1 }));
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-4 select-none">
      {/* Header Mode Picker */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-hairline">
          <button
            onClick={() => {
              setMode("ai_smart");
              resetGame();
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === "ai_smart" ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Smart AI</span>
          </button>

          <button
            onClick={() => {
              setMode("ai_casual");
              resetGame();
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === "ai_casual" ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Casual</span>
          </button>

          <button
            onClick={() => {
              setMode("pvp");
              resetGame();
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === "pvp" ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2-Player</span>
          </button>
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink transition-colors"
          title="Reset board"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scoreboard */}
      <div className="w-full grid grid-cols-3 gap-2">
        <div className="bg-surface-2 border border-hairline p-2 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono text-ink-subtle block">
            {mode === "pvp" ? "Player X" : "You (X)"}
          </span>
          <span className="text-base font-bold font-mono text-primary">{scores.x}</span>
        </div>

        <div className="bg-surface-2 border border-hairline p-2 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono text-ink-subtle block">Ties</span>
          <span className="text-base font-bold font-mono text-ink">{scores.ties}</span>
        </div>

        <div className="bg-surface-2 border border-hairline p-2 rounded-xl text-center">
          <span className="text-[10px] uppercase font-mono text-ink-subtle block">
            {mode === "pvp" ? "Player O" : "Computer (O)"}
          </span>
          <span className="text-base font-bold font-mono text-emerald-400">{scores.o}</span>
        </div>
      </div>

      {/* 3x3 Game Board */}
      <div className="relative w-full aspect-square max-w-[320px] bg-surface-2 p-3 rounded-2xl border border-hairline shadow-2xl">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full">
          {board.map((cell, index) => {
            const isWinningCell = gameResult.line?.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || !!gameResult.winner}
                className={`rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-bold font-mono transition-all duration-150 ${
                  cell === "X"
                    ? "text-primary"
                    : cell === "O"
                    ? "text-emerald-400"
                    : "text-transparent hover:bg-surface-3"
                } ${
                  isWinningCell
                    ? "bg-primary/20 border-2 border-primary scale-102"
                    : "bg-surface-1 border border-hairline"
                }`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Game End Banner Overlay */}
        {gameResult.winner && (
          <div className="absolute inset-0 bg-surface-1/90 rounded-2xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-xs animate-in fade-in duration-150">
            <span className="text-2xl font-bold font-mono text-ink">
              {gameResult.winner === "tie"
                ? "It's a Draw!"
                : `${gameResult.winner === "X" ? "Player X" : "Player O"} Wins!`}
            </span>
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Turn indicator */}
      {!gameResult.winner && (
        <div className="text-xs font-mono text-ink-subtle flex items-center gap-1.5">
          <span>Turn:</span>
          <span className={turn === "X" ? "text-primary font-bold" : "text-emerald-400 font-bold"}>
            {turn}
          </span>
        </div>
      )}
    </div>
  );
}
