"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Task, TaskStatus, Priority } from "@/types/task";
import { TaskListRow } from "./task-list-row";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

interface TaskListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onNewTask: () => void;
}

type SortField = "title" | "project" | "priority" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const PRIORITY_ORDER: Record<Priority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const STATUS_ORDER: Record<TaskStatus, number> = {
  TODO: 1,
  IN_PROGRESS: 2,
  IN_REVIEW: 3,
  DONE: 4,
};

export function TaskListView({
  tasks,
  onEdit,
  onView,
  onNewTask,
}: TaskListViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(true);

  // Load done collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_tasks_done_collapsed");
      if (saved !== null) {
        setIsDoneCollapsed(saved === "true");
      }
    }
  }, []);

  const toggleDoneCollapse = () => {
    sound.playClick(700);
    setIsDoneCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("devdash_tasks_done_collapsed", String(next));
      }
      return next;
    });
  };

  const handleHeaderSort = (field: SortField) => {
    sound.playClick(800);
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "project": {
          const aProj = a.project?.title || "";
          const bProj = b.project?.title || "";
          comparison = aProj.localeCompare(bProj);
          break;
        }
        case "priority":
          comparison = (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0);
          break;
        case "status":
          comparison = (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0);
          break;
        case "createdAt":
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  // Split into Open and Done
  const openTasks = useMemo(() => sortedTasks.filter((t) => t.status !== "DONE"), [sortedTasks]);
  const doneTasks = useMemo(() => sortedTasks.filter((t) => t.status === "DONE"), [sortedTasks]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-subtle/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-text-primary shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-text-primary shrink-0" />
    );
  };

  if (tasks.length === 0) {
    return (
      <EmptyState
        message="No tasks matching the selected filters"
        actionLabel="Create a new task"
        onAction={onNewTask}
      />
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col min-w-0">
      {/* Header Row */}
      <div className="h-9 px-3 sm:px-4 flex items-center gap-3 border-b border-line bg-surface-1 text-[11px] font-mono uppercase tracking-[0.08em] text-subtle select-none">
        {/* Checkbox spacer (16px) */}
        <div className="w-4 shrink-0" />

        {/* Title Header */}
        <button
          type="button"
          onClick={() => handleHeaderSort("title")}
          aria-sort={sortField === "title" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          className="group flex-1 min-w-0 flex items-center gap-1.5 text-left hover:text-text-primary transition-colors cursor-pointer"
        >
          <span>Title</span>
          {renderSortIndicator("title")}
        </button>

        {/* Project Header */}
        <button
          type="button"
          onClick={() => handleHeaderSort("project")}
          aria-sort={sortField === "project" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          className="group hidden sm:flex w-[120px] shrink-0 items-center gap-1.5 text-left hover:text-text-primary transition-colors cursor-pointer"
        >
          <span>Project</span>
          {renderSortIndicator("project")}
        </button>

        {/* Priority Header */}
        <button
          type="button"
          onClick={() => handleHeaderSort("priority")}
          aria-sort={sortField === "priority" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          className="group hidden sm:flex w-[80px] shrink-0 items-center gap-1.5 text-left hover:text-text-primary transition-colors cursor-pointer"
        >
          <span>Priority</span>
          {renderSortIndicator("priority")}
        </button>

        {/* Reminder Header */}
        <div className="hidden md:flex w-[100px] shrink-0 items-center text-left">
          <span>Reminder</span>
        </div>

        {/* Status Header */}
        <button
          type="button"
          onClick={() => handleHeaderSort("status")}
          aria-sort={sortField === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
          className="group flex w-[105px] shrink-0 items-center gap-1.5 text-left hover:text-text-primary transition-colors cursor-pointer"
        >
          <span>Status</span>
          {renderSortIndicator("status")}
        </button>

        {/* Actions spacer */}
        <div className="w-7 shrink-0" />
      </div>

      {/* Rows Container */}
      <div className="flex-1 overflow-y-auto">
        {/* Open Tasks Section */}
        {openTasks.map((task) => (
          <TaskListRow
            key={task.id}
            task={task}
            onEdit={onEdit}
            onView={onView}
          />
        ))}

        {openTasks.length === 0 && (
          <div className="py-8 text-center text-xs font-mono text-subtle">
            All tasks completed
          </div>
        )}

        {/* Done Section Grouping */}
        {doneTasks.length > 0 && (
          <div className="mt-2 border-t border-line">
            <button
              type="button"
              onClick={toggleDoneCollapse}
              className="w-full h-8 px-3 sm:px-4 bg-surface-1/40 hover:bg-surface-2 flex items-center justify-between text-[11px] font-mono text-subtle hover:text-text-primary transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                {isDoneCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>Completed Tasks</span>
                <span className="opacity-70">({doneTasks.length})</span>
              </div>
              <span className="text-[10px] text-subtle">
                {isDoneCollapsed ? "Click to expand" : "Click to collapse"}
              </span>
            </button>

            {!isDoneCollapsed && (
              <div className="divide-y divide-line">
                {doneTasks.map((task) => (
                  <TaskListRow
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onView={onView}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
