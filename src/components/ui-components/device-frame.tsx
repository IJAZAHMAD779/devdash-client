"use client";

import React, { useState } from "react";
import { Monitor, Tablet, Smartphone, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

interface DeviceFrameProps {
  runtimeNote?: string;
  onRefresh?: () => void;
  children: (viewport: "desktop" | "tablet" | "mobile", refreshKey: number) => React.ReactNode;
  className?: string;
}

export function DeviceFrame({
  runtimeNote = "React 18 · Babel",
  onRefresh,
  children,
  className,
}: DeviceFrameProps) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    sound.playClick(750);
    setRefreshKey((k) => k + 1);
    if (onRefresh) onRefresh();
  };

  const handleSelectViewport = (v: "desktop" | "tablet" | "mobile") => {
    sound.playClick(850);
    setViewport(v);
  };

  return (
    <div className={cn("flex flex-col rounded-lg border border-hairline overflow-hidden bg-surface-1", className)}>
      {/* Slim Toolbar: Runtime note left, Device switchers + reload right */}
      <div className="px-3.5 py-1.5 bg-surface-2/60 border-b border-hairline flex items-center justify-between text-xs select-none">
        <span className="font-mono text-[11px] text-ink-subtle">{runtimeNote}</span>

        <div className="flex items-center gap-2">
          {/* Device toggle */}
          <div
            role="group"
            aria-label="Viewport dimensions"
            className="flex items-center rounded-[6px] bg-surface-1 p-0.5 border border-hairline"
          >
            <button
              type="button"
              onClick={() => handleSelectViewport("desktop")}
              aria-pressed={viewport === "desktop"}
              title="Desktop (100% width)"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors cursor-pointer",
                viewport === "desktop"
                  ? "bg-surface-2 text-ink shadow-sm"
                  : "text-ink-subtle hover:text-ink hover:bg-surface-2/40"
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSelectViewport("tablet")}
              aria-pressed={viewport === "tablet"}
              title="Tablet (768px)"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors cursor-pointer",
                viewport === "tablet"
                  ? "bg-surface-2 text-ink shadow-sm"
                  : "text-ink-subtle hover:text-ink hover:bg-surface-2/40"
              )}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSelectViewport("mobile")}
              aria-pressed={viewport === "mobile"}
              title="Mobile (390px)"
              className={cn(
                "p-1.5 rounded-[4px] transition-colors cursor-pointer",
                viewport === "mobile"
                  ? "bg-surface-2 text-ink shadow-sm"
                  : "text-ink-subtle hover:text-ink hover:bg-surface-2/40"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Reload preview"
            aria-label="Reload preview"
            className="p-1.5 rounded-[6px] text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer border border-hairline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame viewport with faint dot grid background (4% opacity) */}
      <div className="relative flex-1 bg-surface-1 p-4 sm:p-6 flex items-center justify-center overflow-auto min-h-[460px]">
        {/* Faint dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_1px_1px,#34343a_1px,transparent_0)] bg-[size:20px_20px]"
        />

        {/* Resizing frame container */}
        <div
          className={cn(
            "relative z-10 w-full transition-[max-width] duration-150 motion-reduce:transition-none flex items-center justify-center rounded-lg border border-hairline bg-[#090a0b] overflow-hidden shadow-2xl",
            viewport === "desktop" && "max-w-full",
            viewport === "tablet" && "max-w-[768px]",
            viewport === "mobile" && "max-w-[390px]"
          )}
        >
          {children(viewport, refreshKey)}
        </div>
      </div>
    </div>
  );
}
