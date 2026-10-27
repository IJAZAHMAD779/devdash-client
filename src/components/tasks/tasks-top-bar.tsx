"use client";

import React, { useRef, useEffect } from "react";
import {
  Kanban,
  List,
  Plus,
  Search,
  Bell,
  X,
  FolderKanban,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Priority } from "@/types/task";
import { PropertyPopover, PopoverOption } from "./property-popover";
import { PriorityLabel, ALL_PRIORITIES } from "./priority-label";
import { sound } from "@/lib/audio";

interface ProjectRef {
  id: string;
  title: string;
}

export interface TasksTopBarProps {
  totalCount: number;
  viewMode: "kanban" | "list";
  onViewModeChange: (mode: "kanban" | "list") => void;
  onNewTask: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
  projects?: ProjectRef[];
  selectedPriority: Priority | "ALL";
  onPriorityChange: (priority: Priority | "ALL") => void;
  pendingRemindersCount: number;
  onOpenReminders: () => void;
  className?: string;
}

export function TasksTopBar({
  totalCount,
  viewMode,
  onViewModeChange,
  onNewTask,
  searchQuery,
  onSearchChange,
  selectedProjectId,
  onProjectChange,
  projects = [],
  selectedPriority,
  onPriorityChange,
  pendingRemindersCount,
  onOpenReminders,
  className,
}: TasksTopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' to focus search, 'N' to open new task, 'B' / 'L' to switch views
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputFocused =
        activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;

      if (isInputFocused) return;

      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNewTask();
      } else if ((e.key === "b" || e.key === "B") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onViewModeChange("kanban");
      } else if ((e.key === "l" || e.key === "L") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onViewModeChange("list");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewTask, onViewModeChange]);

  // Project options for popover
  const projectOptions: PopoverOption[] = [
    { value: "", label: "All Projects" },
    ...projects.map((p) => ({
      value: p.id,
      label: p.title,
    })),
  ];

  // Priority options for popover
  const priorityOptions: PopoverOption<Priority | "ALL">[] = [
    { value: "ALL", label: "All Priorities" },
    ...ALL_PRIORITIES.map((p) => ({
      value: p,
      label: p === "URGENT" ? "Urgent" : p === "HIGH" ? "High" : p === "MEDIUM" ? "Medium" : "Low",
      icon: <PriorityLabel priority={p} showLabel={false} />,
    })),
  ];

  const hasActiveFilters = Boolean(selectedProjectId || selectedPriority !== "ALL" || searchQuery);

  const handleClearFilters = () => {
    sound.playClick(600);
    onSearchChange("");
    onProjectChange("");
    onPriorityChange("ALL");
  };

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);

  return (
    <header className={cn("border-b border-line bg-surface-1/40 flex-shrink-0 select-none", className)}>
      {/* Row 1: Title, View Switcher, Reminders, New Task */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Title & Total Count */}
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold tracking-[-0.3px] text-text-primary truncate">
            Tasks Board
          </h1>
          <span className="text-xs font-mono text-subtle font-normal">
            {totalCount}
          </span>
        </div>

        {/* Right Actions: View Switcher, Reminders, New Task */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* View Switcher (Segmented Control: Board / List) */}
          <div className="flex items-center p-0.5 rounded-[6px] bg-surface-2 border border-line">
            <button
              type="button"
              onClick={() => {
                sound.playClick(700);
                onViewModeChange("kanban");
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors cursor-pointer focus:outline-none",
                viewMode === "kanban"
                  ? "bg-surface-3 text-text-primary shadow-xs font-medium"
                  : "text-subtle hover:text-text-primary hover:bg-surface-2/60"
              )}
              title="Board view (B)"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick(700);
                onViewModeChange("list");
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors cursor-pointer focus:outline-none",
                viewMode === "list"
                  ? "bg-surface-3 text-text-primary shadow-xs font-medium"
                  : "text-subtle hover:text-text-primary hover:bg-surface-2/60"
              )}
              title="List view (L)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Reminders Ghost Button (Plain mono count, neutral bell) */}
          <button
            type="button"
            onMouseEnter={() => import("@/components/reminders/reminders-modal")}
            onFocus={() => import("@/components/reminders/reminders-modal")}
            onClick={() => {
              sound.playClick(800);
              onOpenReminders();
            }}
            title="Scheduled Reminders"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-surface-2 hover:bg-surface-3 border border-line text-xs font-mono text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-subtle shrink-0" />
            <span className="hidden sm:inline">Reminders</span>
            <span className="font-mono text-xs text-subtle">
              {pendingRemindersCount}
            </span>
          </button>

          {/* New Task Button (The ONLY accent-filled primary button) */}
          <button
            type="button"
            onMouseEnter={() => import("@/components/tasks/new-task-modal")}
            onFocus={() => import("@/components/tasks/new-task-modal")}
            onClick={onNewTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-accent/20 transition-all cursor-pointer"
            title="Create Task (N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
            <kbd className="hidden md:inline-flex text-[10px] font-mono opacity-70 bg-white/20 px-1 rounded-[3px]">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* Row 2: Search & Quiet Text-Style Popover Filters */}
      <div className="px-4 sm:px-6 py-2 border-t border-line flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Search input (32px, 6px radius, surface-2, / to focus) */}
        <div className="relative flex-1 min-w-[140px] sm:min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-[6px] bg-surface-2 border border-line hover:border-line-strong text-text-primary text-xs placeholder:text-subtle focus:outline-none focus:border-line-strong focus:bg-surface-3 transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-text-primary p-0.5 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex text-[10px] font-mono text-subtle border border-line px-1 rounded-[3px] bg-surface-1/50 pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Right: Popover Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Popover Filter */}
          <PropertyPopover
            value={selectedProjectId}
            onChange={onProjectChange}
            options={projectOptions}
            renderTrigger={(selected, isOpen) => (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-line text-muted hover:text-text-primary transition-colors cursor-pointer",
                  isOpen && "border-line-strong text-text-primary bg-surface-3",
                  selectedProjectId && "text-text-primary font-medium"
                )}
              >
                {selectedProjectId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
                <span className="text-subtle font-normal">Project:</span>
                <span className="truncate max-w-[120px]">
                  {selectedProjectObj ? selectedProjectObj.title : "All"}
                </span>
              </button>
            )}
          />

          {/* Priority Popover Filter */}
          <PropertyPopover<Priority | "ALL">
            value={selectedPriority}
            onChange={onPriorityChange}
            options={priorityOptions}
            renderTrigger={(selected, isOpen) => (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-line text-muted hover:text-text-primary transition-colors cursor-pointer",
                  isOpen && "border-line-strong text-text-primary bg-surface-3",
                  selectedPriority !== "ALL" && "text-text-primary font-medium"
                )}
              >
                {selectedPriority !== "ALL" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
                <span className="text-subtle font-normal">Priority:</span>
                <span>
                  {selectedPriority === "ALL"
                    ? "All"
                    : selectedPriority === "URGENT"
                    ? "Urgent"
                    : selectedPriority === "HIGH"
                    ? "High"
                    : selectedPriority === "MEDIUM"
                    ? "Medium"
                    : "Low"}
                </span>
              </button>
            )}
          />

          {/* Clear Filters Button (Visible only when filters active) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 h-8 px-2 rounded-[6px] text-[11px] font-mono text-subtle hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
