"use client";

import React, { useState, useMemo } from "react";
import {
  Star,
  ExternalLink,
  Github,
  Edit2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
} from "lucide-react";
import { Project, ProjectStatus } from "@/types/project";
import { ProjectIcon } from "./project-icon";
import { StatusDot } from "./status-dot";
import { TechTags } from "./tech-tags";
import { ActivityText } from "./activity-text";
import { ProjectActionsMenu } from "./project-actions-menu";
import { useRepoTelemetry } from "@/hooks/use-repo-telemetry";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

export interface ProjectDataGridProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  className?: string;
}

type SortField = "title" | "status" | "pushedAt" | "createdAt" | "favorite";
type SortDirection = "asc" | "desc";

function ProjectGridRow({
  project,
  onSelectProject,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  project: Project;
  onSelectProject: (id: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
}) {
  const { stats } = useRepoTelemetry(project.repositoryUrl);

  const linkedCounts = useMemo(() => {
    const parts: string[] = [];
    const taskCount = project._count?.tasks ?? project.tasks?.length ?? 0;
    const snippetCount = project._count?.snippets ?? project.snippets?.length ?? 0;
    const componentCount = project._count?.components ?? project.components?.length ?? 0;

    if (taskCount > 0) parts.push(`${taskCount} ${taskCount === 1 ? "task" : "tasks"}`);
    if (snippetCount > 0) parts.push(`${snippetCount} ${snippetCount === 1 ? "snippet" : "snippets"}`);
    if (componentCount > 0) parts.push(`${componentCount} ${componentCount === 1 ? "comp" : "comps"}`);

    if (parts.length === 0) return "—";
    return parts.join(" · ");
  }, [project]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSelectProject(project.id);
    }
  };

  return (
    <tr
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => onSelectProject(project.id)}
      className="h-11 border-b border-line hover:bg-surface-2/60 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:bg-surface-2"
    >
      {/* 1. Star / Favorite */}
      <td
        className="w-10 px-3 text-center"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(project.id, !project.favorite);
        }}
      >
        <button
          type="button"
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
      </td>

      {/* 2. Project Name & Icon (Sticky Left Column) */}
      <td className="px-4 sticky left-0 z-10 bg-surface-1 group-hover:bg-surface-2/90 transition-colors border-r border-line max-w-[220px]">
        <div className="flex items-center gap-2.5 min-w-0">
          <ProjectIcon
            liveUrl={project.liveUrl}
            repositoryUrl={project.repositoryUrl}
            title={project.title}
            size="sm"
          />
          <span
            className="text-xs font-medium text-text-primary group-hover:text-white truncate"
            title={project.title}
          >
            {project.title}
          </span>
        </div>
      </td>

      {/* 3. Status (Neutral if completed) */}
      <td className="px-4 whitespace-nowrap">
        <StatusDot status={project.status} />
      </td>

      {/* 4. Tech Stack (Max 2 tags + inline +N) */}
      <td className="px-4 whitespace-nowrap">
        <TechTags tags={project.techStack} maxVisible={2} />
      </td>

      {/* 5. Activity (Language + stars + pushed relative) */}
      <td className="px-4 whitespace-nowrap">
        <div className="flex items-center gap-2 text-xs font-mono text-muted">
          {stats?.language && (
            <span className="text-subtle">{stats.language}</span>
          )}
          {stats && stats.stars > 0 && (
            <span className="text-amber-400/90 font-medium">★ {stats.stars}</span>
          )}
          <ActivityText pushedAt={stats?.pushedAt} />
        </div>
      </td>

      {/* 6. Linked Entities (e.g. "3 tasks · 1 snippet", or "—") */}
      <td className="px-4 whitespace-nowrap text-xs font-mono text-muted">
        <span>{linkedCounts}</span>
      </td>

      {/* 7. External Links (Globe & GitHub icons) */}
      <td className="px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Live Site"
              aria-label="Open Live Site"
              className="p-1 rounded-[4px] hover:bg-surface-2 text-muted hover:text-text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
            </a>
          ) : (
            <span className="p-1 text-subtle/30 cursor-not-allowed">
              <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
            </span>
          )}

          {project.repositoryUrl ? (
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
          ) : (
            <span className="p-1 text-subtle/30 cursor-not-allowed">
              <Github className="w-3.5 h-3.5 stroke-[1.5]" />
            </span>
          )}
        </div>
      </td>

      {/* 8. Added Date (Local honest timestamp) */}
      <td className="px-4 whitespace-nowrap text-[11px] font-mono text-subtle">
        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}
      </td>

      {/* 9. Actions (Sticky Right Column: Edit on hover, Delete in overflow menu) */}
      <td
        className="px-3 sticky right-0 z-10 bg-surface-1 group-hover:bg-surface-2/90 transition-colors border-l border-line text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(project)}
            title="Edit Project"
            aria-label={`Edit ${project.title}`}
            className="w-7 h-7 rounded-[4px] hover:bg-surface-2 text-muted hover:text-text-primary transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Edit2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
          <ProjectActionsMenu
            projectTitle={project.title}
            onEdit={() => onEdit(project)}
            onDelete={() => onDelete(project.id)}
          />
        </div>
      </td>
    </tr>
  );
}

