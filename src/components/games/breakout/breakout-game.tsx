"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCcw,
  Pause,
  Play,
  Trophy,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import { sounds } from "../sound-manager";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants & Types                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const STORAGE_KEY = "devdash_breakout_highscore";

type PowerUpType = "EXPAND" | "MULTI" | "SLOW" | "SHIELD";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  glowColor: string;
  hp: number;
  maxHp: number;
  points: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  color: string;
  icon: string;
  active: boolean;
}

const BRICK_COLORS = [
  { color: "#ec4899", glow: "rgba(236,72,153,0.5)", hp: 2, points: 50 }, // Row 0: Neon Pink (2 hits)
  { color: "#f59e0b", glow: "rgba(245,158,11,0.5)", hp: 1, points: 40 }, // Row 1: Bright Amber
  { color: "#eab308", glow: "rgba(234,179,8,0.5)", hp: 1, points: 30 },  // Row 2: Gold Yellow
  { color: "#10b981", glow: "rgba(16,185,129,0.5)", hp: 1, points: 20 }, // Row 3: Emerald Green
  { color: "#06b6d4", glow: "rgba(6,182,212,0.5)", hp: 1, points: 10 },  // Row 4: Cyber Cyan
];

export function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High score & settings
  const [highScore, setHighScore] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [level, setLevel] = useState<number>(1);
  const [combo, setCombo] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "gameover" | "victory">("idle");
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [hasShield, setHasShield] = useState<boolean>(false);

  // Mutable Game Loop State Ref (bypasses React render loop lag)
  const stateRef = useRef({
    gameState: "idle" as "idle" | "playing" | "paused" | "gameover" | "victory",
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    paddle: {
      x: CANVAS_WIDTH / 2 - 48,
      y: CANVAS_HEIGHT - 32,
      w: 96,
      h: 12,
      targetW: 96,
      speed: 8,
    },
    balls: [] as Ball[],
    bricks: [] as Brick[],
    particles: [] as Particle[],
    powerUps: [] as PowerUp[],
    shieldActive: false,
    expandTimer: 0,
    slowTimer: 0,
    shake: 0,
    keys: { left: false, right: false },
    mouseAttached: true,
  });

  // Load High Score and listen to sound changes on Mount
  useEffect(() => {
    setIsMuted(sounds.getMuted());
    const handleSoundChange = () => {
      setIsMuted(sounds.getMuted());
    };
    window.addEventListener("devdash_sound_change", handleSoundChange);

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHighScore(parseInt(saved, 10));
    }

    return () => {
      window.removeEventListener("devdash_sound_change", handleSoundChange);
    };
  }, []);

  // Save High Score helper
  const updateHighScore = useCallback((newScore: number) => {
    if (typeof window !== "undefined") {
      const current = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      if (newScore > current) {
        localStorage.setItem(STORAGE_KEY, String(newScore));
        setHighScore(newScore);
      }
    }
  }, []);

  // Initialize Bricks Grid for given level
  const initBricks = useCallback((lvl: number): Brick[] => {
    const rows = 5;
    const cols = 8;
    const padTop = 50;
    const padSide = 32;
    const gap = 8;
    const brickW = (CANVAS_WIDTH - padSide * 2 - gap * (cols - 1)) / cols;
    const brickH = 18;

    const bricks: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      const scheme = BRICK_COLORS[r % BRICK_COLORS.length];
      const hpMultiplier = lvl > 2 && r < 2 ? 2 : scheme.hp;

      for (let c = 0; c < cols; c++) {
        // Occasional layouts in higher levels (checkered or pyramid)
        if (lvl === 2 && (r + c) % 2 === 1 && r > 2) continue;
        if (lvl === 3 && (c === 0 || c === cols - 1) && r > 2) continue;

        bricks.push({
          x: padSide + c * (brickW + gap),
          y: padTop + r * (brickH + gap),
          w: brickW,
          h: brickH,
          color: scheme.color,
          glowColor: scheme.glow,
          hp: hpMultiplier,
          maxHp: hpMultiplier,
          points: scheme.points * lvl,
          active: true,
        });
      }
    }
    return bricks;
  }, []);

  // Reset Ball on Paddle
  const resetBallOnPaddle = useCallback(() => {
    const s = stateRef.current;
    const paddle = s.paddle;
    const baseSpeed = 5.2 + (s.level - 1) * 0.4;

    s.balls = [
      {
        x: paddle.x + paddle.w / 2,
        y: paddle.y - 8,
        vx: 0,
        vy: 0,
        radius: 6,
        speed: baseSpeed,
        trail: [],
      },
    ];
  }, []);

  // Start new game or level
  const startNewGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = "idle";
    s.score = 0;
    s.lives = 3;
    s.level = 1;
    s.combo = 0;
    s.paddle.w = 96;
    s.paddle.targetW = 96;
    s.paddle.x = CANVAS_WIDTH / 2 - 48;
    s.shieldActive = false;
    s.expandTimer = 0;
    s.slowTimer = 0;
    s.particles = [];
    s.powerUps = [];
    s.bricks = initBricks(1);

    resetBallOnPaddle();

    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    setHasShield(false);
    setActivePowerUp(null);
    setGameState("idle");
  }, [initBricks, resetBallOnPaddle]);

  // Launch ball from paddle
  const launchBall = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === "idle" && s.balls.length > 0) {
      s.gameState = "playing";
      setGameState("playing");
      sounds.playJump();

      // Launch upward at a natural random angle
      const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // -54 deg to +54 deg from vertical
      const speed = s.balls[0].speed;
      s.balls[0].vx = speed * Math.sin(angle);
      s.balls[0].vy = -speed * Math.cos(angle);
    }
  }, []);

  // Spawn brick destruction particles
  const spawnParticles = (x: number, y: number, color: string) => {
    const s = stateRef.current;
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 25 + 20,
      });
    }
  };

  // Spawn Power-Up chance
  const checkSpawnPowerUp = (x: number, y: number) => {
    if (Math.random() > 0.22) return; // 22% drop chance

    const types: { type: PowerUpType; color: string; icon: string }[] = [
      { type: "EXPAND", color: "#06b6d4", icon: "P" },
      { type: "MULTI", color: "#ec4899", icon: "M" },
      { type: "SLOW", color: "#10b981", icon: "S" },
      { type: "SHIELD", color: "#eab308", icon: "L" },
    ];

    const pick = types[Math.floor(Math.random() * types.length)];
    stateRef.current.powerUps.push({
      x,
      y,
      vy: 2.2,
      type: pick.type,
      color: pick.color,
      icon: pick.icon,
      active: true,
    });
  };

  // Main 60fps Game Loop
  useEffect(() => {
    startNewGame();
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = () => {
      const s = stateRef.current;
      const paddle = s.paddle;

      // 1. Keyboard paddle movement
      if (s.keys.left) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
      }
      if (s.keys.right) {
        paddle.x = Math.min(CANVAS_WIDTH - paddle.w, paddle.x + paddle.speed);
      }

      // Smooth paddle width interpolation (expand power-up)
      paddle.w += (paddle.targetW - paddle.w) * 0.15;

      // Power-up countdowns
      if (s.expandTimer > 0) {
        s.expandTimer--;
        if (s.expandTimer <= 0) {
          paddle.targetW = 96;
          setActivePowerUp(null);
        }
      }
      if (s.slowTimer > 0) {
        s.slowTimer--;
        if (s.slowTimer <= 0) {
          s.balls.forEach((b) => (b.speed /= 0.75));
          setActivePowerUp(null);
        }
      }

      // 2. Ball logic
      if (s.gameState === "idle") {
        // Keep ball glued to paddle center
        if (s.balls.length > 0) {
          s.balls[0].x = paddle.x + paddle.w / 2;
          s.balls[0].y = paddle.y - 8;
        }
      } else if (s.gameState === "playing") {
        for (let i = s.balls.length - 1; i >= 0; i--) {
          const ball = s.balls[i];

          // Add trail position
          ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.6 });
          if (ball.trail.length > 8) ball.trail.shift();
          ball.trail.forEach((t) => (t.alpha *= 0.82));

          // Move ball
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall collision: Left & Right
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            sounds.playClick();
          } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
            ball.x = CANVAS_WIDTH - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            sounds.playClick();
          }

          // Wall collision: Top
          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            sounds.playClick();
          }

          // Paddle collision
          if (
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.h &&
            ball.x >= paddle.x - ball.radius &&
            ball.x <= paddle.x + paddle.w + ball.radius &&
            ball.vy > 0
          ) {
            // Deflection angle based on hit position from center (-1 to 1)
            const hitPoint = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
            const maxAngle = (Math.PI / 180) * 65; // Max 65 degree deflection
            const angle = hitPoint * maxAngle;

            ball.vx = ball.speed * Math.sin(angle);
            ball.vy = -ball.speed * Math.cos(angle);
            ball.y = paddle.y - ball.radius - 1;

            // Reset combo on paddle bounce
            s.combo = 0;
            setCombo(0);
            sounds.playClick();

            // Spawn paddle impact sparks
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: ball.x,
                y: paddle.y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
                size: Math.random() * 2 + 1,
                color: "#38bdf8",
                alpha: 1,
                life: 0,
                maxLife: 15,
              });
            }
          }

          // Safety Shield Collision (Bottom Barrier)
          if (s.shieldActive && ball.y + ball.radius >= CANVAS_HEIGHT - 6) {
            ball.y = CANVAS_HEIGHT - 6 - ball.radius;
            ball.vy = -Math.abs(ball.vy);
            s.shieldActive = false;
            setHasShield(false);
            sounds.playJump();

            // Barrier break particles
            for (let b = 0; b < 24; b++) {
              s.particles.push({
                x: (CANVAS_WIDTH / 24) * b,
                y: CANVAS_HEIGHT - 6,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 4 - 1,
                size: 2.5,
                color: "#eab308",
                alpha: 1,
                life: 0,
                maxLife: 20,
              });
            }
          }

          // Bottom Fall (Life Lost or Ball Removed)
          if (ball.y - ball.radius > CANVAS_HEIGHT) {
            s.balls.splice(i, 1);

            // If no balls remaining, lose a life
            if (s.balls.length === 0) {
              s.lives--;
              setLives(s.lives);
              s.shake = 12;
              sounds.playGameOver();

              if (s.lives <= 0) {
                // Game Over
                s.gameState = "gameover";
                setGameState("gameover");
                updateHighScore(s.score);
              } else {
                // Reset ball on paddle
                s.gameState = "idle";
                setGameState("idle");
                resetBallOnPaddle();
              }
            }
            continue;
          }

          // Brick collision check
          for (let b = 0; b < s.bricks.length; b++) {
            const brick = s.bricks[b];
            if (!brick.active) continue;

            // Simple AABB vs circle collision
            if (
              ball.x + ball.radius >= brick.x &&
              ball.x - ball.radius <= brick.x + brick.w &&
              ball.y + ball.radius >= brick.y &&
              ball.y - ball.radius <= brick.y + brick.h
            ) {
              // Determine collision side
              const overlapLeft = ball.x + ball.radius - brick.x;
              const overlapRight = brick.x + brick.w - (ball.x - ball.radius);
              const overlapTop = ball.y + ball.radius - brick.y;
              const overlapBottom = brick.y + brick.h - (ball.y - ball.radius);

              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

              if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                ball.vx = -ball.vx;
              } else {
                ball.vy = -ball.vy;
              }

              // Damage brick
              brick.hp--;
              s.combo++;
              setCombo(s.combo);

              const comboMultiplier = Math.min(4, Math.floor(s.combo / 2) + 1);
              const gainedPoints = brick.points * comboMultiplier;
              s.score += gainedPoints;
              setScore(s.score);
              sounds.playScore();

              if (brick.hp <= 0) {
                brick.active = false;
                spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);
                checkSpawnPowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2);
              } else {
                // Spark hit on tough brick
                spawnParticles(ball.x, ball.y, brick.color);
              }

              // Check if all bricks cleared (Victory)
              const remaining = s.bricks.filter((br) => br.active).length;
              if (remaining === 0) {
                s.gameState = "victory";
                setGameState("victory");
                s.score += 1000 * s.level;
                setScore(s.score);
                updateHighScore(s.score);
                sounds.playScore();
              }

              break; // Handle one brick hit per frame per ball
            }
          }
        }
      }

      // 3. Falling Power-Ups logic
      for (let p = s.powerUps.length - 1; p >= 0; p--) {
        const item = s.powerUps[p];
        item.y += item.vy;

        // Catch with paddle
        if (
          item.y + 10 >= paddle.y &&
          item.y - 10 <= paddle.y + paddle.h &&
          item.x >= paddle.x &&
          item.x <= paddle.x + paddle.w
        ) {
          sounds.playJump();
          s.powerUps.splice(p, 1);

          // Apply power-up effect
          if (item.type === "EXPAND") {
            paddle.targetW = 140;
            s.expandTimer = 720; // 12 seconds
            setActivePowerUp("Wide Paddle (12s)");
          } else if (item.type === "MULTI") {
            if (s.balls.length > 0) {
              const baseBall = s.balls[0];
              s.balls.push(
                {
                  ...baseBall,
                  vx: baseBall.vx * 0.8 + 2.5,
                  vy: baseBall.vy,
                  trail: [],
                },
                {
                  ...baseBall,
                  vx: baseBall.vx * 0.8 - 2.5,
                  vy: baseBall.vy,
                  trail: [],
                }
              );
            }
            setActivePowerUp("Multi-Ball x3!");
          } else if (item.type === "SLOW") {
            s.balls.forEach((b) => (b.speed *= 0.75));
            s.slowTimer = 600; // 10 seconds
            setActivePowerUp("Slow Motion (10s)");
          } else if (item.type === "SHIELD") {
            s.shieldActive = true;
            setHasShield(true);
            setActivePowerUp("Safety Shield Active");
          }
          continue;
        }

        // Off screen
        if (item.y > CANVAS_HEIGHT) {
          s.powerUps.splice(p, 1);
        }
      }

      // 4. Update Particles
      for (let pt = s.particles.length - 1; pt >= 0; pt--) {
        const part = s.particles[pt];
        part.x += part.vx;
        part.y += part.vy;
        part.vy += 0.08; // subtle gravity
        part.life++;
        part.alpha = Math.max(0, 1 - part.life / part.maxLife);

        if (part.life >= part.maxLife) {
          s.particles.splice(pt, 1);
        }
      }

      // 5. Render Scene to Canvas
      ctx.save();

      // Screen shake offset
      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
        s.shake *= 0.85;
        if (s.shake < 0.5) s.shake = 0;
      }

      // Background
      ctx.fillStyle = "#090a0b";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle cyan/magenta background grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw Safety Shield if active
      if (s.shieldActive) {
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(234, 179, 8, 0.7)";
        ctx.fillRect(0, CANVAS_HEIGHT - 6, CANVAS_WIDTH, 6);
        ctx.shadowBlur = 0;
      }

      // Draw Bricks
      s.bricks.forEach((brick) => {
        if (!brick.active) return;

        ctx.save();
        ctx.shadowColor = brick.glowColor;
        ctx.shadowBlur = 8;

        // Brick body
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
        ctx.fill();

        // 2-Hit cracked visual indicator
        if (brick.maxHp === 2 && brick.hp === 1) {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(brick.x + brick.w * 0.3, brick.y);
          ctx.lineTo(brick.x + brick.w * 0.5, brick.y + brick.h * 0.6);
          ctx.lineTo(brick.x + brick.w * 0.7, brick.y + brick.h);
          ctx.stroke();
        }

        // Inner highlight sheen
        ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, 3);

        ctx.restore();
      });

      // Draw Falling Power-Ups
      s.powerUps.forEach((item) => {
        ctx.save();
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(item.x - 12, item.y - 8, 24, 16, 6);
        ctx.fill();

        ctx.fillStyle = "#000";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.icon, item.x, item.y);
        ctx.restore();
      });

      // Draw Particles
      s.particles.forEach((part) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.shadowColor = part.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Paddle
      ctx.save();
      ctx.shadowColor = "rgba(37, 99, 235, 0.6)";
      ctx.shadowBlur = 14;

      const paddleGrad = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
      paddleGrad.addColorStop(0, "#06b6d4");
      paddleGrad.addColorStop(0.5, "#3b82f6");
      paddleGrad.addColorStop(1, "#06b6d4");

      ctx.fillStyle = paddleGrad;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
      ctx.fill();

      // Top glowing bar on paddle
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(paddle.x + 8, paddle.y + 2, paddle.w - 16, 2);
      ctx.restore();

      // Draw Balls & Trails
      s.balls.forEach((ball) => {
        // Trails
        ball.trail.forEach((t) => {
          ctx.save();
          ctx.globalAlpha = t.alpha * 0.5;
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(t.x, t.y, ball.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Ball itself
        ctx.save();
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Neon outer glow ring
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [startNewGame, updateHighScore]);

  // Handle Mouse movement across canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clientX = (e.clientX - rect.left) * scaleX;

    const paddle = stateRef.current.paddle;
    paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.w, clientX - paddle.w / 2));
  };

  // Handle Touch movement on mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clientX = (e.touches[0].clientX - rect.left) * scaleX;

    const paddle = stateRef.current.paddle;
    paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.w, clientX - paddle.w / 2));
  };

  // Keyboard navigation & spacebar launch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        s.keys.left = true;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        s.keys.right = true;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (s.gameState === "idle") {
          launchBall();
        } else if (s.gameState === "gameover" || s.gameState === "victory") {
          startNewGame();
        }
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        if (s.gameState === "playing") {
          s.gameState = "paused";
          setGameState("paused");
        } else if (s.gameState === "paused") {
          s.gameState = "playing";
          setGameState("playing");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") s.keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") s.keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [launchBall, startNewGame]);

  // Advance to Next Level on Victory
  const handleNextLevel = () => {
    const s = stateRef.current;
    s.level++;
    setLevel(s.level);
    s.bricks = initBricks(s.level);
    s.gameState = "idle";
    setGameState("idle");
    resetBallOnPaddle();
  };

  const toggleMute = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
    window.dispatchEvent(new CustomEvent("devdash_sound_change"));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4 select-none">
      {/* Top HUD Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-1 border border-hairline shadow-sm">
        {/* Left: Score & Multiplier */}
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] font-mono text-ink-subtle uppercase">Score</div>
            <div className="text-sm sm:text-base font-bold font-mono text-ink tracking-tight">
              {score}
            </div>
          </div>

          {combo > 1 && (
            <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-blue-400 font-semibold animate-pulse">
              {Math.min(4, Math.floor(combo / 2) + 1)}x COMBO
            </div>
          )}

          {activePowerUp && (
            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-400">
              <Zap className="w-2.5 h-2.5" />
              <span>{activePowerUp}</span>
            </div>
          )}
        </div>

        {/* Center: Lives as Neon Hearts */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((heartIndex) => (
            <Heart
              key={heartIndex}
              className={cn(
                "w-4 h-4 transition-all duration-200",
                heartIndex <= lives
                  ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                  : "text-zinc-700 fill-zinc-800/40"
              )}
            />
          ))}
          {hasShield && (
            <span title="Shield Active">
              <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 ml-1" />
            </span>
          )}
        </div>

        {/* Right: Level & High Score */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-mono text-ink-subtle uppercase">High Score</div>
            <div className="text-xs sm:text-sm font-bold font-mono text-amber-400 flex items-center justify-end gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>{Math.max(score, highScore)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-primary" />}
            </button>

            <button
              type="button"
              onClick={startNewGame}
              className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              title="Restart Game"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport Container */}
      <div className="relative w-full aspect-[4/3] max-w-[640px] rounded-2xl overflow-hidden border border-hairline-strong shadow-2xl bg-[#090a0b]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onClick={() => {
            if (gameState === "idle") launchBall();
          }}
          className="w-full h-full cursor-none block touch-none"
        />

        {/* Start / Idle Screen Overlay */}
        {gameState === "idle" && (
          <div
            onClick={launchBall}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center cursor-pointer animate-in fade-in duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-lg shadow-primary/20 mb-3 animate-bounce">
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </div>
            <h3 className="text-lg font-bold text-ink tracking-tight mb-1">
              Ready to Launch
            </h3>
            <p className="text-xs text-ink-muted max-w-xs mb-4">
              Glide the paddle with your mouse or arrow keys to bounce the ball and smash bricks.
            </p>
            <span className="px-3 py-1 rounded-md bg-surface-2 border border-hairline text-[11px] font-mono text-blue-400">
              Press SPACE or CLICK to Launch
            </span>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === "paused" && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <h3 className="text-xl font-bold text-ink tracking-tight mb-2">Game Paused</h3>
            <p className="text-xs text-ink-muted mb-4">Take a breather. Ready when you are!</p>
            <button
              type="button"
              onClick={() => {
                stateRef.current.gameState = "playing";
                setGameState("playing");
              }}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-lg shadow-primary/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Game</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <RotateCcw className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-ink tracking-tight mb-1">Game Over</h3>
            <p className="text-xs text-ink-muted mb-4">
              Final Score: <span className="font-mono font-bold text-ink">{score}</span>
              {score >= highScore && score > 0 && (
                <span className="text-amber-400 ml-2 font-semibold">★ New High Score!</span>
              )}
            </p>
            <button
              type="button"
              onClick={startNewGame}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-lg shadow-primary/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        )}

        {/* Level Victory Overlay */}
        {gameState === "victory" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 animate-bounce">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-ink tracking-tight mb-1">
              Level {level} Cleared!
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              Bonus: <span className="font-mono font-bold text-emerald-400">+{1000 * level} PTS</span>
            </p>
            <button
              type="button"
              onClick={handleNextLevel}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Level {level + 1}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Help & Mobile Touch Paddles */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted px-2">
        <div className="flex items-center gap-2 text-[11px] font-mono text-ink-subtle">
          <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline">Mouse / Touch</span>
          <span>Glide</span>
          <span>·</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline">A / D</span>
          <span>Keys</span>
          <span>·</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline">Space</span>
          <span>Launch</span>
        </div>

        {/* On-screen buttons for touch devices */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onMouseDown={() => (stateRef.current.keys.left = true)}
            onMouseUp={() => (stateRef.current.keys.left = false)}
            onTouchStart={() => (stateRef.current.keys.left = true)}
            onTouchEnd={() => (stateRef.current.keys.left = false)}
            className="p-3 rounded-lg bg-surface-2 border border-hairline text-ink active:bg-surface-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={launchBall}
            className="px-4 py-2.5 rounded-lg bg-primary text-white font-mono text-xs font-semibold"
          >
            Launch
          </button>
          <button
            type="button"
            onMouseDown={() => (stateRef.current.keys.right = true)}
            onMouseUp={() => (stateRef.current.keys.right = false)}
            onTouchStart={() => (stateRef.current.keys.right = true)}
            onTouchEnd={() => (stateRef.current.keys.right = false)}
            className="p-3 rounded-lg bg-surface-2 border border-hairline text-ink active:bg-surface-3"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
