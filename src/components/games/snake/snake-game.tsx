"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Pause, Play, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { sounds } from "../sound-manager";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants & types                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Mode = "classic" | "wrap";
interface Point {
  x: number;
  y: number;
}
interface Food extends Point {
  born: number;
  life?: number; // bonus only (ms of game time)
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  g: number;
}
interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  max: number;
}
interface Mote {
  x: number;
  y: number;
  r: number;
  v: number;
  ph: number;
}

const GRID_SIZE = 20;
const SIZE = 400; // logical canvas size
const CELL = SIZE / GRID_SIZE;
const HS_KEYS: Record<Mode, string> = {
  classic: "devdash_snake_highscore",
  wrap: "devdash_snake_highscore_wrap",
};
const BONUS_LIFE = 6500;

const OPP: Record<Direction, Direction> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
const VEC: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};
const ANG: Record<Direction, number> = { RIGHT: 0, DOWN: Math.PI / 2, LEFT: Math.PI, UP: -Math.PI / 2 };

interface Sim {
  state: "idle" | "running" | "dying" | "over";
  paused: boolean;
  mode: Mode;
  snake: Point[];
  prev: Point[];
  dir: Direction;
  queue: Direction[];
  food: Food;
  bonus: Food | null;
  grow: number;
  score: number;
  apples: number;
  tickMs: number;
  acc: number;
  t: number; // ambient clock
  gameT: number; // running clock
  angle: number;
  bulges: number[];
  particles: Particle[];
  popups: Popup[];
  motes: Mote[];
  shake: number;
  flash: number;
  dieT: number;
  dieIdx: number;
  dieTotal: number;
  win: boolean;
  high: Record<Mode, number>;
  scale: number;
  reduced: boolean;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
};
const easeOutBack = (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

function initialSnake(): Point[] {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
}

function pickFreeCell(snake: Point[], avoid: (Point | null)[]): Point | null {
  const taken = new Set<number>();
  for (const sg of snake) taken.add(sg.y * GRID_SIZE + sg.x);
  for (const a of avoid) if (a) taken.add(a.y * GRID_SIZE + a.x);
  const free: Point[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!taken.has(y * GRID_SIZE + x)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function makeSim(): Sim {
  const snake = initialSnake();
  return {
    state: "idle",
    paused: false,
    mode: "classic",
    snake,
    prev: snake.map((s) => ({ ...s })),
    dir: "RIGHT",
    queue: [],
    food: { x: 15, y: 10, born: 0 },
    bonus: null,
    grow: 0,
    score: 0,
    apples: 0,
    tickMs: 115,
    acc: 0,
    t: 0,
    gameT: 0,
    angle: 0,
    bulges: [],
    particles: [],
    popups: [],
    motes: [],
    shake: 0,
    flash: 0,
    dieT: 0,
    dieIdx: 0,
    dieTotal: 600,
    win: false,
    high: { classic: 0, wrap: 0 },
    scale: 1,
    reduced: false,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function SnakeGame() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sim = useRef<Sim>(makeSim());
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [length, setLength] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<Mode>("classic");

  /* ── board setup ──────────────────────────────────────────────────────── */

  const initBoard = useCallback(() => {
    const s = sim.current;
    const snake = initialSnake();
    s.snake = snake;
    s.prev = snake.map((p) => ({ ...p }));
    s.dir = "RIGHT";
    s.queue = [];
    s.angle = 0;
    s.grow = 0;
    s.score = 0;
    s.apples = 0;
    s.tickMs = 115;
    s.acc = 0;
    s.gameT = 0;
    s.bulges = [];
    s.particles = [];
    s.popups = [];
    s.bonus = null;
    s.shake = 0;
    s.flash = 0;
    s.dieT = 0;
    s.dieIdx = 0;
    s.win = false;
    const f = pickFreeCell(snake, []) ?? { x: 15, y: 10 };
    s.food = { x: f.x, y: f.y, born: s.t };
  }, []);

  const resetGame = useCallback(() => {
    const s = sim.current;
    initBoard();
    s.state = "running";
    s.paused = false;
    setScore(0);
    setLevel(1);
    setLength(3);
    setIsGameOver(false);
    setIsWin(false);
    setIsNewBest(false);
    setIsPaused(false);
    setIsPlaying(true);
    setHighScore(s.high[s.mode]);
  }, [initBoard]);

  const changeMode = useCallback(
    (m: Mode) => {
      const s = sim.current;
      if (s.mode === m) return;
      s.mode = m;
      s.state = "idle";
      s.paused = false;
      initBoard();
      setMode(m);
      setScore(0);
      setLevel(1);
      setLength(3);
      setIsPlaying(false);
      setIsGameOver(false);
      setIsPaused(false);
      setHighScore(s.high[m]);
    },
    [initBoard]
  );

  const changeDirection = useCallback((dir: Direction) => {
    const s = sim.current;
    if (s.state !== "running" || s.paused) return;
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (dir === last || dir === OPP[last]) return;
    if (s.queue.length < 2) s.queue.push(dir);
  }, []);

  const togglePause = useCallback(() => {
    const s = sim.current;
    if (s.state !== "running") return;
    s.paused = !s.paused;
    setIsPaused(s.paused);
  }, []);

  /* ── keyboard + visibility ────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable)) return;
      const s = sim.current;
      const active = s.state === "running" || s.state === "dying";

      const dirMap: Record<string, Direction> = {
        ArrowUp: "UP",
        w: "UP",
        W: "UP",
        ArrowDown: "DOWN",
        s: "DOWN",
        S: "DOWN",
        ArrowLeft: "LEFT",
        a: "LEFT",
        A: "LEFT",
        ArrowRight: "RIGHT",
        d: "RIGHT",
        D: "RIGHT",
      };
      if (dirMap[e.key]) {
        if (active) e.preventDefault();
        changeDirection(dirMap[e.key]);
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        if (el?.tagName === "BUTTON") return;
        e.preventDefault();
        if (s.state === "idle" || s.state === "over") resetGame();
        else if (s.state === "running") togglePause();
      } else if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (s.state === "running") {
          e.preventDefault();
          togglePause();
        }
      } else if (e.key === "r" || e.key === "R") {
        if (s.state !== "idle") {
          e.preventDefault();
          resetGame();
        }
      }
    };
    const onVis = () => {
      const s = sim.current;
      if (document.hidden && s.state === "running" && !s.paused) {
        s.paused = true;
        setIsPaused(true);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [changeDirection, resetGame, togglePause]);

  /* ── main loop ────────────────────────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = sim.current;

    s.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    try {
      (["classic", "wrap"] as Mode[]).forEach((m) => {
        const v = localStorage.getItem(HS_KEYS[m]);
        if (v) s.high[m] = parseInt(v, 10) || 0;
      });
    } catch {
      /* ignore */
    }
    setHighScore(s.high[s.mode]);

    s.motes = Array.from({ length: 22 }, () => ({
      x: Math.random() * SIZE,
      y: Math.random() * SIZE,
      r: 0.8 + Math.random() * 1.6,
      v: 0.1 + Math.random() * 0.3,
      ph: Math.random() * 6.28,
    }));
    initBoard();

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      s.scale = canvas.width / SIZE;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const burst = (x: number, y: number, colors: string[], n: number, speed: number, g = 0.05) => {
      const count = s.reduced ? Math.ceil(n / 3) : n;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.4 + Math.random()) * speed;
        s.particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 25 + Math.random() * 20,
          max: 45,
          size: 1.8 + Math.random() * 2.6,
          color: colors[i % colors.length],
          g,
        });
      }
    };

    const segPos = (i: number, tt: number): { x: number; y: number } => {
      const c = s.snake[i];
      const pv = s.prev[i] ?? c;
      const far = Math.abs(c.x - pv.x) > 1.5 || Math.abs(c.y - pv.y) > 1.5;
      const gx = far ? c.x : pv.x + (c.x - pv.x) * tt;
      const gy = far ? c.y : pv.y + (c.y - pv.y) * tt;
      return { x: gx * CELL + CELL / 2, y: gy * CELL + CELL / 2 };
    };

    const finish = (win: boolean) => {
      s.state = "over";
      s.win = win;
      let nb = false;
      if (s.score > s.high[s.mode] && s.score > 0) {
        s.high[s.mode] = s.score;
        nb = true;
        try {
          localStorage.setItem(HS_KEYS[s.mode], String(s.score));
        } catch {
          /* ignore */
        }
        setHighScore(s.score);
      }
      setLength(s.snake.length);
      setIsNewBest(nb);
      setIsWin(win);
      setIsGameOver(true);
    };

    const crash = () => {
      s.state = "dying";
      s.dieT = 0;
      s.dieIdx = 0;
      s.dieTotal = Math.min(1000, 300 + s.snake.length * 30);
      s.shake = s.reduced ? 0 : 7;
      s.flash = 1;
      sounds.playGameOver();
    };

    /* one logic tick */
    const step = () => {
      if (s.queue.length) s.dir = s.queue.shift() as Direction;
      const v = VEC[s.dir];
      let hx = s.snake[0].x + v.x;
      let hy = s.snake[0].y + v.y;

      if (s.mode === "wrap") {
        hx = (hx + GRID_SIZE) % GRID_SIZE;
        hy = (hy + GRID_SIZE) % GRID_SIZE;
      } else if (hx < 0 || hx >= GRID_SIZE || hy < 0 || hy >= GRID_SIZE) {
        crash();
        return;
      }

      const body = s.grow > 0 ? s.snake : s.snake.slice(0, -1);
      if (body.some((sg) => sg.x === hx && sg.y === hy)) {
        crash();
        return;
      }

      const old = s.snake;
      const next = [{ x: hx, y: hy }, ...old];
      let ate = false;

      if (hx === s.food.x && hy === s.food.y) {
        ate = true;
        s.score += 10;
        s.apples++;
        s.tickMs = Math.max(62, 115 - s.apples * 2.2);
        s.bulges.push(0);
        const fx = hx * CELL + CELL / 2;
        const fy = hy * CELL + CELL / 2;
        burst(fx, fy, ["#ef4444", "#f87171", "#fca5a5", "#22c55e"], 16, 2.6);
        s.popups.push({ x: fx, y: fy - 8, text: "+10", color: "#fecaca", life: 45, max: 45 });
        sounds.playScore();
        setScore(s.score);
        setLevel(1 + Math.floor(s.apples / 5));

        const f = pickFreeCell(next, [s.bonus]);
        if (!f) {
          s.prev = next.map((_, i) => old[Math.min(i, old.length - 1)]);
          s.snake = next;
          finish(true);
          return;
        }
        s.food = { x: f.x, y: f.y, born: s.gameT };
        if (!s.bonus && s.apples % 5 === 0) {
          const b = pickFreeCell(next, [s.food]);
          if (b) s.bonus = { x: b.x, y: b.y, born: s.gameT, life: BONUS_LIFE };
        }
      } else if (s.bonus && hx === s.bonus.x && hy === s.bonus.y) {
        ate = true;
        s.score += 50;
        s.grow += 2;
        s.bulges.push(0);
        const fx = hx * CELL + CELL / 2;
        const fy = hy * CELL + CELL / 2;
        burst(fx, fy, ["#fde047", "#fbbf24", "#fff7ae", "#f59e0b"], 28, 3.4, 0.03);
        s.popups.push({ x: fx, y: fy - 8, text: "+50", color: "#fde047", life: 60, max: 60 });
        s.flash = Math.max(s.flash, 0.5);
        s.bonus = null;
        sounds.playScore();
        setScore(s.score);
      }

      if (!ate) {
        if (s.grow > 0) s.grow--;
        else next.pop();
      }

      s.prev = next.map((_, i) => old[Math.min(i, old.length - 1)]);
      s.snake = next;
      s.bulges = s.bulges.map((b) => b + 1).filter((b) => b < next.length + 2);
    };

    /* update ─────────────────────────────────────────────────────────────── */
    const update = (dt: number, k: number) => {
      s.t += dt;
      s.shake *= Math.pow(0.88, k);
      if (s.shake < 0.1) s.shake = 0;
      s.flash *= Math.pow(0.9, k);

      for (const m of s.motes) {
        m.y -= m.v * k;
        m.x += Math.sin(s.t / 900 + m.ph) * 0.12 * k;
        if (m.y < -4) {
          m.y = SIZE + 4;
          m.x = Math.random() * SIZE;
        }
      }
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const q = s.particles[i];
        q.x += q.vx * k;
        q.y += q.vy * k;
        q.vy += q.g * k;
        q.vx *= Math.pow(0.97, k);
        q.life -= k;
        if (q.life <= 0) s.particles.splice(i, 1);
      }
      for (let i = s.popups.length - 1; i >= 0; i--) {
        s.popups[i].y -= 0.5 * k;
        s.popups[i].life -= k;
        if (s.popups[i].life <= 0) s.popups.splice(i, 1);
      }

      // head heading (smooth turn)
      const target = ANG[s.dir];
      const diff = ((target - s.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      s.angle += diff * Math.min(1, 0.35 * k);

      if (s.state === "running" && !s.paused) {
        s.gameT += dt;
        s.acc += dt;
        let guard = 0;
        while (s.acc >= s.tickMs && s.state === "running" && guard++ < 4) {
          s.acc -= s.tickMs;
          step();
        }
        if (s.bonus && s.bonus.life && s.gameT - s.bonus.born > s.bonus.life) {
          burst(s.bonus.x * CELL + CELL / 2, s.bonus.y * CELL + CELL / 2, ["#fbbf24", "#92400e"], 8, 1.4, 0.02);
          s.bonus = null;
        }
      } else if (s.state === "dying") {
        s.dieT += dt;
        const n = s.snake.length;
        const per = s.dieTotal / Math.max(1, n);
        const upto = Math.min(n, Math.floor(s.dieT / per));
        const tt = Math.min(1, s.acc / s.tickMs);
        while (s.dieIdx < upto) {
          const pos = segPos(s.dieIdx, tt);
          burst(pos.x, pos.y, ["#4ade80", "#22c55e", "#16a34a", "#bbf7d0"], 4, 2.2, 0.12);
          s.dieIdx++;
        }
        if (s.dieT >= s.dieTotal + 250) finish(false);
      }
    };

    /* render ─────────────────────────────────────────────────────────────── */
    const drawApple = (gx: number, gy: number, food: Food, gold: boolean) => {
      const cx = gx * CELL + CELL / 2;
      const cy = gy * CELL + CELL / 2;
      const clock = s.state === "running" || s.state === "dying" || s.state === "over" ? s.gameT : s.t;
      const age = clock - food.born;
      const pop = easeOutBack(Math.min(1, Math.max(0, age / 320)));
      const pulse = 1 + 0.06 * Math.sin(s.t / 200);
      const r = CELL * 0.37;

      ctx.save();
      ctx.translate(cx, cy);

      // glow
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, CELL * 1.25);
      glow.addColorStop(0, gold ? "rgba(251,191,36,0.5)" : "rgba(239,68,68,0.38)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-CELL * 1.3, -CELL * 1.3, CELL * 2.6, CELL * 2.6);

      // bonus countdown ring
      if (gold && food.life) {
        const left = Math.max(0, 1 - age / food.life);
        const urgent = left < 0.25 && Math.floor(s.t / 120) % 2 === 0;
        ctx.strokeStyle = urgent ? "#f87171" : "rgba(253,224,71,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, CELL * 0.66, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
        ctx.stroke();
      }

      ctx.scale(pop * pulse, pop * pulse);

      // body
      const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
      if (gold) {
        g.addColorStop(0, "#fef9c3");
        g.addColorStop(0.45, "#fbbf24");
        g.addColorStop(1, "#b45309");
      } else {
        g.addColorStop(0, "#fecaca");
        g.addColorStop(0.45, "#ef4444");
        g.addColorStop(1, "#7f1d1d");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(-r * 0.25, 0.5, r * 0.82, 0, Math.PI * 2);
      ctx.arc(r * 0.25, 0.5, r * 0.82, 0, Math.PI * 2);
      ctx.fill();

      // stem + leaf
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.7);
      ctx.lineTo(1.5, -r * 1.25);
      ctx.stroke();
      if (!gold) {
        ctx.save();
        ctx.translate(2.5, -r * 1.05);
        ctx.rotate(-0.5 + Math.sin(s.t / 400) * 0.12);
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.ellipse(r * 0.45, 0, r * 0.5, r * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // shine
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.5, -r * 0.2, r * 0.17, r * 0.3, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // sparkle
      if (gold) {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.save();
        ctx.translate(r * 0.55, -r * 0.5);
        ctx.rotate(s.t / 500);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const rr = i % 2 === 0 ? 3.4 : 0.9;
          const a = (i * Math.PI) / 4;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    const drawHead = (x: number, y: number, dead: boolean) => {
      const R = CELL * 0.5;
      const fx = s.food.x * CELL + CELL / 2 - x;
      const fy = s.food.y * CELL + CELL / 2 - y;
      const dist = Math.hypot(fx, fy) || 1;
      const dxn = fx / dist;
      const dyn = fy / dist;
      const ca = Math.cos(s.angle);
      const sa = Math.sin(s.angle);
      const lx = dxn * ca + dyn * sa;
      const ly = -dxn * sa + dyn * ca;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.angle);

      // tongue
      const flick = Math.max(0, Math.sin(s.t / 260));
      const ext = Math.pow(flick, 4) * 0.9 + (dist < CELL * 3.2 ? 0.5 : 0);
      if (!dead && ext > 0.05) {
        const L = CELL * (0.3 + 0.55 * Math.min(1, ext));
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(R * 0.8, 0);
        ctx.lineTo(R * 0.8 + L, 0);
        ctx.moveTo(R * 0.8 + L, 0);
        ctx.lineTo(R * 0.8 + L + 4, -3);
        ctx.moveTo(R * 0.8 + L, 0);
        ctx.lineTo(R * 0.8 + L + 4, 3);
        ctx.stroke();
      }

      // head shape
      ctx.fillStyle = "#052e16";
      ctx.beginPath();
      ctx.ellipse(R * 0.1, 0, R * 1.08 + 1.5, R * 0.98 + 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      const hg = ctx.createRadialGradient(-R * 0.2, -R * 0.4, 1, 0, 0, R * 1.2);
      hg.addColorStop(0, "#86efac");
      hg.addColorStop(0.6, "#4ade80");
      hg.addColorStop(1, "#22c55e");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.ellipse(R * 0.1, 0, R * 1.08, R * 0.98, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.ellipse(R * 0.55, 0, R * 0.5, R * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // nostrils
      ctx.fillStyle = "#14532d";
      ctx.beginPath();
      ctx.arc(R * 0.95, -R * 0.22, 0.9, 0, Math.PI * 2);
      ctx.arc(R * 0.95, R * 0.22, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // eyes
      for (const side of [-1, 1]) {
        const ex = R * 0.28;
        const ey = side * R * 0.52;
        if (dead) {
          ctx.strokeStyle = "#052e16";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(ex - 2.6, ey - 2.6);
          ctx.lineTo(ex + 2.6, ey + 2.6);
          ctx.moveTo(ex + 2.6, ey - 2.6);
          ctx.lineTo(ex - 2.6, ey + 2.6);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(ex, ey, R * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#052e16";
          ctx.beginPath();
          ctx.arc(ex + lx * R * 0.1, ey + ly * R * 0.1, R * 0.16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(ex + lx * R * 0.1 - 0.8, ey + ly * R * 0.1 - 0.8, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const render = () => {
      ctx.setTransform(s.scale, 0, 0, s.scale, 0, 0);

      // board
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? "#0e131a" : "#0b0f15";
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
      }
      const bgGlow = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 40, SIZE / 2, SIZE / 2, SIZE * 0.75);
      bgGlow.addColorStop(0, "rgba(34,197,94,0.05)");
      bgGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.save();
      if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake * 2, (Math.random() - 0.5) * s.shake * 2);

      // ambient motes
      for (const m of s.motes) {
        const a = 0.12 + 0.12 * Math.sin(s.t / 700 + m.ph);
        ctx.fillStyle = `rgba(134,239,172,${a})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // walls
      if (s.mode === "classic") {
        const pulse = 0.5 + 0.5 * Math.sin(s.t / 450);
        ctx.strokeStyle = `rgba(239,68,68,${0.22 + 0.18 * pulse})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, SIZE - 4, SIZE - 4);
        ctx.strokeStyle = "rgba(239,68,68,0.08)";
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, SIZE - 12, SIZE - 12);
      } else {
        ctx.strokeStyle = "rgba(34,211,238,0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -s.t / 60;
        ctx.strokeRect(1.5, 1.5, SIZE - 3, SIZE - 3);
        ctx.setLineDash([]);
      }

      // food
      drawApple(s.food.x, s.food.y, s.food, false);
      if (s.bonus) drawApple(s.bonus.x, s.bonus.y, s.bonus, true);

      // snake
      const N = s.snake.length;
      const tt = Math.min(1, s.acc / s.tickMs);
      const start = s.state === "dying" ? s.dieIdx : s.state === "over" && !s.win ? N : 0;
      if (start < N) {
        const pts: { x: number; y: number; link: boolean }[] = [];
        for (let i = 0; i < N; i++) {
          const pos = segPos(i, tt);
          const link = i > 0 && Math.hypot(pos.x - pts[i - 1].x, pos.y - pts[i - 1].y) < CELL * 1.6;
          pts.push({ ...pos, link });
        }
        const rad = (i: number) => {
          const f = i / Math.max(1, N - 1);
          let r = CELL * (0.46 - 0.17 * f);
          for (const b of s.bulges) {
            const d = i - (b + tt);
            r += CELL * 0.12 * Math.exp((-d * d) / 1.2);
          }
          return r;
        };
        const colorAt = (i: number) => mix("#4ade80", "#166534", i / Math.max(1, N - 1));

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const pass = (extra: number, colorFn: (i: number) => string) => {
          for (let i = N - 1; i >= start; i--) {
            const r = rad(i);
            const col = colorFn(i);
            ctx.fillStyle = col;
            ctx.strokeStyle = col;
            ctx.beginPath();
            ctx.arc(pts[i].x, pts[i].y, r + extra, 0, Math.PI * 2);
            ctx.fill();
            if (i > start && pts[i].link) {
              ctx.lineWidth = r + rad(i - 1) + extra * 2;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
              ctx.stroke();
            }
          }
        };

        // soft shadow
        ctx.globalAlpha = 0.25;
        for (let i = N - 1; i >= start; i--) {
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.arc(pts[i].x + 2, pts[i].y + 3, rad(i), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        pass(1.6, () => "#052e16"); // outline
        pass(0, colorAt); // body

        // scales + sheen
        for (let i = N - 1; i >= Math.max(start, 1); i--) {
          const r = rad(i);
          if (i % 2 === 0) {
            ctx.fillStyle = "rgba(5,46,22,0.22)";
            ctx.beginPath();
            ctx.arc(pts[i].x, pts[i].y, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "rgba(255,255,255,0.13)";
          ctx.beginPath();
          ctx.arc(pts[i].x - r * 0.25, pts[i].y - r * 0.3, r * 0.34, 0, Math.PI * 2);
          ctx.fill();
        }

        // head
        if (start === 0) {
          drawHead(pts[0].x, pts[0].y, s.state === "dying" || (s.state === "over" && !s.win));
          if (s.state === "dying" && s.dieT < 180) {
            ctx.strokeStyle = `rgba(248,113,113,${1 - s.dieT / 180})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(pts[0].x, pts[0].y, CELL * (0.6 + s.dieT / 140), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // particles
      for (const q of s.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, q.life / q.max));
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (0.5 + 0.5 * (q.life / q.max)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // popups
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 14px ui-monospace, SFMono-Regular, Menlo, monospace";
      for (const p of s.popups) {
        const age = p.max - p.life;
        const pop = 1 + Math.max(0, 1 - age / 8) * 0.5;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 18);
        ctx.translate(p.x, p.y);
        ctx.scale(pop, pop);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineJoin = "round";
        ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
      }

      ctx.restore(); // end shake

      // flash + vignette
      if (s.flash > 0.02) {
        ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.12})`;
        ctx.fillRect(0, 0, SIZE, SIZE);
      }
      const vg = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.4, SIZE / 2, SIZE / 2, SIZE * 0.78);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, SIZE, SIZE);
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      update(dt, dt / 16.667);
      render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [initBoard]);

  /* ── swipe controls ───────────────────────────────────────────────────── */

  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = swipe.current;
    if (!st) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (Math.hypot(dx, dy) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) changeDirection(dx > 0 ? "RIGHT" : "LEFT");
    else changeDirection(dy > 0 ? "DOWN" : "UP");
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    swipe.current = null;
  };

  /* ── UI ───────────────────────────────────────────────────────────────── */

  const dpadBtn =
    "w-11 h-11 rounded-lg bg-surface-2 active:bg-surface-3 active:scale-95 border border-hairline flex items-center justify-center text-ink hover:text-primary transition-all touch-none";

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 select-none">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between gap-2">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-ink font-mono flex items-center gap-2">🐍 Retro Snake</h2>
          <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-hairline w-fit">
            {(["classic", "wrap"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                aria-pressed={mode === m}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  mode === m ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
                }`}
              >
                {m === "classic" ? "Classic walls" : "Wrap-around"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[60px]">
            <span className="block text-[10px] uppercase font-mono text-ink-subtle">Score</span>
            <span className="text-sm font-bold font-mono text-ink">{score}</span>
          </div>

          <div className="bg-surface-2 border border-hairline px-3 py-1.5 rounded-lg text-center min-w-[60px]">
            <span className="text-[10px] uppercase font-mono text-ink-subtle flex items-center justify-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-amber-500" /> Best
            </span>
            <span className="text-sm font-bold font-mono text-ink">{Math.max(highScore, score)}</span>
          </div>
        </div>
      </div>

      {/* Level / pause strip */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-ink-subtle -mt-1">
        <span>
          Level <span className="text-ink font-bold">{level}</span> · Golden apples = +50
        </span>
        {isPlaying && !isGameOver && (
          <button
            onClick={togglePause}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-2 border border-hairline hover:text-ink transition-colors"
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative w-full aspect-square max-w-[400px] bg-surface-2 p-2 rounded-2xl border border-hairline shadow-2xl flex items-center justify-center">
        <div
          ref={wrapRef}
          className="relative w-full h-full rounded-xl overflow-hidden touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

          {/* Start / Game Over overlay */}
          {(!isPlaying || isGameOver) && (
            <div className="absolute inset-0 bg-surface-1/80 flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-sm px-4 text-center">
              <span className="text-xl font-bold text-ink font-mono">
                {isGameOver ? (isWin ? "🏆 Perfect Game!" : "Game Over!") : "Classic Snake"}
              </span>
              {isGameOver ? (
                <>
                  <p className="text-sm text-ink">
                    You scored <span className="font-bold font-mono">{score}</span> points
                    {isNewBest && <span className="ml-2 text-amber-400 font-semibold">🏆 New best!</span>}
                  </p>
                  <p className="text-[11px] font-mono text-ink-subtle">
                    Length {length} · Level {level}
                  </p>
                </>
              ) : (
                <p className="text-xs text-ink-subtle max-w-[260px]">
                  Arrow keys / WASD or swipe to slither. Eat apples, grab the golden ones before they vanish.
                </p>
              )}
              <button
                onClick={resetGame}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-1.5"
              >
                {isGameOver ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isGameOver ? "Play Again" : "Start Game"}</span>
              </button>
              <p className="text-[10px] text-ink-subtle">or press Space</p>
            </div>
          )}

          {/* Paused Overlay */}
          {isPaused && (
            <div className="absolute inset-0 bg-surface-1/80 flex flex-col items-center justify-center space-y-3 z-10 backdrop-blur-sm">
              <span className="text-xl font-bold text-ink font-mono">Game Paused</span>
              <button
                onClick={togglePause}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/30"
              >
                Resume
              </button>
            </div>
          )}
        </div>
      </div>

      {/* D-Pad for Mobile or Click Controls */}
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            changeDirection("UP");
          }}
          className={dpadBtn}
          aria-label="Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              changeDirection("LEFT");
            }}
            className={dpadBtn}
            aria-label="Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              changeDirection("DOWN");
            }}
            className={dpadBtn}
            aria-label="Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              changeDirection("RIGHT");
            }}
            className={dpadBtn}
            aria-label="Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
