"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Pause, Play, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { sounds } from "../sound-manager";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [wrapWalls, setWrapWalls] = useState(false);

  const stateRef = useRef({
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ] as Point[],
    direction: "RIGHT" as Direction,
    nextDirection: "RIGHT" as Direction,
    food: { x: 15, y: 10 } as Point,
    isGameOver: false,
    isPaused: false,
    score: 0,
    speed: 110, // ms per tick
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_snake_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    let collision: boolean;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      collision = currentSnake.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
    } while (collision);
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    const s = stateRef.current;
    s.snake = initialSnake;
    s.direction = "RIGHT";
    s.nextDirection = "RIGHT";
    s.food = spawnFood(initialSnake);
    s.isGameOver = false;
    s.isPaused = false;
    s.score = 0;
    s.speed = 110;

    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  }, [spawnFood]);

  const changeDirection = useCallback((dir: Direction) => {
    const s = stateRef.current;
    const current = s.direction;
    if (
      (dir === "UP" && current !== "DOWN") ||
      (dir === "DOWN" && current !== "UP") ||
      (dir === "LEFT" && current !== "RIGHT") ||
      (dir === "RIGHT" && current !== "LEFT")
    ) {
      s.nextDirection = dir;
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          changeDirection("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          changeDirection("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          changeDirection("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          changeDirection("RIGHT");
          break;
        case " ":
          e.preventDefault();
          if (!isPlaying || isGameOver) resetGame();
          break;
        case "p":
        case "P":
        case "Escape":
          e.preventDefault();
          if (isPlaying && !isGameOver) {
            stateRef.current.isPaused = !stateRef.current.isPaused;
            setIsPaused(stateRef.current.isPaused);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection, isPlaying, isGameOver, resetGame]);

  // Main game tick interval
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      s.direction = s.nextDirection;

      const head = { ...s.snake[0] };
      switch (s.direction) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // Handle wall collisions
      if (wrapWalls) {
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;
      } else {
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          s.isGameOver = true;
          setIsGameOver(true);
          sounds.playGameOver();
          return;
        }
      }

      // Check self-collision
      for (const seg of s.snake) {
        if (seg.x === head.x && seg.y === head.y) {
          s.isGameOver = true;
          setIsGameOver(true);
          sounds.playGameOver();
          return;
        }
      }

      const newSnake = [head, ...s.snake];

      // Check food eaten
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score += 10;
        setScore(s.score);
        sounds.playScore();
        s.food = spawnFood(newSnake);

        // Increase speed slightly
        if (s.speed > 60) s.speed -= 2;

        if (s.score > highScore) {
          setHighScore(s.score);
          if (typeof window !== "undefined") {
            localStorage.setItem("devdash_snake_highscore", String(s.score));
          }
        }
      } else {
        newSnake.pop(); // Remove tail segment
      }

      s.snake = newSnake;
    }, stateRef.current.speed);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isGameOver, wrapWalls, spawnFood, highScore]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const s = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const cellSize = w / GRID_SIZE;

      // Dark board background
      ctx.fillStyle = "#0c0d0e";
      ctx.fillRect(0, 0, w, h);

      // Subtle grid lines
      ctx.strokeStyle = "#1a1c1e";
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(w, i * cellSize);
        ctx.stroke();
      }

      // Draw red apple food
      const fx = s.food.x * cellSize + cellSize / 2;
      const fy = s.food.y * cellSize + cellSize / 2;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(fx, fy, cellSize / 2.3, 0, Math.PI * 2);
      ctx.fill();

      // Stem on apple
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(fx - 1, fy - cellSize / 2 - 2, 2, 4);

      // Draw snake
      s.snake.forEach((seg, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? "#22c55e" : "#16a34a";

        const px = seg.x * cellSize + 1;
        const py = seg.y * cellSize + 1;
        const size = cellSize - 2;

        ctx.beginPath();
        ctx.roundRect(px, py, size, size, isHead ? 4 : 2);
        ctx.fill();

        // Eyes on snake head
        if (isHead) {
          ctx.fillStyle = "#000000";
          const eyeSize = 2.5;
          if (s.direction === "RIGHT") {
            ctx.fillRect(px + size - 5, py + 3, eyeSize, eyeSize);
            ctx.fillRect(px + size - 5, py + size - 5, eyeSize, eyeSize);
          } else if (s.direction === "LEFT") {
            ctx.fillRect(px + 3, py + 3, eyeSize, eyeSize);
            ctx.fillRect(px + 3, py + size - 5, eyeSize, eyeSize);
          } else if (s.direction === "UP") {
            ctx.fillRect(px + 3, py + 3, eyeSize, eyeSize);
            ctx.fillRect(px + size - 5, py + 3, eyeSize, eyeSize);
          } else {
            ctx.fillRect(px + 3, py + size - 5, eyeSize, eyeSize);
            ctx.fillRect(px + size - 5, py + size - 5, eyeSize, eyeSize);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 select-none">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink font-mono flex items-center gap-2">
            🐍 Retro Snake
          </h2>
          <button
            onClick={() => setWrapWalls((w) => !w)}
            className="text-xs text-ink-subtle hover:text-ink underline transition-colors"
          >
            Walls: {wrapWalls ? "Wrap-around (Passing)" : "Lethal (Classic)"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[65px]">
            <span className="block text-[10px] uppercase font-mono text-ink-subtle">Score</span>
            <span className="text-sm font-bold font-mono text-ink">{score}</span>
          </div>

          <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[65px]">
            <span className="text-[10px] uppercase font-mono text-ink-subtle flex items-center justify-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-amber-500" /> Best
            </span>
            <span className="text-sm font-bold font-mono text-ink">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full aspect-square max-w-[380px] bg-surface-2 p-2 rounded-2xl border border-hairline shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="w-full h-full rounded-xl block"
        />

        {/* Start / Game Over overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-2 bg-surface-1/90 rounded-xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-xs">
            <span className="text-xl font-bold text-ink font-mono">
              {isGameOver ? "Game Over!" : "Classic Snake"}
            </span>
            <p className="text-xs text-ink-subtle">
              {isGameOver ? `You scored ${score} points!` : "Use Arrow Keys or WASD to slither"}
            </p>
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isGameOver ? "Play Again" : "Start Game"}</span>
            </button>
          </div>
        )}

        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-2 bg-surface-1/90 rounded-xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-xs">
            <span className="text-xl font-bold text-ink font-mono">Game Paused</span>
            <button
              onClick={() => {
                stateRef.current.isPaused = false;
                setIsPaused(false);
              }}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {/* D-Pad for Mobile or Click Controls */}
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <button
          onClick={() => changeDirection("UP")}
          className="w-11 h-11 rounded-lg bg-surface-2 active:bg-surface-3 border border-hairline flex items-center justify-center text-ink hover:text-primary transition-colors"
          aria-label="Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changeDirection("LEFT")}
            className="w-11 h-11 rounded-lg bg-surface-2 active:bg-surface-3 border border-hairline flex items-center justify-center text-ink hover:text-primary transition-colors"
            aria-label="Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeDirection("DOWN")}
            className="w-11 h-11 rounded-lg bg-surface-2 active:bg-surface-3 border border-hairline flex items-center justify-center text-ink hover:text-primary transition-colors"
            aria-label="Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeDirection("RIGHT")}
            className="w-11 h-11 rounded-lg bg-surface-2 active:bg-surface-3 border border-hairline flex items-center justify-center text-ink hover:text-primary transition-colors"
            aria-label="Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
