"use client";

import React, { useState } from "react";
import { RotateCw, Dices, Coins } from "lucide-react";
import { sounds } from "../sound-manager";

type ToolMode = "coin" | "dice";

export function CoinDiceGame() {
  const [toolMode, setToolMode] = useState<ToolMode>("coin");

  // Coin state
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);
  const [coinResult, setCoinResult] = useState<"HEADS" | "TAILS" | null>("HEADS");
  const [coinStats, setCoinStats] = useState({ heads: 0, tails: 0, total: 0 });
  const [coinRotation, setCoinRotation] = useState(0);

  // Dice state
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [numDice, setNumDice] = useState<1 | 2 | 3>(2);
  const [diceResults, setDiceResults] = useState<number[]>([3, 5]);

  const flipCoin = () => {
    if (isFlippingCoin) return;

    setIsFlippingCoin(true);
    sounds.playCoinFlip();

    const isHeads = Math.random() < 0.5;
    const extraRotations = 1800 + (isHeads ? 0 : 180);
    const newRotation = coinRotation + extraRotations;
    setCoinRotation(newRotation);

    setTimeout(() => {
      const outcome = isHeads ? "HEADS" : "TAILS";
      setCoinResult(outcome);
      setCoinStats((prev) => ({
        heads: prev.heads + (isHeads ? 1 : 0),
        tails: prev.tails + (isHeads ? 0 : 1),
        total: prev.total + 1,
      }));
      setIsFlippingCoin(false);
    }, 1000);
  };

  const rollDice = () => {
    if (isRollingDice) return;

    setIsRollingDice(true);
    sounds.playDiceRoll();

    setTimeout(() => {
      const newResults = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
      setDiceResults(newResults);
      setIsRollingDice(false);
    }, 700);
  };

  // Render dice face dots
  const renderDiceFace = (val: number) => {
    const dotPositions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activeDots = dotPositions[val] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-16 h-16 sm:w-20 sm:h-20 p-2 sm:p-2.5 bg-slate-100 rounded-2xl shadow-xl border border-slate-300">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-slate-900 rounded-full shadow-inner" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-6 select-none">
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
        /* Coin Flip Experience */
        <div className="w-full flex flex-col items-center space-y-6">
          {/* 3D Coin Canvas */}
          <div
            onClick={flipCoin}
            className="w-44 h-44 relative cursor-pointer [perspective:1000px] group"
          >
            <div
              style={{
                transform: `rotateY(${coinRotation}deg)`,
                transition: "transform 1s cubic-bezier(0.15, 0.9, 0.25, 1)",
                transformStyle: "preserve-3d",
              }}
              className="w-full h-full relative rounded-full shadow-2xl"
            >
              {/* Front: HEADS */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border-4 border-amber-300 flex flex-col items-center justify-center [backface-visibility:hidden] shadow-inner text-amber-950 font-bold select-none">
                <span className="text-4xl">🦅</span>
                <span className="text-xs uppercase tracking-widest font-mono mt-1 font-black">HEADS</span>
              </div>

              {/* Back: TAILS */}
              <div
                style={{ transform: "rotateY(180deg)" }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border-4 border-amber-300 flex flex-col items-center justify-center [backface-visibility:hidden] shadow-inner text-amber-950 font-bold select-none"
              >
                <span className="text-4xl">1</span>
                <span className="text-xs uppercase tracking-widest font-mono mt-1 font-black">TAILS</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={flipCoin}
            disabled={isFlippingCoin}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-2"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFlippingCoin ? "animate-spin" : ""}`} />
            <span>{isFlippingCoin ? "Flipping..." : "Flip Coin"}</span>
          </button>

          {/* Result announcement */}
          {coinResult && !isFlippingCoin && (
            <div className="text-base font-bold font-mono text-ink animate-in fade-in zoom-in-95 duration-150">
              Result: <span className="text-amber-400">{coinResult}</span>
            </div>
          )}

          {/* Flips Summary */}
          <div className="grid grid-cols-3 gap-3 w-full pt-2">
            <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-ink-subtle block">Heads</span>
              <span className="text-base font-bold font-mono text-ink">{coinStats.heads}</span>
            </div>
            <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-ink-subtle block">Tails</span>
              <span className="text-base font-bold font-mono text-ink">{coinStats.tails}</span>
            </div>
            <div className="bg-surface-2 border border-hairline p-2.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-ink-subtle block">Total</span>
              <span className="text-base font-bold font-mono text-ink">{coinStats.total}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Dice Roller Experience */
        <div className="w-full flex flex-col items-center space-y-6">
          {/* Quantity selector */}
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <span>Dice Count:</span>
            {([1, 2, 3] as (1 | 2 | 3)[]).map((count) => (
              <button
                key={count}
                onClick={() => {
                  setNumDice(count);
                  setDiceResults(Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1));
                }}
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

          {/* Dice Display */}
          <div className="flex items-center justify-center gap-4 py-4 min-h-[110px]">
            {diceResults.slice(0, numDice).map((val, idx) => (
              <div
                key={idx}
                className={`transition-all duration-300 ${
                  isRollingDice ? "scale-90 rotate-12 blur-[1px]" : "scale-100 rotate-0"
                }`}
              >
                {renderDiceFace(val)}
              </div>
            ))}
          </div>

          {/* Total Sum */}
          <div className="text-center">
            <span className="text-xs uppercase font-mono text-ink-subtle block">Total Sum</span>
            <span className="text-3xl font-bold font-mono text-primary">
              {isRollingDice ? "..." : diceResults.slice(0, numDice).reduce((a, b) => a + b, 0)}
            </span>
          </div>

          {/* Roll Button */}
          <button
            onClick={rollDice}
            disabled={isRollingDice}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold shadow-md shadow-primary/30 transition-all flex items-center gap-2"
          >
            <Dices className={`w-4 h-4 ${isRollingDice ? "animate-bounce" : ""}`} />
            <span>{isRollingDice ? "Rolling..." : "Roll Dice"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
