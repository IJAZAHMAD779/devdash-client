"use client";

import React, { useState } from "react";
import { Star, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { Snippet } from "@/types/snippet";
import { useToggleSnippetFavorite, useDeleteSnippet } from "@/hooks/use-snippets";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { CopyButton } from "./copy-button";
import { LanguageDot, formatLanguageName } from "./language-dot";
import { TagList } from "./tag-list";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface SnippetListRowProps {
  snippet: Snippet;
  onView: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  showLanguage?: boolean;
}

function formatRelativeTime(dateString?: string): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function SnippetListRow({
  snippet,
  onView,
  onEdit,
  showLanguage = true,
}: SnippetListRowProps) {
  const toggleFavorite = useToggleSnippetFavorite();
  const deleteSnippet = useDeleteSnippet();

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const relativeTime = formatRelativeTime(snippet.updatedAt || snippet.createdAt);
  const projectName = snippet.project?.title || null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(850);
    toggleFavorite.mutate({
      id: snippet.id,
      favorite: !snippet.favorite,
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(800);
    onEdit(snippet);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteSnippet.mutateAsync(snippet.id);
      toast.success("Snippet deleted", {
        description: `"${snippet.title}" removed from vault.`,
      });
    } catch {
      toast.error("Failed to delete snippet");
    }
  };

  return (
    <>
      <div
        role="row"
        tabIndex={0}
        onClick={() => {
          sound.playClick(800);
          onView(snippet);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView(snippet);
          }
        }}
        className="group relative flex items-center h-11 px-3 border-b border-hairline hover:bg-surface-2 transition-colors cursor-pointer select-none text-xs focus-visible:outline-none focus-visible:bg-surface-2"
      >
        {/* Star Column */}
        <div className="w-8 shrink-0 flex items-center justify-start">
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={snippet.favorite ? "Unstar snippet" : "Star snippet"}
            className="p-1 rounded text-ink-subtle hover:text-ink transition-colors"
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                snippet.favorite ? "text-warn fill-warn" : "opacity-40 group-hover:opacity-100"
              )}
            />
          </button>
        </div>

        {/* Title + Description Column (flex-1) */}
        <div className="flex-1 min-w-0 pr-3 flex flex-col justify-center">
          <div className="flex items-baseline gap-2 truncate">
            <span className="font-medium text-ink truncate leading-tight">
              {snippet.title}
            </span>
            {snippet.description && (
              <span className="hidden md:inline text-ink-subtle truncate text-[11px]">
                — {snippet.description}
              </span>
            )}
          </div>

          {/* Under ~640px: meta line below title */}
          <div className="flex sm:hidden items-center gap-2 mt-0.5 text-[10px] font-mono text-ink-subtle">
            {showLanguage && (
              <span className="inline-flex items-center gap-1">
                <LanguageDot language={snippet.language} className="shrink-0" />
                <span>{formatLanguageName(snippet.language)}</span>
              </span>
            )}
            {snippet.tags && snippet.tags.length > 0 && (
              <TagList tags={snippet.tags} maxDisplay={1} />
            )}
            {projectName && <span>· {projectName}</span>}
            {relativeTime && <span>· {relativeTime}</span>}
          </div>
        </div>

        {/* Language Column (hidden if inside language folder) */}
        {showLanguage && (
          <div className="hidden sm:flex items-center gap-1.5 w-28 shrink-0 font-mono text-[11px] text-ink-muted truncate">
            <LanguageDot language={snippet.language} className="shrink-0" />
            <span className="truncate">{formatLanguageName(snippet.language)}</span>
          </div>
        )}

        {/* Tags Column */}
        <div className="hidden sm:flex items-center w-28 shrink-0 truncate">
          {snippet.tags && snippet.tags.length > 0 ? (
            <TagList tags={snippet.tags} maxDisplay={2} />
          ) : (
            <span className="text-ink-subtle/50 font-mono text-[11px]">—</span>
          )}
        </div>

        {/* Project Column */}
        <div className="hidden md:flex items-center w-28 shrink-0 font-mono text-[11px] text-ink-subtle truncate">
          <span className="truncate">{projectName || "—"}</span>
        </div>

        {/* Updated Column */}
        <div className="hidden lg:flex items-center justify-end w-20 shrink-0 font-mono text-[10px] text-ink-subtle text-right">
          {relativeTime || "—"}
        </div>

        {/* Actions Column (Copy always visible; Edit and Menu on hover/focus-within) */}
        <div
          className="flex items-center justify-end gap-1 w-20 shrink-0 pl-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Copy: Always visible ghost icon */}
          <CopyButton
            textToCopy={snippet.code}
            className="h-7 w-7 text-ink-subtle hover:text-ink hover:bg-surface-3"
          />

          {/* Edit Button: Hover/focus-within */}
          <button
            type="button"
            onClick={handleEditClick}
            aria-label="Edit snippet"
            title="Edit snippet"
            className="p-1.5 rounded-[6px] text-ink-subtle hover:text-ink hover:bg-surface-3 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-[768px]:opacity-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* More Menu (Delete): Hover/focus-within */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick(600);
                setShowMenu(!showMenu);
              }}
              aria-label="Snippet actions"
              className="p-1.5 rounded-[6px] text-ink-subtle hover:text-ink hover:bg-surface-3 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-[768px]:opacity-100"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-32 rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Snippet"
        description={`Are you sure you want to delete "${snippet.title}"? This action cannot be undone.`}
        confirmText="Delete Snippet"
        variant="danger"
      />
    </>
  );
}
