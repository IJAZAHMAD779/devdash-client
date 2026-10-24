"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SchematicWireframeProps {
  category?: string;
  name?: string;
  className?: string;
}

export type WireframeType =
  | "auth"
  | "verify"
  | "error404"
  | "email"
  | "avatar"
  | "button"
  | "modal"
  | "table"
  | "badge"
  | "card"
  | "navigation"
  | "sidebar"
  | "tabs"
  | "dashboard"
  | "pet"
  | "form"
  | "general";

export function getWireframeType(category?: string, name?: string): WireframeType {
  const combined = `${category || ""} ${name || ""}`.toLowerCase();

  if (combined.includes("login") || combined.includes("sign") || combined.includes("auth") || combined.includes("register")) {
    return "auth";
  }
  if (combined.includes("verify") || combined.includes("otp") || combined.includes("pin") || combined.includes("code")) {
    return "verify";
  }
  if (combined.includes("404") || combined.includes("error") || combined.includes("not found")) {
    return "error404";
  }
  if (combined.includes("email") || combined.includes("mail") || combined.includes("template") || combined.includes("newsletter")) {
    return "email";
  }
  if (combined.includes("avatar") || combined.includes("user") || combined.includes("profile") || combined.includes("team")) {
    return "avatar";
  }
  if (combined.includes("button") || combined.includes("cta") || combined.includes("action")) {
    return "button";
  }
  if (combined.includes("modal") || combined.includes("dialog") || combined.includes("popup") || combined.includes("sheet")) {
    return "modal";
  }
  if (combined.includes("table") || combined.includes("grid") || combined.includes("data") || combined.includes("row")) {
    return "table";
  }
  if (combined.includes("badge") || combined.includes("tag") || combined.includes("chip") || combined.includes("pill") || combined.includes("label")) {
    return "badge";
  }
  if (combined.includes("card") || combined.includes("tile") || combined.includes("pricing") || combined.includes("widget")) {
    return "card";
  }
  if (combined.includes("nav") || combined.includes("header") || combined.includes("menu") || combined.includes("topbar")) {
    return "navigation";
  }
  if (combined.includes("sidebar") || combined.includes("drawer") || combined.includes("layout") || combined.includes("aside")) {
    return "sidebar";
  }
  if (combined.includes("tab") || combined.includes("accordion") || combined.includes("collapse") || combined.includes("faq")) {
    return "tabs";
  }
  if (combined.includes("dashboard") || combined.includes("stat") || combined.includes("chart") || combined.includes("metric") || combined.includes("analytic")) {
    return "dashboard";
  }
  if (combined.includes("pet") || combined.includes("game") || combined.includes("mascot") || combined.includes("canvas") || combined.includes("dino") || combined.includes("snake")) {
    return "pet";
  }
  if (combined.includes("form") || combined.includes("input") || combined.includes("select") || combined.includes("field")) {
    return "form";
  }

  return "general";
}

