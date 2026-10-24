"use client";

import React, { useMemo } from "react";
import { Star, Globe, Github } from "lucide-react";
import { Project } from "@/types/project";
import { ProjectIcon } from "./project-icon";
import { StatusDot } from "./status-dot";
import { ActivityText } from "./activity-text";
import { ProjectActionsMenu } from "./project-actions-menu";
import { useRepoTelemetry } from "@/hooks/use-repo-telemetry";
import { useToggleFavorite, useDeleteProject } from "@/hooks/use-projects";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onSelect?: (id: string) => void;
  filterStatus?: string;
  className?: string;
}

export function ProjectCard({
  project,
  onEdit,
  onSelect,
  filterStatus = "ALL",
  className,
}: ProjectCardProps) {
  const toggleFavorite = useToggleFavorite();
  const deleteProject = useDeleteProject();
  const { stats } = useRepoTelemetry(project.repositoryUrl);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(project.favorite ? 500 : 850);
    toggleFavorite.mutate({
      id: project.id,
      favorite: !project.favorite,
    });
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted", {
        description: `"${project.title}" has been removed.`,
      });
    } catch {
      toast.error("Failed to delete project");
    }
  };

  // Tech stack formatted as one line separated by · with +N
  const techText = useMemo(() => {
    if (!project.techStack || project.techStack.length === 0) return null;
    const max = 3;
    const firstFew = project.techStack.slice(0, max).join(" · ");
    const remaining = project.techStack.length - max;
    if (remaining > 0) return `${firstFew} · +${remaining}`;
    return firstFew;
  }, [project.techStack]);

  // Linked tasks & snippets counts (only when > 0)
  const linkedCounts = useMemo(() => {
    const parts: string[] = [];
    const taskCount = project._count?.tasks ?? project.tasks?.length ?? 0;
    const snippetCount = project._count?.snippets ?? project.snippets?.length ?? 0;

    if (taskCount > 0) parts.push(`${taskCount} ${taskCount === 1 ? "task" : "tasks"}`);
    if (snippetCount > 0) parts.push(`${snippetCount} ${snippetCount === 1 ? "snippet" : "snippets"}`);
    return parts.join(" · ");
  }, [project]);

  // Status shown only if NOT Completed (unless active filter tab is COMPLETED)
  const shouldShowStatus = project.status !== "COMPLETED" || filterStatus === "COMPLETED";

  return (
    <div
      tabIndex={0}
      onClick={() => onSelect?.(project.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect?.(project.id);
      }}
      className={cn(
        "group relative flex flex-col justify-between p-4 rounded-[8px] bg-surface-1 border border-line hover:border-line-strong hover:bg-surface-2/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        className
      )}
    >
      <div>
        {/* 1. Header Row: ProjectIcon (32px tile, 20px icon) + Title + Star + Actions */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <ProjectIcon
              liveUrl={project.liveUrl}
              repositoryUrl={project.repositoryUrl}
              title={project.title}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-text-primary group-hover:text-white truncate tracking-tight">
                {project.title}
              </h3>
              {shouldShowStatus && (
                <div className="mt-0.5">
                  <StatusDot status={project.status} />
                </div>
              )}
            </div>
          </div>

          {/* Star & Actions Menu */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleFavoriteClick}
              title={project.favorite ? "Unstar project" : "Star project"}
              aria-label={project.favorite ? "Unstar project" : "Star project"}
              className="p-1 rounded-[4px] hover:bg-surface-2 text-subtle hover:text-amber-400 transition-colors cursor-pointer"
            >
              <Star
                className={cn(
                  "w-3.5 h-3.5 stroke-[1.5]",
                  project.favorite ? "text-amber-400 fill-amber-400" : "text-subtle"
                )}
              />
            </button>

            <ProjectActionsMenu
              projectTitle={project.title}
              onEdit={() => onEdit(project)}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* 2. Description (max 2 lines, line-clamp-2, reserved height) */}
        <div className="min-h-[36px] my-2">
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
            {project.description || "No project description provided."}
          </p>
        </div>

        {/* 3. Tech Stack (one line of mono text separated by ·) */}
        {techText && (
          <div className="text-[11px] font-mono text-subtle truncate mb-3">
            {techText}
          </div>
        )}
      </div>

      {/* 4. Footer (hairline divider above: activity, linked entities, links) */}
      <div className="pt-2.5 border-t border-line flex items-center justify-between gap-2 text-xs font-mono text-subtle">
        {/* Left: Telemetry / Activity */}
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {stats?.language && (
            <span className="truncate text-subtle">{stats.language}</span>
          )}
          {stats && stats.stars > 0 && (
            <span className="text-amber-400/90 font-medium shrink-0">★ {stats.stars}</span>
          )}
          <ActivityText pushedAt={stats?.pushedAt} className="shrink-0" />
          {linkedCounts && (
            <>
              <span className="text-line-strong shrink-0">·</span>
              <span className="truncate text-[11px]">{linkedCounts}</span>
            </>
          )}
        </div>

        {/* Right: External Ghost Icon Buttons (16px) */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Launch Live Site"
              aria-label="Launch Live Site"
              className="p-1 rounded-[4px] hover:bg-surface-2 text-muted hover:text-text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
            </a>
          )}
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open GitHub Repository"
              aria-label="Open GitHub Repository"
              className="p-1 rounded-[4px] hover:bg-surface-2 text-muted hover:text-text-primary transition-colors"
            >
              <Github className="w-3.5 h-3.5 stroke-[1.5]" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
