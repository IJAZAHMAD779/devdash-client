"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, ProjectStatus } from "@/types/project";
import { Task } from "@/types/task";
import { ProgressBar } from "./progress-bar";
import { ActivityBars, DayMetric } from "./sparkline";

export interface ProjectsActivityPanelProps {
  projects: Project[];
  tasks: Task[];
  isLoadingProjects?: boolean;
  className?: string;
}

const STATUS_DOT: Record<ProjectStatus, string> = {
  IN_PROGRESS: "bg-accent",
  PLANNING: "bg-muted",
  ON_HOLD: "bg-warn",
  COMPLETED: "bg-ok",
  ARCHIVED: "bg-subtle",
};

export function ProjectsActivityPanel({
  projects,
  tasks,
  isLoadingProjects,
  className,
}: ProjectsActivityPanelProps) {
  // Filter launchpad projects (favorites first, then active)
  const activeProjects = useMemo(() => {
    if (!projects) return [];
    const favs = projects.filter((p) => p.favorite);
    const others = projects.filter((p) => !p.favorite && p.status !== "COMPLETED");
    return [...favs, ...others].slice(0, 4);
  }, [projects]);

  // Compute 7-day activity bars from real completed tasks
  const weekActivity = useMemo((): DayMetric[] => {
    const days: DayMetric[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      // Count tasks with completedAt on this date
      const count = tasks.filter((t) => {
        if (t.status !== "DONE") return false;
        if (!t.completedAt) return false;
        return t.completedAt.startsWith(dateStr);
      }).length;

      days.push({
        day: dayName,
        dateStr,
        count,
        isToday: i === 0,
      });
    }

    return days;
  }, [tasks]);

  return (
    <div className={cn("space-y-5", className)}>
      {/* 1. Projects Panel */}
      <div className="bg-surface-1 border border-line rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">
            PROJECTS
          </span>
          <Link
            href="/projects"
            className="text-xs font-mono text-muted hover:text-text-primary transition-colors flex items-center gap-1 group"
          >
            <span>Open Projects Hub</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="p-5">
          {isLoadingProjects ? (
            <div className="space-y-3 py-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-2/50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              No active projects. Create one in the Projects Hub.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {activeProjects.map((p) => {
                const totalTasks = p.tasks?.length ?? p._count?.tasks ?? 0;
                const doneTasks =
                  p.tasks?.filter((t) => t.status === "DONE").length ?? 0;
                const percent =
                  totalTasks > 0
                    ? Math.round((doneTasks / totalTasks) * 100)
                    : p.status === "COMPLETED"
                    ? 100
                    : 0;

                return (
                  <Link
                    key={p.id}
                    href={`/projects?id=${p.id}&view=workbench`}
                    className="py-3 first:pt-0 last:pb-0 block group transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            STATUS_DOT[p.status] || "bg-subtle"
                          )}
                        />
                        <span className="text-xs sm:text-sm font-medium text-text-primary group-hover:text-white truncate">
                          {p.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-subtle shrink-0">
                        <span>{totalTasks} tasks</span>
                        <span className="text-muted">{percent}%</span>
                      </div>
                    </div>
                    <ProgressBar progress={percent} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Week Activity Panel */}
      <div className="bg-surface-1 border border-line rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">
            WEEK ACTIVITY
          </span>
          <span className="text-[11px] font-mono text-subtle">
            7-day completion
          </span>
        </div>
        <ActivityBars data={weekActivity} />
      </div>
    </div>
  );
}
