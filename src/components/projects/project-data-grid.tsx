"use client";

import { useState, useMemo } from "react";
import {
  Star,
  ExternalLink,
  Github,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
  Layers,
} from "lucide-react";
import { Project, ProjectStatus } from "@/types/project";
import { ProjectStatusBadge } from "./project-status-badge";
import { ProjectFavicon } from "./project-favicon";
import { GitHubTelemetryBadge } from "./github-telemetry-badge";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface ProjectDataGridProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  className?: string;
}

type SortField = "title" | "status" | "updatedAt" | "favorite";
type SortDirection = "asc" | "desc";

export function ProjectDataGrid({
  projects,
  onSelectProject,
  onEdit,
  onDelete,
  onToggleFavorite,
  className,
}: ProjectDataGridProps) {
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const handleSort = (field: SortField) => {
    sound.playClick(700);
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let comparison = 0;
      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === "updatedAt") {
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortField === "favorite") {
        comparison = (a.favorite ? 1 : 0) - (b.favorite ? 1 : 0);
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [projects, sortField, sortDir]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary" />
    );
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface-1 p-12 text-center text-ink-tertiary">
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No projects available for data grid</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-hairline bg-surface-1 overflow-hidden shadow-xs",
        className
      )}
    >
      <div className="overflow-x-auto max-h-[calc(100vh-250px)]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-20 bg-surface-2 border-b border-hairline text-ink-subtle font-mono text-[11px] uppercase tracking-wider select-none">
            <tr>
              {/* Star / Fav column */}
              <th className="py-2.5 px-3 w-10 text-center">
                <button
                  onClick={() => handleSort("favorite")}
                  title="Sort by favorite"
                  className="cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 mx-auto text-ink-tertiary hover:text-amber-400 transition-colors" />
                </button>
              </th>

              {/* Title / Name (Sticky Column) */}
              <th className="py-2.5 px-4 sticky left-0 z-30 bg-surface-2 min-w-[200px]">
                <button
                  onClick={() => handleSort("title")}
                  className="flex items-center gap-1.5 hover:text-ink transition-colors cursor-pointer group"
                >
                  <span>Project</span>
                  {renderSortIcon("title")}
                </button>
              </th>

              {/* Status */}
              <th className="py-2.5 px-3 min-w-[120px]">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1.5 hover:text-ink transition-colors cursor-pointer group"
                >
                  <span>Status</span>
                  {renderSortIcon("status")}
                </button>
              </th>

              {/* Tech Stack */}
              <th className="py-2.5 px-3 min-w-[150px]">Tech Stack</th>

              {/* Linked Entities Hub */}
              <th className="py-2.5 px-3 min-w-[140px]">Entities</th>

              {/* GitHub Telemetry */}
              <th className="py-2.5 px-3 min-w-[140px]">Telemetry</th>

              {/* External Links */}
              <th className="py-2.5 px-3 min-w-[80px]">Links</th>

              {/* Updated Time */}
              <th className="py-2.5 px-3 min-w-[110px]">
                <button
                  onClick={() => handleSort("updatedAt")}
                  className="flex items-center gap-1.5 hover:text-ink transition-colors cursor-pointer group"
                >
                  <span>Updated</span>
                  {renderSortIcon("updatedAt")}
                </button>
              </th>

              {/* Actions */}
              <th className="py-2.5 px-3 w-20 text-right pr-4">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-hairline bg-surface-1 font-sans text-ink">
            {sortedProjects.map((project) => {
              const isGitHub = Boolean(
                project.repositoryUrl && project.repositoryUrl.includes("github.com/")
              );

              return (
                <tr
                  key={project.id}
                  className="hover:bg-surface-2/60 transition-colors group"
                >
                  {/* Star Action */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => {
                        sound.playClick(project.favorite ? 500 : 850);
                        onToggleFavorite(project.id, !project.favorite);
                      }}
                      className="text-ink-tertiary hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "w-3.5 h-3.5 mx-auto",
                          project.favorite
                            ? "fill-amber-400 text-amber-400"
                            : "opacity-40 hover:opacity-100"
                        )}
                      />
                    </button>
                  </td>

                  {/* Sticky Project Title */}
                  <td className="py-2.5 px-4 sticky left-0 z-10 bg-surface-1 group-hover:bg-surface-2 transition-colors min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <ProjectFavicon
                        liveUrl={project.liveUrl}
                        repositoryUrl={project.repositoryUrl}
                        title={project.title}
                        size={18}
                      />
                      <button
                        onClick={() => {
                          sound.playClick(750);
                          onSelectProject(project.id);
                        }}
                        title="Open in Workbench"
                        className="font-medium text-ink hover:text-primary transition-colors truncate text-left cursor-pointer"
                      >
                        {project.title}
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3">
                    <ProjectStatusBadge status={project.status} />
                  </td>

                  {/* Tech Stack */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {project.techStack?.slice(0, 2).map((tech) => (
                        <span
                          key={tech}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 border border-hairline text-ink-muted"
                        >
                          {tech}
                        </span>
                      ))}
                      {(project.techStack?.length || 0) > 2 && (
                        <span className="text-[10px] font-mono text-ink-tertiary">
                          +{project.techStack.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Linked Entities */}
                  <td className="py-2.5 px-3 font-mono text-[11px] text-ink-subtle">
                    <div className="flex items-center gap-2">
                      <span title="Tasks" className="hover:text-ink transition-colors">
                        {project._count?.tasks ?? 0}t
                      </span>
                      <span className="text-hairline-strong">/</span>
                      <span title="Snippets" className="hover:text-ink transition-colors">
                        {project._count?.snippets ?? 0}s
                      </span>
                      <span className="text-hairline-strong">/</span>
                      <span title="Components" className="hover:text-ink transition-colors">
                        {project._count?.components ?? 0}c
                      </span>
                      <span className="text-hairline-strong">/</span>
                      <span title="Notes" className="hover:text-ink transition-colors">
                        {project._count?.notes ?? 0}n
                      </span>
                    </div>
                  </td>

                  {/* Telemetry */}
                  <td className="py-2.5 px-3">
                    {isGitHub ? (
                      <GitHubTelemetryBadge
                        repoUrl={project.repositoryUrl}
                        compact={true}
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-ink-tertiary">
                        —
                      </span>
                    )}
                  </td>

                  {/* Links */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Live Preview"
                          className="p-1 text-ink-subtle hover:text-primary transition-colors cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {project.repositoryUrl && (
                        <a
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Repository"
                          className="p-1 text-ink-subtle hover:text-ink transition-colors cursor-pointer"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Updated Time */}
                  <td className="py-2.5 px-3 text-[11px] font-mono text-ink-tertiary whitespace-nowrap">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          sound.playClick(800);
                          onEdit(project);
                        }}
                        title="Edit Project"
                        className="p-1.5 rounded hover:bg-surface-3 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick(400);
                          setDeleteTarget(project);
                        }}
                        title="Delete Project"
                        className="p-1.5 rounded hover:bg-rose-500/10 text-ink-tertiary hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Project"
        description={`Are you sure you want to delete project "${deleteTarget?.title}"? All associated tasks, snippets, components, and notes will be affected.`}
        confirmText="Delete Project"
        variant="danger"
      />
    </div>
  );
}
