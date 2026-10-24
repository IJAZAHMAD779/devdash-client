"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Plus, Gamepad2, FolderKanban } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useTasks, usePatchTaskStatus, useCreateTask } from "@/hooks/use-tasks";
import { useSnippets } from "@/hooks/use-snippets";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useReminders } from "@/hooks/use-reminders";
import { RemindersModal } from "@/components/reminders/reminders-modal";
import { DevPetCompanion } from "@/components/pet/dev-pet";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { FocusList } from "@/components/dashboard/focus-list";
import { ProjectsActivityPanel } from "@/components/dashboard/projects-activity-panel";
import { ScratchpadBookmarksPanel } from "@/components/dashboard/scratchpad-bookmarks-panel";
import { toast } from "@/lib/toast";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const { data: tasks, isLoading: isTasksLoading } = useTasks();
  const { data: snippets } = useSnippets();
  const { data: bookmarks } = useBookmarks();
  const { data: reminders } = useReminders();

  const patchTaskStatus = usePatchTaskStatus();
  const createTask = useCreateTask();

  // Scratchpad state persisted in localStorage
  const [scratchpadText, setScratchpadText] = useState("");
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_quick_scratchpad");
      if (saved) setScratchpadText(saved);
    }
  }, []);

  const handleScratchpadChange = (text: string) => {
    setScratchpadText(text);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_quick_scratchpad", text);
    }
  };

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Today's formatted date as small quiet mono label
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Earliest upcoming task with a dueDate for countdown calculation
  const earliestDueCountdown = useMemo(() => {
    if (!tasks) return null;
    const pendingWithDueDate = tasks
      .filter((t) => t.status !== "DONE" && t.dueDate)
      .map((t) => ({ task: t, date: new Date(t.dueDate!) }))
      .filter(({ date }) => !isNaN(date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (pendingWithDueDate.length === 0) return null;

    const earliest = pendingWithDueDate[0];
    const now = new Date();
    // Normalize to midnight for fair calendar day difference
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetDate = new Date(earliest.date.getFullYear(), earliest.date.getMonth(), earliest.date.getDate()).getTime();
    const diffDays = Math.ceil((targetDate - startOfToday) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return `${earliest.task.title} in ${diffDays} days`;
    if (diffDays === 1) return `${earliest.task.title} tomorrow`;
    if (diffDays === 0) return `${earliest.task.title} due today`;
    return `${earliest.task.title} overdue`;
  }, [tasks]);

  // One-line status computed purely from real data
  const realStatusLine = useMemo(() => {
    const urgentCount =
      tasks?.filter(
        (t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "DONE"
      ).length ?? 0;
    const activeRemindersCount = reminders?.filter((r) => !r.isSent).length ?? 0;

    const parts: string[] = [];
    if (urgentCount > 0) parts.push(`${urgentCount} urgent`);
    if (activeRemindersCount > 0) {
      parts.push(`${activeRemindersCount} ${activeRemindersCount === 1 ? "reminder" : "reminders"} queued`);
    }
    if (earliestDueCountdown) parts.push(earliestDueCountdown);

    if (parts.length === 0) {
      return "All systems operational · Workspace caught up";
    }

    return parts.join(" · ");
  }, [tasks, reminders, earliestDueCountdown]);

  // Next reminder time formatted
  const nextReminderTime = useMemo(() => {
    if (!reminders) return null;
    const upcoming = reminders
      .filter((r) => !r.isSent && r.remindAt)
      .map((r) => new Date(r.remindAt))
      .filter((d) => d.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (!upcoming) return null;
    return upcoming.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }, [reminders]);

  // 7-day task completion trend points for inline sparkline (real data only)
  const taskTrendPoints = useMemo(() => {
    if (!tasks) return undefined;
    const completedWithDates = tasks.filter((t) => t.status === "DONE" && t.completedAt);
    if (completedWithDates.length === 0) return undefined;

    const points: number[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = completedWithDates.filter((t) => t.completedAt?.startsWith(dateStr)).length;
      points.push(count);
    }
    return points;
  }, [tasks]);

  // Metric counts
  const metrics = useMemo(() => {
    const totalProjects = projects?.length ?? 0;
    const activeProjects =
      projects?.filter((p) => p.status !== "COMPLETED" && p.status !== "ARCHIVED").length ?? 0;
    const pendingTasks = tasks?.filter((t) => t.status !== "DONE").length ?? 0;
    const urgentTasks =
      tasks?.filter((t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "DONE")
        .length ?? 0;
    const totalSnippets = snippets?.length ?? 0;
    const activeReminders = reminders?.filter((r) => !r.isSent).length ?? 0;

    return {
      activeProjects,
      totalProjects,
      pendingTasks,
      urgentTasks,
      totalSnippets,
      activeReminders,
    };
  }, [projects, tasks, snippets, reminders]);

  // Task mutation handlers
  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    patchTaskStatus.mutate({ id: taskId, status: newStatus });
  };

  const handleAddQuickTask = async (title: string) => {
    try {
      await createTask.mutateAsync({
        title,
        priority: "HIGH",
        status: "TODO",
      });
      toast.success("Task added to Today's Focus");
    } catch {
      toast.error("Failed to create task");
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-dashboard-canvas text-text-primary flex flex-col overflow-y-auto">
      {/* 1. Header Horizon */}
      <header className="border-b border-line px-5 sm:px-8 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted select-none">
                {todayFormatted}
              </span>
            </div>

            {/* Greeting + Protected Interactive Pet Companion (perfect baseline alignment) */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                {greeting}, {user?.firstName || "Developer"}
              </h1>
              <div className="shrink-0 flex items-center">
                <DevPetCompanion />
              </div>
            </div>

            {/* Real data-driven one-line status */}
            <p className="mt-1 text-xs text-muted font-normal">
              {realStatusLine}
            </p>
          </div>

          {/* Header Action Buttons (Only New Task is accent-filled) */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <Link
              href="/games"
              title="Arcade Hub"
              aria-label="Arcade Hub"
              className="w-8 h-8 rounded-[6px] border border-line hover:bg-surface-2 text-muted hover:text-text-primary transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Gamepad2 className="w-4 h-4 stroke-[1.5]" />
            </Link>

            <Link
              href="/projects"
              className="h-8 px-3 rounded-[6px] border border-line hover:bg-surface-2 text-xs font-mono text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <FolderKanban className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Projects</span>
            </Link>

            <Link
              href="/tasks"
              className="h-8 px-3 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium tracking-tight transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Content (Responsive via Container Queries) */}
      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-6 space-y-6 flex-1 @container">
        {/* Row 1: Single-Panel Stat Strip (4 columns separated by hairline dividers, no corner icons) */}
        <StatStrip
          activeProjects={metrics.activeProjects}
          totalProjects={metrics.totalProjects}
          pendingTasks={metrics.pendingTasks}
          urgentTasks={metrics.urgentTasks}
          totalSnippets={metrics.totalSnippets}
          activeReminders={metrics.activeReminders}
          nextReminderTime={nextReminderTime}
          taskTrendPoints={taskTrendPoints}
          onOpenReminders={() => setIsRemindersModalOpen(true)}
        />

        {/* Row 2: Today's Focus (Hero) | Projects + Week Activity */}
        <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Today's Focus Hero */}
          <div className="@4xl:col-span-7">
            <FocusList
              tasks={tasks || []}
              isLoading={isTasksLoading}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddQuickTask}
            />
          </div>

          {/* Right Column: Projects + Week Activity */}
          <div className="@4xl:col-span-5">
            <ProjectsActivityPanel
              projects={projects || []}
              tasks={tasks || []}
              isLoadingProjects={isProjectsLoading}
            />
          </div>
        </div>

        {/* Row 3: Single Tabbed Panel (Scratchpad | Starred Bookmarks) */}
        <ScratchpadBookmarksPanel
          scratchpadText={scratchpadText}
          onScratchpadChange={handleScratchpadChange}
          bookmarks={bookmarks || []}
        />
      </main>

      {/* Reminders Modal */}
      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
      />
    </div>
  );
}
