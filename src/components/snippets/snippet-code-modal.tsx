"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Star,
  Edit2,
  MoreHorizontal,
  Trash2,
  Eye,
  Code2,
} from "lucide-react";
import { codeToHtml } from "shiki";
import { Snippet } from "@/types/snippet";
import { useToggleSnippetFavorite, useDeleteSnippet } from "@/hooks/use-snippets";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { CopyButton } from "./copy-button";
import { LanguageDot, formatLanguageName } from "./language-dot";
import { ComponentLivePreview } from "@/components/ui-components/component-live-preview";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface SnippetCodeModalProps {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (snippet: Snippet) => void;
}

// Global cache for highlighted full code snippets
const fullHighlightCache = new Map<string, string>();

const SUPPORTED_LANGUAGES = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "html",
  "css",
  "json",
  "python",
  "bash",
  "sql",
  "prisma",
  "yaml",
  "markdown",
  "rust",
  "go",
];

export function SnippetCodeModal({
  snippet,
  isOpen,
  onClose,
  onEdit,
}: SnippetCodeModalProps) {
  const toggleFavorite = useToggleSnippetFavorite();
  const deleteSnippet = useDeleteSnippet();

  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const cleanLang = useMemo(() => {
    if (!snippet) return "typescript";
    const l = snippet.language.trim().toLowerCase();
    if (l === "ts") return "typescript";
    if (l === "js") return "javascript";
    if (l === "py") return "python";
    if (l === "sh" || l === "shell") return "bash";
    if (l === "html_css") return "html";
    if (l === "yml") return "yaml";
    if (l === "md") return "markdown";
    return SUPPORTED_LANGUAGES.includes(l) ? l : "typescript";
  }, [snippet]);

  const isHtml = useMemo(() => {
    if (!snippet) return false;
    return (
      cleanLang === "html" ||
      snippet.language.toLowerCase() === "html_css" ||
      snippet.code.trim().toLowerCase().startsWith("<!doctype") ||
      snippet.code.trim().toLowerCase().startsWith("<html")
    );
  }, [snippet, cleanLang]);

  const cacheKey = snippet
    ? `full:${snippet.id}:${cleanLang}:${snippet.updatedAt || snippet.code}`
    : "";

  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(() => {
    return cacheKey ? fullHighlightCache.get(cacheKey) || null : null;
  });

  // Run or retrieve Shiki highlighting
  useEffect(() => {
    if (!snippet || !isOpen) return;

    if (fullHighlightCache.has(cacheKey)) {
      setHighlightedHtml(fullHighlightCache.get(cacheKey)!);
      return;
    }

    let isCancelled = false;

    async function highlight() {
      try {
        const html = await codeToHtml(snippet!.code, {
          lang: cleanLang,
          theme: "vitesse-dark",
        });

        if (!isCancelled) {
          fullHighlightCache.set(cacheKey, html);
          setHighlightedHtml(html);
        }
      } catch {
        if (!isCancelled) {
          setHighlightedHtml(null);
        }
      }
    }

    highlight();

    return () => {
      isCancelled = true;
    };
  }, [snippet, isOpen, cacheKey, cleanLang]);

  // Keyboard navigation: Esc to close, E to open edit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        sound.playClick(600);
        onClose();
      } else if ((e.key === "e" || e.key === "E") && onEdit && snippet) {
        const target = e.target as HTMLElement | null;
        if (
          !target ||
          (target.tagName !== "INPUT" &&
            target.tagName !== "TEXTAREA" &&
            !target.isContentEditable)
        ) {
          e.preventDefault();
          sound.playClick(750);
          onClose();
          onEdit(snippet);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onEdit, snippet]);

  if (!isOpen || !snippet) return null;

  const lines = snippet.code.split("\n");

  const formattedDate = snippet.updatedAt || snippet.createdAt
    ? new Date(snippet.updatedAt || snippet.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const metadataSegments = [
    snippet.tags && snippet.tags.length > 0
      ? snippet.tags.map((t) => `#${t}`).join(" ")
      : null,
    snippet.project?.title || null,
    formattedDate ? `updated ${formattedDate}` : null,
  ].filter(Boolean);

  const handleToggleFavorite = () => {
    sound.playClick(850);
    toggleFavorite.mutate({
      id: snippet.id,
      favorite: !snippet.favorite,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteSnippet.mutateAsync(snippet.id);
      toast.success("Snippet deleted", {
        description: `"${snippet.title}" has been removed from your vault.`,
      });
      onClose();
    } catch {
      toast.error("Failed to delete snippet");
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="snippet-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClick(600);
            onClose();
          }
        }}
      >
        <div
          ref={modalRef}
          className="w-full max-w-[880px] max-h-[92vh] rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header: title, language dot + name, Star, Edit, More menu, Close */}
          <div className="px-5 py-3.5 border-b border-hairline flex items-center justify-between gap-3 shrink-0 select-none bg-surface-1">
            {/* Title + Language Dot & Name */}
            <div className="flex items-center gap-3 min-w-0">
              <h2
                id="snippet-modal-title"
                className="text-[18px] font-semibold tracking-[-0.4px] text-ink truncate leading-tight"
              >
                {snippet.title}
              </h2>

              <div className="flex items-center gap-1.5 font-mono text-xs text-ink-muted shrink-0">
                <LanguageDot language={snippet.language} className="shrink-0" />
                <span>{formatLanguageName(snippet.language)}</span>
              </div>
            </div>

            {/* Right: Star, HTML preview toggle, Edit, Menu, Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* HTML Preview Toggle */}
              {isHtml && (
                <div className="flex items-center rounded-md bg-surface-2 p-0.5 border border-hairline mr-1">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(850);
                      setActiveTab("code");
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs font-mono rounded transition-colors",
                      activeTab === "code"
                        ? "bg-surface-3 text-ink"
                        : "text-ink-subtle hover:text-ink"
                    )}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(850);
                      setActiveTab("preview");
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs font-mono rounded transition-colors",
                      activeTab === "preview"
                        ? "bg-surface-3 text-ink"
                        : "text-ink-subtle hover:text-ink"
                    )}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>
              )}

              {/* Star: Ghost button */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={snippet.favorite ? "Unstar snippet" : "Star snippet"}
                title={snippet.favorite ? "Starred" : "Star snippet"}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  snippet.favorite
                    ? "text-warn"
                    : "text-ink-subtle hover:text-ink hover:bg-surface-2"
                )}
              >
                <Star
                  className={cn(
                    "w-4 h-4",
                    snippet.favorite && "fill-warn"
                  )}
                />
              </button>

              {/* Edit: Ghost button */}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(750);
                    onClose();
                    onEdit(snippet);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                  title="Edit snippet (E)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              {/* "⋯" More Menu: Contains Delete with danger text */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(600);
                    setShowMenu(!showMenu);
                  }}
                  aria-label="More actions"
                  className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
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
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-mono"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  onClose();
                }}
                aria-label="Close modal"
                className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors ml-1"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Metadata line: Description + mono details */}
          {(snippet.description || metadataSegments.length > 0) && (
            <div className="px-5 pt-3 pb-2 flex flex-col gap-1.5 select-none bg-surface-1 border-b border-hairline">
              {snippet.description && (
                <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
                  {snippet.description}
                </p>
              )}

              {metadataSegments.length > 0 && (
                <div className="font-mono text-[11px] text-ink-subtle">
                  {metadataSegments.join(" · ")}
                </div>
              )}
            </div>
          )}

          {/* 3. Code Block: Single container, 8px radius, hairline border, max-height 560px, thin scroll */}
          <div className="p-5 overflow-y-auto flex-1 bg-surface-1">
            {isHtml && activeTab === "preview" ? (
              <div className="rounded-lg overflow-hidden border border-hairline">
                <ComponentLivePreview
                  code={snippet.code}
                  name={snippet.title}
                  category="html"
                  framework="HTML_CSS"
                  className="w-full min-h-[460px] border-0"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-surface-2/40 border border-hairline overflow-hidden flex flex-col">
                {/* Slim top bar: Single Copy button */}
                <div className="flex items-center justify-end px-3 py-1.5 border-b border-hairline bg-surface-2/60 select-none">
                  <CopyButton
                    textToCopy={snippet.code}
                    className="h-6 px-2 text-[11px] rounded text-ink-muted hover:text-ink hover:bg-surface-3"
                  />
                </div>

                {/* Shiki full code container with line numbers and own scrollbar */}
                <div className="max-h-[min(60vh,560px)] overflow-auto p-3.5 font-mono text-[12px] leading-[22px]">
                  {highlightedHtml ? (
                    <div className="flex gap-4">
                      {/* Line numbers gutter */}
                      <div className="select-none text-right shrink-0 text-subtle/50 font-mono text-[11px] leading-[22px] min-w-[24px]">
                        {lines.map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Shiki Highlighted Code */}
                      <div
                        className="flex-1 overflow-x-auto font-mono [&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:!m-0 [&>pre]:leading-[22px] [&>pre_code]:!font-mono [&>pre_code]:!text-[12px]"
                        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                      />
                    </div>
                  ) : (
                    /* Instant Fallback */
                    <div className="flex gap-4 text-ink-muted">
                      <div className="select-none text-right shrink-0 text-subtle/50 font-mono text-[11px] leading-[22px] min-w-[24px]">
                        {lines.map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>
                      <pre className="flex-1 overflow-x-auto font-mono leading-[22px]">
                        {snippet.code}
                      </pre>
                    </div>
                  )}
                </div>
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
