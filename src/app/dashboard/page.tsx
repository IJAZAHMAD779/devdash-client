"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  FolderKanban,
  CheckSquare,
  Code2,
  Bookmark as BookmarkIcon,
  Clock,
  ArrowRight,
  Plus,
  Flame,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Calendar,
  AlertTriangle,
  Sparkles,
  Layers,
} from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useTasks, usePatchTaskStatus, useCreateTask } from "@/hooks/use-tasks";
import { useSnippets } from "@/hooks/use-snippets";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useReminders } from "@/hooks/use-reminders";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProjectFavicon } from "@/components/projects/project-favicon";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { RemindersModal } from "@/components/reminders/reminders-modal";
import { DevPetCompanion } from "@/components/pet/dev-pet";
import { cn } from "@/lib/utils";
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
  const [copiedScratchpad, setCopiedScratchpad] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [isSubmittingQuickTask, setIsSubmittingQuickTask] = useState(false);
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

  const handleCopyScratchpad = async () => {
    if (!scratchpadText.trim()) return;
    try {
      await navigator.clipboard.writeText(scratchpadText);
      setCopiedScratchpad(true);
      toast.success("Scratchpad copied to clipboard");
      setTimeout(() => setCopiedScratchpad(false), 2000);
    } catch {
      toast.error("Failed to copy scratchpad");
    }
  };

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Today's formatted date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Filter pending High/Urgent tasks for "Today's Focus"
  const priorityFocusTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter((t) => t.status !== "DONE")
      .sort((a, b) => {
        const pOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      })
      .slice(0, 6);
  }, [tasks]);

  // Favorite / active projects with task metrics
  const activeLaunchpadProjects = useMemo(() => {
    if (!projects) return [];
    const favs = projects.filter((p) => p.favorite);
    const others = projects.filter((p) => !p.favorite && p.status !== "COMPLETED");
    return [...favs, ...others].slice(0, 4);
  }, [projects]);

  // Key metrics
  const metrics = useMemo(() => {
    const totalProjects = projects?.length ?? 0;
    const activeProjects = projects?.filter((p) => p.status !== "COMPLETED" && p.status !== "ARCHIVED").length ?? 0;
    const pendingTasks = tasks?.filter((t) => t.status !== "DONE").length ?? 0;
    const urgentTasks = tasks?.filter((t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "DONE").length ?? 0;
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

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    patchTaskStatus.mutate({ id: taskId, status: newStatus });
  };

  const handleAddQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || isSubmittingQuickTask) return;

    setIsSubmittingQuickTask(true);
    try {
      await createTask.mutateAsync({
        title: quickTaskTitle.trim(),
        priority: "HIGH",
        status: "TODO",
      });
      setQuickTaskTitle("");
      toast.success("Task added to Today's Focus");
    } catch {
      toast.error("Failed to create task");
    } finally {
      setIsSubmittingQuickTask(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col overflow-y-auto">
      {/* Top Header Horizon */}
      <div className="border-b border-hairline bg-surface-1/40 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-ink-tertiary flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {todayFormatted}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.6px] text-ink">
                {greeting}, {user?.firstName || "Developer"}
              </h1>
              <DevPetCompanion />
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary" />
              <span>Projects</span>
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard Canvas */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Row 1: High-Density Metric HUD */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Active Projects */}
          <Link
            href="/projects"
            className="group p-4 sm:p-5 rounded-xl bg-surface-1 border border-hairline hover:border-primary/40 hover:shadow-[0_0_24px_-4px_rgba(37,99,235,0.12)] transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-ink-tertiary mb-3">
              <span className="text-xs font-mono uppercase tracking-wider">Active Projects</span>
              <FolderKanban className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-mono">
                {metrics.activeProjects}
              </span>
              <span className="text-xs text-ink-muted font-mono">
                of {metrics.totalProjects} total
              </span>
            </div>
          </Link>

          {/* Metric 2: Pending Tasks */}
          <Link
            href="/tasks"
            className="group p-4 sm:p-5 rounded-xl bg-surface-1 border border-hairline hover:border-primary/40 hover:shadow-[0_0_24px_-4px_rgba(37,99,235,0.12)] transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-ink-tertiary mb-3">
              <span className="text-xs font-mono uppercase tracking-wider">Pending Tasks</span>
              <CheckSquare className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-mono">
                {metrics.pendingTasks}
              </span>
              {metrics.urgentTasks > 0 ? (
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {metrics.urgentTasks} urgent
                </span>
              ) : (
                <span className="text-xs text-ink-muted font-mono">all clear</span>
              )}
            </div>
          </Link>

          {/* Metric 3: Code Snippets & Components */}
          <Link
            href="/snippets"
            className="group p-4 sm:p-5 rounded-xl bg-surface-1 border border-hairline hover:border-primary/40 hover:shadow-[0_0_24px_-4px_rgba(37,99,235,0.12)] transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-ink-tertiary mb-3">
              <span className="text-xs font-mono uppercase tracking-wider">Snippets Vault</span>
              <Code2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-mono">
                {metrics.totalSnippets}
              </span>
              <span className="text-xs text-ink-muted font-mono">templates</span>
            </div>
          </Link>

          {/* Metric 4: Scheduled Reminders */}
          <button
            type="button"
            onClick={() => setIsRemindersModalOpen(true)}
            className="group p-4 sm:p-5 rounded-xl bg-surface-1 border border-hairline hover:border-primary/40 hover:shadow-[0_0_24px_-4px_rgba(37,99,235,0.12)] transition-all duration-200 flex flex-col justify-between text-left cursor-pointer"
          >
            <div className="flex items-center justify-between text-ink-tertiary mb-3">
              <span className="text-xs font-mono uppercase tracking-wider">Scheduled Reminders</span>
              <Clock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-mono">
                {metrics.activeReminders}
              </span>
              <span className="text-xs text-ink-muted font-mono">in queue</span>
            </div>
          </button>
        </div>

        {/* Row 2: Two-Column Command Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols): Today's Focus Tasks + Project Launchpad */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section: Today's Focus Tasks */}
            <div className="rounded-xl bg-surface-1 border border-hairline p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-hairline/80 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold tracking-[-0.2px] text-ink">
                    Today&apos;s Focus &amp; High Priority
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-muted">
                    {priorityFocusTasks.length}
                  </span>
                </div>
                <Link
                  href="/tasks"
                  className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                  <span>All Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Inline Quick Add Task */}
              <form onSubmit={handleAddQuickTask} className="relative">
                <input
                  type="text"
                  placeholder="+ Add a quick focus task for today (press Enter)..."
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-ink placeholder:text-ink-tertiary transition-colors"
                />
              </form>

              {/* Tasks List */}
              {isTasksLoading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-surface-2 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : priorityFocusTasks.length > 0 ? (
                <div className="space-y-1.5 divide-y divide-hairline/40">
                  {priorityFocusTasks.map((t) => (
                    <div
                      key={t.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={t.status === "DONE"}
                          onChange={() => handleToggleTask(t.id, t.status)}
                          className="w-4 h-4 rounded border-hairline text-primary focus:ring-0 cursor-pointer shrink-0"
                        />
                        <span
                          className={cn(
                            "text-xs truncate transition-all",
                            t.status === "DONE"
                              ? "line-through text-ink-tertiary"
                              : "text-ink group-hover:text-primary"
                          )}
                        >
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.project && (
                          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-ink-tertiary border border-hairline max-w-[120px] truncate">
                            {t.project.title}
                          </span>
                        )}
                        <TaskPriorityBadge priority={t.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-ink-muted">
                  <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <span>No high priority tasks pending. You&apos;re completely caught up!</span>
                </div>
              )}
            </div>

            {/* Section: Project Launchpad with Radial Progress Rings */}
            <div className="rounded-xl bg-surface-1 border border-hairline p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-hairline/80 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold tracking-[-0.2px] text-ink">
                    Project Launchpad
                  </h2>
                </div>
                <Link
                  href="/projects"
                  className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                  <span>Open Projects Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isProjectsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 bg-surface-2 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : activeLaunchpadProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {activeLaunchpadProjects.map((p) => {
                    const compRate =
                      p.tasks && p.tasks.length > 0
                        ? Math.round(
                            (p.tasks.filter((t) => t.status === "DONE").length / p.tasks.length) * 100
                          )
                        : p.status === "COMPLETED"
                        ? 100
                        : 0;

                    return (
                      <Link
                        key={p.id}
                        href={`/projects?id=${p.id}&view=workbench`}
                        className="p-4 rounded-xl bg-surface-2/60 border border-hairline hover:border-primary/40 hover:shadow-[0_0_20px_-4px_rgba(37,99,235,0.12)] transition-all duration-200 flex flex-col justify-between group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ProjectFavicon
                              liveUrl={p.liveUrl}
                              repositoryUrl={p.repositoryUrl}
                              title={p.title}
                              size={20}
                            />
                            <h3 className="text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors truncate">
                              {p.title}
                            </h3>
                          </div>
                          <ProgressRing
                            progress={compRate}
                            size={28}
                            strokeWidth={3}
                            showText
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-ink-tertiary font-mono pt-2 border-t border-hairline/40">
                          <ProjectStatusBadge status={p.status} />
                          <span>{p._count?.tasks ?? 0} tasks</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-ink-muted">
                  No active projects found.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Scratchpad & Quick Links */}
          <div className="space-y-6">
            {/* Quick Developer Scratchpad */}
            <div className="rounded-xl bg-surface-1 border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline/80 pb-2.5">
                <span className="text-xs font-semibold tracking-[-0.2px] text-ink">
                  Quick Scratchpad
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyScratchpad}
                    title="Copy scratchpad"
                    className="p-1 rounded hover:bg-surface-2 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
                  >
                    {copiedScratchpad ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleScratchpadChange("")}
                    title="Clear scratchpad"
                    className="p-1 rounded hover:bg-surface-2 text-ink-tertiary hover:text-semantic-error transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={scratchpadText}
                onChange={(e) => handleScratchpadChange(e.target.value)}
                placeholder="Temporary commands, auth tokens, draft thoughts (auto-saved locally)..."
                className="w-full bg-surface-2/80 rounded-lg p-3 text-xs font-mono text-ink placeholder:text-ink-tertiary border border-hairline focus:border-primary focus:outline-none resize-none leading-relaxed transition-colors"
              />
              <span className="block text-[10px] font-mono text-ink-tertiary text-right">
                Auto-saved to device
              </span>
            </div>

            {/* Quick Bookmarks Vault */}
            <div className="rounded-xl bg-surface-1 border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline/80 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <BookmarkIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold tracking-[-0.2px] text-ink">
                    Starred Bookmarks
                  </span>
                </div>
                <Link
                  href="/resources"
                  className="text-[11px] font-medium text-primary hover:text-primary-hover"
                >
                  View All
                </Link>
              </div>

              {bookmarks && bookmarks.filter((b) => b.favorite).length > 0 ? (
                <div className="space-y-1.5">
                  {bookmarks
                    .filter((b) => b.favorite)
                    .slice(0, 5)
                    .map((bm) => (
                      <a
                        key={bm.id}
                        href={bm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-surface-2/60 hover:bg-surface-2 border border-hairline flex items-center justify-between text-xs group transition-colors"
                      >
                        <span className="truncate text-ink group-hover:text-primary mr-2">
                          {bm.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-ink-tertiary group-hover:text-primary shrink-0" />
                      </a>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-ink-muted">
                  Star high-frequency bookmarks for 1-click access here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
      />
    </div>
  );
}
