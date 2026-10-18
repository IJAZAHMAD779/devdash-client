import React from "react";
import { Layers } from "lucide-react";
import { IsometricWorkspace } from "@/components/auth/isometric-workspace";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-canvas">
      {/* ── LEFT COLUMN: Minimalist Linear Branding & Animated 3D Isometric Stack ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[48%] h-full flex-col justify-between p-8 xl:p-12 bg-canvas border-r border-hairline relative overflow-hidden select-none">
        {/* Subtle dot matrix grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient top-left highlight */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        {/* 1. Top: Minimal Brand Mark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-1 border border-hairline flex items-center justify-center text-ink shadow-sm">
            <Layers className="w-4 h-4 text-ink-muted" />
          </div>
          <span className="text-sm font-semibold tracking-[-0.3px] text-ink">
            DevDash
          </span>
        </div>

        {/* 2. Center: Autonomous & Interactive Animated Isometric Slabs */}
        <div className="relative z-10 my-auto py-4 flex items-center justify-center">
          <IsometricWorkspace />
        </div>

        {/* 3. Bottom: Editorial Typography (Zero AI Slop) */}
        <div className="relative z-10 space-y-2.5 max-w-sm">
          <h2 className="text-2xl font-bold tracking-[-0.8px] text-ink leading-tight">
            Your developer workspace, synchronized.
          </h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Organize repositories, track kanban tasks, and curate syntax-highlighted code snippets without context switching.
          </p>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Sign In / Sign Up Form (Zero Scroll) ── */}
      <div className="flex-1 h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[390px] flex flex-col items-center justify-center my-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
