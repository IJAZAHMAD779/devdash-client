import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  Code2,
  Component,
  BookOpen,
  ArrowLeft,
  Compass,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-canvas text-ink">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Glowing 404 badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-hairline shadow-inner">
          <Compass className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-mono font-medium text-ink-muted">
            Error 404 . Route Not Found
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-[-1.8px] text-ink">
            Lost in the Workspace
          </h1>
          <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
            The page or resource you are looking for doesn&apos;t exist, has been
            relocated, or the URL might be mistyped.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Projects</span>
          </Link>
        </div>

        {/* Quick Hub Navigation Cards */}
        <div className="pt-6 border-t border-hairline/60">
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary mb-3">
            Quick Navigation Hub
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <Link
              href="/tasks"
              className="p-3 rounded-lg bg-surface-1 hover:bg-surface-2 border border-hairline transition-colors group flex flex-col gap-1.5"
            >
              <CheckSquare className="w-4 h-4 text-ink-subtle group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-ink group-hover:text-primary transition-colors">
                Tasks
              </span>
              <span className="text-[10px] text-ink-tertiary">Kanban board</span>
            </Link>

            <Link
              href="/snippets"
              className="p-3 rounded-lg bg-surface-1 hover:bg-surface-2 border border-hairline transition-colors group flex flex-col gap-1.5"
            >
              <Code2 className="w-4 h-4 text-ink-subtle group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-ink group-hover:text-primary transition-colors">
                Snippets
              </span>
              <span className="text-[10px] text-ink-tertiary">Code vault</span>
            </Link>

            <Link
              href="/components"
              className="p-3 rounded-lg bg-surface-1 hover:bg-surface-2 border border-hairline transition-colors group flex flex-col gap-1.5"
            >
              <Component className="w-4 h-4 text-ink-subtle group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-ink group-hover:text-primary transition-colors">
                Components
              </span>
              <span className="text-[10px] text-ink-tertiary">UI gallery</span>
            </Link>

            <Link
              href="/resources"
              className="p-3 rounded-lg bg-surface-1 hover:bg-surface-2 border border-hairline transition-colors group flex flex-col gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-ink-subtle group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-ink group-hover:text-primary transition-colors">
                Resources
              </span>
              <span className="text-[10px] text-ink-tertiary">Notes & URLs</span>
            </Link>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-[11px] text-ink-tertiary flex items-center justify-center gap-1.5">
          <span>Tip: Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-[10px] font-mono text-ink-muted">
            ⌘K
          </kbd>
          <span>to open Spotlight search anywhere.</span>
        </p>
      </div>
    </div>
  );
}
