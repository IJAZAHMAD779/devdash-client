"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RotateCcw, PenTool, Eraser, Undo2, Pause, Play, Trophy, CheckCircle2 } from "lucide-react";
import { generatePuzzle, Difficulty, SudokuGrid } from "./sudoku-generator";
import { sounds } from "../sound-manager";

export function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [initialGrid, setInitialGrid] = useState<SudokuGrid>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [currentGrid, setCurrentGrid] = useState<SudokuGrid>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [solvedGrid, setSolvedGrid] = useState<SudokuGrid>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [notes, setNotes] = useState<Record<string, number[]>>({});

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [history, setHistory] = useState<{ grid: SudokuGrid; notes: Record<string, number[]> }[]>([]);
  const [isWon, setIsWon] = useState(false);

  // Initialize or restart puzzle
  const startNewGame = useCallback((diff: Difficulty = difficulty) => {
    const { initialGrid: init, solvedGrid: solved } = generatePuzzle(diff);
    setInitialGrid(init);
    setCurrentGrid(init.map((row) => [...row]));
    setSolvedGrid(solved);
    setNotes({});
    setSelectedCell([4, 4]);
    setTimerSeconds(0);
    setIsPaused(false);
    setMistakes(0);
    setHistory([]);
    setIsWon(false);
    setDifficulty(diff);
  }, [difficulty]);

  useEffect(() => {
    startNewGame("easy");
  }, [startNewGame]);

  // Timer interval
  useEffect(() => {
    if (isPaused || isWon) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isWon]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [timerSeconds]);

  // Check conflicts
  const conflicts = useMemo(() => {
    const conflictSet = new Set<string>();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentGrid[r][c];
        if (val === 0) continue;

        // Check row
        for (let oc = 0; oc < 9; oc++) {
          if (oc !== c && currentGrid[r][oc] === val) {
            conflictSet.add(`${r}-${c}`);
            conflictSet.add(`${r}-${oc}`);
          }
        }

        // Check col
        for (let or = 0; or < 9; or++) {
          if (or !== r && currentGrid[or][c] === val) {
            conflictSet.add(`${r}-${c}`);
            conflictSet.add(`${or}-${c}`);
          }
        }

        // Check 3x3 block
        const startR = Math.floor(r / 3) * 3;
        const startC = Math.floor(c / 3) * 3;
        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const tr = startR + br;
            const tc = startC + bc;
            if ((tr !== r || tc !== c) && currentGrid[tr][tc] === val) {
              conflictSet.add(`${r}-${c}`);
              conflictSet.add(`${tr}-${tc}`);
            }
          }
        }
      }
    }

    return conflictSet;
  }, [currentGrid]);

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell([r, c]);
    sounds.playClick();
  };

  const handleInputNumber = useCallback(
    (num: number) => {
      if (!selectedCell || isPaused || isWon) return;
      const [r, c] = selectedCell;

      // Cannot modify initial given numbers
      if (initialGrid[r][c] !== 0) return;

      const cellKey = `${r}-${c}`;

      if (isNotesMode) {
        // Toggle note
        const currentNotes = notes[cellKey] || [];
        const newNotes = currentNotes.includes(num)
          ? currentNotes.filter((n) => n !== num)
          : [...currentNotes, num].sort();

        setNotes((prev) => ({ ...prev, [cellKey]: newNotes }));
        sounds.playClick();
        return;
      }

      // Normal value entry
      setHistory((prev) => [...prev, { grid: currentGrid.map((row) => [...row]), notes: { ...notes } }]);

      const newGrid = currentGrid.map((row) => [...row]);
      newGrid[r][c] = num;
      setCurrentGrid(newGrid);

      // Clear notes for this cell
      if (notes[cellKey]) {
        const nextNotes = { ...notes };
        delete nextNotes[cellKey];
        setNotes(nextNotes);
      }

      // Check mistake vs solved
      if (num !== solvedGrid[r][c]) {
        setMistakes((m) => m + 1);
      }

      sounds.playClick();

      // Check complete win
      let isComplete = true;
      for (let cr = 0; cr < 9; cr++) {
        for (let cc = 0; cc < 9; cc++) {
          if (newGrid[cr][cc] === 0 || newGrid[cr][cc] !== solvedGrid[cr][cc]) {
            isComplete = false;
            break;
          }
        }
        if (!isComplete) break;
      }

      if (isComplete) {
        setIsWon(true);
        sounds.playScore();
      }
    },
    [selectedCell, isPaused, isWon, initialGrid, isNotesMode, notes, currentGrid, solvedGrid]
  );

  const handleErase = useCallback(() => {
    if (!selectedCell || isPaused || isWon) return;
    const [r, c] = selectedCell;
    if (initialGrid[r][c] !== 0) return;

    const cellKey = `${r}-${c}`;
    setHistory((prev) => [...prev, { grid: currentGrid.map((row) => [...row]), notes: { ...notes } }]);

    const newGrid = currentGrid.map((row) => [...row]);
    newGrid[r][c] = 0;
    setCurrentGrid(newGrid);

    if (notes[cellKey]) {
      const nextNotes = { ...notes };
      delete nextNotes[cellKey];
      setNotes(nextNotes);
    }
    sounds.playClick();
  }, [selectedCell, isPaused, isWon, initialGrid, currentGrid, notes]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isPaused || isWon) return;
    const last = history[history.length - 1];
    setCurrentGrid(last.grid);
    setNotes(last.notes);
    setHistory((prev) => prev.slice(0, -1));
    sounds.playClick();
  }, [history, isPaused, isWon]);

  // Keyboard navigation & inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isWon) return;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        handleInputNumber(parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        handleErase();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setIsNotesMode((m) => !m);
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        handleUndo();
      } else if (selectedCell) {
        const [r, c] = selectedCell;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedCell([Math.max(0, r - 1), c]);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedCell([Math.min(8, r + 1), c]);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setSelectedCell([r, Math.max(0, c - 1)]);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setSelectedCell([r, Math.min(8, c + 1)]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInputNumber, handleErase, handleUndo, selectedCell, isPaused, isWon]);

  const activeValue = selectedCell ? currentGrid[selectedCell[0]][selectedCell[1]] : 0;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-4 select-none">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-lg border border-hairline">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => startNewGame(d)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                difficulty === d ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-ink-subtle">
            Mistakes: <span className="text-ink font-semibold">{mistakes}</span>
          </div>

          <div className="flex items-center gap-1 bg-surface-2 px-2.5 py-1 rounded-md border border-hairline text-xs font-mono text-ink">
            <span>{formattedTime}</span>
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="ml-1 text-ink-subtle hover:text-ink transition-colors"
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* 9x9 Sudoku Grid */}
      <div className="relative p-2.5 sm:p-3 bg-surface-2 rounded-2xl border border-hairline shadow-2xl">
        <div className="grid grid-cols-9 grid-rows-9 gap-[1px] bg-hairline rounded-lg overflow-hidden border border-hairline">
          {currentGrid.map((row, r) =>
            row.map((val, c) => {
              const isInitial = initialGrid[r][c] !== 0;
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const hasConflict = conflicts.has(`${r}-${c}`);
              const isMatchingValue = activeValue > 0 && val === activeValue;
              const cellNotes = notes[`${r}-${c}`] || [];

              // 3x3 block borders
              const borderRight = c === 2 || c === 5 ? "border-r-2 border-r-slate-500/50" : "";
              const borderBottom = r === 2 || r === 5 ? "border-b-2 border-b-slate-500/50" : "";

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-sm sm:text-base font-mono font-medium transition-colors cursor-pointer ${borderRight} ${borderBottom} ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : hasConflict
                      ? "bg-red-500/20 text-red-400 font-bold"
                      : isMatchingValue
                      ? "bg-primary/20 text-ink font-semibold"
                      : isInitial
                      ? "bg-surface-1 text-ink font-bold"
                      : "bg-surface-1 text-primary-hover hover:bg-surface-3"
                  }`}
                >
                  {val > 0 ? (
                    val
                  ) : cellNotes.length > 0 ? (
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 text-[8px] sm:text-[9px] leading-none text-ink-subtle">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n} className="flex items-center justify-center">
                          {cellNotes.includes(n) ? n : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-surface-1/95 rounded-2xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-xs">
            <span className="text-lg font-bold text-ink font-mono">Game Paused</span>
            <button
              onClick={() => setIsPaused(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {isWon && (
          <div className="absolute inset-0 bg-surface-1/95 rounded-2xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-xs animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <span className="text-xl font-bold text-ink font-mono">Puzzle Solved!</span>
            <p className="text-xs text-ink-subtle">Completed in {formattedTime} with {mistakes} mistakes</p>
            <button
              onClick={() => startNewGame(difficulty)}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Control Tools */}
      <div className="w-full flex items-center justify-between px-1">
        <button
          onClick={handleUndo}
          className="flex-1 flex flex-col items-center py-2 text-ink-subtle hover:text-ink transition-colors text-xs gap-1"
        >
          <Undo2 className="w-4 h-4" />
          <span>Undo</span>
        </button>

        <button
          onClick={handleErase}
          className="flex-1 flex flex-col items-center py-2 text-ink-subtle hover:text-ink transition-colors text-xs gap-1"
        >
          <Eraser className="w-4 h-4" />
          <span>Erase</span>
        </button>

        <button
          onClick={() => setIsNotesMode((m) => !m)}
          className={`flex-1 flex flex-col items-center py-2 transition-colors text-xs gap-1 ${
            isNotesMode ? "text-primary font-semibold" : "text-ink-subtle hover:text-ink"
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Notes {isNotesMode ? "(On)" : "(Off)"}</span>
        </button>

        <button
          onClick={() => startNewGame(difficulty)}
          className="flex-1 flex flex-col items-center py-2 text-ink-subtle hover:text-ink transition-colors text-xs gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart</span>
        </button>
      </div>

      {/* Number Pad 1-9 */}
      <div className="w-full grid grid-cols-9 gap-1.5 pt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleInputNumber(num)}
            className="h-11 rounded-lg bg-surface-2 hover:bg-surface-3 active:scale-95 border border-hairline text-ink font-bold font-mono text-base flex items-center justify-center transition-all"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
