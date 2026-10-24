"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw, Pause } from "lucide-react";
import { sounds } from "../sound-manager";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants & types                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const W = 800; // logical canvas size (scaled to any display size / DPR)
const H = 260;
const GROUND = 205; // y of the ground line
const P = 3; // one "art pixel" in logical px
const DINO_X = 70;
const HS_KEY = "devdash_dino_highscore";

type Pose = "run" | "jump" | "duck" | "dead";

interface Part {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  d: boolean; // detail part (no outline)
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Cactus {
  dx: number;
  hU: number;
  flower: boolean;
}
interface Obstacle {
  type: "cactus" | "bird";
  x: number;
  y: number;
  w: number;
  h: number;
  boxes: Box[]; // x relative to obstacle.x, y absolute
  cacti: Cactus[];
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
interface Cloud {
  x: number;
  y: number;
  v: number;
  s: number;
}
interface Star {
  x: number;
  y: number;
  tw: number;
  ph: number;
}

interface Sim {
  state: "idle" | "running" | "over";
  paused: boolean;
  dinoY: number; // ≤ 0 (px above ground)
  vy: number;
  jumping: boolean;
  jumpHeld: boolean;
  ducking: boolean;
  speed: number;
  distance: number;
  score: number;
  hi: number;
  scroll: number;
  runPhase: number;
  t: number;
  shake: number;
  blink: number;
  spawnTimer: number;
  dustTimer: number;
  overAt: number;
  newBest: boolean;
  lastMilestone: number;
  lastSpeedDisp: number;
  scale: number;
  reduced: boolean;
  obstacles: Obstacle[];
  particles: Particle[];
  clouds: Cloud[];
  stars: Star[];
}

const C = {
  G: "#22c55e",
  L: "#86efac",
  D: "#14532d",
  B: "#fde68a",
  Y: "#f59e0b",
  R: "#ef4444",
  Rd: "#b91c1c",
  W: "#ffffff",
  K: "#0f172a",
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const p = (x: number, y: number, w: number, h: number, c: string, d = false): Part => ({ x, y, w, h, c, d });

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
};
const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function drawSprite(ctx: CanvasRenderingContext2D, parts: Part[], ox: number, oy: number, outline: string | null) {
  if (outline) {
    ctx.fillStyle = outline;
    for (const q of parts) {
      if (q.d) continue;
      const x = Math.round(ox + q.x * P);
      const y = Math.round(oy + q.y * P);
      const w = q.w * P;
      const h = q.h * P;
      ctx.fillRect(x - P, y, w + 2 * P, h);
      ctx.fillRect(x, y - P, w, h + 2 * P);
    }
  }
  for (const q of parts) {
    ctx.fillStyle = q.c;
    ctx.fillRect(Math.round(ox + q.x * P), Math.round(oy + q.y * P), q.w * P, q.h * P);
  }
}

/* ── Dino (original scarfed raptor) ───────────────────────────────────────── */
function dinoParts(pose: Pose, phase: number, t: number, moving: boolean, blink: boolean): Part[] {
  const o: Part[] = [];
  const w1 = Math.round(Math.sin(t / 90));
  const w2 = Math.round(Math.sin(t / 90 + 1.2));
  const w3 = Math.round(Math.sin(t / 90 + 2.4));

  if (pose === "duck") {
    // legs
    for (let i = 0; i < 2; i++) {
      const ph = phase + i * Math.PI;
      const lift = Math.max(0, Math.sin(ph));
      const fx = Math.round(Math.cos(ph) * 1.5);
      const bx = 9 + i * 5;
      const footY = 19 - Math.round(lift * 2);
      o.push(p(bx + fx, 16, 2, Math.max(1, footY - 16), C.G));
      o.push(p(bx + fx, footY - 1, 3, 1, C.D));
    }
    o.push(p(0, 13, 4, 2, C.G), p(3, 12, 4, 3, C.G)); // tail
    o.push(p(6, 11, 12, 6, C.G)); // body
    o.push(p(8, 14, 10, 3, C.B, true), p(7, 11, 10, 1, C.L, true));
    o.push(p(18, 10, 8, 5, C.G), p(25, 11, 3, 3, C.G)); // head + snout
    o.push(p(21, 14, 7, 1, C.D, true));
    if (blink) o.push(p(21, 12, 2, 1, C.D, true));
    else o.push(p(21, 11, 2, 2, C.W, true), p(22, 12, 1, 1, C.K, true));
    o.push(p(27, 11, 1, 1, C.D, true));
    o.push(p(16, 10, 3, 2, C.R)); // scarf
    o.push(p(13, 11 + w1, 3, 1, C.R), p(10, 11 + w2, 3, 1, C.Rd));
    o.push(p(7, 9, 2, 2, C.Y), p(10, 9, 2, 2, C.Y), p(13, 9, 2, 2, C.Y)); // spikes
    return o;
  }

  const bob = pose === "run" && moving ? -Math.round(Math.abs(Math.cos(phase))) : 0;
  const y = bob;
  const wag = pose === "jump" ? -1 : moving ? Math.round(Math.sin(phase * 2)) : 0;

  // legs first (behind body)
  if (pose === "jump") {
    o.push(p(8, 15, 5, 2, C.G), p(12, 15, 5, 2, C.G), p(12, 17, 2, 1, C.D), p(16, 17, 3, 1, C.D));
  } else {
    for (let i = 0; i < 2; i++) {
      const ph = moving ? phase + i * Math.PI : 0;
      const lift = moving ? Math.max(0, Math.sin(ph)) : 0;
      const fx = moving ? Math.round(Math.cos(ph) * 2) : 0;
      const bx = 8 + i * 4;
      const footY = 19 - Math.round(lift * 3);
      o.push(p(bx, 14, 3, 3, C.G));
      o.push(p(bx + fx, 16, 2, Math.max(1, footY - 16), C.G));
      o.push(p(bx + fx, footY - 1, 4, 1, C.D));
    }
  }

  // tail
  o.push(p(0, 10 + wag + y, 3, 2, C.G), p(2, 9 + y, 4, 3, C.G), p(5, 8 + y, 3, 5, C.G));
  // body
  o.push(p(6, 7 + y, 10, 8, C.G));
  o.push(p(8, 12 + y, 8, 3, C.B, true), p(7, 7 + y, 8, 1, C.L, true));
  // neck + head
  o.push(p(14, 4 + y, 4, 5, C.G));
  o.push(p(15, 0 + y, 8, 5, C.G), p(22, 1 + y, 3, 3, C.G), p(16, 5 + y, 8, 1, C.G));
  o.push(p(19, 4 + y, 5, 1, C.D, true));
  if (pose === "dead") {
    o.push(
      p(19, 1 + y, 1, 1, C.K, true),
      p(21, 1 + y, 1, 1, C.K, true),
      p(20, 2 + y, 1, 1, C.K, true),
      p(19, 3 + y, 1, 1, C.K, true),
      p(21, 3 + y, 1, 1, C.K, true),
      p(21, 5 + y, 2, 2, "#f87171", true)
    );
  } else if (blink) {
    o.push(p(19, 2 + y, 2, 1, C.D, true));
  } else {
    o.push(p(19, 1 + y, 2, 2, C.W, true), p(20, 2 + y, 1, 1, C.K, true));
  }
  o.push(p(24, 1 + y, 1, 1, C.D, true));
  // tiny arms
  o.push(p(17, 9 + y, 3, 1, C.G), p(19, 10 + y, 1, 1, C.G));
  // scarf + flutter
  o.push(p(14, 5 + y, 5, 2, C.R));
  o.push(p(11, 6 + y + w1, 3, 1, C.R), p(8, 6 + y + w2, 3, 1, C.Rd), p(6, 7 + y + w3, 2, 1, C.R));
  // back spikes
  o.push(p(6, 5 + y, 2, 2, C.Y), p(9, 4 + y, 2, 3, C.Y), p(12, 4 + y, 2, 3, C.Y), p(3, 7 + y, 2, 2, C.Y));
  return o;
}

/* ── Cactus ───────────────────────────────────────────────────────────────── */
function cactusParts(hU: number, flower: boolean, night: number): Part[] {
  const body = mix("#16a34a", "#2dd4bf", night * 0.6);
  const light = mix("#4ade80", "#99f6e4", night * 0.6);
  const dark = mix("#166534", "#0f766e", night * 0.6);
  const a1 = Math.max(4, Math.round(hU * 0.45));
  const a2 = Math.max(3, Math.round(hU * 0.6));
  const o: Part[] = [
    p(3, 0, 4, hU, body),
    p(0, a1, 4, 2, body),
    p(0, a1 - 4, 2, 6, body),
    p(6, a2, 4, 2, body),
    p(8, a2 - 3, 2, 5, body),
    p(3, 1, 1, hU - 2, light, true),
    p(6, 1, 1, hU - 1, dark, true),
    p(0, a1 - 3, 1, 4, light, true),
    p(9, a2 - 2, 1, 3, dark, true),
    p(4, 3, 1, 1, "#dcfce7", true),
    p(5, 6, 1, 1, "#dcfce7", true),
    p(4, hU - 3, 1, 1, "#dcfce7", true),
  ];
  if (flower) o.push(p(3, -1, 4, 1, "#f472b6", true), p(4, -2, 2, 1, "#fb7185", true));
  return o;
}

/* ── Pterodactyl ──────────────────────────────────────────────────────────── */
function birdParts(frame: number, night: number): Part[] {
  const pu = mix("#8b5cf6", "#a78bfa", night);
  const pd = mix("#6d28d9", "#7c3aed", night);
  const o: Part[] = [];
  // wings (behind)
  if (frame === 0) o.push(p(5, -4, 5, 4, pd), p(7, -6, 3, 2, pd));
  else if (frame === 1) o.push(p(2, 0, 9, 2, pd));
  else o.push(p(5, 7, 5, 4, pd), p(7, 10, 3, 2, pd));
  o.push(p(0, 4, 3, 2, pu)); // tail
  o.push(p(3, 3, 9, 4, pu)); // body
  o.push(p(4, 6, 7, 1, "#c4b5fd", true));
  o.push(p(11, 2, 4, 4, pu)); // head
  o.push(p(9, 0, 2, 3, pu)); // crest
  o.push(p(15, 3, 4, 1, "#fb923c")); // beak
  o.push(p(12, 3, 1, 1, C.W, true), p(13, 3, 1, 1, C.K, true));
  return o;
}

function cloudParts(): Part[] {
  return [p(1, 2, 12, 2, "#fff"), p(3, 0, 7, 2, "#fff"), p(6, -1, 3, 1, "#fff"), p(0, 3, 2, 1, "#fff")];
}

function makeSim(): Sim {
  return {
    state: "idle",
    paused: false,
    dinoY: 0,
    vy: 0,
    jumping: false,
    jumpHeld: false,
    ducking: false,
    speed: 6.5,
    distance: 0,
    score: 0,
    hi: 0,
    scroll: 0,
    runPhase: 0,
    t: 0,
    shake: 0,
    blink: 0,
    spawnTimer: 60,
    dustTimer: 0,
    overAt: 0,
    newBest: false,
    lastMilestone: 0,
    lastSpeedDisp: 0,
    scale: 1,
    reduced: false,
    obstacles: [],
    particles: [],
    clouds: [],
    stars: [],
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function DinoGame() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sim = useRef<Sim>(makeSim());

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [speedDisp, setSpeedDisp] = useState(6.5);

  /* ── controls ─────────────────────────────────────────────────────────── */

  const start = useCallback(() => {
    const s = sim.current;
    s.state = "running";
    s.paused = false;
    s.dinoY = 0;
    s.vy = 0;
    s.jumping = false;
    s.jumpHeld = false;
    s.ducking = false;
    s.speed = 6.5;
    s.distance = 0;
    s.score = 0;
    s.obstacles = [];
    s.particles = [];
    s.spawnTimer = 60;
    s.shake = 0;
    s.blink = 0;
    s.newBest = false;
    s.lastMilestone = 0;
    setIsPlaying(true);
    setIsGameOver(false);
    setIsPaused(false);
  }, []);

  const addDust = useCallback((x: number, y: number, n: number, spread: number) => {
    const s = sim.current;
    const count = s.reduced ? Math.ceil(n / 3) : n;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.7) * spread,
        vy: -Math.random() * 1.8,
        life: 18 + Math.random() * 12,
        max: 30,
        size: 2 + Math.floor(Math.random() * 3),
        color: Math.random() < 0.5 ? "#d6b878" : "#b8975a",
        g: 0.06,
      });
    }
  }, []);

  const jump = useCallback(() => {
    const s = sim.current;
    if (s.state !== "running" || s.paused) return;
    s.jumpHeld = true;
    if (!s.jumping) {
      s.jumping = true;
      s.vy = -11.5;
      sounds.playJump();
      addDust(DINO_X + 22, GROUND, 6, 2.5);
    }
  }, [addDust]);

  const releaseJump = useCallback(() => {
    const s = sim.current;
    s.jumpHeld = false;
    if (s.jumping && s.vy < -7.5) s.vy = -7.5; // short hop if released early
  }, []);

  const duck = useCallback((on: boolean) => {
    sim.current.ducking = on;
  }, []);

  const press = useCallback(() => {
    const s = sim.current;
    if (s.state !== "running") {
      if (s.state === "over" && performance.now() - s.overAt < 350) return; // avoid accidental restart
      start();
    } else {
      jump();
    }
  }, [start, jump]);

  const togglePause = useCallback(() => {
    const s = sim.current;
    if (s.state !== "running") return;
    s.paused = !s.paused;
    setIsPaused(s.paused);
  }, []);

  /* ── keyboard + visibility ────────────────────────────────────────────── */

  useEffect(() => {
    const isJumpKey = (c: string) => c === "Space" || c === "ArrowUp" || c === "KeyW";
    const skip = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return false;
      return ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable;
    };

    const onDown = (e: KeyboardEvent) => {
      if (skip(e)) return;
      if (isJumpKey(e.code)) {
        if ((e.target as HTMLElement)?.tagName === "BUTTON" && e.code === "Space") return;
        e.preventDefault();
        if (!e.repeat) press();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        duck(true);
      } else if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        togglePause();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        start();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (isJumpKey(e.code)) releaseJump();
      else if (e.code === "ArrowDown" || e.code === "KeyS") duck(false);
    };
    const onVis = () => {
      const s = sim.current;
      if (document.hidden && s.state === "running" && !s.paused) {
        s.paused = true;
        setIsPaused(true);
      }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [press, releaseJump, duck, togglePause, start]);

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
      const saved = localStorage.getItem(HS_KEY);
      if (saved) {
        s.hi = parseInt(saved, 10) || 0;
        setHighScore(s.hi);
      }
    } catch {
      /* ignore */
    }

    s.stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * W,
      y: Math.random() * (GROUND - 40),
      tw: 0.6 + Math.random() * 1.6,
      ph: Math.random() * 6.28,
    }));
    s.clouds = Array.from({ length: 5 }, (_, i) => ({
      x: (i * W) / 5 + Math.random() * 80,
      y: 28 + Math.random() * 70,
      v: 0.15 + Math.random() * 0.25,
      s: 0.8 + Math.random() * 0.7,
    }));

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

    const spawn = () => {
      const r = Math.random();
      if (s.score > 300 && r < 0.3) {
        const low = Math.random() < 0.5;
        const y = GROUND - (low ? 41 : 63);
        s.obstacles.push({
          type: "bird",
          x: W + 30,
          y,
          w: 57,
          h: 27,
          boxes: [{ x: 6, y: y + 6, w: 48, h: 18 }],
          cacti: [],
        });
      } else {
        const n = s.score > 150 ? (r < 0.55 ? 1 : r < 0.85 ? 2 : 3) : r < 0.7 ? 1 : 2;
        const cacti: Cactus[] = [];
        for (let i = 0; i < n; i++) {
          const big = Math.random() < 0.45;
          cacti.push({
            dx: i * 24,
            hU: big ? 17 : 11 + Math.floor(Math.random() * 3),
            flower: Math.random() < 0.25,
          });
        }
        s.obstacles.push({
          type: "cactus",
          x: W + 30,
          y: GROUND - Math.max(...cacti.map((c) => c.hU)) * P,
          w: (n - 1) * 24 + 30,
          h: Math.max(...cacti.map((c) => c.hU)) * P,
          boxes: cacti.map((c) => ({ x: c.dx + 6, y: GROUND - c.hU * P + 3, w: 18, h: c.hU * P - 3 })),
          cacti,
        });
      }
      s.spawnTimer = Math.floor(45 + Math.random() * 55 - Math.min(s.score / 100, 18));
    };

    const die = () => {
      s.state = "over";
      s.paused = false;
      s.overAt = performance.now();
      s.shake = s.reduced ? 0 : 9;
      const cx = DINO_X + 36;
      const cy = GROUND + s.dinoY - 28;
      const n = s.reduced ? 10 : 26;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 4.5;
        s.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 2,
          life: 40 + Math.random() * 25,
          max: 65,
          size: 3 + Math.floor(Math.random() * 3),
          color: [C.G, C.L, C.Y, C.R][i % 4],
          g: 0.18,
        });
      }
      const nb = s.score > s.hi && s.score > 0;
      s.newBest = nb;
      if (nb) {
        s.hi = s.score;
        try {
          localStorage.setItem(HS_KEY, String(s.score));
        } catch {
          /* ignore */
        }
        setHighScore(s.score);
      }
      sounds.playGameOver();
      setIsGameOver(true);
    };

    /* update ─────────────────────────────────────────────────────────────── */
    const update = (dt: number, k: number) => {
      s.t += dt;
      if (s.paused) return;

      const running = s.state === "running";
      const ambient = running ? s.speed : s.state === "idle" ? 1.4 : 0;
      s.scroll += ambient * k;

      for (const c of s.clouds) {
        c.x -= (c.v + ambient * 0.08) * k;
        if (c.x < -80) {
          c.x = W + 40 + Math.random() * 100;
          c.y = 28 + Math.random() * 70;
        }
      }
      s.shake *= Math.pow(0.86, k);
      if (s.shake < 0.1) s.shake = 0;
      if (s.blink > 0) s.blink -= k;

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const q = s.particles[i];
        q.x += q.vx * k - (running ? s.speed * 0.4 * k : 0);
        q.y += q.vy * k;
        q.vy += q.g * k;
        q.life -= k;
        if (q.life <= 0) s.particles.splice(i, 1);
      }

      if (!running) return;

      // progression
      s.distance += s.speed * k;
      s.score = Math.floor(s.distance / 10);
      s.speed = 6.5 + Math.min(s.score / 300, 6.5);

      const ms = Math.floor(s.score / 100);
      if (ms > s.lastMilestone) {
        s.lastMilestone = ms;
        s.blink = 50;
        sounds.playScore();
      }
      const sd = Math.round(s.speed * 10) / 10;
      if (sd !== s.lastSpeedDisp) {
        s.lastSpeedDisp = sd;
        setSpeedDisp(sd);
      }

      // physics
      const wasAir = s.jumping;
      const impact = s.vy;
      const grav = 0.65 * (s.ducking && s.jumping ? 2.2 : 1);
      s.dinoY += s.vy * k;
      s.vy += grav * k;
      if (s.dinoY >= 0) {
        s.dinoY = 0;
        s.vy = 0;
        s.jumping = false;
        if (wasAir) {
          addDust(DINO_X + 30, GROUND, impact > 8 ? 10 : 5, 3);
          if (impact > 9 && !s.reduced) s.shake = Math.max(s.shake, 1.5);
        }
      }
      if (!s.jumping) {
        s.runPhase += s.speed * k * 0.042;
        s.dustTimer -= k;
        if (s.dustTimer <= 0) {
          s.dustTimer = 5;
          addDust(DINO_X + 10, GROUND, 1, 1.6);
        }
      }

      // obstacles
      s.spawnTimer -= k;
      if (s.spawnTimer <= 0) spawn();

      const ox = DINO_X;
      const oy = GROUND + s.dinoY - 19 * P;
      const dinoBoxes: Box[] =
        s.ducking && !s.jumping
          ? [{ x: ox + 21, y: oy + 33, w: 57, h: 21 }]
          : [
              { x: ox + 21, y: oy + 24, w: 27, h: 30 },
              { x: ox + 48, y: oy + 3, w: 24, h: 15 },
            ];

      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const ob = s.obstacles[i];
        ob.x -= s.speed * k;
        let hit = false;
        for (const b of ob.boxes) {
          const ab = { x: ob.x + b.x, y: b.y, w: b.w, h: b.h };
          for (const db of dinoBoxes) {
            if (overlap(db, ab)) hit = true;
          }
        }
        if (hit) {
          die();
          return;
        }
        if (ob.x < -120) s.obstacles.splice(i, 1);
      }
    };

    /* render ─────────────────────────────────────────────────────────────── */
    const text = (
      t: string,
      x: number,
      y: number,
      size: number,
      color: string,
      stroke = "rgba(0,0,0,0.55)",
      align: CanvasTextAlign = "center"
    ) => {
      ctx.font = `bold ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 4;
      ctx.strokeStyle = stroke;
      ctx.strokeText(t, x, y);
      ctx.fillStyle = color;
      ctx.fillText(t, x, y);
    };

    const render = () => {
      ctx.setTransform(s.scale, 0, 0, s.scale, 0, 0);

      const x0 = (0.5 - 0.5 * Math.cos((2 * Math.PI * s.score) / 1000)) * 1.5 - 0.25;
      const n = Math.max(0, Math.min(1, x0)); // 0 = day … 1 = night

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, mix("#7dd3fc", "#0b1026", n));
      sky.addColorStop(1, mix("#fde9b0", "#25214f", n));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake * 2, (Math.random() - 0.5) * s.shake * 2);

      // stars
      if (n > 0.05) {
        for (const st of s.stars) {
          const a = n * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin((s.t / 600) * st.tw + st.ph)));
          ctx.fillStyle = `rgba(226,232,240,${a})`;
          ctx.fillRect(Math.round(st.x), Math.round(st.y), 2, 2);
        }
      }

      // sun
      if (n < 0.95) {
        const sy = 62 + n * 150;
        const sx = 640;
        const glow = ctx.createRadialGradient(sx, sy, 6, sx, sy, 90);
        glow.addColorStop(0, `rgba(253,224,71,${0.55 * (1 - n)})`);
        glow.addColorStop(1, "rgba(253,224,71,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 100, sy - 100, 200, 200);
        ctx.globalAlpha = 1 - n;
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // moon
      if (n > 0.1) {
        const my = 215 - n * 155;
        const mx = 640;
        ctx.globalAlpha = n;
        const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 70);
        mg.addColorStop(0, "rgba(191,219,254,0.35)");
        mg.addColorStop(1, "rgba(191,219,254,0)");
        ctx.fillStyle = mg;
        ctx.fillRect(mx - 80, my - 80, 160, 160);
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.arc(mx, my, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(mx - 6, my - 4, 4, 0, Math.PI * 2);
        ctx.arc(mx + 7, my + 5, 3, 0, Math.PI * 2);
        ctx.arc(mx + 4, my - 8, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // parallax ranges
      const range = (factor: number, base: number, amp: number, color: string, f1: number, f2: number, o: number, jag: boolean) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, GROUND + 2);
        for (let x = 0; x <= W; x += 8) {
          const wx = x + s.scroll * factor;
          const hgt = jag
            ? amp * (0.25 + 0.75 * Math.abs(Math.sin(wx * f1 + o)) * (0.7 + 0.3 * Math.sin(wx * f2 + o * 2.3)))
            : amp * (0.55 + 0.3 * Math.sin(wx * f1 + o) + 0.15 * Math.sin(wx * f2 + o * 2.3));
          ctx.lineTo(x, base - hgt);
        }
        ctx.lineTo(W, GROUND + 2);
        ctx.closePath();
        ctx.fill();
      };
      range(0.08, GROUND - 6, 95, mix("#a5b4fc", "#1c2253", n), 0.006, 0.019, 1, true);
      range(0.18, GROUND - 4, 60, mix("#c4b5fd", "#241f4d", n), 0.009, 0.023, 4, true);

      // clouds
      const cp = cloudParts();
      for (const c of s.clouds) {
        ctx.save();
        ctx.globalAlpha = 0.9 - n * 0.6;
        ctx.fillStyle = mix("#ffffff", "#475569", n);
        for (const q of cp) {
          ctx.fillRect(Math.round(c.x + q.x * P * c.s), Math.round(c.y + q.y * P * c.s), q.w * P * c.s, q.h * P * c.s);
        }
        ctx.restore();
      }

      // dunes
      range(0.4, GROUND + 2, 26, mix("#f1cf86", "#2c2550", n), 0.012, 0.031, 2, false);

      // ground
      const gg = ctx.createLinearGradient(0, GROUND, 0, H);
      gg.addColorStop(0, mix("#e9cd8e", "#241e3c", n));
      gg.addColorStop(1, mix("#d2a95c", "#150f29", n));
      ctx.fillStyle = gg;
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = mix("#fff1c2", "#3a3266", n);
      ctx.fillRect(0, GROUND, W, 1);
      ctx.fillStyle = mix("#8a6a35", "#4c4380", n);
      ctx.fillRect(0, GROUND + 1, W, 2);

      // ground details
      const cell = 44;
      const first = Math.floor(s.scroll / cell);
      const pebble = mix("#b8935a", "#40376a", n);
      const pebbleHi = mix("#e3c58b", "#5a4f92", n);
      for (let i = first; i <= first + Math.ceil(W / cell) + 1; i++) {
        const r1 = hash(i);
        const r2 = hash(i + 999);
        const r3 = hash(i + 4242);
        const x = Math.round(i * cell - s.scroll + r1 * cell);
        const y = Math.round(GROUND + 10 + r2 * (H - GROUND - 18));
        if (r3 < 0.45) {
          ctx.fillStyle = pebble;
          ctx.fillRect(x, y, 6, 3);
          ctx.fillStyle = pebbleHi;
          ctx.fillRect(x + 1, y - 1, 4, 1);
        } else if (r3 < 0.75) {
          ctx.fillStyle = mix("#4d7c0f", "#2dd4bf", n * 0.7);
          ctx.fillRect(x, y, 2, 4);
          ctx.fillRect(x + 3, y - 2, 2, 6);
          ctx.fillRect(x + 6, y + 1, 2, 3);
        } else {
          ctx.fillStyle = pebble;
          ctx.fillRect(x, y, 14, 1);
          ctx.fillRect(x + 14, y + 1, 5, 1);
        }
      }

      // shadows
      const feetY = GROUND + s.dinoY;
      const sh = Math.max(0.35, 1 + s.dinoY / 160);
      ctx.fillStyle = `rgba(0,0,0,${0.22 * sh})`;
      ctx.beginPath();
      ctx.ellipse(DINO_X + 36, GROUND + 4, 30 * sh, 4 * sh, 0, 0, Math.PI * 2);
      ctx.fill();

      // obstacles
      const cactusOutline = mix("#052e16", "#042f2e", n);
      const birdFrame = [0, 1, 2, 1][Math.floor(s.t / 100) % 4];
      for (const ob of s.obstacles) {
        if (ob.type === "cactus") {
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fillRect(Math.round(ob.x), GROUND + 2, ob.w, 4);
          for (const c of ob.cacti) {
            drawSprite(ctx, cactusParts(c.hU, c.flower, n), ob.x + c.dx, GROUND - c.hU * P, cactusOutline);
          }
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.beginPath();
          ctx.ellipse(ob.x + 28, GROUND + 4, 20, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          drawSprite(ctx, birdParts(birdFrame, n), ob.x, ob.y, "#2e1065");
        }
      }

      // dino
      const pose: Pose =
        s.state === "over" ? "dead" : s.jumping ? "jump" : s.ducking && s.state === "running" ? "duck" : "run";
      const blink = s.t % 3400 > 3250;
      const moving = s.state === "running" && !s.jumping;
      const parts = dinoParts(pose, s.runPhase, s.t, moving, blink);
      drawSprite(ctx, parts, DINO_X, feetY - 19 * P, "#0b2e17");

      // particles
      for (const q of s.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, q.life / q.max));
        ctx.fillStyle = q.color;
        ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size);
      }
      ctx.globalAlpha = 1;

      // speed lines
      if (s.state === "running" && s.speed > 8.5) {
        const f = Math.min(1, (s.speed - 8.5) / 4.5);
        ctx.fillStyle = `rgba(255,255,255,${0.12 * f * (1 - n * 0.5)})`;
        for (let i = 0; i < 8; i++) {
          const x = W - ((s.t * (0.9 + (i % 3) * 0.4) + i * 173) % (W + 200)) + 100;
          ctx.fillRect(Math.round(x), 24 + ((i * 37) % 150), 40 + ((i * 13) % 60), 1);
        }
      }

      ctx.restore(); // end shake

      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, W * 0.62);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, `rgba(0,0,0,${0.28 + n * 0.12})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // milestone flash
      if (s.blink > 0 && !s.reduced) {
        ctx.fillStyle = `rgba(255,255,255,${(s.blink / 50) * 0.12})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD
      const hudColor = n > 0.5 ? "#cbd5e1" : "#475569";
      const hudStroke = n > 0.5 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)";
      const showScore = !(s.blink > 0 && Math.floor(s.blink / 6) % 2 === 1);
      text(`HI ${String(s.hi).padStart(5, "0")}`, W - 150, 24, 14, hudColor, hudStroke, "right");
      if (showScore) text(String(s.score).padStart(5, "0"), W - 20, 24, 14, n > 0.5 ? "#f8fafc" : "#0f172a", hudStroke, "right");

      // overlays
      if (s.state === "idle") {
        text("D I N O   D A S H", W / 2, 78, 34, "#ffffff", "rgba(15,23,42,0.75)");
        if (Math.floor(s.t / 500) % 2 === 0) text("PRESS SPACE OR TAP TO START", W / 2, 118, 14, "#fef9c3", "rgba(15,23,42,0.8)");
        text("Jump: Space / ↑    Duck: ↓    Pause: P", W / 2, 142, 11, "#e2e8f0", "rgba(15,23,42,0.8)");
      }
      if (s.paused) {
        ctx.fillStyle = "rgba(2,6,23,0.55)";
        ctx.fillRect(0, 0, W, H);
        text("PAUSED", W / 2, H / 2 - 10, 28, "#ffffff");
        text("Press P / Esc to resume", W / 2, H / 2 + 22, 13, "#cbd5e1");
      }
      if (s.state === "over") {
        ctx.fillStyle = "rgba(2,6,23,0.5)";
        ctx.fillRect(0, 0, W, H);
        text("G A M E   O V E R", W / 2, H / 2 - 38, 30, "#ffffff");
        text(`SCORE ${String(s.score).padStart(5, "0")}`, W / 2, H / 2 + 0, 16, "#fef9c3");
        if (s.newBest) text("★ NEW BEST! ★", W / 2, H / 2 + 26, 14, "#fbbf24");
        if (Math.floor(s.t / 500) % 2 === 0) text("Press Space or tap to restart", W / 2, H / 2 + 56, 12, "#cbd5e1");
      }
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

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [addDust]);

  /* ── UI ───────────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-4 select-none">
      {/* Top Controller Bar */}
      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink tracking-tight flex items-center gap-2">🦖 Dino Dash</span>
          <span className="text-xs font-mono text-ink-subtle">Speed: {speedDisp.toFixed(1)}x</span>
          {highScore > 0 && (
            <span className="hidden sm:inline text-xs font-mono text-ink-subtle">Best: {highScore}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isPlaying && !isGameOver && (
            <button
              onClick={togglePause}
              className="p-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle hover:text-ink text-xs transition-colors"
              title="Pause Game (P / Esc)"
              aria-label={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={start}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors"
          >
            {isPlaying ? (
              <RotateCcw className="w-3.5 h-3.5 text-ink-subtle" />
            ) : (
              <Play className="w-3.5 h-3.5 text-ink-subtle" />
            )}
            <span>{isPlaying ? "Restart" : "Play"}</span>
          </button>
        </div>
      </div>

      {/* Canvas Screen */}
      <div
        ref={wrapRef}
        onPointerDown={(e) => {
          e.preventDefault();
          press();
        }}
        onPointerUp={releaseJump}
        onPointerCancel={releaseJump}
        style={{ aspectRatio: `${W} / ${H}` }}
        className="w-full relative rounded-xl overflow-hidden border border-hairline shadow-2xl bg-surface-1 cursor-pointer focus:outline-none touch-none"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      </div>

      {/* Controls */}
      <div className="w-full flex items-center justify-between text-xs text-ink-subtle px-2">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">
            Controls:{" "}
            <kbd className="font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-hairline text-ink">Space</kbd> or{" "}
            <kbd className="font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-hairline text-ink">↑</kbd> to Jump
            (hold for higher),{" "}
            <kbd className="font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-hairline text-ink">↓</kbd> to Duck
          </span>
        </div>

        <div className="flex sm:hidden items-center gap-2 w-full justify-center pt-2">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              duck(true);
            }}
            onPointerUp={() => duck(false)}
            onPointerLeave={() => duck(false)}
            onPointerCancel={() => duck(false)}
            className="flex-1 py-3 bg-surface-2 active:bg-surface-3 border border-hairline rounded-lg font-medium text-xs text-ink text-center touch-none"
          >
            Duck (↓)
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              press();
            }}
            onPointerUp={releaseJump}
            onPointerCancel={releaseJump}
            className="flex-1 py-3 bg-primary active:bg-primary-hover text-white rounded-lg font-medium text-xs text-center shadow-sm shadow-primary/20 touch-none"
          >
            Jump (Space)
          </button>
        </div>
      </div>
    </div>
  );
}
