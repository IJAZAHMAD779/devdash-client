"use client";

import {
  Star,
  ExternalLink,
  Github,
  CheckSquare,
  Code2,
  Component,
  BookOpen,
  MoreVertical,
  Trash2,
  Edit2,
} from "lucide-react";
import { useState } from "react";
import { Project } from "@/types/project";
import { ProjectStatusBadge } from "./project-status-badge";
import { ProjectFavicon } from "./project-favicon";
import { useToggleFavorite, useDeleteProject } from "@/hooks/use-projects";
import { ProgressRing } from "@/components/ui/progress-ring";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface Props {
  project: Project;
  onEdit: (project: Project) => void;
}

export function ProjectCard({ project, onEdit }: Props) {
  const toggleFavorite = useToggleFavorite();
  const deleteProject = useDeleteProject();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate({
      id: project.id,
      favorite: !project.favorite,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted", {
        description: `"${project.title}" has been removed.`,
      });
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const completionRate = project.tasks && project.tasks.length > 0
    ? Math.round((project.tasks.filter((t) => t.status === "DONE").length / project.tasks.length) * 100)
    : project.status === "COMPLETED"
    ? 100
    : 0;

  return (
    <div className="group relative flex flex-col justify-between p-5 rounded-xl bg-surface-1 border border-hairline hover:border-primary/40 hover:shadow-[0_0_24px_-4px_rgba(37,99,235,0.12)] hover:bg-surface-2/60 transition-all duration-200">
      {/* Top Header: Title, Status, Favorite */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <ProjectFavicon
              liveUrl={project.liveUrl}
              repositoryUrl={project.repositoryUrl}
              title={project.title}
              size={20}
            />
            <h3 className="text-base font-medium tracking-[-0.4px] text-ink truncate group-hover:text-white transition-colors">
              {project.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ProjectStatusBadge status={project.status} />

            {/* Favorite Star with Icon Swap Transition */}
            <button
              onClick={handleFavoriteClick}
              title={project.favorite ? "Unstar project" : "Star project"}
              className="p-1 rounded hover:bg-surface-3 transition-colors text-ink-subtle hover:text-amber-400"
            >
              <div
                className="t-icon-swap w-4 h-4"
                data-state={project.favorite ? "b" : "a"}
              >
                <span className="t-icon" data-icon="a">
                  <Star className="w-4 h-4 text-ink-tertiary" />
                </span>
                <span className="t-icon" data-icon="b">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </span>
              </div>
            </button>

            {/* Context Menu Trigger */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded hover:bg-surface-3 text-ink-subtle hover:text-ink transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 rounded-md bg-surface-2 border border-hairline-strong shadow-xl z-30 py-1 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(project);
                      }}
                      className="w-full px-3 py-1.5 text-left text-ink hover:bg-surface-3 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-ink-subtle" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-surface-3 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 min-h-[32px] mb-3">
          {project.description || "No description provided."}
        </p>

        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-mono text-ink-subtle">
            {project.techStack.slice(0, 4).map((tech, idx) => (
              <span key={tech} className="flex items-center gap-2">
                {idx > 0 && <span className="text-hairline-strong select-none">•</span>}
                <span className="hover:text-ink transition-colors">{tech}</span>
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="text-ink-tertiary">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Relation Counts & External Links */}
      <div className="pt-3 border-t border-hairline/60 flex items-center justify-between text-xs text-ink-subtle">
        {/* Linked Item Counters */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span
            title={`Task Progress: ${completionRate}%`}
            className="flex items-center gap-1.5 hover:text-ink transition-colors"
          >
            <ProgressRing progress={completionRate} size={15} strokeWidth={2.5} />
            <span>{project._count?.tasks ?? 0}</span>
          </span>
          <span
            title="Saved Snippets"
            className="flex items-center gap-1 hover:text-ink transition-colors"
          >
            <Code2 className="w-3 h-3 text-ink-tertiary" />
            {project._count?.snippets ?? 0}
          </span>
          <span
            title="UI Components"
            className="flex items-center gap-1 hover:text-ink transition-colors"
          >
            <Component className="w-3 h-3 text-ink-tertiary" />
            {project._count?.components ?? 0}
          </span>
          <span
            title="Technical Notes"
            className="flex items-center gap-1 hover:text-ink transition-colors"
          >
            <BookOpen className="w-3 h-3 text-ink-tertiary" />
            {project._count?.notes ?? 0}
          </span>
        </div>

        {/* Repository & Demo Links */}
        <div className="flex items-center gap-1.5">
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open GitHub Repository"
              className="p-1 text-ink-subtle hover:text-ink transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Live Preview"
              className="p-1 text-ink-subtle hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.title}"? All associated tasks, snippets, components, and notes will be affected.`}
        confirmText="Delete Project"
        variant="danger"
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}
