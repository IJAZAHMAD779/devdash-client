"use client";

import { useMemo } from "react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  name: string;
  count: number;
  description?: string;
  onClick: () => void;
}

export function FolderCard({ name, count, description, onClick }: FolderCardProps) {
  // Normalize category name for matching wireframe schematics
  const lowerName = name.toLowerCase();

  // Determine which schematic wireframe to render based on the folder/category name
  const wireframeType = useMemo(() => {
    if (lowerName.includes("login") || lowerName.includes("log in") || lowerName.includes("auth") || lowerName.includes("sign")) {
      return "auth";
    }
    if (lowerName.includes("verify") || lowerName.includes("otp") || lowerName.includes("pin") || lowerName.includes("code")) {
      return "verify";
    }
    if (lowerName.includes("404") || lowerName.includes("error") || lowerName.includes("not found")) {
      return "error404";
    }
    if (lowerName.includes("email") || lowerName.includes("template") || lowerName.includes("mail")) {
      return "email";
    }
    if (lowerName.includes("avatar") || lowerName.includes("user") || lowerName.includes("profile")) {
      return "avatar";
    }
    if (lowerName.includes("nav") || lowerName.includes("header") || lowerName.includes("menu")) {
      return "navigation";
    }
    if (lowerName.includes("card") || lowerName.includes("widget") || lowerName.includes("dashboard")) {
      return "dashboard";
    }
    if (lowerName.includes("form") || lowerName.includes("input")) {
      return "form";
    }
    return "general";
  }, [lowerName]);

  const handleClick = () => {
    sound.playClick(850);
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col p-4 rounded-2xl bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 select-none"
    >
      {/* Schematic Wireframe Viewport (clean minimal frame, no 3 colored dots) */}
      <div className="w-full h-44 rounded-xl bg-[#090a0b] border border-hairline/60 flex items-center justify-center p-4 relative overflow-hidden group-hover:border-primary/40 transition-colors">
        {/* Subtle background blueprint grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141517_1px,transparent_1px),linear-gradient(to_bottom,#141517_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />

        {/* Dynamic Wireframe Graphics matching Image 1 */}
        {wireframeType === "auth" && (
          <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md space-y-2.5">
            <div className="w-16 h-2 rounded-full bg-ink/70 mx-auto mb-1" />
            <div className="space-y-1.5">
              <div className="w-full h-5 rounded border border-hairline/80 bg-surface-3/60 px-2 flex items-center">
                <div className="w-12 h-1.5 rounded-full bg-ink-tertiary/60" />
              </div>
              <div className="w-full h-5 rounded border border-hairline/80 bg-surface-3/60 px-2 flex items-center">
                <div className="w-16 h-1.5 rounded-full bg-ink-tertiary/60" />
              </div>
            </div>
            <div className="w-14 h-4 rounded bg-primary/90 mx-auto flex items-center justify-center shadow-xs">
              <div className="w-8 h-1 rounded-full bg-white/90" />
            </div>
          </div>
        )}

        {wireframeType === "verify" && (
          <div className="relative w-44 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md text-center space-y-2.5">
            <div className="w-20 h-2 rounded-full bg-ink/70 mx-auto mb-1" />
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-7 h-8 rounded border border-hairline/80 bg-surface-3/60 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-ink-muted/80" />
                </div>
              ))}
            </div>
            <div className="w-16 h-4 rounded bg-primary/90 mx-auto flex items-center justify-center">
              <div className="w-10 h-1 rounded-full bg-white/90" />
            </div>
          </div>
        )}

        {wireframeType === "error404" && (
          <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-3.5 shadow-md flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-20 h-2 rounded-full bg-ink/70" />
              <div className="w-24 h-1.5 rounded-full bg-ink-tertiary/50" />
              <div className="w-12 h-3.5 rounded bg-primary/90 mt-1 flex items-center justify-center">
                <div className="w-7 h-1 rounded-full bg-white/90" />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tighter text-ink-tertiary/30 select-none pr-1">
              404
            </div>
          </div>
        )}

        {wireframeType === "email" && (
          <div className="relative flex items-center justify-center gap-2">
            {/* Desktop email wireframe */}
            <div className="w-32 rounded-lg bg-surface-2/80 border border-hairline p-2.5 shadow-md space-y-1.5">
              <div className="w-14 h-2 rounded-full bg-ink/70 mb-1" />
              <div className="w-full h-1.5 rounded-full bg-ink-tertiary/40" />
              <div className="w-3/4 h-1.5 rounded-full bg-ink-tertiary/40" />
              <div className="w-10 h-3 rounded bg-primary/80 mt-1" />
            </div>
            {/* Phone template silhouette */}
            <div className="w-14 h-24 rounded-lg bg-surface-3/90 border border-hairline p-1.5 shadow-lg flex flex-col justify-between">
              <div className="w-4 h-0.5 rounded-full bg-ink-tertiary/60 mx-auto" />
              <div className="space-y-1">
                <div className="w-full h-1 rounded-full bg-ink-muted/50" />
                <div className="w-4/5 h-1 rounded-full bg-ink-muted/40" />
                <div className="w-6 h-2 rounded bg-primary/70 mx-auto mt-1" />
              </div>
              <div className="w-3 h-0.5 rounded-full bg-ink-tertiary/40 mx-auto" />
            </div>
          </div>
        )}

        {wireframeType === "avatar" && (
          <div className="relative w-44 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md space-y-2">
            <div className="w-16 h-2 rounded-full bg-ink/70 mb-2" />
            {/* Avatar group overlap */}
            <div className="flex items-center -space-x-2 justify-center py-1">
              <div className="w-7 h-7 rounded-full border-2 border-surface-2 bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-[10px] text-white font-medium shadow-xs">
                U1
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-surface-2 bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-medium shadow-xs">
                U2
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-surface-2 bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] text-white font-medium shadow-xs">
                U3
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-surface-2 bg-surface-3 border-hairline text-ink-tertiary text-[9px] flex items-center justify-center font-mono font-medium">
                +4
              </div>
            </div>
            <div className="w-24 h-1.5 rounded-full bg-ink-tertiary/40 mx-auto" />
          </div>
        )}

        {wireframeType === "navigation" && (
          <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-2.5 shadow-md space-y-2">
            {/* Topbar navbar */}
            <div className="w-full h-5 rounded border border-hairline/80 bg-surface-3/80 px-2 flex items-center justify-between">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-1 rounded-full bg-ink-tertiary/60" />
                <div className="w-6 h-1 rounded-full bg-ink-tertiary/60" />
                <div className="w-6 h-1 rounded-full bg-ink-tertiary/60" />
              </div>
              <div className="w-4 h-2 rounded bg-primary/80" />
            </div>
            <div className="w-full h-12 rounded border border-hairline/60 bg-surface-3/30 p-2 flex items-center justify-center">
              <div className="w-20 h-1.5 rounded-full bg-ink-tertiary/40" />
            </div>
          </div>
        )}

        {wireframeType === "dashboard" && (
          <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-2.5 shadow-md space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="w-14 h-2 rounded-full bg-ink/70" />
              <div className="w-4 h-1.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="h-10 rounded border border-hairline/80 bg-surface-3/60 p-1.5 space-y-1">
                <div className="w-6 h-1 rounded-full bg-ink-tertiary/50" />
                <div className="w-10 h-2.5 rounded-full bg-ink/80" />
              </div>
              <div className="h-10 rounded border border-hairline/80 bg-surface-3/60 p-1.5 space-y-1">
                <div className="w-6 h-1 rounded-full bg-ink-tertiary/50" />
                <div className="w-10 h-2.5 rounded-full bg-ink/80" />
              </div>
            </div>
          </div>
        )}

        {(wireframeType === "form" || wireframeType === "general") && (
          <div className="relative w-44 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md space-y-2">
            <div className="w-18 h-2 rounded-full bg-ink/70 mb-1" />
            <div className="space-y-1.5">
              <div className="w-full h-4 rounded border border-hairline/70 bg-surface-3/50 px-1.5 flex items-center">
                <div className="w-10 h-1 rounded-full bg-ink-tertiary/50" />
              </div>
              <div className="w-full h-4 rounded border border-hairline/70 bg-surface-3/50 px-1.5 flex items-center">
                <div className="w-14 h-1 rounded-full bg-ink-tertiary/50" />
              </div>
            </div>
            <div className="w-12 h-3.5 rounded bg-primary/90 flex items-center justify-center">
              <div className="w-6 h-1 rounded-full bg-white/90" />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Text matching Image 1 */}
      <div className="mt-3 px-1">
        <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink group-hover:text-primary transition-colors capitalize truncate">
          {name}
        </h3>
        <p className="text-xs text-ink-muted mt-0.5 tracking-tight font-normal">
          {count} {count === 1 ? "component" : "components"}
        </p>
      </div>
    </div>
  );
}
