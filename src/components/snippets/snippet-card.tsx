"use client";

import { useState } from "react";
import {
  Star,
  FolderKanban,
  MoreVertical,
  Trash2,
  Edit2,
  Tag,
} from "lucide-react";
import { Snippet } from "@/types/snippet";
import { CodeBlock } from "@/components/ui/code-block";
import { useToggleSnippetFavorite, useDeleteSnippet } from "@/hooks/use-snippets";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Props {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, onEdit }: Props) {
  const toggleFavorite = useToggleSnippetFavorite();
  const deleteSnippet = useDeleteSnippet();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate({
      id: snippet.id,
      favorite: !snippet.favorite,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (confirm(`Delete snippet "${snippet.title}"?`)) {
      deleteSnippet.mutate(snippet.id);
    }
  };

  return (
    <div className="flex flex-col rounded-xl bg-surface-1 border border-hairline hover:border-hairline-strong transition-all duration-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-hairline flex items-start justify-between gap-3 bg-surface-1/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink truncate">
              {snippet.title}
            </h3>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20 text-primary-hover">
              {snippet.language}
            </span>
          </div>

          {snippet.description && (
            <p className="text-xs text-ink-muted line-clamp-1">
              {snippet.description}
            </p>
          )}

          {/* Meta & Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {snippet.project && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-3 border border-hairline font-mono text-[10px] text-ink-muted">
                <FolderKanban className="w-2.5 h-2.5 text-primary" />
                {snippet.project.title}
              </span>
            )}
            {snippet.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-ink-subtle"
              >
                <Tag className="w-2 h-2 text-ink-tertiary" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Favorite & Context Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleFavoriteClick}
            title={snippet.favorite ? "Unstar snippet" : "Star snippet"}
            className="p-1 rounded hover:bg-surface-3 transition-colors text-ink-subtle hover:text-amber-400"
          >
            <div
              className="t-icon-swap w-4 h-4"
              data-state={snippet.favorite ? "b" : "a"}
            >
              <span className="t-icon" data-icon="a">
                <Star className="w-4 h-4 text-ink-tertiary" />
              </span>
              <span className="t-icon" data-icon="b">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </span>
            </div>
          </button>

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
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-32 rounded-md bg-surface-2 border border-hairline-strong shadow-xl z-30 py-1 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(snippet);
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

      {/* Code Block with Shiki Syntax Highlighting & Secret Masking */}
      <div className="p-3">
        <CodeBlock
          code={snippet.code}
          language={snippet.language}
          filename={`${snippet.title.toLowerCase().replace(/\s+/g, "-")}.${
            snippet.language === "typescript"
              ? "ts"
              : snippet.language === "python"
              ? "py"
              : snippet.language === "sql"
              ? "sql"
              : snippet.language === "bash"
              ? "sh"
              : snippet.language
          }`}
        />
      </div>
    </div>
  );
}
