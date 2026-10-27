"use client";

import { useState, useEffect } from "react";
import { X, Plus, Star, Sparkles, Loader2 } from "lucide-react";
import { useCreateProject } from "@/hooks/use-projects";
import { ProjectStatus } from "@/types/project";
import { toast } from "@/lib/toast";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_TECH_STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "Supabase",
  "PostgreSQL",
  "Prisma",
  "Clerk",
  "Python",
  "FastAPI",
  "Docker",
  "Redis",
];

export function NewProjectModal({ isOpen, onClose }: Props) {
  const createProject = useCreateProject();

  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("PLANNING");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setStatus("PLANNING");
      setRepositoryUrl("");
      setLiveUrl("");
      setTechStack([]);
      setCustomTag("");
      setFavorite(false);
      setError(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    sound.playClick(600);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150); // Matches --modal-close-dur (150ms)
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || techStack.includes(trimmed)) return;
    sound.playClick(900);
    setTechStack([...techStack, trimmed]);
    setCustomTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    sound.playClick(500);
    setTechStack(techStack.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required");
      return;
    }

    try {
      setError(null);
      const created = await createProject.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        repositoryUrl: repositoryUrl.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
        techStack,
        favorite,
      });

      toast.success("Project created", {
        description: `"${created.title}" added to your workspace.`,
      });
      handleClose();
    } catch (err: any) {
      const msg = err.message || "Failed to create project";
      setError(msg);
      toast.error("Failed to create project", { description: msg });
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Modal Surface with transitions-dev recipe */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "t-modal relative w-full max-w-lg rounded-xl bg-surface-1 border border-hairline-strong shadow-2xl overflow-hidden z-10 flex flex-col max-h-[calc(100dvh-2rem)]",
          isOpen && !isClosing && "is-open",
          isClosing && "is-closing"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-surface-2/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-[-0.4px] text-ink">
              Create New Project
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Title & Favorite */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-ink-muted">Project Title *</label>
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
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Supabase Micro-SaaS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-mono text-ink-muted">Description</label>
            <textarea
              rows={2}
              placeholder="Brief summary of what this project does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs placeholder:text-ink-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="font-mono text-ink-muted">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-ink-muted">Repository URL</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs placeholder:text-ink-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-ink-muted">Live Demo URL</label>
              <input
                type="url"
                placeholder="https://myproject.dev"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs placeholder:text-ink-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Tech Stack Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-ink-muted">Tech Stack Tags</label>
              <span className="text-[11px] font-mono text-ink-tertiary">
                {techStack.length} selected
              </span>
            </div>

            {/* Selected Tags */}
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-surface-2 border border-hairline">
                {techStack.map((tag) => (
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

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom tag (e.g. GraphQL, Vite)..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag(customTag);
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => handleAddTag(customTag)}
                disabled={!customTag.trim()}
                className="px-3 py-1.5 rounded-md bg-surface-3 border border-hairline text-ink text-xs disabled:opacity-40 hover:bg-surface-4 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Common Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {COMMON_TECH_STACK.map((tag) => {
                const isSelected = techStack.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      isSelected ? handleRemoveTag(tag) : handleAddTag(tag)
                    }
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded border transition-colors",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary-hover"
                        : "bg-surface-2 border-hairline text-ink-subtle hover:text-ink hover:bg-surface-3"
                    )}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={createProject.isPending || !title.trim()}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
