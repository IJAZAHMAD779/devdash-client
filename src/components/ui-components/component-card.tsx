"use client";

import { useState } from "react";
import {
  Star,
  FolderKanban,
  MoreVertical,
  Trash2,
  Edit2,
  Tag,
  Code2,
  Eye,
  Layers,
  Palette,
} from "lucide-react";
import { UIComponentItem, ComponentFramework, ComponentStyling } from "@/types/component";
import { CodeBlock } from "@/components/ui/code-block";
import {
  useToggleComponentFavorite,
  useDeleteComponent,
} from "@/hooks/use-components";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface Props {
  component: UIComponentItem;
  onEdit: (component: UIComponentItem) => void;
}

const FRAMEWORK_CONFIG: Record<
  ComponentFramework,
  { label: string; badgeClass: string }
> = {
  REACT: {
    label: "React",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  NEXTJS: {
    label: "Next.js",
    badgeClass: "bg-zinc-100/10 text-zinc-100 border-zinc-100/20",
  },
  VUE: {
    label: "Vue",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  SVELTE: {
    label: "Svelte",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  HTML_CSS: {
    label: "HTML/CSS",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
};

const STYLING_CONFIG: Record<
  ComponentStyling,
  { label: string; badgeClass: string }
> = {
  TAILWIND: {
    label: "Tailwind CSS",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  },
  CSS_MODULES: {
    label: "CSS Modules",
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  },
  VANILLA_CSS: {
    label: "Vanilla CSS",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  STYLED_COMPONENTS: {
    label: "Styled Comp",
    badgeClass: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  },
};

export function ComponentCard({ component, onEdit }: Props) {
  const toggleFavorite = useToggleComponentFavorite();
  const deleteComponent = useDeleteComponent();
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fwConfig =
    FRAMEWORK_CONFIG[component.framework] || FRAMEWORK_CONFIG.REACT;
  const styleConfig =
    STYLING_CONFIG[component.styling] || STYLING_CONFIG.TAILWIND;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate({
      id: component.id,
      favorite: !component.favorite,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteComponent.mutateAsync(component.id);
      toast.success("Component deleted", {
        description: `"${component.name}" has been removed from catalog.`,
      });
    } catch {
      toast.error("Failed to delete component");
    }
  };

  // Determine language for code highlighting
  const getLanguage = () => {
    if (component.framework === "VUE") return "html";
    if (component.framework === "SVELTE") return "html";
    if (component.framework === "HTML_CSS") return "html";
    return "typescript";
  };

  return (
    <div className="flex flex-col rounded-xl bg-surface-1 border border-hairline hover:border-hairline-strong transition-all duration-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-hairline flex items-start justify-between gap-3 bg-surface-1/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink truncate">
              {component.name}
            </h3>
            {/* Framework Badge */}
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-full border inline-flex items-center gap-1 font-medium",
                fwConfig.badgeClass
              )}
            >
              <Layers className="w-2.5 h-2.5" />
              {fwConfig.label}
            </span>
            {/* Styling Badge */}
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-full border inline-flex items-center gap-1 font-medium",
                styleConfig.badgeClass
              )}
            >
              <Palette className="w-2.5 h-2.5" />
              {styleConfig.label}
            </span>
          </div>

          {component.description && (
            <p className="text-xs text-ink-muted line-clamp-1">
              {component.description}
            </p>
          )}

          {component.project && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-ink-tertiary">
              <FolderKanban className="w-3 h-3 text-ink-subtle" />
              <span className="truncate">{component.project.title}</span>
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "p-1.5 rounded-md hover:bg-surface-2 transition-colors cursor-pointer",
              component.favorite ? "text-amber-400" : "text-ink-tertiary hover:text-ink"
            )}
            title={component.favorite ? "Unstar component" : "Star component"}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-transform active:scale-125 duration-150",
                component.favorite && "fill-amber-400"
              )}
            />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-md hover:bg-surface-2 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-32 rounded-lg bg-surface-2 border border-hairline shadow-lg py-1 z-20 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(component);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-ink-muted hover:text-ink hover:bg-surface-3 text-left transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
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
      </div>

      {/* Code / Preview Tab Toggle (if previewCode exists) */}
      {component.previewCode && (
        <div className="px-4 py-1.5 bg-surface-1/80 border-b border-hairline flex items-center gap-1">
          <button
            onClick={() => {
              sound.playClick(850);
              setActiveTab("code");
            }}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer",
              activeTab === "code"
                ? "bg-surface-3 text-ink font-semibold"
                : "text-ink-tertiary hover:text-ink"
            )}
          >
            <Code2 className="w-3 h-3" />
            <span>Component Code</span>
          </button>
          <button
            onClick={() => {
              sound.playClick(850);
              setActiveTab("preview");
            }}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer",
              activeTab === "preview"
                ? "bg-surface-3 text-ink font-semibold"
                : "text-ink-tertiary hover:text-ink"
            )}
          >
            <Eye className="w-3 h-3" />
            <span>Usage / Preview</span>
          </button>
        </div>
      )}

      {/* Code Display with Shiki & Copy */}
      <div className="p-3 bg-surface-1/30 flex-1">
        <CodeBlock
          code={
            activeTab === "code"
              ? component.code
              : component.previewCode || component.code
          }
          language={getLanguage()}
          className="max-h-80"
        />
      </div>

      {/* Footer Tags */}
      {component.tags && component.tags.length > 0 && (
        <div className="px-4 py-2.5 border-t border-hairline/60 bg-surface-1/40 flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-ink-subtle shrink-0" />
          {component.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-ink-muted border border-hairline/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Component"
        description={`Are you sure you want to delete component "${component.name}"? This action cannot be undone.`}
        confirmText="Delete Component"
        variant="danger"
        isLoading={deleteComponent.isPending}
      />
    </div>
  );
}
