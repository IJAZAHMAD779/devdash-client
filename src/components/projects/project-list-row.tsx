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
import { sound } from "@/lib/audio";
import { formatDate, cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface Props {
  project: Project;
  onEdit: (project: Project) => void;
}

export function ProjectListRow({ project, onEdit }: Props) {
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

  return (
    <div
      className={cn(
        "group flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-hairline hover:bg-surface-2 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg last:border-b-0",
        menuOpen ? "relative z-30" : "relative z-0"
      )}
    >
      {/* Left: Star, Title, Status, Description */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
        {/* Favorite Icon Swap */}
        <button
          onClick={handleFavoriteClick}
          title={project.favorite ? "Unstar project" : "Star project"}
          className="p-1 rounded hover:bg-surface-3 transition-colors text-ink-subtle hover:text-amber-400 flex-shrink-0"
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

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <ProjectFavicon
              liveUrl={project.liveUrl}
              repositoryUrl={project.repositoryUrl}
              title={project.title}
              size={18}
            />
            <span className="text-sm font-medium tracking-[-0.2px] text-ink truncate group-hover:text-white">
              {project.title}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>

          {project.description && (
            <p className="text-xs text-ink-subtle truncate mt-0.5">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Middle: Tech Stack */}
      <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0 mr-6">
        {project.techStack?.slice(0, 3).map((tech) => (
          <span
            key={tech}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-hairline text-ink-subtle"
          >
            {tech}
          </span>
        ))}
        {project.techStack && project.techStack.length > 3 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 border border-hairline text-ink-tertiary">
            +{project.techStack.length - 3}
          </span>
        )}
      </div>

      {/* Right: Counts, External Links, Date, Menu */}
      <div className="flex items-center gap-5 flex-shrink-0 text-xs text-ink-subtle">
        {/* Linked Items */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
          <span
            title="Linked Tasks"
            className="flex items-center gap-1 hover:text-ink"
          >
            <CheckSquare className="w-3 h-3 text-ink-tertiary" />
            {project._count?.tasks ?? 0}
          </span>
          <span
            title="Snippets"
            className="flex items-center gap-1 hover:text-ink"
          >
            <Code2 className="w-3 h-3 text-ink-tertiary" />
            {project._count?.snippets ?? 0}
          </span>
          <span
            title="Components"
            className="flex items-center gap-1 hover:text-ink"
          >
            <Component className="w-3 h-3 text-ink-tertiary" />
            {project._count?.components ?? 0}
          </span>
        </div>

        <span className="hidden md:inline-block font-mono text-[11px] text-ink-tertiary">
          {formatDate(project.updatedAt)}
        </span>

        {/* Links */}
        <div className="flex items-center gap-1">
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open GitHub Repository"
              className="p-1 text-ink-subtle hover:text-ink transition-colors"
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
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Context Menu */}
        <div className="relative">
          <button
            onClick={() => {
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
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-32 rounded-lg bg-surface-2 border border-hairline-strong shadow-2xl z-50 py-1 text-xs">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(project);
                  }}
                  className="w-full px-3 py-1.5 text-left text-ink hover:bg-surface-3 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-ink-subtle" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-surface-3 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
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
