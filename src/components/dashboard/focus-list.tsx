"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, CornerDownLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, Priority } from "@/types/task";

export interface FocusListProps {
  tasks: Task[];
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onAddTask: (title: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; dotClass: string; textClass: string }
> = {
  URGENT: {
    label: "urgent",
    dotClass: "bg-danger",
    textClass: "text-danger",
  },
  HIGH: {
    label: "high",
    dotClass: "bg-warn",
    textClass: "text-warn",
  },
  MEDIUM: {
    label: "medium",
    dotClass: "bg-accent",
    textClass: "text-muted",
  },
  LOW: {
    label: "low",
    dotClass: "bg-subtle",
    textClass: "text-subtle",
  },
};

export function FocusList({
  tasks,
  onToggleTask,
  onAddTask,
  isLoading,
  className,
}: FocusListProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingTasks = tasks.filter((t) => t.status !== "DONE");
  const nextUpTask = pendingTasks[0] || null;
  const remainingTasks = pendingTasks.slice(1, 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddTask(quickTitle.trim());
      setQuickTitle("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-surface-1 border border-line rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col justify-between overflow-hidden",
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">
            TODAY&apos;S FOCUS
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-surface-2 border border-line text-muted">
            {pendingTasks.length}
          </span>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-mono text-muted hover:text-text-primary transition-colors flex items-center gap-1 group"
        >
          <span>All tasks</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-20 bg-surface-2/60 rounded-md animate-pulse" />
            <div className="h-10 bg-surface-2/40 rounded-md animate-pulse" />
            <div className="h-10 bg-surface-2/40 rounded-md animate-pulse" />
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="py-10 text-center select-none">
            <p className="text-sm font-medium text-text-primary mb-1">
              All caught up
            </p>
            <p className="text-xs text-muted">
              No urgent or pending tasks scheduled for today.
            </p>
          </div>
        ) : (
          <>
            {/* "Next Up" Block */}
            {nextUpTask && (
              <div className="p-4 rounded-md bg-surface-2/50 border border-line hover:border-line-strong transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-accent font-medium">
                    NEXT UP
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {nextUpTask.project && (
                      <span className="text-subtle text-[11px] truncate max-w-[120px]">
                        {nextUpTask.project.title}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          PRIORITY_CONFIG[nextUpTask.priority]?.dotClass || "bg-subtle"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider",
                          PRIORITY_CONFIG[nextUpTask.priority]?.textClass || "text-subtle"
                        )}
                      >
                        {PRIORITY_CONFIG[nextUpTask.priority]?.label || nextUpTask.priority}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleTask(nextUpTask.id, nextUpTask.status)}
                    aria-label={`Mark "${nextUpTask.title}" as complete`}
                    className="mt-1 w-4 h-4 rounded-[4px] border border-line-strong hover:border-accent flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    {nextUpTask.status === "DONE" && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-base sm:text-lg font-medium text-text-primary tracking-tight leading-snug">
                      {nextUpTask.title}
                    </p>
                    {nextUpTask.dueDate && (
                      <span className="inline-block mt-1 text-[11px] font-mono text-muted">
                        Due: {new Date(nextUpTask.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Remaining Tasks List (40px rows, hairline separators) */}
            {remainingTasks.length > 0 && (
              <div className="divide-y divide-line border-t border-line pt-1">
                {remainingTasks.map((t) => {
                  const isDone = t.status === "DONE";
                  const priorityMeta = PRIORITY_CONFIG[t.priority];

                  return (
                    <div
                      key={t.id}
                      className="h-10 flex items-center justify-between gap-3 group transition-opacity duration-150"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id, t.status)}
                          aria-label={`Mark "${t.title}" as complete`}
                          className={cn(
                            "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                            isDone
                              ? "bg-accent border-accent text-white"
                              : "border-line-strong hover:border-accent bg-transparent"
                          )}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span
                          className={cn(
                            "text-xs truncate transition-all duration-150",
                            isDone
                              ? "line-through text-subtle opacity-50"
                              : "text-text-primary group-hover:text-white"
                          )}
                        >
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {t.project && (
                          <span className="hidden sm:inline-block text-[11px] font-mono text-subtle max-w-[110px] truncate">
                            {t.project.title}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              priorityMeta?.dotClass || "bg-subtle"
                            )}
                          />
                          <span
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-wider",
                              priorityMeta?.textClass || "text-subtle"
                            )}
                          >
                            {priorityMeta?.label || t.priority}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Add Row (borderless with + prefix and ⏎ hint, bg-surface-2 on focus only) */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-line flex items-center gap-2 px-4 py-2.5 focus-within:bg-surface-2 transition-colors"
      >
        <Plus className="w-3.5 h-3.5 text-muted shrink-0" />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a focus task for today..."
          className="flex-1 bg-transparent border-none text-xs text-text-primary placeholder:text-subtle focus:outline-none"
        />
        <div className="flex items-center gap-1 text-[10px] font-mono text-subtle select-none">
          <span>return</span>
          <CornerDownLeft className="w-2.5 h-2.5" />
        </div>
      </form>
    </div>
  );
}