export function ProjectDataGrid({
  projects,
  onSelectProject,
  onEdit,
  onDelete,
  onToggleFavorite,
  className,
}: ProjectDataGridProps) {
  const [sortField, setSortField] = useState<SortField>("favorite");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

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
      } else if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "favorite") {
        comparison = (a.favorite ? 1 : 0) - (b.favorite ? 1 : 0);
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [projects, sortField, sortDir]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-accent" />
    ) : (
      <ArrowDown className="w-3 h-3 text-accent" />
    );
  };

  if (projects.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-muted border border-line rounded-[8px] bg-surface-1">
        No projects match the selected criteria.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[8px] border border-line bg-surface-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto max-h-[calc(100vh-220px)] no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-20 bg-surface-2 border-b border-line text-muted font-mono text-[11px] uppercase tracking-[0.08em] select-none">
            <tr>
              {/* Star */}
              <th className="py-2.5 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={() => handleSort("favorite")}
                  className="cursor-pointer"
                  title="Sort by favorite"
                  aria-label="Sort by favorite"
                >
                  <Star className="w-3.5 h-3.5 mx-auto text-subtle hover:text-amber-400 transition-colors" />
                </button>
              </th>

              {/* Project Title (Sticky Left) */}
              <th
                className="py-2.5 px-4 sticky left-0 z-30 bg-surface-2 border-r border-line min-w-[200px]"
                aria-sort={sortField === "title" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
              >
                <button
                  type="button"
                  onClick={() => handleSort("title")}
                  className="flex items-center gap-1.5 cursor-pointer group hover:text-text-primary"
                >
                  <span>PROJECT</span>
                  {renderSortIndicator("title")}
                </button>
              </th>

              {/* Status */}
              <th
                className="py-2.5 px-4"
                aria-sort={sortField === "status" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
              >
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1.5 cursor-pointer group hover:text-text-primary"
                >
                  <span>STATUS</span>
                  {renderSortIndicator("status")}
                </button>
              </th>

              {/* Tech Stack */}
              <th className="py-2.5 px-4">
                <span>TECH STACK</span>
              </th>

              {/* Activity */}
              <th className="py-2.5 px-4">
                <span>ACTIVITY</span>
              </th>

              {/* Linked Entities */}
              <th className="py-2.5 px-4">
                <span>LINKED</span>
              </th>

              {/* Links */}
              <th className="py-2.5 px-3">
                <span>LINKS</span>
              </th>

              {/* Added */}
              <th
                className="py-2.5 px-4"
                aria-sort={sortField === "createdAt" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
              >
                <button
                  type="button"
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1.5 cursor-pointer group hover:text-text-primary"
                >
                  <span>ADDED</span>
                  {renderSortIndicator("createdAt")}
                </button>
              </th>

              {/* Actions (Sticky Right) */}
              <th className="py-2.5 px-3 sticky right-0 z-30 bg-surface-2 border-l border-line text-right w-20">
                <span>ACTIONS</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-line">
            {sortedProjects.map((project) => (
              <ProjectGridRow
                key={project.id}
                project={project}
                onSelectProject={onSelectProject}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
