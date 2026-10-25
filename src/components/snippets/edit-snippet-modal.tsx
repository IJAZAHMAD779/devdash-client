"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Star, Loader2, FolderKanban } from "lucide-react";
import { useUpdateSnippet } from "@/hooks/use-snippets";
import { useProjects } from "@/hooks/use-projects";
import { Snippet } from "@/types/snippet";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { TagInput } from "./tag-input";
import { SnippetPopover, SnippetPopoverOption } from "./snippet-popover";
import { LanguageDot, formatLanguageName } from "./language-dot";

interface EditSnippetModalProps {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "bash",
  "sql",
  "json",
  "prisma",
  "yaml",
  "html",
  "css",
  "rust",
  "go",
  "markdown",
];

export function EditSnippetModal({
  snippet,
  isOpen,
  onClose,
}: EditSnippetModalProps) {
  const updateSnippet = useUpdateSnippet();
  const { data: projects } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [code, setCode] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load snippet data into state
  useEffect(() => {
    if (snippet && isOpen) {
      setTitle(snippet.title || "");
      setDescription(snippet.description || "");
      setLanguage(snippet.language || "typescript");
      setCode(snippet.code || "");
      setProjectId(snippet.projectId || "");
      setTags(snippet.tags || []);
      setFavorite(snippet.favorite || false);
      setError(null);

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [snippet, isOpen]);

  // Auto-grow textarea up to 50vh
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = window.innerHeight * 0.5;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 220), maxHeight)}px`;
    }
  }, [code]);

  const isDirty =
    snippet &&
    (title !== snippet.title ||
      description !== (snippet.description || "") ||
      code !== snippet.code ||
      language !== snippet.language ||
      projectId !== (snippet.projectId || "") ||
      favorite !== snippet.favorite ||
      JSON.stringify(tags) !== JSON.stringify(snippet.tags || []));

  const handleClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm("Discard unsaved changes?");
      if (!confirmDiscard) return;
    }
    sound.playClick(600);
    onClose();
  };

  // Keyboard navigation: Cmd/Ctrl+Enter saves, Esc cancels
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, title, code, language, description, projectId, tags, favorite, isDirty]);

  // Tab key handling: Tab inserts 2 spaces, Shift+Tab outdents
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (!e.shiftKey) {
        // Insert 2 spaces
        const nextCode = code.substring(0, start) + "  " + code.substring(end);
        setCode(nextCode);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        }, 0);
      } else {
        // Outdent if previous 2 chars are spaces
        if (code.substring(start - 2, start) === "  ") {
          const nextCode = code.substring(0, start - 2) + code.substring(end);
          setCode(nextCode);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = Math.max(0, start - 2);
          }, 0);
        }
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!snippet) return;

    if (!title.trim()) {
      setError("Snippet title is required");
      titleInputRef.current?.focus();
      return;
    }

    if (!code.trim()) {
      setError("Code snippet content is required");
      textareaRef.current?.focus();
      return;
    }

    try {
      setError(null);
      await updateSnippet.mutateAsync({
        id: snippet.id,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          language: language.toLowerCase(),
          code: code.trim(),
          projectId: projectId || null,
          tags,
          favorite,
        },
      });

      toast.success("Snippet updated", {
        description: `Changes to "${title.trim()}" saved.`,
      });
      sound.playSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to update snippet";
      setError(msg);
      toast.error("Failed to update snippet", { description: msg });
    }
  };

  if (!isOpen || !snippet) return null;

  const languageOptions: SnippetPopoverOption<string>[] = LANGUAGES.map((lang) => ({
    value: lang,
    label: formatLanguageName(lang),
    icon: <LanguageDot language={lang} className="shrink-0" />,
  }));

  const projectOptions: SnippetPopoverOption<string>[] = [
    { value: "", label: "No project", icon: <FolderKanban className="w-3.5 h-3.5 text-ink-subtle" /> },
    ...(projects || []).map((p) => ({
      value: p.id,
      label: p.title,
      icon: <FolderKanban className="w-3.5 h-3.5 text-ink-subtle" />,
    })),
  ];

  const isValid = Boolean(title.trim() && code.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-snippet-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-[640px] max-h-[92vh] rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-hairline bg-surface-1">
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle font-semibold">
            Edit Snippet
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* 1. Large Borderless Title Input (18px) */}
          <div className="space-y-1">
            <input
              ref={titleInputRef}
              id="edit-snippet-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Snippet title..."
              aria-required="true"
              className="w-full bg-transparent text-[18px] font-medium text-ink placeholder:text-ink-subtle/50 focus:outline-none border-b border-hairline focus:border-accent pb-1.5 transition-colors"
            />
          </div>

          {/* 2. Properties Row: Language, Project, Favorite */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Language searchable popover */}
            <SnippetPopover
              searchable
              searchPlaceholder="Filter language..."
              options={languageOptions}
              value={language}
              onChange={(val) => setLanguage(val)}
              renderTrigger={(selected) => (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md bg-surface-2 text-xs font-mono text-ink border border-hairline hover:border-hairline-strong transition-colors"
                >
                  <LanguageDot language={language} className="shrink-0" />
                  <span>{selected?.label || language}</span>
                </button>
              )}
            />

            {/* Project popover */}
            <SnippetPopover
              searchable
              searchPlaceholder="Filter projects..."
              options={projectOptions}
              value={projectId}
              onChange={(val) => setProjectId(val)}
              renderTrigger={(selected) => (
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-mono transition-colors border",
                    projectId
                      ? "bg-surface-2 text-ink border-hairline-strong"
                      : "bg-surface-1 text-ink-subtle border-hairline hover:text-ink hover:bg-surface-2"
                  )}
                >
                  <FolderKanban className="w-3.5 h-3.5 text-ink-subtle" />
                  <span className="truncate max-w-[140px]">
                    {selected?.label || "No project"}
                  </span>
                </button>
              )}
            />

            {/* Favorite Star Toggle */}
            <button
              type="button"
              onClick={() => {
                sound.playClick(850);
                setFavorite(!favorite);
              }}
              title={favorite ? "Starred snippet" : "Star snippet"}
              aria-label={favorite ? "Starred snippet" : "Star snippet"}
              className={cn(
                "inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-mono transition-colors border",
                favorite
                  ? "bg-surface-2 text-warn border-warn/40"
                  : "bg-surface-1 text-ink-subtle border-hairline hover:text-ink hover:bg-surface-2"
              )}
            >
              <Star
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  favorite ? "text-warn fill-warn" : ""
                )}
              />
              <span className="text-[11px]">{favorite ? "Starred" : "Star"}</span>
            </button>
          </div>

          {/* 3. Description: Single-line borderless input */}
          <div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or purpose (optional)..."
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-subtle/50 focus:outline-none border-b border-hairline focus:border-hairline-strong pb-1 transition-colors"
            />
          </div>

          {/* 4. Code Textarea: Mono 13px, surface-2, min-h 220px, auto-growing, no resize handle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-subtle">
              <span>Code</span>
              <span>Tab inserts 2 spaces</span>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleCodeKeyDown}
              placeholder={`// Paste or write ${formatLanguageName(language)} code here...`}
              spellCheck={false}
              className="w-full min-h-[220px] p-3 rounded-md bg-surface-2/70 border border-hairline text-ink font-mono text-[13px] leading-[20px] resize-none focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* 5. Tags: Inline chip input */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-ink-subtle">Tags</span>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="Add tags (press Enter or comma)..."
            />
          </div>
        </form>

        {/* Footer: Cancel & Save Changes */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hairline bg-surface-1">
          <span className="hidden sm:inline text-[11px] font-mono text-ink-subtle">
            <kbd className="border border-hairline px-1 py-0.2 rounded bg-surface-2 text-ink-muted">
              ⌘ Enter
            </kbd>{" "}
            to save
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleClose}
              className="h-8 px-3 rounded-[6px] text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={updateSnippet.isPending || !isValid}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm",
                (!isValid || updateSnippet.isPending) && "opacity-60 cursor-not-allowed"
              )}
            >
              {updateSnippet.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
