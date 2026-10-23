"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Github,
  Star,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Code2,
  Component,
  FileText,
  Bookmark,
  Layers,
  Calendar,
  AlertCircle,
  Plus,
  ChevronLeft,
  PanelLeftOpen,
} from "lucide-react";
import { Project } from "@/types/project";
import { useProject } from "@/hooks/use-projects";
import { ProjectStatusBadge } from "./project-status-badge";
import { ProjectFavicon } from "./project-favicon";
import { GitHubTelemetryBadge } from "./github-telemetry-badge";
import { ProjectOpenGraphCard } from "./project-opengraph-card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";


interface ProjectWorkbenchProps {
  project: Project | null;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onBackToExplorer?: () => void;
  isExplorerCollapsed?: boolean;
  onToggleExplorer?: () => void;
  className?: string;
}

export function ProjectWorkbench({
  project: initialProject,
  onEdit,
  onDelete,
  onToggleFavorite,
  onBackToExplorer,
  isExplorerCollapsed,
  onToggleExplorer,
  className,
}: ProjectWorkbenchProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Fetch detailed project entity including relational tasks, snippets, notes, components
  const { data: detailedProject, isLoading } = useProject(initialProject?.id);

  const project = detailedProject || initialProject;


  // Task metrics calculation
  const taskMetrics = useMemo(() => {
    if (!project?.tasks || project.tasks.length === 0) {
      const total = project?._count?.tasks || 0;
      return { total, completed: 0, percentage: 0, pendingTasks: [] };
    }
    const total = project.tasks.length;
    const completed = project.tasks.filter((t) => t.status === "DONE").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingTasks = project.tasks
      .filter((t) => t.status !== "DONE")
      .slice(0, 3);
    return { total, completed, percentage, pendingTasks };
  }, [project]);

  if (!project) {
    return (
      <div
        className={cn(
          "flex-1 flex flex-col items-center justify-center p-8 text-center bg-canvas select-none",
          className
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mb-4 shadow-sm">
          <Layers className="w-7 h-7 text-primary/80" />
        </div>
        <h3 className="text-base font-semibold text-ink tracking-[-0.3px]">
          No Project Selected
        </h3>
        <p className="text-xs text-ink-muted max-w-sm mt-1 leading-relaxed">
          Select a project from the left explorer tree to view its workbench command center, telemetry, open graph preview, and linked resources.
        </p>
      </div>
    );
  }

  const isGitHub = Boolean(
    project.repositoryUrl && project.repositoryUrl.includes("github.com/")
  );

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto bg-canvas text-ink flex flex-col p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6",
        className
      )}
    >
      {/* Navigation and Sidebar Expand Bar */}
      <div className="flex items-center gap-2">
        {onBackToExplorer && (
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              onBackToExplorer();
            }}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink text-xs font-medium cursor-pointer self-start transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>
        )}

        {isExplorerCollapsed && onToggleExplorer && (
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              onToggleExplorer();
            }}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer px-2 py-1"
            title="Expand Explorer Sidebar"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 text-primary" />
            <span>Show Explorer</span>
          </button>
        )}
      </div>

      {/* 1. Header Command Section */}
      <div className="p-4 sm:p-6 rounded-xl bg-surface-1 border border-hairline relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Left Title & Status */}
          <div className="flex items-start gap-4 min-w-0">
            <ProjectFavicon
              liveUrl={project.liveUrl}
              repositoryUrl={project.repositoryUrl}
              title={project.title}
              size={40}
              className="mt-0.5"
            />
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.6px] text-ink truncate">
                  {project.title}
                </h1>
                <ProjectStatusBadge status={project.status} />
                <button
                  onClick={() => {
                    sound.playClick(project.favorite ? 500 : 850);
                    onToggleFavorite(project.id, !project.favorite);
                  }}
                  title={project.favorite ? "Favorited" : "Add to favorites"}
                  className="p-1 rounded-md hover:bg-surface-2 text-ink-tertiary transition-colors cursor-pointer"
                >
                  <Star
                    className={cn(
                      "w-4 h-4",
                      project.favorite
                        ? "fill-amber-400 text-amber-400"
                        : "hover:text-amber-400"
                    )}
                  />
                </button>
              </div>

              {project.description && (
                <p className="text-xs text-ink-muted leading-relaxed max-w-2xl">
                  {project.description}
                </p>
              )}

              {/* Tech Stack Badges */}
              {project.techStack && project.techStack.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] font-mono text-ink-subtle">
                  {project.techStack.map((tech, idx) => (
                    <span key={tech} className="flex items-center gap-2">
                      {idx > 0 && <span className="text-hairline-strong select-none">•</span>}
                      <span className="hover:text-ink transition-colors">{tech}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 self-start shrink-0 flex-wrap">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer px-2 py-1.5"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-ink-tertiary" />
              </a>
            )}

            {project.repositoryUrl && (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer px-2 py-1.5"
              >
                <Github className="w-3.5 h-3.5 text-ink-tertiary" />
                <span>Repo</span>
              </a>
            )}

            <button
              onClick={() => {
                sound.playClick(800);
                onEdit(project);
              }}
              title="Edit Project"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer px-2 py-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-ink-tertiary" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                sound.playClick(400);
                setShowDeleteConfirm(true);
              }}
              title="Delete Project"
              className="p-1.5 rounded-md hover:bg-rose-500/10 text-ink-tertiary hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry and Timestamps sub-row */}
        <div className="mt-5 pt-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-ink-tertiary">
          <div>
            {isGitHub ? (
              <GitHubTelemetryBadge repoUrl={project.repositoryUrl} />
            ) : (
              <span className="text-[11px] text-ink-subtle">
                Private / Custom Repository
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual OpenGraph & Tasks Section (2 columns on large screens) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* OpenGraph Live Preview Card (5 cols) */}
        <div className="xl:col-span-5 space-y-2">
          <h3 className="text-xs font-semibold tracking-[-0.2px] text-ink-subtle uppercase">
            Live Preview
          </h3>
          <ProjectOpenGraphCard
            url={project.liveUrl || (isGitHub ? project.repositoryUrl : null)}
            fallbackTitle={project.title}
            fallbackDescription={project.description || undefined}
          />
        </div>

        {/* Task Progress & Linked Board (7 cols) */}
        <div className="xl:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-[-0.2px] text-ink-subtle uppercase">
              Tasks & Sprint Progress
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(900);
                  setIsNewTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-2 hover:bg-surface-3 border border-hairline text-[11px] font-medium text-ink transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-primary" />
                <span>Add Task</span>
              </button>
              <Link
                href="/tasks"
                className="text-[11px] font-medium text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <span>Go to Kanban</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-hairline bg-surface-1 flex flex-col justify-between space-y-4">
            {/* Progress Bar & Stat */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-ink font-medium">Completion Rate</span>
                <span className="font-mono text-ink font-semibold">
                  {taskMetrics.completed} / {taskMetrics.total} tasks (
                  {taskMetrics.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden border border-hairline/50">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${taskMetrics.percentage}%` }}
                />
              </div>
            </div>

            {/* Pending Tasks List */}
            <div className="space-y-2 pt-2 border-t border-hairline/50">
              <span className="text-[11px] font-mono text-ink-subtle uppercase tracking-wider block">
                Next Up
              </span>
              {taskMetrics.pendingTasks.length > 0 ? (
                taskMetrics.pendingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-md bg-surface-2/60 border border-hairline/60 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-ink font-medium truncate">
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 text-ink-muted uppercase shrink-0">
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-ink-tertiary">
                  {taskMetrics.total === 0
                    ? "No tasks linked to this project yet."
                    : "All current tasks completed!"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Linked Entity Workspace Hub */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold tracking-[-0.2px] text-ink-subtle uppercase">
          Linked Developer Entities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tasks Entity Card */}
          <Link
            href="/tasks"
            className="p-4 rounded-lg border border-hairline bg-surface-1 hover:border-hairline-strong transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-ink-subtle group-hover:text-primary transition-colors flex items-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold font-mono text-ink">
                {project._count?.tasks ?? taskMetrics.total}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
              Tasks
            </h4>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Kanban backlog & sprint tracking
            </p>
          </Link>

          {/* Snippets Entity Card */}
          <Link
            href="/snippets"
            className="p-4 rounded-lg border border-hairline bg-surface-1 hover:border-hairline-strong transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-ink-subtle group-hover:text-primary transition-colors flex items-center">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold font-mono text-ink">
                {project._count?.snippets ?? (project.snippets?.length || 0)}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
              Code Snippets
            </h4>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Reusable functions & boilerplate
            </p>
          </Link>

          {/* Components Entity Card */}
          <Link
            href="/components"
            className="p-4 rounded-lg border border-hairline bg-surface-1 hover:border-hairline-strong transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-ink-subtle group-hover:text-primary transition-colors flex items-center">
                <Component className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold font-mono text-ink">
                {project._count?.components ?? (project.components?.length || 0)}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
              UI Components
            </h4>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Design library & layout components
            </p>
          </Link>

          {/* Notes & Architecture Card */}
          <Link
            href="/resources"
            className="p-4 rounded-lg border border-hairline bg-surface-1 hover:border-hairline-strong transition-all duration-150 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-ink-subtle group-hover:text-primary transition-colors flex items-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold font-mono text-ink">
                {project._count?.notes ?? (project.notes?.length || 0)}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
              Architecture Notes
            </h4>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Tech specs, ADRs & docs
            </p>
          </Link>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(project.id)}
        title="Delete Project"
        description={`Are you sure you want to delete project "${project.title}"? All associated tasks, snippets, components, and notes will be affected.`}
        confirmText="Delete Project"
        variant="danger"
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        defaultProjectId={project.id}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </div>
  );
}
