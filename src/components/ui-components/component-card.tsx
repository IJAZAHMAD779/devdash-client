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
  Layers,
  Palette,
  ExternalLink,
} from "lucide-react";
import { UIComponentItem, ComponentFramework, ComponentStyling } from "@/types/component";
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
  onViewCode: (component: UIComponentItem) => void;
}

const FRAMEWORK_CONFIG: Record<
  ComponentFramework,
  { label: string; textClass: string }
> = {
  REACT: {
    label: "React",
    textClass: "text-sky-400 font-semibold",
  },
  NEXTJS: {
    label: "Next.js",
    textClass: "text-zinc-200 font-semibold",
  },
  VUE: {
    label: "Vue",
    textClass: "text-emerald-400 font-semibold",
  },
  SVELTE: {
    label: "Svelte",
    textClass: "text-orange-400 font-semibold",
  },
  HTML_CSS: {
    label: "HTML/CSS",
    textClass: "text-indigo-400 font-semibold",
  },
};

const STYLING_CONFIG: Record<
  ComponentStyling,
  { label: string; textClass: string }
> = {
  TAILWIND: {
    label: "Tailwind CSS",
    textClass: "text-cyan-300",
  },
  CSS_MODULES: {
    label: "CSS Modules",
    textClass: "text-purple-300",
  },
  VANILLA_CSS: {
    label: "Vanilla CSS",
    textClass: "text-blue-300",
  },
  STYLED_COMPONENTS: {
    label: "Styled Comp",
    textClass: "text-pink-300",
  },
};

export function ComponentCard({ component, onEdit, onViewCode }: Props) {
  const toggleFavorite = useToggleComponentFavorite();
  const deleteComponent = useDeleteComponent();
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

  const lineCount = (component.code.match(/\n/g) || []).length + 1;

  return (
    <div
      onClick={() => {
        sound.playClick(800);
        onViewCode(component);
      }}
      className="group relative flex flex-col justify-between p-4 rounded-xl bg-surface-1 border border-hairline hover:border-primary/50 hover:bg-surface-1/90 transition-all duration-200 cursor-pointer shadow-sm"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink group-hover:text-primary transition-colors truncate">
              {component.name}
            </h3>

            {/* Framework & Styling & Category (NO pill backgrounds — clean text with dot separator) */}
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-ink-subtle flex-wrap">
              <span className={fwConfig.textClass}>{fwConfig.label}</span>
              <span className="text-ink-tertiary">·</span>
              <span className={styleConfig.textClass}>{styleConfig.label}</span>
              <span className="text-ink-tertiary">·</span>
              <span className="text-ink-tertiary capitalize">
                {component.category || "general"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "p-1.5 rounded-md hover:bg-surface-2 transition-colors cursor-pointer",
                component.favorite ? "text-amber-400" : "text-ink-tertiary hover:text-ink"
              )}
              title={component.favorite ? "Starred" : "Star component"}
            >
              <Star
                className={cn(
                  "w-3.5 h-3.5 transition-transform active:scale-125 duration-150",
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
                title="Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
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

        {/* Description */}
        {component.description && (
          <p className="text-xs text-ink-muted line-clamp-2 mb-3 leading-relaxed">
            {component.description}
          </p>
        )}
      </div>

      {/* Footer Meta Row */}
      <div className="mt-3 pt-3 border-t border-hairline/60 flex items-center justify-between text-xs text-ink-tertiary gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {component.project ? (
            <div className="flex items-center gap-1.5 text-ink-muted truncate">
              <FolderKanban className="w-3 h-3 text-ink-tertiary shrink-0" />
              <span className="truncate">{component.project.title}</span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-ink-tertiary">
              {lineCount} lines
            </span>
          )}

          {component.tags && component.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-ink-tertiary truncate">
              <span>#{component.tags[0]}</span>
              {component.tags.length > 1 && (
                <span>+{component.tags.length - 1}</span>
              )}
            </div>
          )}
        </div>

        {/* View Code CTA Indicator */}
        <div className="inline-flex items-center gap-1 text-[11px] font-medium text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
          <Code2 className="w-3.5 h-3.5" />
          <span>View Code</span>
        </div>
      </div>

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
