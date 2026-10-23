"use client";

import { useState, useEffect } from "react";
import { X, Plus, Star, Loader2, Layers, Palette, Folder } from "lucide-react";
import { useCreateComponent } from "@/hooks/use-components";
import { useProjects } from "@/hooks/use-projects";
import { ComponentFramework, ComponentStyling } from "@/types/component";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FRAMEWORKS: { id: ComponentFramework; label: string }[] = [
  { id: "REACT", label: "React" },
  { id: "NEXTJS", label: "Next.js" },
  { id: "VUE", label: "Vue" },
  { id: "SVELTE", label: "Svelte" },
  { id: "HTML_CSS", label: "HTML/CSS" },
];

const STYLING_OPTIONS: { id: ComponentStyling; label: string }[] = [
  { id: "TAILWIND", label: "Tailwind CSS" },
  { id: "CSS_MODULES", label: "CSS Modules" },
  { id: "VANILLA_CSS", label: "Vanilla CSS" },
  { id: "STYLED_COMPONENTS", label: "Styled Components" },
];

export function NewComponentModal({ isOpen, onClose }: Props) {
  const createComponent = useCreateComponent();
  const { data: projects } = useProjects();

  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [framework, setFramework] = useState<ComponentFramework>("REACT");
  const [styling, setStyling] = useState<ComponentStyling>("TAILWIND");
  const [code, setCode] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setCategory("general");
      setFramework("REACT");
      setStyling("TAILWIND");
      setCode("");
      setPreviewCode("");
      setProjectId("");
      setTags([]);
      setTagInput("");
      setFavorite(false);
      setError(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Component name is required");
      return;
    }
    if (!code.trim()) {
      setError("Component code is required");
      return;
    }

    try {
      await createComponent.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || "general",
        framework,
        styling,
        code: code.trim(),
        previewCode: previewCode.trim() || undefined,
        projectId: projectId || null,
        tags,
        favorite,
      });

      sound.playSuccess();
      toast.success("Component created", {
        description: `"${name.trim()}" added to your UI library.`,
      });
      handleClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = e?.response?.data?.error?.message || "Failed to create component";
      setError(msg);
      toast.error("Failed to create component", { description: msg });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-150",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative w-full max-w-2xl bg-surface-1 border border-hairline rounded-xl shadow-2xl overflow-hidden transition-all duration-150 max-h-[90vh] flex flex-col",
          isClosing
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-surface-1/80">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-[-0.3px] text-ink">
              New UI Component
            </h2>
            <button
              type="button"
              onClick={() => {
                sound.playClick(800);
                setFavorite(!favorite);
              }}
              className={cn(
                "p-1 rounded transition-colors cursor-pointer",
                favorite
                  ? "text-amber-400"
                  : "text-ink-tertiary hover:text-ink-muted"
              )}
              title={favorite ? "Starred component" : "Star component"}
            >
              <Star
                className={cn("w-4 h-4", favorite && "fill-amber-400")}
              />
            </button>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-xs">
              {error}
            </div>
          )}

          {/* Component Name, Category & Project Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Component Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. GlowingButton.tsx"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-ink-tertiary" />
                <span>Category / Folder</span>
              </label>
              <input
                type="text"
                placeholder="e.g. navbars, buttons, sliders"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                Link to Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink transition-colors"
              >
                <option value="">No Project Linked</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Framework & Styling Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-ink-tertiary" />
                <span>Framework</span>
              </label>
              <select
                value={framework}
                onChange={(e) =>
                  setFramework(e.target.value as ComponentFramework)
                }
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink transition-colors"
              >
                {FRAMEWORKS.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-ink-tertiary" />
                <span>Styling Engine</span>
              </label>
              <select
                value={styling}
                onChange={(e) =>
                  setStyling(e.target.value as ComponentStyling)
                }
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink transition-colors"
              >
                {STYLING_OPTIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Accessible micro-animated button with subtle hover elevation."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline focus:border-primary focus:outline-none text-xs text-ink placeholder:text-ink-tertiary transition-colors"
            />
          </div>

          {/* Component Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-ink-muted">
                Component Source Code <span className="text-primary">*</span>
              </label>
              <span className="text-[10px] text-ink-subtle font-mono">
                JSX / TSX / Vue / Svelte / CSS
              </span>
            </div>
            <textarea
              rows={8}
              placeholder={`export function Button({ children, ...props }) {\n  return (\n    <button className="px-4 py-2 rounded-md bg-primary text-white" {...props}>\n      {children}\n    </button>\n  );\n}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-md bg-canvas border border-hairline focus:border-primary focus:outline-none text-xs font-mono text-ink placeholder:text-ink-tertiary transition-colors leading-relaxed"
            />
          </div>

          {/* Usage / Preview Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-ink-muted">
                Usage Example / Preview Code (optional)
              </label>
              <span className="text-[10px] text-ink-subtle font-mono">
                How to invoke it
              </span>
            </div>
            <textarea
              rows={4}
              placeholder={`<Button onClick={() => alert("clicked!")}>\n  Click me\n</Button>`}
              value={previewCode}
              onChange={(e) => setPreviewCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md bg-canvas border border-hairline focus:border-primary focus:outline-none text-xs font-mono text-ink placeholder:text-ink-tertiary transition-colors leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-surface-2 border border-hairline focus-within:border-primary transition-colors">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 text-ink border border-hairline"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-ink-muted hover:text-ink cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={
                  tags.length === 0
                    ? "Type tag and press Enter (e.g. button, animated, glass)..."
                    : "Add more..."
                }
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 min-w-[140px] bg-transparent text-xs text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={createComponent.isPending}
              className="px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createComponent.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {createComponent.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Component</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
