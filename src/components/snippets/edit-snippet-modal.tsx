"use client";

import { useState, useEffect } from "react";
import { X, Save, Star, Loader2 } from "lucide-react";
import { useUpdateSnippet } from "@/hooks/use-snippets";
import { useProjects } from "@/hooks/use-projects";
import { Snippet } from "@/types/snippet";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Props {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_LANGUAGES = [
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
];

export function EditSnippetModal({ snippet, isOpen, onClose }: Props) {
  const updateSnippet = useUpdateSnippet();
  const { data: projects } = useProjects();

  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [code, setCode] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (snippet && isOpen) {
      setTitle(snippet.title);
      setDescription(snippet.description || "");
      setLanguage(snippet.language);
      setCode(snippet.code);
      setProjectId(snippet.projectId || "");
      setTags(snippet.tags || []);
      setTagInput("");
      setFavorite(snippet.favorite);
      setError(null);
      setIsClosing(false);
    }
  }, [snippet, isOpen]);

  const handleClose = () => {
    sound.playClick(600);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    sound.playClick(900);
    setTags([...tags, trimmed]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    sound.playClick(500);
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippet) return;
    if (!title.trim() || !code.trim()) {
      setError("Title and code content are required");
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

      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to update snippet");
    }
  };

  if (!isOpen && !isClosing) return null;
  if (!snippet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "t-modal relative w-full max-w-xl rounded-xl bg-surface-1 border border-hairline-strong shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]",
          isOpen && !isClosing && "is-open",
          isClosing && "is-closing"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-surface-2/40">
          <span className="text-sm font-semibold tracking-[-0.4px] text-ink">
            Edit Snippet
          </span>
          <button
            onClick={handleClose}
            className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="font-mono text-ink-muted">Snippet Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-ink-muted">Language *</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary uppercase font-mono"
              >
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-ink-muted">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-ink-muted">Code *</label>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(favorite ? 500 : 850);
                  setFavorite(!favorite);
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-ink-subtle hover:text-amber-400"
              >
                <Star
                  className={cn(
                    "w-3.5 h-3.5",
                    favorite ? "text-amber-400 fill-amber-400" : "text-ink-tertiary"
                  )}
                />
                <span>Favorite</span>
              </button>
            </div>
            <textarea
              rows={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 rounded-md bg-surface-2 border border-hairline text-ink font-mono text-xs focus:outline-none focus:border-primary transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-ink-muted">Link to Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
              >
                <option value="">No Project (Global Snippet)</option>
                {projects?.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-ink-muted">Add Tag</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. auth, db, hooks"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-2.5 py-1.5 rounded-md bg-surface-3 border border-hairline text-ink text-xs disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-surface-2 border border-hairline">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-hairline text-ink-muted"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md bg-surface-2 border border-hairline text-ink hover:bg-surface-3 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateSnippet.isPending || !title.trim() || !code.trim()}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
            >
              {updateSnippet.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
