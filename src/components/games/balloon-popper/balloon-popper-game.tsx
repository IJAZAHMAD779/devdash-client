"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Play, Pause, Trophy } from "lucide-react";
import { sounds } from "../sound-manager";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants & types                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const W = 480; // logical canvas width  (rendered at any size / DPR)
const H = 360; // logical canvas height
const HIGHSCORE_KEY = "devdash_balloon_highscore";
const COMBO_WINDOW = 1400; // ms to chain the next pop
const BLITZ_SECONDS = 30;
const GOLD_BONUS_SECONDS = 2;

type Mode = "blitz" | "zen";

const BALLOON_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];
const CONFETTI_COLORS = ["#fde047", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#c084fc"];

interface Vec {
  x: number;
  y: number;
}

interface Balloon {
  id: number;
  x: number;
  y: number;
  vy: number;
  r: number;
  depth: number; // 0.7 (far) → 1 (near)
  color: string;
  gold: boolean;
  phase: number;
  swaySpeed: number;
  swayAmp: number;
  tilt: number;
  hover: number; // 0..1 eased hover amount
  string: Vec[];
}

interface Particle {
  kind: "shard" | "confetti" | "spark";
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
  max: number;
}

interface Ring {
  x: number;
  y: number;
  r0: number;
  r1: number;
  life: number;
  max: number;
  color: string;
  width: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  max: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number;
  ph: number;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  speed: number;
  alpha: number;
}

interface Sim {
  balloons: Balloon[];
  particles: Particle[];
  rings: Ring[];
  texts: FloatText[];
  stars: Star[];
  clouds: Cloud[];
  nextId: number;
  score: number;
  combo: number;
  maxCombo: number;
  pops: number;
  clicks: number;
  lastPopAt: number;
  time: number; // seconds left (blitz)
  elapsed: number; // seconds played
  clock: number; // game clock ms (excludes pauses)
  t: number; // ambient clock ms (always runs)
  running: boolean;
  paused: boolean;
  over: boolean;
  mode: Mode;
  spawnTimer: number;
  shake: number;
  flash: number;
  wind: number;
  scale: number;
  reduced: boolean;
  high: number;
  hoverId: number;
  pointer: { x: number; y: number; inside: boolean; type: string };
  hud: { score: number; time: number };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** amt: -1 (black) … 0 (same) … 1 (white) */
function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  return `rgb(${Math.round((target - r) * p + r)},${Math.round((target - g) * p + g)},${Math.round(
    (target - b) * p + b
  )})`;
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function balloonPath(ctx: CanvasRenderingContext2D, r: number) {
  const w = r * 0.86;
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(-w * 0.35, r * 0.96, -w, r * 0.5, -w, -r * 0.12);
  ctx.bezierCurveTo(-w, -r * 0.72, -w * 0.55, -r, 0, -r);
  ctx.bezierCurveTo(w * 0.55, -r, w, -r * 0.72, w, -r * 0.12);
  ctx.bezierCurveTo(w, r * 0.5, w * 0.35, r * 0.96, 0, r);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 === 0 ? size : size * 0.22;
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function hitTest(b: Balloon, x: number, y: number, pad: number) {
  const dx = (x - b.x) / (b.r * 0.86 + pad);
  const dy = (y - (b.y + b.r * 0.04)) / (b.r + pad);
  return dx * dx + dy * dy <= 1;
}

function makeSim(): Sim {
  return {
    balloons: [],
    particles: [],
    rings: [],
    texts: [],
    stars: [],
    clouds: [],
    nextId: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    pops: 0,
    clicks: 0,
    lastPopAt: -1e9,
    time: BLITZ_SECONDS,
    elapsed: 0,
    clock: 0,
    t: 0,
    running: false,
    paused: false,
    over: false,
    mode: "blitz",
    spawnTimer: 0,
    shake: 0,
    flash: 0,
    wind: 0,
    scale: 1,
    reduced: false,
    high: 0,
    hoverId: -1,
    pointer: { x: -100, y: -100, inside: false, type: "mouse" },
    hud: { score: -1, time: -1 },
  };
}

function spawnBalloon(s: Sim, startY?: number): Balloon {
  const gold = Math.random() < 0.1;
  const depth = gold ? 1 : 0.72 + Math.random() * 0.28;
  const r = gold ? 30 : (28 + Math.random() * 16) * (0.8 + depth * 0.2);
  const vy = gold ? 2.7 : (1.0 + Math.random() * 1.1) * (0.6 + depth * 0.4);
  const x = r + Math.random() * (W - r * 2);
  const y = startY ?? H + r * 2 + Math.random() * 50;
  const b: Balloon = {
    id: s.nextId++,
    x,
    y,
    vy,
    r,
    depth,
    color: gold ? "#fbbf24" : BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    gold,
    phase: Math.random() * Math.PI * 2,
    swaySpeed: 0.02 + Math.random() * 0.025,
    swayAmp: 0.25 + Math.random() * 0.45,
    tilt: 0,
    hover: 0,
    string: [],
  };
  for (let i = 0; i < 9; i++) b.string.push({ x, y: y + r + i * 4 });
  s.balloons.push(b);
  s.balloons.sort((a, c) => a.depth - c.depth); // back → front
  return b;
}

function popBalloon(s: Sim, index: number) {
  const b = s.balloons[index];

  // combo / score
  s.combo = s.clock - s.lastPopAt < COMBO_WINDOW ? s.combo + 1 : 1;
  s.lastPopAt = s.clock;
  s.maxCombo = Math.max(s.maxCombo, s.combo);
  const mult = Math.min(5, 1 + Math.floor((s.combo - 1) / 4));
  const base = b.gold ? 50 : 10;
  const pts = base * mult;
  s.score += pts;
  s.pops++;

  // sounds
  sounds.playPop();
  if (b.gold || s.combo % 5 === 0) sounds.playScore();

  // rubber shards
  const shardCount = s.reduced ? 6 : 14;
  for (let i = 0; i < shardCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.5 + Math.random() * 4.5;
    const life = 35 + Math.random() * 25;
    s.particles.push({
      kind: "shard",
      x: b.x + Math.cos(a) * b.r * 0.4,
      y: b.y + Math.sin(a) * b.r * 0.4,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 1,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.45,
      w: (7 + Math.random() * 9) * b.depth,
      h: (4 + Math.random() * 5) * b.depth,
      color: shade(b.color, (Math.random() - 0.5) * 0.35),
      life,
      max: life,
    });
  }

  // air-burst sparks
  const sparkCount = s.reduced ? 0 : 10;
  for (let i = 0; i < sparkCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 5;
    s.particles.push({
      kind: "spark",
      x: b.x,
      y: b.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      rot: 0,
      vr: 0,
      w: 1 + Math.random() * 1.6,
      h: 0,
      color: "#ffffff",
      life: 14 + Math.random() * 10,
      max: 24,
    });
  }

  // shockwave
  s.rings.push({ x: b.x, y: b.y, r0: b.r * 0.5, r1: b.r * 2.1, life: 18, max: 18, color: "#ffffff", width: 2.5 });

  // gold extras
  if (b.gold) {
    const n = s.reduced ? 10 : 34;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 6;
      const life = 55 + Math.random() * 35;
      s.particles.push({
        kind: "confetti",
        x: b.x,
        y: b.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2.5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.4,
        w: 5 + Math.random() * 4,
        h: 3 + Math.random() * 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life,
        max: life,
      });
    }
    s.rings.push({ x: b.x, y: b.y, r0: b.r * 0.4, r1: b.r * 3.4, life: 28, max: 28, color: "#fde047", width: 3 });
    s.flash = Math.max(s.flash, 0.9);
    if (s.mode === "blitz") {
      s.time = Math.min(60, s.time + GOLD_BONUS_SECONDS);
      s.texts.push({
        x: b.x,
        y: b.y - b.r - 18,
        text: `+${GOLD_BONUS_SECONDS}s`,
        color: "#86efac",
        size: 15,
        life: 55,
        max: 55,
      });
    }
  }

  s.texts.push({
    x: b.x,
    y: b.y - b.r * 0.2,
    text: mult > 1 ? `+${pts}  ×${mult}` : `+${pts}`,
    color: b.gold ? "#fde047" : "#ffffff",
    size: b.gold ? 20 : 15 + mult,
    life: 50,
    max: 50,
  });

  if (!s.reduced) s.shake = Math.max(s.shake, b.gold ? 5 : 2);

  s.balloons.splice(index, 1);
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function BalloonPopperGame() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sim = useRef<Sim>(makeSim());

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BLITZ_SECONDS);
  const [gameMode, setGameMode] = useState<Mode>("blitz");
  const [stats, setStats] = useState({ pops: 0, maxCombo: 0, accuracy: 0, newBest: false });

  /* ── controls ─────────────────────────────────────────────────────────── */

  const startGame = useCallback((mode?: Mode) => {
    const s = sim.current;
    const m = mode ?? s.mode;

    s.balloons = [];
    s.particles = [];
    s.rings = [];
    s.texts = [];
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.pops = 0;
    s.clicks = 0;
    s.lastPopAt = -1e9;
    s.time = BLITZ_SECONDS;
    s.elapsed = 0;
    s.clock = 0;
    s.spawnTimer = 0;
    s.shake = 0;
    s.flash = 0;
    s.mode = m;
    s.running = true;
    s.paused = false;
    s.over = false;
    s.hud = { score: -1, time: -1 };

    for (let i = 0; i < 7; i++) spawnBalloon(s, H * (0.25 + Math.random() * 0.8));

    setScore(0);
    setTimeLeft(BLITZ_SECONDS);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setGameMode(m);
  }, []);

  const togglePause = useCallback(() => {
    const s = sim.current;
    if (!s.running) return;
    s.paused = !s.paused;
    setIsPaused(s.paused);
  }, []);

  /* ── main setup: sizing, ambient scene, loop ──────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = sim.current;

    s.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    try {
      const saved = localStorage.getItem(HIGHSCORE_KEY);
      if (saved) {
        s.high = parseInt(saved, 10) || 0;
        setHighScore(s.high);
      }
    } catch {
      /* storage unavailable */
    }

    // ambient scene
    s.stars = Array.from({ length: 46 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.85,
      r: 0.4 + Math.random() * 1.1,
      tw: 0.6 + Math.random() * 1.6,
      ph: Math.random() * 6.28,
    }));
    s.clouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * W,
      y: 30 + Math.random() * (H * 0.75),
      w: 140 + Math.random() * 120,
      speed: 0.08 + Math.random() * 0.2,
      alpha: 0.04 + Math.random() * 0.045,
    }));
    if (s.balloons.length === 0) {
      for (let i = 0; i < 6; i++) spawnBalloon(s, 40 + Math.random() * (H - 40));
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      s.scale = canvas.width / W;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const endGame = () => {
      s.running = false;
      s.over = true;
      s.paused = false;
      const newBest = s.score > s.high && s.score > 0;
      if (newBest) {
        s.high = s.score;
        try {
          localStorage.setItem(HIGHSCORE_KEY, String(s.score));
        } catch {
          /* ignore */
        }
        setHighScore(s.score);
      }
      setStats({
        pops: s.pops,
        maxCombo: s.maxCombo,
        accuracy: s.clicks ? Math.round((s.pops / s.clicks) * 100) : 0,
        newBest,
      });
      sounds.playGameOver();
      setIsGameOver(true);
      setIsPaused(false);
      setIsPlaying(false);
    };

    /* update ─────────────────────────────────────────────────────────────── */
    const update = (dt: number, k: number) => {
      s.t += dt;
      s.wind = Math.sin(s.t / 2600) * 0.22 + Math.sin(s.t / 870) * 0.09;
      s.shake *= Math.pow(0.88, k);
      s.flash *= Math.pow(0.85, k);
      if (s.shake < 0.05) s.shake = 0;

      // ambient clouds always drift
      for (const c of s.clouds) {
        c.x += (c.speed + s.wind * 0.4) * k;
        if (c.x > W + c.w) c.x = -c.w;
        if (c.x < -c.w * 1.1) c.x = W + c.w;
      }

      if (s.paused) return;

      if (s.running) {
        s.clock += dt;
        s.elapsed += dt / 1000;
        if (s.mode === "blitz") {
          s.time -= dt / 1000;
          if (s.time <= 0) {
            s.time = 0;
            endGame();
          }
        }
        if (s.combo > 0 && s.clock - s.lastPopAt > COMBO_WINDOW) s.combo = 0;
      }

      // hover detection (front-most)
      s.hoverId = -1;
      if (s.running && s.pointer.inside) {
        for (let i = s.balloons.length - 1; i >= 0; i--) {
          if (hitTest(s.balloons[i], s.pointer.x, s.pointer.y, 5)) {
            s.hoverId = s.balloons[i].id;
            break;
          }
        }
      }

      // difficulty
      const speedMul = s.running ? (s.mode === "blitz" ? 1 + Math.min(0.6, s.elapsed / 50) : 0.8) : 0.7;
      const target = s.running ? (s.mode === "blitz" ? Math.min(11, 7 + Math.floor(s.elapsed / 10)) : 7) : 6;

      // spawn
      s.spawnTimer += dt;
      if (s.spawnTimer > 320 && s.balloons.length < target) {
        s.spawnTimer = 0;
        spawnBalloon(s);
      }

      // balloons
      for (let i = s.balloons.length - 1; i >= 0; i--) {
        const b = s.balloons[i];
        b.phase += b.swaySpeed * k;
        const dx = (Math.sin(b.phase) * b.swayAmp + s.wind * b.depth) * k;
        b.x += dx;
        b.y -= b.vy * speedMul * k;
        // soft walls
        if (b.x < b.r) b.x += (b.r - b.x) * 0.1 * k;
        if (b.x > W - b.r) b.x -= (b.x - (W - b.r)) * 0.1 * k;
        const tiltTarget = dx * 0.3 + Math.sin(b.phase * 0.7) * 0.05;
        b.tilt += (tiltTarget - b.tilt) * 0.08 * k;
        b.hover += ((s.hoverId === b.id ? 1 : 0) - b.hover) * 0.2 * k;

        // string follow (simple rope constraint)
        const L = b.r * 1.05 + 3;
        const ax = b.x - Math.sin(b.tilt) * L;
        const ay = b.y + Math.cos(b.tilt) * L;
        b.string[0].x = ax;
        b.string[0].y = ay;
        const seg = 5 + b.r * 0.06;
        for (let j = 1; j < b.string.length; j++) {
          const p = b.string[j];
          const q = b.string[j - 1];
          p.x += (q.x - p.x) * 0.22 * k;
          p.y += 0.55 * k;
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const d = Math.hypot(ddx, ddy) || 1;
          p.x = q.x + (ddx / d) * seg;
          p.y = q.y + (ddy / d) * seg;
        }

        if (b.y < -b.r * 2 - 50) s.balloons.splice(i, 1);
      }

      // particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * k;
        p.y += p.vy * k;
        if (p.kind === "shard") {
          p.vy += 0.16 * k;
          p.vx *= Math.pow(0.985, k);
        } else if (p.kind === "confetti") {
          p.vy += 0.07 * k;
          p.vx *= Math.pow(0.985, k);
          p.vy *= Math.pow(0.99, k);
        } else {
          p.vx *= Math.pow(0.92, k);
          p.vy *= Math.pow(0.92, k);
        }
        p.rot += p.vr * k;
        p.life -= k;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      for (let i = s.rings.length - 1; i >= 0; i--) {
        s.rings[i].life -= k;
        if (s.rings[i].life <= 0) s.rings.splice(i, 1);
      }
      for (let i = s.texts.length - 1; i >= 0; i--) {
        const t = s.texts[i];
        t.y -= 0.7 * k;
        t.life -= k;
        if (t.life <= 0) s.texts.splice(i, 1);
      }

      // sync HUD only when values change
      if (s.score !== s.hud.score) {
        s.hud.score = s.score;
        setScore(s.score);
      }
      const t = Math.ceil(s.time);
      if (t !== s.hud.time) {
        s.hud.time = t;
        setTimeLeft(t);
      }
    };

    /* render ─────────────────────────────────────────────────────────────── */
    const drawBalloon = (b: Balloon) => {
      const alpha = 0.72 + 0.28 * b.depth;

      // string
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = "rgba(203,213,225,0.5)";
      ctx.lineWidth = 1.1 * b.depth + 0.3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.string[0].x, b.string[0].y);
      for (let i = 1; i < b.string.length - 1; i++) {
        const mx = (b.string[i].x + b.string[i + 1].x) / 2;
        const my = (b.string[i].y + b.string[i + 1].y) / 2;
        ctx.quadraticCurveTo(b.string[i].x, b.string[i].y, mx, my);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.tilt);
      const sc = 1 + b.hover * 0.06;
      ctx.scale(sc, sc);
      const r = b.r;
      const w = r * 0.86;

      // gold aura
      if (b.gold) {
        const pulse = 0.35 + 0.15 * Math.sin(s.t / 180);
        const aura = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.1);
        aura.addColorStop(0, `rgba(251,191,36,${pulse})`);
        aura.addColorStop(1, "rgba(251,191,36,0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // hover halo
      if (b.hover > 0.02) {
        ctx.fillStyle = `rgba(255,255,255,${0.08 * b.hover})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, w + 7, r + 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // body
      const g = ctx.createRadialGradient(-r * 0.32, -r * 0.42, r * 0.08, 0, 0, r * 1.2);
      g.addColorStop(0, shade(b.color, 0.5));
      g.addColorStop(0.4, b.color);
      g.addColorStop(1, shade(b.color, -0.5));
      ctx.fillStyle = g;
      balloonPath(ctx, r);
      ctx.fill();

      // inner lighting (clipped to body)
      ctx.save();
      balloonPath(ctx, r);
      ctx.clip();
      // bounce light from below
      const bounce = ctx.createRadialGradient(0, r * 0.95, 0, 0, r * 0.95, r * 0.9);
      bounce.addColorStop(0, "rgba(255,255,255,0.28)");
      bounce.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bounce;
      ctx.fillRect(-r, -r, r * 2, r * 2.2);
      // rim darkening
      ctx.strokeStyle = rgba("#000000", 0.28);
      ctx.lineWidth = r * 0.14;
      balloonPath(ctx, r);
      ctx.stroke();
      ctx.restore();

      // outline
      ctx.strokeStyle = b.gold ? "rgba(254,240,138,0.9)" : "rgba(0,0,0,0.25)";
      ctx.lineWidth = b.gold ? 1.6 : 0.8;
      balloonPath(ctx, r);
      ctx.stroke();

      // specular highlights
      ctx.save();
      ctx.translate(-w * 0.4, -r * 0.46);
      ctx.rotate(-0.55);
      const spec = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.3);
      spec.addColorStop(0, "rgba(255,255,255,0.9)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.15, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(-w * 0.12, -r * 0.8, r * 0.07, r * 0.04, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // knot
      ctx.fillStyle = shade(b.color, -0.3);
      ctx.beginPath();
      ctx.moveTo(0, r - 1);
      ctx.quadraticCurveTo(-1.5, r + 2, -4.5, r + 6);
      ctx.lineTo(4.5, r + 6);
      ctx.quadraticCurveTo(1.5, r + 2, 0, r - 1);
      ctx.fill();

      // gold sparkle
      if (b.gold) {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        drawStar(ctx, w * 0.3, -r * 0.1, 4 + Math.sin(s.t / 140) * 1.5, s.t / 700);
      }

      ctx.restore();
    };

    const render = () => {
      ctx.setTransform(s.scale, 0, 0, s.scale, 0, 0);

      // background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#05060a");
      bg.addColorStop(0.6, "#0c1124");
      bg.addColorStop(1, "#1a1340");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // horizon glow
      const glow = ctx.createRadialGradient(W / 2, H + 40, 10, W / 2, H + 40, H * 0.9);
      glow.addColorStop(0, "rgba(124,58,237,0.28)");
      glow.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // stars
      for (const st of s.stars) {
        const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin((s.t / 700) * st.tw + st.ph));
        ctx.fillStyle = `rgba(203,213,225,${a})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // clouds
      for (const c of s.clouds) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(1, 0.32);
        const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, c.w / 2);
        cg.addColorStop(0, `rgba(148,163,255,${c.alpha})`);
        cg.addColorStop(1, "rgba(148,163,255,0)");
        ctx.fillStyle = cg;
        ctx.fillRect(-c.w / 2, -c.w / 2, c.w, c.w);
        ctx.restore();
      }

      ctx.save();
      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake * 2, (Math.random() - 0.5) * s.shake * 2);
      }

      // balloons (back → front)
      for (const b of s.balloons) drawBalloon(b);

      // rings
      for (const rg of s.rings) {
        const p = 1 - rg.life / rg.max;
        const e = 1 - Math.pow(1 - p, 3);
        ctx.strokeStyle = rgba(rg.color, (1 - p) * 0.7);
        ctx.lineWidth = rg.width * (1 - p) + 0.3;
        ctx.beginPath();
        ctx.arc(rg.x, rg.y, rg.r0 + (rg.r1 - rg.r0) * e, 0, Math.PI * 2);
        ctx.stroke();
      }

      // particles
      for (const p of s.particles) {
        const a = Math.max(0, Math.min(1, p.life / p.max));
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        if (p.kind === "spark") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.w * a + 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "shard") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.moveTo(-p.w / 2, 0);
          ctx.quadraticCurveTo(0, -p.h, p.w / 2, 0);
          ctx.quadraticCurveTo(0, p.h * 0.35, -p.w / 2, 0);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.rot * 3));
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      // floating texts
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const t of s.texts) {
        const age = t.max - t.life;
        const pop = 1 + Math.max(0, 1 - age / 8) * 0.5;
        const a = Math.min(1, t.life / 18);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `700 ${t.size * pop}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      ctx.restore(); // end shake

      // gold flash
      if (s.flash > 0.02) {
        ctx.fillStyle = `rgba(253,224,71,${s.flash * 0.18})`;
        ctx.fillRect(0, 0, W, H);
      }

      // combo meter
      if (s.running && s.combo >= 2) {
        const mult = Math.min(5, 1 + Math.floor((s.combo - 1) / 4));
        const ratio = Math.max(0, 1 - (s.clock - s.lastPopAt) / COMBO_WINDOW);
        const pw = 132;
        const px = W / 2 - pw / 2;
        const py = 10;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        roundedRect(ctx, px, py, pw, 26, 13);
        ctx.fill();
        ctx.save();
        roundedRect(ctx, px, py, pw, 26, 13);
        ctx.clip();
        const bar = ctx.createLinearGradient(px, 0, px + pw, 0);
        bar.addColorStop(0, "rgba(251,146,60,0.55)");
        bar.addColorStop(1, "rgba(251,191,36,0.55)");
        ctx.fillStyle = bar;
        ctx.fillRect(px, py, pw * ratio, 26);
        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(`${s.combo} COMBO${mult > 1 ? `  ×${mult}` : ""}`, W / 2, py + 13.5);
      }

      // reticle (mouse only)
      if (s.running && !s.paused && s.pointer.inside && s.pointer.type === "mouse") {
        const hot = s.hoverId !== -1;
        const rr = hot ? 13 : 10;
        ctx.strokeStyle = hot ? "#fde047" : "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.pointer.x, s.pointer.y, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(s.pointer.x, s.pointer.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        for (const [dx, dy] of [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]) {
          ctx.moveTo(s.pointer.x + dx * (rr + 2), s.pointer.y + dy * (rr + 2));
          ctx.lineTo(s.pointer.x + dx * (rr + 6), s.pointer.y + dy * (rr + 6));
        }
        ctx.stroke();
      }

      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      update(dt, dt / 16.667);
      render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // auto-pause when tab is hidden
    const onVisibility = () => {
      if (document.hidden && s.running && !s.paused) {
        s.paused = true;
        setIsPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // keyboard: P / Esc / Space = pause, R = restart
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (s.running && (e.key === "p" || e.key === "P" || e.key === "Escape")) {
        togglePause();
      } else if (s.running && e.key === " ") {
        e.preventDefault();
        togglePause();
      } else if ((s.running || s.over) && (e.key === "r" || e.key === "R")) {
        startGame();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey);
    };
  }, [startGame, togglePause]);

  /* ── pointer input ────────────────────────────────────────────────────── */

  const toLogical = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLogical(e);
    const ptr = sim.current.pointer;
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.inside = true;
    ptr.type = e.pointerType;
  };

  const handlePointerLeave = () => {
    sim.current.pointer.inside = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = sim.current;
    const p = toLogical(e);
    s.pointer.x = p.x;
    s.pointer.y = p.y;
    s.pointer.type = e.pointerType;
    s.pointer.inside = e.pointerType === "mouse";
    if (!s.running || s.paused) return;

    s.clicks++;
    const pad = e.pointerType === "mouse" ? 4 : 10; // friendlier on touch
    for (let i = s.balloons.length - 1; i >= 0; i--) {
      if (hitTest(s.balloons[i], p.x, p.y, pad)) {
        popBalloon(s, i);
        return;
      }
    }

    // miss
    if (s.mode === "blitz") s.combo = 0;
    s.rings.push({ x: p.x, y: p.y, r0: 3, r1: 20, life: 14, max: 14, color: "#94a3b8", width: 1.5 });
  };

  /* ── UI ───────────────────────────────────────────────────────────────── */

  const showStartOrOver = !isPlaying || isGameOver;
  const bestShown = Math.max(highScore, gameMode === "blitz" ? score : 0);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto space-y-4 select-none">
      {/* Top Controls */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2">
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
              <span className="text-sm font-bold font-mono text-ink">{bestShown}</span>
            </div>
          )}

          {isPlaying && !isGameOver && (
            <button
              onClick={togglePause}
              aria-label={isPaused ? "Resume" : "Pause"}
              className="h-[46px] w-[46px] flex items-center justify-center bg-surface-2 border border-hairline rounded-lg text-ink-subtle hover:text-ink transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>
          )}
        </div>
      </div>

      {/* Canvas Interactive Zone */}
      <div
        ref={wrapRef}
        className="relative w-full aspect-[4/3] max-w-[640px] bg-surface-2 rounded-2xl border border-hairline shadow-2xl overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerLeave}
          className="absolute inset-0 w-full h-full block cursor-none touch-none"
        />

        {/* Start / Game Over overlay */}
        {showStartOrOver && (
          <div className="absolute inset-0 bg-surface-1/80 rounded-2xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-sm cursor-default px-4 text-center">
            <span className="text-2xl font-bold text-ink font-mono">
              {isGameOver ? "Time's Up!" : "🎈 Balloon Popper"}
            </span>

            {isGameOver ? (
              <>
                <p className="text-sm text-ink">
                  You scored <span className="font-bold font-mono">{score}</span> points
                  {stats.newBest && <span className="ml-2 text-amber-400 font-semibold">🏆 New best!</span>}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Pops", value: stats.pops },
                    { label: "Best combo", value: stats.maxCombo },
                    { label: "Accuracy", value: `${stats.accuracy}%` },
                  ].map((st) => (
                    <div key={st.label} className="bg-surface-2/80 border border-hairline rounded-lg px-3 py-1.5 min-w-[78px]">
                      <span className="block text-[10px] uppercase font-mono text-ink-subtle">{st.label}</span>
                      <span className="text-sm font-bold font-mono text-ink">{st.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-ink-subtle max-w-[320px]">
                Pop balloons, chain pops for combo multipliers, and catch the glowing gold ones for 50 pts
                {gameMode === "blitz" ? ` and +${GOLD_BONUS_SECONDS}s` : ""}.
              </p>
            )}

            <button
              onClick={() => startGame(gameMode)}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-1.5"
            >
              {isGameOver ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isGameOver ? "Play Again" : "Start Popping"}</span>
            </button>
          </div>
        )}

        {/* Pause overlay */}
        {isPlaying && !isGameOver && isPaused && (
          <div className="absolute inset-0 bg-surface-1/70 rounded-2xl flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-sm cursor-default">
            <span className="text-xl font-bold text-ink font-mono">Paused</span>
            <div className="flex items-center gap-2">
              <button
                onClick={togglePause}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
              <button
                onClick={() => startGame(gameMode)}
                className="px-4 py-2 rounded-lg bg-surface-2 border border-hairline text-ink text-xs font-semibold transition-all flex items-center gap-1.5 hover:bg-surface-3"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-ink-subtle text-center">
        Click or tap balloons to pop them · chain pops for ×multipliers · <kbd className="font-mono">P</kbd> pause ·{" "}
        <kbd className="font-mono">R</kbd> restart
      </div>
    </div>
  );
}
