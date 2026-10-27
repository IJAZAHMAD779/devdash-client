"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Github,
  Star,
  Edit2,
  Plus,
  RefreshCw,
  X,
  ArrowRight,
  ArrowLeft,
  PanelLeftOpen,
} from "lucide-react";
import { Project } from "@/types/project";
import { useProject } from "@/hooks/use-projects";
import { useRepoTelemetry } from "@/hooks/use-repo-telemetry";
import { ProjectIcon } from "./project-icon";
import { StatusDot } from "./status-dot";
import { MetaLine } from "./meta-line";
import { TechTags } from "./tech-tags";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

export interface ProjectWorkbenchProps {
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
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Detailed project data (includes relational tasks, snippets, notes, components)
  const { data: detailedProject } = useProject(initialProject?.id);
  const project = detailedProject || initialProject;

  // Shared repository telemetry hook (SWR + 6h cache)
  const { stats } = useRepoTelemetry(project?.repositoryUrl);

  // Clean domain resolution
  const resolvedDomain = useMemo(() => {
    if (!project?.liveUrl) return null;
    try {
      const u = project.liveUrl.startsWith("http")
        ? project.liveUrl
        : `https://${project.liveUrl}`;
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return project.liveUrl;
    }
  }, [project?.liveUrl]);

  // Tasks progress calculations
  const taskMetrics = useMemo(() => {
    if (!project?.tasks || project.tasks.length === 0) {
      const total = project?._count?.tasks || 0;
      return { total, completed: 0, percentage: 0, nextUp: null };
    }
    const total = project.tasks.length;
    const completed = project.tasks.filter((t) => t.status === "DONE").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const nextUp = project.tasks.find((t) => t.status !== "DONE") || null;
    return { total, completed, percentage, nextUp };
  }, [project]);

  if (!project) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center p-8 text-center text-muted select-none", className)}>
        <p className="text-sm font-medium text-text-primary mb-1">No project selected</p>
        <p className="text-xs text-subtle">Select a project from the explorer tree to view its details.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto bg-canvas text-text-primary flex flex-col p-4 sm:p-6 lg:p-8 no-scrollbar", className)}>
      {/* Top Mobile Bar / Return to Explorer */}
      {onBackToExplorer && (
        <div className="md:hidden mb-3">
          <button
            type="button"
            onClick={onBackToExplorer}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-surface-1 hover:bg-surface-2 border border-line text-xs font-mono text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Projects</span>
          </button>
        </div>
      )}

