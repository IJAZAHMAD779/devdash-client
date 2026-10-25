"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Star, Loader2, ChevronDown, ChevronRight, Check } from "lucide-react";
import { useUpdateComponent, useUIComponents } from "@/hooks/use-components";
import { useProjects } from "@/hooks/use-projects";
import {
  UIComponentItem,
  ComponentFramework,
  ComponentStyling,
} from "@/types/component";
import { Combobox } from "./combobox";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  component: UIComponentItem | null;
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

export function EditComponentModal({ component, isOpen, onClose }: Props) {
  const updateComponent = useUpdateComponent();
  const { data: allComponents } = useUIComponents();
  const { data: projects } = useProjects();

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

  // Popover open states
  const [openFramework, setOpenFramework] = useState(false);
  const [openStyling, setOpenStyling] = useState(false);
  const [openProject, setOpenProject] = useState(false);

  // Collapsible section
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeAreaRef = useRef<HTMLTextAreaElement>(null);

  // Extract distinct category names preserving canonical casing
  const categoryOptions = useMemo(() => {
    if (!allComponents || allComponents.length === 0) return ["general", "navbars", "buttons", "cards", "forms", "modals"];
    const map = new Map<string, string>();
    allComponents.forEach((c) => {
      const cat = (c.category || "general").trim();
      if (!cat) return;
      const lower = cat.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, cat);
      }
    });
    if (!map.has("general")) map.set("general", "general");
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [allComponents]);

  // Sync state when component changes or modal opens
  useEffect(() => {
    if (component && isOpen) {
      setName(component.name || "");
      setDescription(component.description || "");
      setCategory(component.category || "general");
      setFramework(component.framework || "REACT");
      setStyling(component.styling || "TAILWIND");
      setCode(component.code || "");
      setPreviewCode(component.previewCode || "");
      setProjectId(component.projectId || "");
      setTags(component.tags || []);
      setTagInput("");
      setFavorite(component.favorite || false);
      setError(null);

      // Auto-expand if editing a component that has description, tags, or previewCode filled
      const hasMoreDetails = Boolean(
        component.description?.trim() ||
        (component.tags && component.tags.length > 0) ||
        component.previewCode?.trim()
      );
      setIsMoreOpen(hasMoreDetails);

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 60);
    }
  }, [component, isOpen]);

  const isDirty = useMemo(() => {
    if (!component) return false;
    return (
      name !== (component.name || "") ||
      description !== (component.description || "") ||
      category !== (component.category || "general") ||
      framework !== component.framework ||
      styling !== component.styling ||
      code !== (component.code || "") ||
      previewCode !== (component.previewCode || "") ||
      projectId !== (component.projectId || "") ||
      favorite !== component.favorite ||
      JSON.stringify(tags) !== JSON.stringify(component.tags || [])
    );
  }, [component, name, description, category, framework, styling, code, previewCode, projectId, favorite, tags]);

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm("Discard unsaved component changes?")) {
        return;
      }
    }
    onClose();
  };

  // Keyboard shortcut listener: ⌘/Ctrl+Enter saves, Esc closes with confirm
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        if (openFramework || openStyling || openProject) {
          setOpenFramework(false);
          setOpenStyling(false);
          setOpenProject(false);
          return;
        }
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty, openFramework, openStyling, openProject, name, code, category, framework, styling, description, projectId, tags, favorite, previewCode]);

  // Code textarea Tab handling (indents with 2 spaces)
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (e.shiftKey) {
        // Outdent
        const linesBefore = code.substring(0, start).split("\n");
        const currentLine = linesBefore[linesBefore.length - 1];
        if (currentLine.startsWith("  ")) {
          const newCode = code.substring(0, start - 2) + code.substring(start);
          setCode(newCode);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        // Indent 2 spaces
        const newCode = code.substring(0, start) + "  " + code.substring(end);
        setCode(newCode);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        }, 0);
      }
    }
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!component) return;

    if (!name.trim()) {
      setError("Component name is required");
      nameInputRef.current?.focus();
      return;
    }
    if (!code.trim()) {
      setError("Component source code is required");
      codeAreaRef.current?.focus();
      return;
    }

    try {
      setError(null);
      await updateComponent.mutateAsync({
        id: component.id,
        payload: {
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
        },
      });

      sound.playSuccess();
      toast.success("Component updated", {
        description: `"${name.trim()}" saved.`,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = e?.response?.data?.error?.message || "Failed to update component";
      setError(msg);
      toast.error("Failed to update component", { description: msg });
    }
  };

  if (!isOpen || !component) return null;

  const currentFrameworkLabel = FRAMEWORKS.find((f) => f.id === framework)?.label || "React";
  const currentStylingLabel = STYLING_OPTIONS.find((s) => s.id === styling)?.label || "Tailwind CSS";
  const currentProjectName = projects?.find((p) => p.id === projectId)?.title || "No project";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-component-title"
        className="relative w-full max-w-[720px] bg-surface-1 border border-hairline rounded-lg shadow-2xl overflow-hidden transition-all duration-150 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95"
      >
        {/* Header / Name Field */}
        <div className="px-5 pt-4 pb-3 border-b border-hairline bg-surface-1">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(favorite ? 500 : 850);
                  setFavorite(!favorite);
                }}
                className={cn(
                  "p-1 rounded text-ink-subtle hover:text-ink transition-colors cursor-pointer shrink-0",
                  favorite && "text-warn hover:text-warn"
                )}
                title={favorite ? "Starred" : "Star component"}
                aria-label="Toggle star"
              >
                <Star className={cn("w-4 h-4", favorite && "fill-warn text-warn")} />
              </button>

              <input
                ref={nameInputRef}
                id="edit-component-title"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Component name"
                className="w-full bg-transparent text-lg font-semibold tracking-[-0.02em] text-ink placeholder:text-ink-subtle/40 focus:outline-none border-b border-transparent focus:border-accent/40 pb-0.5 transition-colors"
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Properties row */}
          <div className="flex items-center flex-wrap gap-2 pt-1">
            {/* Category Combobox */}
            <Combobox
              value={category}
              onChange={(newCat) => setCategory(newCat)}
              options={categoryOptions}
              placeholder="Category"
            />

            {/* Framework Popover Trigger */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => {
                  setOpenFramework(!openFramework);
                  setOpenStyling(false);
                  setOpenProject(false);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-mono transition-colors border",
                  openFramework
                    ? "bg-surface-2 text-ink border-hairline-strong"
                    : "bg-surface-2 text-ink border-hairline hover:border-hairline-strong"
                )}
              >
                <span className="text-ink-subtle text-[11px] uppercase tracking-wider">FW:</span>
                <span>{currentFrameworkLabel}</span>
                <ChevronDown className="w-3 h-3 text-ink-subtle" />
              </button>

              {openFramework && (
                <div className="absolute left-0 mt-1 w-44 rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl p-1 z-50 animate-in fade-in duration-100">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => {
                        setFramework(fw.id);
                        setOpenFramework(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left",
                        framework === fw.id
                          ? "bg-surface-2 text-ink font-medium"
                          : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                      )}
                    >
                      <span>{fw.label}</span>
                      {framework === fw.id && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Styling Popover Trigger */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => {
                  setOpenStyling(!openStyling);
                  setOpenFramework(false);
                  setOpenProject(false);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-mono transition-colors border",
                  openStyling
                    ? "bg-surface-2 text-ink border-hairline-strong"
                    : "bg-surface-2 text-ink border-hairline hover:border-hairline-strong"
                )}
              >
                <span className="text-ink-subtle text-[11px] uppercase tracking-wider">STYLE:</span>
                <span className="truncate max-w-[120px]">{currentStylingLabel}</span>
                <ChevronDown className="w-3 h-3 text-ink-subtle" />
              </button>

              {openStyling && (
                <div className="absolute left-0 mt-1 w-48 rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl p-1 z-50 animate-in fade-in duration-100">
                  {STYLING_OPTIONS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setStyling(st.id);
                        setOpenStyling(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left",
                        styling === st.id
                          ? "bg-surface-2 text-ink font-medium"
                          : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                      )}
                    >
                      <span className="truncate">{st.label}</span>
                      {styling === st.id && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project Popover Trigger */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => {
                  setOpenProject(!openProject);
                  setOpenFramework(false);
                  setOpenStyling(false);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-mono transition-colors border",
                  projectId
                    ? "bg-surface-2 text-ink border-hairline-strong"
                    : "bg-surface-1 text-ink-subtle border-hairline hover:text-ink hover:bg-surface-2"
                )}
              >
                <span className="text-ink-subtle text-[11px] uppercase tracking-wider">PROJ:</span>
                <span className="truncate max-w-[110px]">{currentProjectName}</span>
                <ChevronDown className="w-3 h-3 text-ink-subtle" />
              </button>

              {openProject && (
                <div className="absolute left-0 mt-1 w-52 rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl p-1 z-50 animate-in fade-in duration-100 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectId("");
                      setOpenProject(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left",
                      !projectId
                        ? "bg-surface-2 text-ink font-medium"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    <span>No project</span>
                    {!projectId && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>
                  {projects?.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        setProjectId(proj.id);
                        setOpenProject(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left",
                        projectId === proj.id
                          ? "bg-surface-2 text-ink font-medium"
                          : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                      )}
                    >
                      <span className="truncate">{proj.title}</span>
                      {projectId === proj.id && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Source Code Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-component-code"
                className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle flex items-center gap-1.5"
              >
                <span>Source Code</span>
                <span className="text-[10px] text-accent font-normal lowercase">(required)</span>
              </label>
              <span className="text-[10px] font-mono text-ink-subtle">Tab indents</span>
            </div>
            <textarea
              ref={codeAreaRef}
              id="edit-component-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleCodeKeyDown}
              spellCheck={false}
              className="w-full font-mono text-[13px] leading-relaxed bg-surface-2 border border-hairline rounded-md p-3 text-ink placeholder:text-ink-subtle/30 focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-accent/30 min-h-[220px] max-h-[46vh] resize-none overflow-y-auto"
            />
          </div>

          {/* Collapsible More Details */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="flex items-center gap-1.5 text-xs font-mono text-ink-subtle hover:text-ink transition-colors cursor-pointer group"
            >
              {isMoreOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-ink-subtle group-hover:text-ink transition-transform" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-ink-subtle group-hover:text-ink transition-transform" />
              )}
              <span>More details</span>
              {!isMoreOpen && (description || tags.length > 0 || previewCode) && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              )}
            </button>

            {isMoreOpen && (
              <div className="mt-3 space-y-3.5 pl-3 border-l border-hairline animate-in fade-in duration-100">
                {/* Description */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this component's purpose or design system role"
                    className="w-full px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink placeholder:text-ink-subtle/40 focus:outline-none focus:border-hairline-strong font-mono"
                  />
                </div>

                {/* Usage Example */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle mb-1">
                    Usage Example
                  </label>
                  <textarea
                    value={previewCode}
                    onChange={(e) => setPreviewCode(e.target.value)}
                    placeholder={`<GlowingButton onClick={() => alert("Clicked!")}>\n  Click me\n</GlowingButton>`}
                    spellCheck={false}
                    className="w-full font-mono text-xs leading-relaxed bg-surface-2 border border-hairline rounded-md p-2.5 text-ink placeholder:text-ink-subtle/30 focus:outline-none focus:border-hairline-strong min-h-[90px] resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-md bg-surface-2 border border-hairline min-h-[34px]">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-surface-1 border border-hairline text-ink-muted"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-ink-subtle hover:text-ink ml-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={tags.length === 0 ? "Add tags (press Enter)..." : ""}
                      className="bg-transparent text-xs font-mono text-ink placeholder:text-ink-subtle/40 focus:outline-none flex-1 min-w-[120px] px-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-5 py-3 border-t border-hairline bg-surface-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {error ? (
              <span className="text-xs text-danger font-mono">{error}</span>
            ) : (
              <span className="text-[11px] font-mono text-ink-subtle hidden sm:inline">
                <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-hairline text-[10px]">⌘↵</kbd> save · <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-hairline text-[10px]">Esc</kbd> cancel
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={updateComponent.isPending}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={updateComponent.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-accent hover:bg-accent/90 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {updateComponent.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
