"use client";

import { useState } from "react";
import {
  Star,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Check,
} from "lucide-react";
import { UIComponentItem } from "@/types/component";
import {
  useToggleComponentFavorite,
  useDeleteComponent,
} from "@/hooks/use-components";
import { ComponentLivePreview } from "./component-live-preview";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface Props {
  component: UIComponentItem;
  onEdit: (component: UIComponentItem) => void;
  onViewCode: (component: UIComponentItem) => void;
}

export function ComponentCard({ component, onEdit, onViewCode }: Props) {
  const toggleFavorite = useToggleComponentFavorite();
  const deleteComponent = useDeleteComponent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(850);
    toggleFavorite.mutate({
      id: component.id,
      favorite: !component.favorite,
    });
  };

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(component.code);
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
      await deleteComponent.mutateAsync(component.id);
      toast.success("Component deleted", {
        description: `"${component.name}" has been removed from catalog.`,
      });
    } catch {
      toast.error("Failed to delete component");
    }
  };

  // Subtitle format: e.g. "Login template" or "React · Tailwind CSS" or category
  const subtitle = component.category
    ? `${component.category}`
    : `${component.framework.toLowerCase()}`;

  return (
    <div
      onClick={() => {
        sound.playClick(800);
        onViewCode(component);
      }}
      className="group relative flex flex-col rounded-2xl bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2/30 transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 select-none"
    >
      {/* Component Visual Preview Container (matching Image 2 - clean frame, no colored dots) */}
      <div className="w-full h-48 bg-[#090a0b] border-b border-hairline/60 relative flex items-center justify-center overflow-hidden p-3 group-hover:border-hairline-strong transition-colors">
        {/* Subtle blueprint grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141517_1px,transparent_1px),linear-gradient(to_bottom,#141517_1px,transparent_1px)] bg-[size:16px_16px] opacity-30 pointer-events-none" />

        {/* Live Preview Embed */}
        <ComponentLivePreview
          code={component.code}
          name={component.name}
          mode="thumbnail"
          className="w-full h-full"
        />

        {/* Hover Quick Action Buttons */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Copy Button */}
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-md bg-surface-2/90 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer shadow-xs"
            title="Copy Code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Favorite Star Button */}
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "p-1.5 rounded-md bg-surface-2/90 hover:bg-surface-3 border border-hairline transition-colors cursor-pointer shadow-xs",
              component.favorite ? "text-amber-400 opacity-100" : "text-ink-muted hover:text-ink"
            )}
            title={component.favorite ? "Starred" : "Star component"}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5",
                component.favorite && "fill-amber-400"
              )}
            />
          </button>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md bg-surface-2/90 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer shadow-xs"
              title="Options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-32 rounded-lg bg-surface-2 border border-hairline shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
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

        {/* Always visible starred indicator if favored and not hovering */}
        {component.favorite && (
          <div className="absolute top-2.5 right-2.5 group-hover:hidden z-0">
            <div className="p-1.5 rounded-md bg-surface-2/80 border border-hairline text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Clean Title · Subtitle matching Image 2 */}
      <div className="p-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-1.5 text-xs truncate">
          <span className="font-semibold text-ink group-hover:text-primary transition-colors truncate">
            {component.name}
          </span>
          <span className="text-ink-tertiary select-none">·</span>
          <span className="text-ink-muted capitalize truncate font-normal">
            {subtitle}
          </span>
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