export function SchematicWireframe({ category, name, className }: SchematicWireframeProps) {
  const wireframeType = useMemo(() => getWireframeType(category, name), [category, name]);

  // Two-letter monogram for general fallback
  const monogram = useMemo(() => {
    const raw = (name || category || "UI").trim();
    const parts = raw.split(/[\s_-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  }, [name, category]);

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center p-3 relative overflow-hidden select-none",
        className
      )}
    >
      {/* Background blueprint architectural grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161719_1px,transparent_1px),linear-gradient(to_bottom,#161719_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />

      {/* 1. AUTH / LOGIN WIREFRAME */}
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
          <div className="w-16 h-4 rounded bg-primary/90 mx-auto flex items-center justify-center shadow-xs">
            <div className="w-8 h-1 rounded-full bg-white/90" />
          </div>
        </div>
      )}

      {/* 2. VERIFY / OTP WIREFRAME */}
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

      {/* 3. 404 / ERROR WIREFRAME */}
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

      {/* 4. EMAIL / TEMPLATES WIREFRAME */}
      {wireframeType === "email" && (
        <div className="relative flex items-center justify-center gap-2">
          <div className="w-32 rounded-lg bg-surface-2/80 border border-hairline p-2.5 shadow-md space-y-1.5">
            <div className="w-14 h-2 rounded-full bg-ink/70 mb-1" />
            <div className="w-full h-1.5 rounded-full bg-ink-tertiary/40" />
            <div className="w-3/4 h-1.5 rounded-full bg-ink-tertiary/40" />
            <div className="w-10 h-3 rounded bg-primary/80 mt-1" />
          </div>
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

      {/* 5. AVATAR / USERS WIREFRAME */}
      {wireframeType === "avatar" && (
        <div className="relative w-44 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md space-y-2">
          <div className="w-16 h-2 rounded-full bg-ink/70 mb-2" />
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

      {/* 6. BUTTONS / CTA WIREFRAME */}
      {wireframeType === "button" && (
        <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md space-y-2.5">
          <div className="w-16 h-2 rounded-full bg-ink/70 mb-1" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-6 rounded bg-primary flex items-center justify-center shadow-xs">
              <div className="w-8 h-1 rounded-full bg-white/90" />
            </div>
            <div className="h-6 rounded bg-surface-3 border border-hairline flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-ink/80" />
            </div>
            <div className="h-6 rounded border border-primary/50 bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-primary" />
            </div>
            <div className="h-6 rounded bg-surface-3/60 border border-dashed border-hairline flex items-center justify-center">
              <div className="w-6 h-1 rounded-full bg-ink-tertiary" />
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL / DIALOG WIREFRAME */}
      {wireframeType === "modal" && (
        <div className="relative w-48 rounded-lg bg-surface-2/90 border border-hairline p-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-hairline/60">
            <div className="w-14 h-2 rounded-full bg-ink/80" />
            <div className="w-2 h-2 rounded-full bg-ink-tertiary/60" />
          </div>
          <div className="space-y-1 py-1">
            <div className="w-full h-1.5 rounded-full bg-ink-tertiary/50" />
            <div className="w-3/4 h-1.5 rounded-full bg-ink-tertiary/40" />
          </div>
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <div className="w-10 h-4 rounded bg-surface-3 border border-hairline flex items-center justify-center">
              <div className="w-5 h-1 rounded-full bg-ink-tertiary" />
            </div>
            <div className="w-12 h-4 rounded bg-primary flex items-center justify-center">
              <div className="w-6 h-1 rounded-full bg-white" />
            </div>
          </div>
        </div>
      )}

      {/* 8. TABLE / DATA GRID WIREFRAME */}
      {wireframeType === "table" && (
        <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline overflow-hidden shadow-md text-[10px]">
          {/* Header row */}
          <div className="px-2.5 py-1.5 bg-surface-3/80 border-b border-hairline flex items-center justify-between">
            <div className="w-10 h-1.5 rounded-full bg-ink-muted/80" />
            <div className="w-8 h-1.5 rounded-full bg-ink-muted/60" />
            <div className="w-6 h-1.5 rounded-full bg-ink-muted/60" />
          </div>
          {/* Data rows */}
          <div className="divide-y divide-hairline/40 p-1 space-y-1">
            <div className="px-1.5 py-1 flex items-center justify-between">
              <div className="w-12 h-1 rounded-full bg-ink/70" />
              <div className="w-6 h-1 rounded-full bg-ink-tertiary/50" />
              <div className="w-5 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
            </div>
            <div className="px-1.5 py-1 flex items-center justify-between">
              <div className="w-14 h-1 rounded-full bg-ink/70" />
              <div className="w-8 h-1 rounded-full bg-ink-tertiary/50" />
              <div className="w-5 h-2 rounded-full bg-sky-500/20 border border-sky-500/40" />
            </div>
          </div>
        </div>
      )}

      {/* 9. BADGE / CHIPS WIREFRAME */}
      {wireframeType === "badge" && (
        <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md space-y-2.5">
          <div className="w-16 h-2 rounded-full bg-ink/70 mb-1" />
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-6 h-1 rounded-full bg-primary" />
            </div>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <div className="w-6 h-1 rounded-full bg-emerald-400" />
            </div>
            <div className="px-2 py-0.5 rounded-full bg-surface-3 border border-hairline flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-ink-tertiary" />
              <div className="w-8 h-1 rounded-full bg-ink-muted" />
            </div>
          </div>
        </div>
      )}

      {/* 10. CARD / TILE WIREFRAME */}
      {wireframeType === "card" && (
        <div className="relative w-44 rounded-lg bg-surface-2/80 border border-hairline p-2.5 shadow-md space-y-2">
          {/* Card header image placeholder */}
          <div className="w-full h-10 rounded bg-surface-3/80 border border-hairline/60 flex items-center justify-center">
            <div className="w-6 h-3 rounded border border-hairline bg-surface-2" />
          </div>
          <div className="w-18 h-2 rounded-full bg-ink/80" />
          <div className="w-full h-1.5 rounded-full bg-ink-tertiary/40" />
          <div className="w-12 h-3.5 rounded bg-primary/80 mt-1" />
        </div>
      )}

      {/* 11. NAVIGATION / TOPBAR WIREFRAME */}
      {wireframeType === "navigation" && (
        <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-2.5 shadow-md space-y-2">
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

      {/* 12. SIDEBAR WIREFRAME */}
      {wireframeType === "sidebar" && (
        <div className="relative w-48 h-24 rounded-lg bg-surface-2/80 border border-hairline p-2 shadow-md flex gap-2">
          {/* Left rail */}
          <div className="w-12 h-full rounded bg-surface-3/80 border border-hairline/60 p-1.5 space-y-1.5">
            <div className="w-full h-3 rounded bg-primary/30 border border-primary/50" />
            <div className="w-full h-2 rounded bg-surface-2" />
            <div className="w-full h-2 rounded bg-surface-2" />
            <div className="w-full h-2 rounded bg-surface-2" />
          </div>
          {/* Main body */}
          <div className="flex-1 h-full rounded border border-hairline/60 bg-surface-3/30 p-1.5 space-y-1.5">
            <div className="w-12 h-2 rounded-full bg-ink/80" />
            <div className="w-full h-8 rounded bg-surface-2/60 border border-hairline/40" />
          </div>
        </div>
      )}

      {/* 13. TABS / ACCORDION WIREFRAME */}
      {wireframeType === "tabs" && (
        <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-2.5 shadow-md space-y-2">
          {/* Segmented tabs */}
          <div className="w-full h-5 rounded bg-surface-3/80 border border-hairline/80 p-0.5 flex items-center gap-1">
            <div className="h-full w-12 rounded bg-primary flex items-center justify-center">
              <div className="w-6 h-1 rounded-full bg-white" />
            </div>
            <div className="h-full flex-1 flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-ink-tertiary" />
            </div>
            <div className="h-full flex-1 flex items-center justify-center">
              <div className="w-8 h-1 rounded-full bg-ink-tertiary" />
            </div>
          </div>
          <div className="w-full h-10 rounded border border-hairline/60 bg-surface-3/30 p-2 space-y-1">
            <div className="w-16 h-1.5 rounded-full bg-ink/70" />
            <div className="w-24 h-1 rounded-full bg-ink-tertiary/40" />
          </div>
        </div>
      )}

      {/* 14. DASHBOARD / METRICS WIREFRAME */}
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

      {/* 15. PET / CANVAS / GAME WIREFRAME */}
      {wireframeType === "pet" && (
        <div className="relative w-44 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md text-center space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-12 h-2 rounded-full bg-ink/70" />
            <div className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-mono">
              ACTIVE
            </div>
          </div>
          {/* Pixel pet character silhouette */}
          <div className="w-14 h-12 rounded-lg bg-surface-3 border border-hairline/80 mx-auto flex flex-col items-center justify-center p-1 relative shadow-inner">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            </div>
            <div className="w-4 h-1 rounded-full bg-ink-tertiary/60" />
          </div>
          <div className="w-20 h-1.5 rounded-full bg-ink-tertiary/40 mx-auto" />
        </div>
      )}

      {/* 16. FORM / INPUT WIREFRAME */}
      {wireframeType === "form" && (
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

      {/* 17. PROCEDURAL BLUEPRINT FALLBACK (for ANY custom category) */}
      {wireframeType === "general" && (
        <div className="relative w-48 rounded-lg bg-surface-2/80 border border-hairline p-3 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-md bg-surface-3 border border-hairline flex items-center justify-center font-mono font-bold text-xs text-primary shadow-xs">
              {monogram}
            </div>
            <div className="w-16 h-2 rounded-full bg-ink/70" />
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded bg-surface-3/60 border border-hairline/50" />
            <div className="w-3/4 h-2 rounded bg-surface-3/40" />
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-hairline/40">
            <div className="w-8 h-1.5 rounded-full bg-ink-tertiary/50" />
            <div className="w-10 h-3 rounded bg-primary/80" />
          </div>
        </div>
      )}
    </div>
  );
}
