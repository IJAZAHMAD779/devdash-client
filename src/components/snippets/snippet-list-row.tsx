"use client";

import React, { useState } from "react";
import { Star, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { Snippet } from "@/types/snippet";
import { useToggleSnippetFavorite, useDeleteSnippet } from "@/hooks/use-snippets";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { LanguageDot, formatLanguageName } from "./language-dot";
import { CopyButton } from "./copy-button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface SnippetListRowProps {
  snippet: Snippet;
  onView: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  showLanguage?: boolean;
  hasTags?: boolean;
  hasProject?: boolean;
  gridTemplate: string;
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
  hasTags = true,
  hasProject = true,
  gridTemplate,
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
        style={{ gridTemplateColumns: gridTemplate }}
        className="group relative grid items-center gap-4 h-[52px] px-3 border-b border-hairline hover:bg-surface-2 transition-colors cursor-pointer select-none text-xs focus-visible:outline-none focus-visible:bg-surface-2"
      >
        {/* 1. Star Column (40px) */}
        <div className="min-w-0 overflow-hidden flex items-center justify-start">
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={snippet.favorite ? "Unstar snippet" : "Star snippet"}
            className="p-1 rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer"
          >
            <Star
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                snippet.favorite ? "text-warn fill-warn" : "opacity-40 group-hover:opacity-100"
              )}
            />
          </button>
        </div>

        {/* 2. Title + Description Column: Two-line cell (minmax(220px, 1fr)) */}
        <div className="min-w-0 overflow-hidden flex flex-col justify-center">
          <span
            className="font-medium text-sm text-ink truncate leading-snug min-w-0 max-w-full"
            title={snippet.title}
          >
            {snippet.title}
          </span>
          {snippet.description ? (
            <span
              className="text-xs text-ink-subtle truncate leading-tight mt-0.5"
              title={snippet.description}
            >
              {snippet.description}
            </span>
          ) : null}
        </div>

        {/* 3. Language Column (132px, conditional on showLanguage) */}
        {showLanguage && (
          <div className="min-w-0 overflow-hidden flex items-center gap-1.5 font-mono text-[11px] text-ink-muted truncate">
            <LanguageDot language={snippet.language} className="shrink-0" />
            <span className="truncate">{formatLanguageName(snippet.language)}</span>
          </div>
        )}

        {/* 4. Tags Column (160px, conditional on hasTags) */}
        {hasTags && (
          <div className="min-w-0 overflow-hidden font-mono text-[11px] text-ink-subtle truncate">
            {snippet.tags && snippet.tags.length > 0 ? (
              <span className="truncate">
                {snippet.tags.map((t) => `#${t}`).join(" ")}
              </span>
            ) : (
              "—"
            )}
          </div>
        )}

        {/* 5. Project Column (120px, conditional on hasProject) */}
        {hasProject && (
          <div className="min-w-0 overflow-hidden font-mono text-[11px] text-ink-subtle truncate">
            <span className="truncate">{projectName || "—"}</span>
          </div>
        )}

        {/* 6. Updated Column (88px, right-aligned) */}
        <div className="min-w-0 overflow-hidden font-mono text-[11px] text-ink-subtle text-right tabular-nums">
          {relativeTime || "—"}
        </div>

        {/* 7. Actions Column (88px, right-aligned flex cell with gap-1, 28px hit areas) */}
        <div
          className="min-w-0 overflow-hidden flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Copy code button (28px hit area, 16px icon) */}
          <CopyButton
            textToCopy={snippet.code}
            label="Copy code"
            className="h-7 w-7 text-ink-subtle hover:text-ink hover:bg-surface-3 cursor-pointer"
          />

          {/* Edit Button (28px hit area, 16px icon) */}
          <button
            type="button"
            onClick={handleEditClick}
            aria-label="Edit snippet"
            title="Edit snippet"
            className="h-7 w-7 inline-flex items-center justify-center rounded-[6px] text-ink-subtle hover:text-ink hover:bg-surface-3 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-[768px]:opacity-100 cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* More Menu / Delete Button (28px hit area, 16px icon) */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick(600);
                setShowMenu(!showMenu);
              }}
              aria-label="Snippet actions"
              className="h-7 w-7 inline-flex items-center justify-center rounded-[6px] text-ink-subtle hover:text-ink hover:bg-surface-3 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-[768px]:opacity-100 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-32 rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-mono cursor-pointer"
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