      {/* Expand Explorer Bar */}
      {isExplorerCollapsed && onToggleExplorer && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onToggleExplorer}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-surface-1 border border-line text-xs font-mono text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Open Explorer</span>
          </button>
        </div>
      )}

      {/* Main Detail Container (Max 720px, left-aligned, 24px vertical rhythm) */}
      <div className="max-w-[720px] w-full space-y-6">
        {/* 1. Header Row */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            {/* Identity: ProjectIcon (40px tile, 24px icon) + Title + Star */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <ProjectIcon
                liveUrl={project.liveUrl}
                repositoryUrl={project.repositoryUrl}
                title={project.title}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h2
                    className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary truncate"
                    title={project.title}
                  >
                    {project.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(project.id, !project.favorite)}
                    title={project.favorite ? "Unstar project" : "Star project"}
                    aria-label={project.favorite ? "Unstar project" : "Star project"}
                    className="p-1 rounded-[4px] hover:bg-surface-2 text-subtle hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                  >
                    <Star
                      className={cn(
                        "w-4 h-4 stroke-[1.5]",
                        project.favorite ? "text-amber-400 fill-amber-400" : "text-subtle"
                      )}
                    />
                  </button>
                </div>

                <div className="mt-1">
                  <StatusDot status={project.status} />
                </div>
              </div>
            </div>

            {/* Actions: Ghost buttons for Live Site / Repo / Edit, and ⋯ menu for Delete */}
            <div className="flex items-center gap-1.5 shrink-0">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Visit Live Site"
                  aria-label="Visit Live Site"
                  className="h-8 px-2.5 rounded-[6px] border border-line hover:bg-surface-2 text-xs font-mono text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span className="hidden sm:inline">Live Site</span>
                </a>
              )}

              {project.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View GitHub Repository"
                  aria-label="View GitHub Repository"
                  className="h-8 px-2.5 rounded-[6px] border border-line hover:bg-surface-2 text-xs font-mono text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span className="hidden sm:inline">Repo</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => onEdit(project)}
                title="Edit Project"
                aria-label="Edit Project"
                className="h-8 px-2.5 rounded-[6px] border border-line hover:bg-surface-2 text-xs font-mono text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 stroke-[1.5]" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <ProjectActionsMenu
                projectTitle={project.title}
                onEdit={() => onEdit(project)}
                onDelete={() => onDelete(project.id)}
              />
            </div>
          </div>

          {/* Description (max 2 lines) */}
          {project.description && (
            <p className="text-xs sm:text-sm text-muted line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* 2. Metadata Line (ONE quiet line, no chips or borders) */}
        <div className="pt-2 border-t border-line">
          <MetaLine stats={stats} createdAt={project.createdAt} />
        </div>

        {/* 3. Tech Stack Tags */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="pt-2 border-t border-line">
            <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-muted mb-2">
              TECH STACK
            </span>
            <TechTags tags={project.techStack} />
          </div>
        )}

        {/* 4. Tasks and Sprint Progress (Above Preview) */}
        <div className="pt-2 border-t border-line space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-muted">
                TASKS
              </span>
              <span className="text-xs font-mono text-subtle">
                {taskMetrics.completed} / {taskMetrics.total} ({taskMetrics.percentage}%)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(true)}
                className="text-xs font-mono text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[1.5]" />
                <span>Add Task</span>
              </button>

              <Link
                href={`/tasks?projectId=${project.id}`}
                className="text-xs font-mono text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
              >
                <span>Go to Kanban</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Thin 3px Progress Bar */}
          <ProgressBar progress={taskMetrics.percentage} />

          {/* Next Up Task or Empty Line */}
          {taskMetrics.nextUp ? (
            <div className="p-3 rounded-[6px] bg-surface-2/40 border border-line flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-accent font-medium shrink-0">
                  NEXT UP
                </span>
                <span className="text-text-primary truncate">{taskMetrics.nextUp.title}</span>
              </div>
              <span className="text-[10px] font-mono uppercase text-subtle shrink-0">
                {taskMetrics.nextUp.priority}
              </span>
            </div>
          ) : taskMetrics.total === 0 ? (
            <div className="h-9 flex items-center justify-between px-3 rounded-[6px] bg-surface-2/30 border border-line text-xs text-muted">
              <span>No tasks linked yet</span>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(true)}
                className="text-accent hover:text-accent-hover text-xs font-mono underline underline-offset-2 cursor-pointer"
              >
                Add first task
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted font-mono">
              All tasks completed for this project.
            </div>
          )}
        </div>

        {/* 5. Linked Entities (Compact single line of count links, zero icon cards) */}
        <div className="pt-2 border-t border-line">
          <div className="flex items-center gap-4 text-xs font-mono">
            <Link
              href={`/snippets?projectId=${project.id}`}
              className={cn(
                "transition-colors hover:text-text-primary",
                (project._count?.snippets ?? 0) > 0 ? "text-muted" : "text-subtle"
              )}
            >
              Snippets {project._count?.snippets ?? 0}
            </Link>

            <span className="text-line-strong">·</span>

            <Link
              href={`/components?projectId=${project.id}`}
              className={cn(
                "transition-colors hover:text-text-primary",
                (project._count?.components ?? 0) > 0 ? "text-muted" : "text-subtle"
              )}
            >
              Components {project._count?.components ?? 0}
            </Link>

            <span className="text-line-strong">·</span>

            <span className="text-subtle">
              Notes {project._count?.notes ?? 0}
            </span>
          </div>
        </div>

        {/* 6. Live Site & On-Demand Preview */}
        {project.liveUrl && (
          <div className="pt-2 border-t border-line space-y-3">
            {/* Compact Row */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-[8px] bg-surface-1 border border-line">
              <div className="flex items-center gap-2.5 min-w-0">
                <ProjectIcon liveUrl={project.liveUrl} size="md" />
                <span className="text-xs font-mono text-muted truncate">
                  {resolvedDomain}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 px-2.5 rounded-[4px] border border-line hover:bg-surface-2 text-xs font-mono text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span>Launch</span>
                  <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(800);
                    setIsPreviewLoaded((prev) => !prev);
                  }}
                  className="h-7 px-2.5 rounded-[4px] bg-surface-2 hover:bg-surface-3 border border-line text-xs font-mono text-text-primary transition-colors cursor-pointer"
                >
                  {isPreviewLoaded ? "Hide preview" : "Load preview"}
                </button>
              </div>
            </div>

            {/* On-Demand Iframe (loads ONLY after click) */}
            {isPreviewLoaded && (
              <div className="rounded-[8px] border border-line overflow-hidden bg-surface-1">
                {/* Slim Header Bar with URL, Refresh, Close */}
                <div className="h-8 px-3 bg-surface-2 border-b border-line flex items-center justify-between gap-2 text-[11px] font-mono text-subtle">
                  <span className="truncate">{project.liveUrl}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewKey((k) => k + 1)}
                      title="Refresh Preview"
                      className="p-1 hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 stroke-[1.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreviewLoaded(false)}
                      title="Close Preview"
                      className="p-1 hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3 stroke-[1.5]" />
                    </button>
                  </div>
                </div>

                {/* 16:10 Iframe Viewport with Fallback */}
                <div className="relative w-full aspect-[16/10] bg-surface-2/60">
                  {iframeBlocked ? (
                    <div className="h-full flex items-center justify-center p-6 text-center text-xs text-muted">
                      This site blocks embedding via security headers. Use &ldquo;Launch ↗&rdquo; to open directly.
                    </div>
                  ) : (
                    <iframe
                      key={previewKey}
                      src={project.liveUrl}
                      title={`Live preview of ${project.title}`}
                      onError={() => setIframeBlocked(true)}
                      className="w-full h-full border-none"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        defaultProjectId={project.id}
      />
    </div>
  );
}
