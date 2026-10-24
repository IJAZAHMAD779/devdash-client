"use client";

import { useState } from "react";
import {
  Star,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Check,
  Globe,
  FileCode,
} from "lucide-react";
import { Snippet } from "@/types/snippet";
import { useToggleSnippetFavorite, useDeleteSnippet } from "@/hooks/use-snippets";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface Props {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
  onView: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, onEdit, onView }: Props) {
  const toggleFavorite = useToggleSnippetFavorite();
  const deleteSnippet = useDeleteSnippet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHtml =
    snippet.language.toLowerCase() === "html" ||
    snippet.language.toLowerCase() === "html_css" ||
    snippet.code.trim().toLowerCase().startsWith("<!doctype") ||
    snippet.code.trim().toLowerCase().startsWith("<html");

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(850);
    toggleFavorite.mutate({
      id: snippet.id,
      favorite: !snippet.favorite,
    });
  };

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteSnippet.mutateAsync(snippet.id);
      toast.success("Snippet deleted", {
        description: `"${snippet.title}" has been removed from your vault.`,
      });
    } catch {
      toast.error("Failed to delete snippet");
    }
  };

  // Preview code lines (limit to 5 lines for clean look)
  const codeLines = snippet.code.trim().split("\n").slice(0, 6);

  return (
    <div
      onClick={() => {
        sound.playClick(800);
        onView(snippet);
      }}
      className="group relative flex flex-col rounded-2xl bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2/30 transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 select-none"
    >
      {/* Component/Snippet Visual Preview Container (matching Image 2 - clean frame, no colored dots) */}
      <div className="w-full h-48 bg-[#090a0b] border-b border-hairline/60 relative flex flex-col justify-between overflow-hidden p-3.5 group-hover:border-hairline-strong transition-colors">
        {/* Subtle blueprint grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141517_1px,transparent_1px),linear-gradient(to_bottom,#141517_1px,transparent_1px)] bg-[size:16px_16px] opacity-30 pointer-events-none" />

        {/* Inner Content Preview */}
        {isHtml ? (
          /* HTML Wireframe representation */
          <div className="relative z-0 w-full h-full flex flex-col items-center justify-center p-2">
            <div className="w-full max-w-[200px] rounded-lg border border-dashed border-hairline-strong bg-surface-2/40 p-3 space-y-2 group-hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-1.5 pb-1 border-b border-hairline">
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-mono text-[10px] text-ink-muted">HTML Preview</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 w-3/4 bg-surface-3 rounded" />
                <div className="h-2 w-full bg-surface-3 rounded" />
                <div className="h-2 w-1/2 bg-primary/30 rounded" />
              </div>
            </div>
          </div>
        ) : (
          /* Clean Syntax Code Block Preview */
          <div className="relative z-0 w-full h-full font-mono text-[11px] leading-relaxed text-ink-muted/80 overflow-hidden select-none">
            {codeLines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2 truncate">
                <span className="text-ink-subtle/50 select-none text-[10px] w-4 text-right shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate">{line || " "}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hover Quick Action Buttons */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Quick Copy Button */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-md bg-surface-2/90 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer shadow-xs"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Star Favorite Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={cn(
              "p-1.5 rounded-md bg-surface-2/90 hover:bg-surface-3 border border-hairline transition-colors cursor-pointer shadow-xs",
              snippet.favorite ? "text-amber-400 opacity-100" : "text-ink-muted hover:text-ink"
            )}
            title={snippet.favorite ? "Starred" : "Star snippet"}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5",
                snippet.favorite && "fill-amber-400"
              )}
            />
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-md bg-surface-2/90 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer shadow-xs"
              title="Options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1.5 w-32 rounded-lg bg-surface-2 border border-hairline shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit(snippet);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-ink-muted hover:text-ink hover:bg-surface-3 text-left transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-semantic-error hover:bg-semantic-error/10 text-left transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Always visible starred indicator if favored and not hovering */}
        {snippet.favorite && (
          <div className="absolute top-2.5 right-2.5 group-hover:hidden z-0">
            <div className="p-1.5 rounded-md bg-surface-2/80 border border-hairline text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Clean Title · Language matching Image 2 */}
      <div className="p-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-1.5 text-xs truncate">
          <span className="font-semibold text-ink group-hover:text-primary transition-colors truncate">
            {snippet.title}
          </span>
          <span className="text-ink-tertiary select-none">·</span>
          <span className="text-ink-muted uppercase font-mono text-[10px] truncate">
            {snippet.language}
          </span>
        </div>

        {isHtml && (
          <div
            className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono text-orange-400"
            title="Interactive HTML Preview available"
          >
            <Globe className="w-2.5 h-2.5" />
            <span>HTML</span>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Snippet"
        description={`Are you sure you want to delete snippet "${snippet.title}"? This cannot be undone.`}
        confirmText="Delete Snippet"
        variant="danger"
        isLoading={deleteSnippet.isPending}
      />
    </div>
  );
}
