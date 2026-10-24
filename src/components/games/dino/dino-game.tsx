"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw, Volume2, VolumeX, Pause } from "lucide-react";
import { sounds } from "../sound-manager";

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "cactus_small" | "cactus_large" | "bird";
  frame?: number;
}

export function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);

  // Mutable game state ref for 60fps requestAnimationFrame loop
  const stateRef = useRef({
    dinoY: 0,
    dinoVy: 0,
    isJumping: false,
    isDucking: false,
    groundY: 160,
    speed: 6,
    obstacles: [] as Obstacle[],
    spawnTimer: 0,
    score: 0,
    distance: 0,
    animationFrameId: 0,
    lastTime: 0,
    isGameOver: false,
    isPaused: false,
    stepCount: 0,
  });

  // Load high score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_dino_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    if (!s.isJumping) {
      s.isJumping = true;
      s.dinoVy = -11.5;
      sounds.playJump();
    }
  }, []);

  const duck = useCallback((ducking: boolean) => {
    stateRef.current.isDucking = ducking;
    if (ducking && stateRef.current.isJumping) {
      // Fast drop
      stateRef.current.dinoVy += 5;
    }
  }, []);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.dinoY = 0;
    s.dinoVy = 0;
    s.isJumping = false;
    s.isDucking = false;
    s.speed = 6.5;
    s.obstacles = [];
    s.spawnTimer = 60;
    s.score = 0;
    s.distance = 0;
    s.isGameOver = false;
    s.isPaused = false;
    s.stepCount = 0;

    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setIsNightMode(false);
  }, []);

  const togglePause = useCallback(() => {
    if (stateRef.current.isGameOver) return;
    stateRef.current.isPaused = !stateRef.current.isPaused;
    setIsPaused(stateRef.current.isPaused);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!isPlaying || isGameOver) {
          resetGame();
        } else {
          jump();
        }
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        duck(true);
      } else if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        togglePause();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") {
        duck(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, isGameOver, jump, duck, resetGame, togglePause]);

  // Main canvas rendering & physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const drawDino = (x: number, y: number, isDucking: boolean, step: number, night: boolean) => {
      ctx.fillStyle = night ? "#e2e8f0" : "#22252a";

      if (isDucking) {
        // Ducking T-Rex (longer, lower height)
        const w = 55;
        const h = 26;
        const px = x;
        const py = y + 16;
        ctx.fillRect(px, py + 8, 38, 14); // body
        ctx.fillRect(px + 28, py, 26, 12); // elongated head
        ctx.fillRect(px + 48, py + 2, 4, 3); // eye
        ctx.fillRect(px + 8, py + 22, 6, 4); // tail
        // running feet
        if (step % 2 === 0) {
          ctx.fillRect(px + 14, py + 22, 8, 4);
        } else {
          ctx.fillRect(px + 26, py + 22, 8, 4);
        }
      } else {
        // Standing / Running T-Rex
        // Body
        ctx.fillRect(x + 12, y + 14, 22, 22);
        // Head
        ctx.fillRect(x + 22, y, 22, 16);
        // Eye (negative space)
        ctx.fillStyle = night ? "#010102" : "#ffffff";
        ctx.fillRect(x + 36, y + 3, 3, 3);
        ctx.fillStyle = night ? "#e2e8f0" : "#22252a";
        // Snout
        ctx.fillRect(x + 40, y + 8, 5, 8);
        // Arms
        ctx.fillRect(x + 34, y + 20, 6, 3);
        // Tail
        ctx.fillRect(x, y + 18, 12, 10);
        ctx.fillRect(x + 4, y + 24, 8, 6);

        // Legs (animated alternate stride when running)
        if (stateRef.current.isJumping) {
          ctx.fillRect(x + 16, y + 36, 4, 6);
          ctx.fillRect(x + 24, y + 36, 4, 4);
        } else {
          if (step % 2 === 0) {
            ctx.fillRect(x + 16, y + 36, 4, 8);
            ctx.fillRect(x + 16, y + 42, 6, 2);
            ctx.fillRect(x + 26, y + 36, 4, 4);
          } else {
            ctx.fillRect(x + 16, y + 36, 4, 4);
            ctx.fillRect(x + 26, y + 36, 4, 8);
            ctx.fillRect(x + 26, y + 42, 6, 2);
          }
        }
      }
    };

    const drawCactus = (obs: Obstacle, night: boolean) => {
      ctx.fillStyle = night ? "#a3e635" : "#16a34a"; // classic or dark desert green
      if (obs.type === "cactus_small") {
        // Main stem
        ctx.fillRect(obs.x + 6, obs.y, 8, obs.height);
        // Left arm
        ctx.fillRect(obs.x, obs.y + 8, 6, 4);
        ctx.fillRect(obs.x, obs.y + 4, 4, 8);
        // Right arm
        ctx.fillRect(obs.x + 14, obs.y + 12, 6, 4);
        ctx.fillRect(obs.x + 16, obs.y + 6, 4, 10);
      } else {
        // Large cactus cluster
        ctx.fillRect(obs.x + 10, obs.y, 10, obs.height);
        ctx.fillRect(obs.x, obs.y + 12, 10, 6);
        ctx.fillRect(obs.x, obs.y + 6, 6, 12);
        ctx.fillRect(obs.x + 20, obs.y + 16, 10, 6);
        ctx.fillRect(obs.x + 24, obs.y + 8, 6, 14);
      }
    };

    const drawBird = (obs: Obstacle, night: boolean) => {
      ctx.fillStyle = night ? "#38bdf8" : "#0284c7";
      const frame = Math.floor(stateRef.current.distance / 12) % 2;
      // Body & beak
      ctx.fillRect(obs.x + 6, obs.y + 6, 18, 8);
      ctx.fillRect(obs.x, obs.y + 8, 6, 4);
      // Eye
      ctx.fillStyle = night ? "#010102" : "#ffffff";
      ctx.fillRect(obs.x + 4, obs.y + 7, 2, 2);
      ctx.fillStyle = night ? "#38bdf8" : "#0284c7";

      if (frame === 0) {
        // Wings up
        ctx.fillRect(obs.x + 12, obs.y - 4, 6, 10);
      } else {
        // Wings down
        ctx.fillRect(obs.x + 12, obs.y + 12, 6, 10);
      }
    };

    const loop = () => {
      if (!running) return;

      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const night = Math.floor(s.score / 500) % 2 === 1;

      // Clear & Background
      ctx.fillStyle = night ? "#08090a" : "#f1f5f9";
      ctx.fillRect(0, 0, width, height);

      // Ground horizon line
      ctx.strokeStyle = night ? "#27272a" : "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY + 44);
      ctx.lineTo(width, s.groundY + 44);
      ctx.stroke();

      // Little bumps on the ground moving left
      ctx.fillStyle = night ? "#3f3f46" : "#94a3b8";
      const groundOffset = Math.floor(s.distance * 1.5) % 60;
      for (let gx = -groundOffset; gx < width; gx += 60) {
        ctx.fillRect(gx + 10, s.groundY + 47, 12, 2);
        ctx.fillRect(gx + 35, s.groundY + 49, 6, 2);
      }

      if (isPlaying && !s.isPaused && !s.isGameOver) {
        s.distance += s.speed;
        s.score = Math.floor(s.distance / 10);
        setScore(s.score);

        // Speed increases gradually
        s.speed = 6.5 + Math.min(s.score / 250, 7);

        // Score 100 chime
        if (s.score > 0 && s.score % 100 === 0 && Math.floor(s.distance) % 10 < 7) {
          sounds.playScore();
        }

        // Dino Physics
        s.dinoY += s.dinoVy;
        s.dinoVy += 0.65; // gravity

        if (s.dinoY >= 0) {
          s.dinoY = 0;
          s.dinoVy = 0;
          s.isJumping = false;
        }

        s.stepCount = Math.floor(s.distance / 8);

        // Obstacle Spawning
        s.spawnTimer -= 1;
        if (s.spawnTimer <= 0) {
          const rand = Math.random();
          if (s.score > 350 && rand < 0.35) {
            // Bird (low or high flight altitude)
            const birdAltitude = Math.random() > 0.5 ? s.groundY - 14 : s.groundY + 12;
            s.obstacles.push({
              x: width + 20,
              y: birdAltitude,
              width: 32,
              height: 20,
              type: "bird",
            });
          } else {
            // Cactus
            const isLarge = Math.random() > 0.55;
            s.obstacles.push({
              x: width + 20,
              y: isLarge ? s.groundY + 4 : s.groundY + 14,
              width: isLarge ? 30 : 20,
              height: isLarge ? 40 : 30,
              type: isLarge ? "cactus_large" : "cactus_small",
            });
          }
          // Random spacing between obstacles
          s.spawnTimer = Math.floor(50 + Math.random() * 55 - Math.min(s.score / 100, 20));
        }

        // Update obstacles & check collision
        const dinoHitbox = s.isDucking
          ? { x: 50, y: s.groundY + s.dinoY + 18, w: 48, h: 24 }
          : { x: 50, y: s.groundY + s.dinoY + 4, w: 34, h: 38 };

        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // AABB Collision detection
          if (
            dinoHitbox.x < obs.x + obs.width - 4 &&
            dinoHitbox.x + dinoHitbox.w > obs.x + 4 &&
            dinoHitbox.y < obs.y + obs.height - 4 &&
            dinoHitbox.y + dinoHitbox.h > obs.y + 4
          ) {
            // Collision!
            s.isGameOver = true;
            setIsGameOver(true);
            sounds.playGameOver();

            if (s.score > highScore) {
              setHighScore(s.score);
              if (typeof window !== "undefined") {
                localStorage.setItem("devdash_dino_highscore", String(s.score));
              }
            }
            break;
          }

          // Despawn off-screen obstacles
          if (obs.x < -60) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // Draw obstacles
      for (const obs of s.obstacles) {
        if (obs.type === "bird") {
          drawBird(obs, night);
        } else {
          drawCactus(obs, night);
        }
      }

      // Draw Dino
      drawDino(50, s.groundY + s.dinoY, s.isDucking, s.stepCount, night);

      // Score HUD
      ctx.font = "bold 13px monospace";
      ctx.fillStyle = night ? "#94a3b8" : "#475569";
      ctx.textAlign = "right";
      const scoreStr = `HI ${String(highScore).padStart(5, "0")}  ${String(s.score).padStart(5, "0")}`;
      ctx.fillText(scoreStr, width - 20, 26);

      // Paused Overlay
      if (s.isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED — Press [P] or [Esc] to Resume", width / 2, height / 2);
      }

      // Game Over Overlay
      if (s.isGameOver) {
        ctx.fillStyle = night ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.75)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = night ? "#f8fafc" : "#0f172a";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText("G A M E   O V E R", width / 2, height / 2 - 12);

        ctx.font = "12px sans-serif";
        ctx.fillStyle = night ? "#94a3b8" : "#64748b";
        ctx.fillText("Press Space or Click to Restart", width / 2, height / 2 + 16);
      }

      // Start screen overlay
      if (!isPlaying) {
        ctx.fillStyle = night ? "#f8fafc" : "#0f172a";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Press Space or Click to Start", width / 2, height / 2);

        ctx.font = "12px sans-serif";
        ctx.fillStyle = night ? "#94a3b8" : "#64748b";
        ctx.fillText("Jump: Space / ↑   |   Duck: ↓", width / 2, height / 2 + 24);
      }

      s.animationFrameId = requestAnimationFrame(loop);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animationFrameId);
    };
  }, [isPlaying, highScore]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-4 select-none">
      {/* Top Controller Bar */}
      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink tracking-tight flex items-center gap-2">
            🦖 Chrome T-Rex Runner
          </span>
          <span className="text-xs font-mono text-ink-subtle">
            Speed: {Math.round(stateRef.current.speed * 10) / 10}x
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPlaying && !isGameOver && (
            <button
              onClick={togglePause}
              className="p-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink text-xs transition-colors"
              title="Pause Game (P / Esc)"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={resetGame}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-ink-subtle" />
            <span>{isPlaying ? "Restart" : "Play"}</span>
          </button>
        </div>
      </div>

      {/* Canvas Screen */}
      <div
        onClick={() => {
          if (!isPlaying || isGameOver) resetGame();
          else jump();
        }}
        className="w-full relative rounded-xl overflow-hidden border border-hairline shadow-2xl bg-surface-1 cursor-pointer focus:outline-none"
      >
        <canvas
          ref={canvasRef}
          width={680}
          height={240}
          className="w-full h-auto block"
        />
      </div>

      {/* Touch / Mouse Mobile Controls */}
      <div className="w-full flex items-center justify-between text-xs text-ink-subtle px-2">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Controls: <kbd className="font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-hairline text-ink">Space</kbd> or <kbd className="font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-hairline text-ink">↑</kbd> to Jump, <kbd className="font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-hairline text-ink">↓</kbd> to Duck</span>
        </div>

        <div className="flex sm:hidden items-center gap-2 w-full justify-center pt-2">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              duck(true);
            }}
            onPointerUp={() => duck(false)}
            className="flex-1 py-3 bg-surface-2 active:bg-surface-3 border border-hairline rounded-lg font-medium text-xs text-ink text-center"
          >
            Duck (↓)
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isPlaying || isGameOver) resetGame();
              else jump();
            }}
            className="flex-1 py-3 bg-primary active:bg-primary-hover text-white rounded-lg font-medium text-xs text-center shadow-sm shadow-primary/20"
          >
            Jump (Space)
          </button>
        </div>
      </div>
    </div>
  );
}
