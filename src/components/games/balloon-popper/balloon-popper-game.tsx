"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Play, Trophy, Sparkles } from "lucide-react";
import { sounds } from "../sound-manager";

interface Balloon {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
  isGold: boolean;
  swayOffset: number;
  swaySpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const BALLOON_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export function BalloonPopperGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameMode, setGameMode] = useState<"blitz" | "zen">("blitz");

  const stateRef = useRef({
    balloons: [] as Balloon[],
    particles: [] as Particle[],
    nextId: 1,
    score: 0,
    isPlaying: false,
    isGameOver: false,
    lastSpawn: 0,
    mode: "blitz" as "blitz" | "zen",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_balloon_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  const spawnBalloon = useCallback((width: number, height: number): Balloon => {
    const isGold = Math.random() < 0.12;
    const size = isGold ? 36 : Math.floor(38 + Math.random() * 22);
    const speed = isGold ? 2.8 : 1.4 + Math.random() * 1.6;

    return {
      id: stateRef.current.nextId++,
      x: size + Math.random() * (width - size * 2),
      y: height + size + Math.random() * 30,
      speed,
      size,
      color: isGold ? "#fbbf24" : BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      isGold,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
    };
  }, []);

  const startGame = useCallback(
    (mode: "blitz" | "zen" = gameMode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const s = stateRef.current;
      s.balloons = [];
      s.particles = [];
      s.score = 0;
      s.isPlaying = true;
      s.isGameOver = false;
      s.mode = mode;

      for (let i = 0; i < 6; i++) {
        const b = spawnBalloon(canvas.width, canvas.height);
        b.y -= i * 60;
        s.balloons.push(b);
      }

      setScore(0);
      setTimeLeft(30);
      setIsGameOver(false);
      setIsPlaying(true);
      setGameMode(mode);
    },
    [gameMode, spawnBalloon]
  );

  // Timer countdown for Blitz mode
  useEffect(() => {
    if (!isPlaying || isGameOver || gameMode === "zen") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stateRef.current.isGameOver = true;
          stateRef.current.isPlaying = false;
          setIsGameOver(true);
          setIsPlaying(false);
          sounds.playGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, gameMode]);

  // Click handler to pop balloons
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.isPlaying) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const s = stateRef.current;

    for (let i = s.balloons.length - 1; i >= 0; i--) {
      const b = s.balloons[i];
      const dist = Math.hypot(clickX - b.x, clickY - b.y);

      if (dist <= b.size) {
        // Pop!
        sounds.playPop();

        // Spawn particles
        for (let p = 0; p < 12; p++) {
          const angle = (p / 12) * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          s.particles.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: b.color,
            life: 25,
          });
        }

        const addedScore = b.isGold ? 50 : 10;
        s.score += addedScore;
        setScore(s.score);

        if (b.isGold) {
          sounds.playScore();
        }

        if (s.mode === "blitz" && s.score > highScore) {
          setHighScore(s.score);
          if (typeof window !== "undefined") {
            localStorage.setItem("devdash_balloon_highscore", String(s.score));
          }
        }

        s.balloons.splice(i, 1);
        break;
      }
    }
  };

  // Canvas render & animation loop
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

      // Dark canvas background
      ctx.fillStyle = "#090a0c";
      ctx.fillRect(0, 0, w, h);

      // Draw gentle background stars/sparkles
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(60, 40, 2, 2);
      ctx.fillRect(240, 90, 2, 2);
      ctx.fillRect(400, 50, 2, 2);
      ctx.fillRect(150, 200, 2, 2);

      if (s.isPlaying) {
        // Spawn new balloons
        if (s.balloons.length < 9) {
          s.balloons.push(spawnBalloon(w, h));
        }

        // Update balloons
        for (let i = s.balloons.length - 1; i >= 0; i--) {
          const b = s.balloons[i];
          b.y -= b.speed;
          b.swayOffset += b.swaySpeed;
          b.x += Math.sin(b.swayOffset) * 0.8;

          // Remove if floated above screen
          if (b.y < -b.size * 2) {
            s.balloons.splice(i, 1);
          }
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1; // gravity
          p.life -= 1;
          if (p.life <= 0) {
            s.particles.splice(i, 1);
          }
        }
      }

      // Draw Balloons
      for (const b of s.balloons) {
        // String
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.size);
        ctx.quadraticCurveTo(b.x + Math.sin(b.swayOffset) * 8, b.y + b.size + 15, b.x, b.y + b.size + 30);
        ctx.stroke();

        // Balloon Body (oval / teardrop)
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.size * 0.85, b.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Knot
        ctx.beginPath();
        ctx.moveTo(-3, b.size - 2);
        ctx.lineTo(3, b.size - 2);
        ctx.lineTo(0, b.size + 4);
        ctx.closePath();
        ctx.fill();

        // Highlight sheen
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.ellipse(-b.size * 0.35, -b.size * 0.35, b.size * 0.2, b.size * 0.35, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        if (b.isGold) {
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Draw particles
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.life / 6), 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [spawnBalloon]);

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-4 select-none">
      {/* Top Controls */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-lg border border-hairline">
          <button
            onClick={() => startGame("blitz")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              gameMode === "blitz" ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
            }`}
          >
            30s Blitz
          </button>
          <button
            onClick={() => startGame("zen")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              gameMode === "zen" ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
            }`}
          >
            Relaxed Zen
          </button>
        </div>

        <div className="flex items-center gap-2">
          {gameMode === "blitz" && (
            <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[65px]">
              <span className="block text-[10px] uppercase font-mono text-ink-subtle">Time</span>
              <span className={`text-sm font-bold font-mono ${timeLeft <= 5 ? "text-red-400" : "text-ink"}`}>
                {timeLeft}s
              </span>
            </div>
          )}

          <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[65px]">
            <span className="block text-[10px] uppercase font-mono text-ink-subtle">Score</span>
            <span className="text-sm font-bold font-mono text-ink">{score}</span>
          </div>

          {gameMode === "blitz" && (
            <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[65px]">
              <span className="text-[10px] uppercase font-mono text-ink-subtle flex items-center justify-center gap-1">
                <Trophy className="w-2.5 h-2.5 text-amber-500" /> Best
              </span>
              <span className="text-sm font-bold font-mono text-ink">{highScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Interactive Zone */}
      <div className="relative w-full aspect-[4/3] max-w-[480px] bg-surface-2 rounded-2xl border border-hairline shadow-2xl overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={480}
          height={360}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />

        {/* Start / Game Over overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-surface-1/90 rounded-2xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-xs">
            <span className="text-2xl font-bold text-ink font-mono">
              {isGameOver ? "Time's Up!" : "🎈 Balloon Popper"}
            </span>
            <p className="text-xs text-ink-subtle">
              {isGameOver
                ? `You scored ${score} points!`
                : "Pop as many floating balloons as you can! Gold balloons = 50 pts."}
            </p>
            <button
              onClick={() => startGame(gameMode)}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isGameOver ? "Play Again" : "Start Popping"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-ink-subtle">
        Click or tap balloons to pop them before they float off-screen
      </div>
    </div>
  );
}
