import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SegmentedBar } from "./segmented-bar";
import { Sparkline } from "./sparkline";

export interface StatStripProps {
  activeProjects: number;
  totalProjects: number;
  pendingTasks: number;
  urgentTasks: number;
  totalSnippets: number;
  activeReminders: number;
  nextReminderTime?: string | null;
  taskTrendPoints?: number[];
  onOpenReminders: () => void;
  className?: string;
}

export function StatStrip({
  activeProjects,
  totalProjects,
  pendingTasks,
  urgentTasks,
  totalSnippets,
  activeReminders,
  nextReminderTime,
  taskTrendPoints,
  onOpenReminders,
  className,
}: StatStripProps) {
  return (
    <div
      className={cn(
        "bg-surface-1 border border-line rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] grid grid-cols-2 lg:grid-cols-4 overflow-hidden",
        className
      )}
    >
      {/* Col 1: Active Projects */}
      <Link
        href="/projects"
        className="p-4 sm:p-5 flex flex-col justify-between hover:bg-surface-2/40 transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <div className="flex items-center justify-between gap-1 mb-2">
          <span
            className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted truncate"
            title="ACTIVE PROJECTS"
          >
            ACTIVE PROJECTS
          </span>
        </div>
        <div className="my-1">
          <span className="text-3xl sm:text-4xl @3xl:text-5xl font-semibold tracking-tight tabular-nums text-text-primary font-mono">
            {activeProjects}
            <span className="text-sm sm:text-base font-normal text-muted ml-1.5 font-mono">
              / {totalProjects}
            </span>
          </span>
        </div>
        <div className="pt-2">
          <SegmentedBar total={totalProjects} active={activeProjects} />
        </div>
      </Link>

      {/* Col 2: Pending Tasks */}
      <Link
        href="/tasks"
        className="p-4 sm:p-5 flex flex-col justify-between border-l border-line hover:bg-surface-2/40 transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <div className="flex items-center justify-between gap-1 mb-2">
          <span
            className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted truncate"
            title="PENDING TASKS"
          >
            PENDING TASKS
          </span>
          {taskTrendPoints && taskTrendPoints.length > 1 && (
            <Sparkline points={taskTrendPoints} width={52} height={14} />
          )}
        </div>
        <div className="my-1">
          <span className="text-3xl sm:text-4xl @3xl:text-5xl font-semibold tracking-tight tabular-nums text-text-primary font-mono">
            {pendingTasks}
          </span>
        </div>
        <div className="pt-2 flex items-center gap-1.5 text-xs font-mono">
          {urgentTasks > 0 ? (
            <span className="text-warn flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              <span>{urgentTasks} urgent</span>
            </span>
          ) : (
            <span className="text-muted">all clear</span>
          )}
        </div>
      </Link>

      {/* Col 3: Snippets Vault */}
      <Link
        href="/snippets"
        className="p-4 sm:p-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-line hover:bg-surface-2/40 transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <div className="flex items-center justify-between gap-1 mb-2">
          <span
            className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted truncate"
            title="SNIPPETS"
          >
            SNIPPETS
          </span>
        </div>
        <div className="my-1">
          <span className="text-3xl sm:text-4xl @3xl:text-5xl font-semibold tracking-tight tabular-nums text-text-primary font-mono">
            {totalSnippets}
          </span>
        </div>
        <div className="pt-2 text-xs font-mono text-muted">
          <span>templates</span>
        </div>
      </Link>

      {/* Col 4: Reminders */}
      <button
        type="button"
        onClick={onOpenReminders}
        className="p-4 sm:p-5 flex flex-col justify-between border-t lg:border-t-0 border-l border-line hover:bg-surface-2/40 transition-colors group cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <div className="flex items-center justify-between gap-1 mb-2">
          <span
            className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted truncate"
            title="REMINDERS"
          >
            REMINDERS
          </span>
        </div>
        <div className="my-1">
          <span className="text-3xl sm:text-4xl @3xl:text-5xl font-semibold tracking-tight tabular-nums text-text-primary font-mono">
            {activeReminders}
          </span>
        </div>
        <div className="pt-2 text-xs font-mono text-muted truncate">
          <span>{nextReminderTime ? `next: ${nextReminderTime}` : "in queue"}</span>
        </div>
      </button>
    </div>
  );
}
