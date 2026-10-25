"use client";

import React from "react";
import { Gamepad2 } from "lucide-react";

export function GameStageSkeleton() {
  return (
    <div
      className="w-full max-w-4xl h-[440px] rounded-[8px] bg-surface-2 border border-line flex flex-col items-center justify-center gap-3 animate-pulse select-none"
      role="status"
      aria-label="Loading game engine"
    >
      <Gamepad2 className="w-8 h-8 text-subtle animate-bounce duration-1000" />
      <span className="font-mono text-xs text-subtle tracking-wider uppercase">
        Loading game...
      </span>
    </div>
  );
}
