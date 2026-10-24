"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, RotateCcw, Dices, Coins, Lock, Flame } from "lucide-react";
import { sounds } from "../sound-manager";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants, types & helpers                                                */
/* ────────────────────────────────────────────────────────────────────────── */

type ToolMode = "coin" | "dice";
type Side = "HEADS" | "TAILS";

const COIN_THICKNESS = 12; // px
const COIN_EDGE_LAYERS = Array.from({ length: 13 }, (_, i) => i - 6); // -6 … 6
const COIN_TOSS_MS = 1500;
const COIN_SPIN_MS = 1250;

/** [rotateX, rotateY] that brings each face of the die toward the viewer */
const FACE_TARGET: Record<number, [number, number]> = {
  1: [0, 0],
  6: [0, 180],
  2: [0, -90],
  5: [0, 90],
  3: [-90, 0],
  4: [90, 0],
};

const FACES: { n: number; t: string }[] = [
  { n: 1, t: "rotateY(0deg)" },
  { n: 6, t: "rotateY(180deg)" },
  { n: 2, t: "rotateY(90deg)" },
  { n: 5, t: "rotateY(-90deg)" },
  { n: 3, t: "rotateX(90deg)" },
  { n: 4, t: "rotateX(-90deg)" },
];

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const STAR_PATH =
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 16 : 6.5;
    const a = ((-90 + i * 36) * Math.PI) / 180;
    return `${i === 0 ? "M" : "L"}${(50 + Math.cos(a) * r).toFixed(2)} ${(42 + Math.sin(a) * r).toFixed(2)}`;
  }).join(" ") + "Z";

interface Die {
  id: number;
  value: number;
  rx: number;
  ry: number;
  held: boolean;
}

interface CoinState {
  heads: number;
  tails: number;
  total: number;
  history: Side[];
  streakSide: Side | null;
  streak: number;
  best: number;
  callWins: number;
  callTotal: number;
}

const INITIAL_COIN: CoinState = {
  heads: 0,
  tails: 0,
  total: 0,
  history: [],
  streakSide: null,
  streak: 0,
  best: 0,
  callWins: 0,
  callTotal: 0,
};

const rollValue = () => Math.floor(Math.random() * 6) + 1;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Next cumulative rotation that is always forward and ends exactly on `target` (mod 360). */
const nextRot = (prev: number, target: number, spins: number) =>
  (Math.floor(prev / 360) + 1 + spins) * 360 + target;

function makeDice(n: number): Die[] {
  return Array.from({ length: n }, (_, i) => {
    const value = rollValue();
    const [rx, ry] = FACE_TARGET[value];
    return { id: i, value, rx, ry, held: false };
  });
}

function rollNote(values: number[]): string | null {
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  if (n === 2 && values[0] === 1 && values[1] === 1) return "🐍 Snake eyes!";
  if (n === 2 && values[0] === 6 && values[1] === 6) return "🚂 Boxcars!";
  if (n >= 2 && values.every((v) => v === values[0])) {
    return ["", "", "Doubles!", "Triples! 🎉", "Quads! 🤯"][n] ?? null;
  }
  if (sum === n * 6) return "🔥 Max roll!";
  if (n === 2 && sum === 7) return "🍀 Lucky seven";
  if (sum === n) return "Minimum roll…";
  return null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function CoinFace({ side }: { side: Side }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      style={{
        filter: "drop-shadow(0 1px 0 rgba(255,255,255,.55)) drop-shadow(0 -1px 0 rgba(120,53,15,.45))",
      }}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="#92400e" strokeWidth="1.2" opacity=".7" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="#92400e" strokeWidth="2.4" strokeDasharray="1.2 2.9" opacity=".75" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#92400e" strokeWidth="1.1" opacity=".7" />
      {side === "HEADS" ? (
        <>
          <path d={STAR_PATH} fill="#92400e" />
          <text
            x="50"
            y="71"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="900"
            letterSpacing="2"
            fill="#92400e"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            HEADS
          </text>
        </>
      ) : (
        <>
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fontSize="34"
            fontWeight="900"
            fill="#92400e"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            1
          </text>
          <text
            x="50"
            y="72"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="900"
            letterSpacing="2"
            fill="#92400e"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            TAILS
          </text>
        </>
      )}
    </svg>
  );
}

