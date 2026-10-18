import React from "react";
import {
  Layers,
  FolderGit2,
  CheckSquare,
  Code2,
  Component,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-canvas">
      {/* ── LEFT COLUMN: DevDash Branding & Feature Showcase ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[48%] h-full flex-col justify-between p-8 xl:p-12 bg-surface-1/40 border-r border-hairline relative overflow-hidden select-none">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,rgba(94,106,210,0.18),transparent)] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top: Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-primary shadow-md shadow-primary/20">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-[-0.4px] text-ink leading-tight">
              DevDash
            </span>
            <span className="text-[11px] font-mono text-ink-subtle">
              Personal Developer Workspace
            </span>
          </div>
        </div>

        {/* Center: Hero Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-md my-auto py-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium tracking-tight">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Productivity Hub</span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-bold tracking-[-1px] text-ink leading-[1.2]">
            Where code, tasks, and ideas stay in flow.
          </h2>

          <p className="text-xs xl:text-sm text-ink-muted leading-relaxed">
            A fast, decoupled command center designed for developers. Seamlessly
            organize active projects, track agile kanban tasks, curate
            syntax-highlighted snippets, and preview UI components.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-surface-1 border border-hairline/80 flex items-center gap-2.5 group hover:border-hairline-strong transition-colors">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  Projects Hub
                </p>
                <p className="text-[10px] text-ink-subtle truncate">
                  Status &amp; repos
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-1 border border-hairline/80 flex items-center gap-2.5 group hover:border-hairline-strong transition-colors">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  Zero-Lag Kanban
                </p>
                <p className="text-[10px] text-ink-subtle truncate">
                  Interactive tasks
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-1 border border-hairline/80 flex items-center gap-2.5 group hover:border-hairline-strong transition-colors">
              <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  Snippets Vault
                </p>
                <p className="text-[10px] text-ink-subtle truncate">
                  Shiki syntax highlight
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-1 border border-hairline/80 flex items-center gap-2.5 group hover:border-hairline-strong transition-colors">
              <div className="w-7 h-7 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Component className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  UI Catalog
                </p>
                <p className="text-[10px] text-ink-subtle truncate">
                  Framework elements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Security & Architecture Credentials */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-ink-subtle border-t border-hairline/60 pt-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-tenant Supabase PostgreSQL</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <Terminal className="w-3 h-3 text-ink-tertiary" />
            <span>Next.js 14 + Express API</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Sign In / Sign Up Form (No Scroll) ── */}
      <div className="flex-1 h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
        {/* Subtle right-column ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[390px] flex flex-col items-center justify-center my-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