const faceMetal =
  "radial-gradient(circle at 30% 25%, #fef3c7 0%, #fcd34d 22%, #f59e0b 55%, #b45309 100%)";

function DieFace({ n, t }: { n: number; t: string }) {
  const active = PIPS[n];
  return (
    <div
      className="absolute inset-0 rounded-[16%] border border-slate-300 bg-gradient-to-br from-white via-slate-100 to-slate-300 grid grid-cols-3 grid-rows-3 p-[11%] shadow-[inset_0_0_10px_rgba(0,0,0,0.18)]"
      style={{
        transform: `${t} translateZ(calc(var(--s) / 2))`,
        backfaceVisibility: "hidden",
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {active.includes(i) && (
            <span
              className={`block rounded-full w-[62%] h-[62%] shadow-[inset_0_2px_3px_rgba(0,0,0,0.55)] ${
                n === 1 ? "bg-red-600 scale-125" : "bg-slate-900"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main component                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

export function CoinDiceGame() {
  const [toolMode, setToolMode] = useState<ToolMode>("coin");
  const [reduced, setReduced] = useState(false);
  const fx = reduced ? 0.35 : 1;

  /* ── Coin state ────────────────────────────────────────────────────────── */
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);
  const [coinResult, setCoinResult] = useState<Side | null>(null);
  const [coinRotation, setCoinRotation] = useState(0);
  const [coin, setCoin] = useState<CoinState>(INITIAL_COIN);
  const [call, setCall] = useState<Side | null>(null);
  const [lastCall, setLastCall] = useState<"win" | "lose" | null>(null);
  const [landTick, setLandTick] = useState(0);

  const callRef = useRef<Side | null>(null);
  const flippingRef = useRef(false);
  const coinTossRef = useRef<HTMLDivElement | null>(null);
  const coinShadowRef = useRef<HTMLDivElement | null>(null);

  /* ── Dice state ────────────────────────────────────────────────────────── */
  const [numDice, setNumDice] = useState<1 | 2 | 3 | 4>(2);
  const [dice, setDice] = useState<Die[]>(() => makeDice(2));
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [diceTotals, setDiceTotals] = useState<number[]>([]);
  const [diceNote, setDiceNote] = useState<string | null>(null);
  const [diceTick, setDiceTick] = useState(0);

  const rollingRef = useRef(false);
  const tossEls = useRef<(HTMLDivElement | null)[]>([]);
  const shadowEls = useRef<(HTMLSpanElement | null)[]>([]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const actionRef = useRef<() => void>(() => {});

  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  /* ── Coin logic ────────────────────────────────────────────────────────── */

  const pickCall = (side: Side) => {
    if (isFlippingCoin) return;
    const next = call === side ? null : side;
    callRef.current = next;
    setCall(next);
    setLastCall(null);
  };

  const flipCoin = useCallback(() => {
    if (flippingRef.current) return;
    flippingRef.current = true;
    setIsFlippingCoin(true);
    setLastCall(null);
    sounds.playCoinFlip();

    const heads = Math.random() < 0.5;
    const side: Side = heads ? "HEADS" : "TAILS";
    const spins = 6 + Math.floor(Math.random() * 4);
    setCoinRotation((prev) => (Math.floor(prev / 360) + 1 + spins) * 360 + (heads ? 0 : 180));

    const dur = COIN_TOSS_MS * fx;
    const rise = 130;
    coinTossRef.current?.animate?.(
      [
        { transform: "translateY(0) scale(1)", offset: 0, easing: "cubic-bezier(0.25,0.6,0.4,1)" },
        { transform: `translateY(-${rise}px) scale(1.25)`, offset: 0.5, easing: "cubic-bezier(0.55,0,0.9,0.5)" },
        { transform: "translateY(0) scale(1)", offset: 0.82, easing: "cubic-bezier(0.25,0.6,0.4,1)" },
        { transform: "translateY(-16px) scale(1.03)", offset: 0.9, easing: "cubic-bezier(0.55,0,0.9,0.5)" },
        { transform: "translateY(0) scale(1)", offset: 1 },
      ],
      { duration: dur }
    );
    coinShadowRef.current?.animate?.(
      [
        { transform: "scale(1)", opacity: 0.55, offset: 0, easing: "ease-out" },
        { transform: "scale(0.45)", opacity: 0.18, offset: 0.5, easing: "ease-in" },
        { transform: "scale(1)", opacity: 0.55, offset: 0.82 },
        { transform: "scale(0.9)", opacity: 0.45, offset: 0.9 },
        { transform: "scale(1)", opacity: 0.55, offset: 1 },
      ],
      { duration: dur }
    );

    timers.current.push(
      setTimeout(() => {
        const picked = callRef.current;
        setCoin((prev) => {
          const streak = prev.streakSide === side ? prev.streak + 1 : 1;
          return {
            heads: prev.heads + (heads ? 1 : 0),
            tails: prev.tails + (heads ? 0 : 1),
            total: prev.total + 1,
            history: [...prev.history, side].slice(-24),
            streakSide: side,
            streak,
            best: Math.max(prev.best, streak),
            callTotal: prev.callTotal + (picked ? 1 : 0),
            callWins: prev.callWins + (picked && picked === side ? 1 : 0),
          };
        });
        setCoinResult(side);
        setLastCall(picked ? (picked === side ? "win" : "lose") : null);
        setLandTick((t) => t + 1);
        setIsFlippingCoin(false);
        flippingRef.current = false;
      }, dur + 40)
    );
  }, [fx]);

  const resetCoin = () => {
    if (isFlippingCoin) return;
    setCoin(INITIAL_COIN);
    setCoinResult(null);
    setLastCall(null);
  };

  /* ── Dice logic ────────────────────────────────────────────────────────── */

  const changeDiceCount = (count: 1 | 2 | 3 | 4) => {
    if (isRollingDice) return;
    setNumDice(count);
    setDice(makeDice(count));
    setDiceNote(null);
  };

  const toggleHold = (i: number) => {
    if (isRollingDice) return;
    setDice((prev) => prev.map((d, idx) => (idx === i ? { ...d, held: !d.held } : d)));
  };

  const rollDice = useCallback(() => {
    if (rollingRef.current) return;
    if (dice.every((d) => d.held)) return;
    rollingRef.current = true;
    setIsRollingDice(true);
    setDiceNote(null);
    sounds.playDiceRoll();

    const next = dice.map((d) => {
      if (d.held) return d;
      const value = rollValue();
      const [tx, ty] = FACE_TARGET[value];
      return {
        ...d,
        value,
        rx: nextRot(d.rx, tx, 2 + Math.floor(Math.random() * 2)),
        ry: nextRot(d.ry, ty, 2 + Math.floor(Math.random() * 2)),
      };
    });
    setDice(next);

    let maxDur = 0;
    dice.forEach((d, i) => {
      if (d.held) return;
      const dur = (1150 + i * 110) * fx;
      maxDur = Math.max(maxDur, dur);
      const h = rand(110, 150);
      const dx = rand(-26, 26);
      const rz = rand(-40, 40);
      tossEls.current[i]?.animate?.(
        [
          { transform: "translate(0,0) rotateZ(0deg) scale(1)", offset: 0, easing: "cubic-bezier(0.2,0.7,0.4,1)" },
          { transform: `translate(${dx}px,-${h}px) rotateZ(${rz}deg) scale(1.15)`, offset: 0.45, easing: "cubic-bezier(0.55,0,0.9,0.5)" },
          { transform: "translate(0,0) rotateZ(0deg) scale(1)", offset: 0.8, easing: "cubic-bezier(0.2,0.7,0.4,1)" },
          { transform: "translate(0,-14px) rotateZ(0deg) scale(1.02)", offset: 0.9, easing: "cubic-bezier(0.55,0,0.9,0.5)" },
          { transform: "translate(0,0) rotateZ(0deg) scale(1)", offset: 1 },
        ],
        { duration: dur }
      );
      shadowEls.current[i]?.animate?.(
        [
          { transform: "scale(1)", opacity: 0.55, offset: 0, easing: "ease-out" },
          { transform: "scale(0.5)", opacity: 0.15, offset: 0.45, easing: "ease-in" },
          { transform: "scale(1)", opacity: 0.55, offset: 0.8 },
          { transform: "scale(0.9)", opacity: 0.45, offset: 0.9 },
          { transform: "scale(1)", opacity: 0.55, offset: 1 },
        ],
        { duration: dur }
      );
    });

    timers.current.push(
      setTimeout(() => {
        const values = next.map((d) => d.value);
        setDiceTotals((prev) => [...prev, values.reduce((a, b) => a + b, 0)].slice(-40));
        setDiceNote(rollNote(values));
        setDiceTick((t) => t + 1);
        setIsRollingDice(false);
        rollingRef.current = false;
      }, maxDur + 60)
    );
  }, [dice, fx]);

  const resetDice = () => {
    if (isRollingDice) return;
    setDiceTotals([]);
    setDiceNote(null);
    setDice((prev) => prev.map((d) => ({ ...d, held: false })));
  };

  /* ── Keyboard: Space / Enter = go ──────────────────────────────────────── */
  actionRef.current = toolMode === "coin" ? flipCoin : rollDice;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(el.tagName)) return;
      if (el?.isContentEditable) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        actionRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Derived values ────────────────────────────────────────────────────── */

  const headsPct = coin.total ? Math.round((coin.heads / coin.total) * 100) : 50;
  const diceSum = dice.reduce((a, d) => a + d.value, 0);
  const diceAvg = diceTotals.length ? (diceTotals.reduce((a, b) => a + b, 0) / diceTotals.length).toFixed(1) : "–";
  const diceHigh = diceTotals.length ? Math.max(...diceTotals) : "–";
  const allHeld = dice.every((d) => d.held);
  const bigDice = numDice >= 4;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-5 select-none">
      <style>{`
        @keyframes cd-pop { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.14)} 100%{transform:scale(1);opacity:1} }
        @keyframes cd-fade { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:none} }
        @keyframes cd-sweep { 0%{transform:translateX(-130%) skewX(-18deg)} 100%{transform:translateX(230%) skewX(-18deg)} }
        @keyframes cd-glow { 0%{opacity:.9;transform:scale(.75)} 100%{opacity:0;transform:scale(1.5)} }
        @keyframes cd-spark {
          0%{transform:translate(-50%,-50%) rotate(var(--a)) translateX(0) scale(1);opacity:1}
          100%{transform:translate(-50%,-50%) rotate(var(--a)) translateX(var(--d)) scale(0);opacity:0}
        }
        .cd-pop{animation:cd-pop .35s cubic-bezier(.2,.9,.3,1.2) both}
        .cd-fade{animation:cd-fade .3s ease-out both}
        .cd-sweep{animation:cd-sweep .9s ease-out both}
        .cd-glow{animation:cd-glow .8s ease-out both}
        .cd-spark{animation:cd-spark .75s ease-out forwards}
        @media (prefers-reduced-motion: reduce){
          .cd-pop,.cd-fade,.cd-sweep,.cd-glow,.cd-spark{animation-duration:.01s}
        }
      `}</style>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-hairline">
        <button
          onClick={() => setToolMode("coin")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            toolMode === "coin" ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Coin Flip</span>
        </button>

        <button
          onClick={() => setToolMode("dice")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            toolMode === "dice" ? "bg-surface-3 text-ink shadow-xs" : "text-ink-subtle hover:text-ink"
          }`}
        >
          <Dices className="w-4 h-4 text-primary" />
          <span>Dice Roller</span>
        </button>
      </div>

      {toolMode === "coin" ? (
        /* ═════════════════════════ COIN ═════════════════════════ */
        <div key="coin" className="cd-fade w-full flex flex-col items-center space-y-4">
          {/* Call it */}
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <span>Call it:</span>
            {(["HEADS", "TAILS"] as Side[]).map((s) => (
              <button
                key={s}
                onClick={() => pickCall(s)}
                disabled={isFlippingCoin}
                aria-pressed={call === s}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors border ${
                  call === s
                    ? "bg-primary text-white border-transparent"
                    : "bg-surface-2 text-ink-subtle hover:text-ink border-hairline"
                }`}
              >
                {s === "HEADS" ? "Heads" : "Tails"}
              </button>
            ))}
          </div>

          {/* Stage */}
          <div className="relative w-full h-[330px] flex items-end justify-center pb-9">
            <div className="relative w-44 h-44">
              {/* ambient glow */}
              <div className="absolute -inset-8 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

              {/* ground shadow */}
              <div className="absolute left-0 right-0 -bottom-7 flex justify-center pointer-events-none">
                <div ref={coinShadowRef} className="w-32 h-4 rounded-full bg-black/60 blur-md opacity-55" />
              </div>

              {/* landing effects */}
              {landTick > 0 && !isFlippingCoin && (
                <div key={landTick} className="absolute inset-0 pointer-events-none">
                  <span className="absolute -inset-3 rounded-full border-2 border-amber-300/60 cd-glow" />
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="cd-spark absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-amber-300"
                      style={
                        {
                          "--a": `${i * 30}deg`,
                          "--d": `${88 + (i % 3) * 20}px`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}

              {/* 3D coin */}
              <div
                onClick={flipCoin}
                className="absolute inset-0 cursor-pointer [perspective:900px]"
                role="button"
                aria-label="Flip coin"
              >
                <div ref={coinTossRef} className="w-full h-full" style={{ transformStyle: "preserve-3d" }}>
                  <div className="w-full h-full" style={{ transformStyle: "preserve-3d", transform: "rotateX(-14deg)" }}>
                    <div
                      className="w-full h-full relative"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${coinRotation}deg)`,
                        transition: `transform ${COIN_SPIN_MS * fx}ms cubic-bezier(0.3,0.5,0.4,1)`,
                      }}
                    >
                      {/* edge (stacked discs for thickness) */}
                      {COIN_EDGE_LAYERS.map((z) => (
                        <div
                          key={z}
                          className="absolute inset-0 rounded-full"
                          style={{
                            transform: `translateZ(${(z * COIN_THICKNESS) / 12}px)`,
                            background: "linear-gradient(135deg,#b45309,#f59e0b 40%,#92400e)",
                            border: "1px solid #78350f",
                          }}
                        />
                      ))}

                      {/* HEADS */}
                      <div
                        className="absolute inset-0 rounded-full overflow-hidden border-[5px] border-amber-300 p-[10%]"
                        style={{
                          background: faceMetal,
                          transform: `translateZ(${COIN_THICKNESS / 2 + 0.5}px)`,
                          backfaceVisibility: "hidden",
                          boxShadow: "inset 0 0 18px rgba(120,53,15,.55)",
                        }}
                      >
                        <CoinFace side="HEADS" />
                        {landTick > 0 && !isFlippingCoin && (
                          <span key={landTick} className="cd-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none" />
                        )}
                        <div className="absolute inset-0 rounded-full pointer-events-none bg-[linear-gradient(120deg,rgba(255,255,255,.35),transparent_40%,transparent_65%,rgba(0,0,0,.18))]" />
                      </div>

                      {/* TAILS */}
                      <div
                        className="absolute inset-0 rounded-full overflow-hidden border-[5px] border-amber-300 p-[10%]"
                        style={{
                          background: faceMetal,
                          transform: `rotateX(180deg) translateZ(${COIN_THICKNESS / 2 + 0.5}px)`,
                          backfaceVisibility: "hidden",
                          boxShadow: "inset 0 0 18px rgba(120,53,15,.55)",
                        }}
                      >
                        <CoinFace side="TAILS" />
                        {landTick > 0 && !isFlippingCoin && (
                          <span key={landTick} className="cd-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none" />
                        )}
                        <div className="absolute inset-0 rounded-full pointer-events-none bg-[linear-gradient(120deg,rgba(255,255,255,.35),transparent_40%,transparent_65%,rgba(0,0,0,.18))]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={flipCoin}
            disabled={isFlippingCoin}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-70 text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-2"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFlippingCoin ? "animate-spin" : ""}`} />
            <span>{isFlippingCoin ? "Flipping..." : "Flip Coin"}</span>
          </button>
          <p className="text-[10px] text-ink-subtle -mt-2">or click the coin · press Space</p>

          {/* Result announcement */}
          <div className="min-h-[52px] flex flex-col items-center justify-center gap-1">
            {coinResult && !isFlippingCoin && (
              <div key={landTick} className="cd-pop text-base font-bold font-mono text-ink">
                Result: <span className="text-amber-400">{coinResult}</span>
              </div>
            )}
            {lastCall && !isFlippingCoin && (
              <div
                key={`c${landTick}`}
                className={`cd-pop text-xs font-semibold ${lastCall === "win" ? "text-emerald-400" : "text-red-400"}`}
              >
                {lastCall === "win" ? "✓ Called it!" : "✗ Not this time"}
              </div>
            )}
            {coin.streak >= 3 && !isFlippingCoin && (
              <div className="cd-pop flex items-center gap-1 text-[11px] text-orange-400 font-mono">
                <Flame className="w-3.5 h-3.5" /> {coin.streak} {coin.streakSide?.toLowerCase()} in a row
              </div>
            )}
          </div>

          {/* Distribution bar + history */}
          <div className="w-full space-y-2.5">
            <div>
              <div className="flex justify-between text-[10px] font-mono uppercase text-ink-subtle mb-1">
                <span>Heads {coin.total ? `${headsPct}%` : ""}</span>
                <span>Tails {coin.total ? `${100 - headsPct}%` : ""}</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden bg-surface-3 flex">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${headsPct}%` }}
                />
                <div className="h-full flex-1 bg-gradient-to-r from-slate-500 to-slate-400" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 justify-center min-h-[20px]">
              {coin.history.map((h, i) => (
                <span
                  key={i}
                  className={`w-5 h-5 rounded-full text-[9px] font-bold font-mono flex items-center justify-center ${
                    h === "HEADS" ? "bg-amber-400 text-amber-950" : "bg-slate-500 text-white"
                  } ${i === coin.history.length - 1 ? "ring-2 ring-white/40" : ""}`}
                >
                  {h === "HEADS" ? "H" : "T"}
                </span>
              ))}
            </div>
          </div>

          {/* Flips Summary */}
          <div className="grid grid-cols-4 gap-2.5 w-full">
            <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-ink-subtle block">Heads</span>
              <span className="text-base font-bold font-mono text-ink">{coin.heads}</span>
            </div>
            <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-ink-subtle block">Tails</span>
              <span className="text-base font-bold font-mono text-ink">{coin.tails}</span>
            </div>
            <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-ink-subtle block">Best streak</span>
              <span className="text-base font-bold font-mono text-ink">{coin.best}</span>
            </div>
            <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-ink-subtle block">Called</span>
              <span className="text-base font-bold font-mono text-ink">
                {coin.callWins}/{coin.callTotal}
              </span>
            </div>
          </div>

          <button
            onClick={resetCoin}
            disabled={isFlippingCoin || coin.total === 0}
            className="text-[11px] text-ink-subtle hover:text-ink disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset stats
          </button>
        </div>
      ) : (
        /* ═════════════════════════ DICE ═════════════════════════ */
        <div key="dice" className="cd-fade w-full flex flex-col items-center space-y-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <span>Dice Count:</span>
            {([1, 2, 3, 4] as (1 | 2 | 3 | 4)[]).map((count) => (
              <button
                key={count}
                onClick={() => changeDiceCount(count)}
                disabled={isRollingDice}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                  numDice === count
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-ink-subtle hover:text-ink border border-hairline"
                }`}
              >
                {count}d6
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="relative w-full rounded-2xl border border-hairline overflow-hidden bg-[radial-gradient(ellipse_at_50%_80%,rgba(16,185,129,0.22),rgba(6,78,59,0.35)_55%,rgba(2,6,23,0.6))]">
            <div className="flex items-end justify-center gap-5 sm:gap-8 h-[270px] pb-14 px-3">
              {dice.map((d, i) => (
                <div key={d.id} className="relative flex flex-col items-center">
                  <button
                    onClick={() => toggleHold(i)}
                    aria-pressed={d.held}
                    aria-label={`Die ${i + 1}: ${d.value}${d.held ? " (held)" : ""}`}
                    className={`relative [perspective:800px] w-[var(--s)] h-[var(--s)] focus:outline-none cursor-pointer ${
                      bigDice ? "[--s:52px] sm:[--s:66px]" : "[--s:62px] sm:[--s:78px]"
                    }`}
                  >
                    {/* held ring */}
                    {d.held && (
                      <span className="absolute -inset-2 rounded-2xl ring-2 ring-amber-400/80 bg-amber-400/10 pointer-events-none" />
                    )}

                    {/* shadow */}
                    <div className="absolute left-0 right-0 -bottom-5 flex justify-center pointer-events-none">
                      <span
                        ref={(el) => {
                          shadowEls.current[i] = el;
                        }}
                        className="block w-4/5 h-3 rounded-full bg-black/60 blur-md opacity-55"
                      />
                    </div>

                    {/* toss → tilt → cube */}
                    <div
                      ref={(el) => {
                        tossEls.current[i] = el;
                      }}
                      className="w-full h-full"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <div
                        className="w-full h-full"
                        style={{ transformStyle: "preserve-3d", transform: "rotateX(-22deg) rotateY(-26deg)" }}
                      >
                        <div
                          className="w-full h-full relative"
                          style={{
                            transformStyle: "preserve-3d",
                            transform: `rotateX(${d.rx}deg) rotateY(${d.ry}deg)`,
                            transition: `transform ${(1150 + i * 110) * 0.78 * fx}ms cubic-bezier(0.2,0.6,0.25,1)`,
                          }}
                        >
                          {FACES.map((f) => (
                            <DieFace key={f.n} n={f.n} t={f.t} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>

                  {d.held && (
                    <span className="absolute -bottom-12 flex items-center gap-1 text-[10px] font-mono uppercase text-amber-400">
                      <Lock className="w-3 h-3" /> Held
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="absolute bottom-2 inset-x-0 text-center text-[10px] text-ink-subtle">
              Tap a die to hold it · press Space to roll
            </p>
          </div>

          {/* Total Sum */}
          <div className="text-center min-h-[78px]">
            <span className="text-xs uppercase font-mono text-ink-subtle block">Total Sum</span>
            {isRollingDice ? (
              <span className="text-3xl font-bold font-mono text-primary animate-pulse">...</span>
            ) : (
              <span key={diceTick} className="cd-pop inline-block text-3xl font-bold font-mono text-primary">
                {diceSum}
              </span>
            )}
            <div className="h-5 mt-0.5">
              {diceNote && !isRollingDice && (
                <span key={`n${diceTick}`} className="cd-pop inline-block text-xs font-semibold text-amber-400">
                  {diceNote}
                </span>
              )}
            </div>
          </div>

          {/* Roll Button */}
          <button
            onClick={rollDice}
            disabled={isRollingDice || allHeld}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-70 text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-2"
          >
            <Dices className={`w-4 h-4 ${isRollingDice ? "animate-bounce" : ""}`} />
            <span>{isRollingDice ? "Rolling..." : allHeld ? "All dice held" : "Roll Dice"}</span>
          </button>

          {/* History */}
          <div className="w-full space-y-2.5">
            <div className="flex flex-wrap gap-1 justify-center min-h-[24px]">
              {diceTotals.slice(-14).map((t, i, arr) => (
                <span
                  key={i}
                  className={`px-2 h-6 rounded-md text-[11px] font-bold font-mono flex items-center justify-center bg-surface-2 border border-hairline text-ink ${
                    i === arr.length - 1 ? "ring-2 ring-primary/50" : ""
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 w-full">
              <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-mono text-ink-subtle block">Rolls</span>
                <span className="text-base font-bold font-mono text-ink">{diceTotals.length}</span>
              </div>
              <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-mono text-ink-subtle block">Average</span>
                <span className="text-base font-bold font-mono text-ink">{diceAvg}</span>
              </div>
              <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-mono text-ink-subtle block">Highest</span>
                <span className="text-base font-bold font-mono text-ink">{diceHigh}</span>
              </div>
            </div>
          </div>

          <button
            onClick={resetDice}
            disabled={isRollingDice || (diceTotals.length === 0 && !dice.some((d) => d.held))}
            className="text-[11px] text-ink-subtle hover:text-ink disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset stats
          </button>
        </div>
      )}
    </div>
  );
}
