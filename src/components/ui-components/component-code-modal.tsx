"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Star,
  Edit2,
  MoreHorizontal,
  Trash2,
  Terminal,
} from "lucide-react";
import { UIComponentItem, ComponentPropItem } from "@/types/component";
import { useToggleComponentFavorite, useDeleteComponent } from "@/hooks/use-components";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { TabsUnderline, TabItem } from "./tabs-underline";
import { DeviceFrame } from "./device-frame";
import { ComponentLivePreview } from "./component-live-preview";
import { CodeBlock } from "@/components/ui/code-block";
import { CopyButton } from "@/components/snippets/copy-button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface ComponentCodeModalProps {
  component: UIComponentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (component: UIComponentItem) => void;
}

type TabType = "preview" | "code" | "docs" | "prompt";

export function ComponentCodeModal({
  component,
  isOpen,
  onClose,
  onEdit,
}: ComponentCodeModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = useToggleComponentFavorite();
  const deleteComponent = useDeleteComponent();

  // Reset tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab("preview");
      setShowMenu(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  // Keyboard navigation: Esc closes, 1-4 switch tabs, E edits
  useEffect(() => {
    if (!isOpen || !component) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        sound.playClick(600);
        onClose();
      } else if (e.key === "1") {
        e.preventDefault();
        setActiveTab("preview");
      } else if (e.key === "2") {
        e.preventDefault();
        setActiveTab("code");
      } else if (e.key === "3") {
        e.preventDefault();
        setActiveTab("docs");
      } else if (e.key === "4") {
        e.preventDefault();
        setActiveTab("prompt");
      } else if ((e.key === "e" || e.key === "E") && onEdit) {
        e.preventDefault();
        sound.playClick(750);
        onClose();
        onEdit(component);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, component, onClose, onEdit]);

  if (!isOpen || !component) return null;

  const getLanguage = () => {
    if (component.framework === "VUE") return "html";
    if (component.framework === "SVELTE") return "html";
    if (component.framework === "HTML_CSS") return "html";
    return "typescript";
  };

  const parsedProps: ComponentPropItem[] = Array.isArray(component.propsSchema)
    ? component.propsSchema
    : typeof component.propsSchema === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(component.propsSchema);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  const hasDocsContent =
    parsedProps.length > 0 ||
    Boolean(component.dependencies && component.dependencies.length > 0) ||
    Boolean(component.description);

  const hasPromptContent = Boolean(component.aiAgentPrompt);

  const tabs: TabItem<TabType>[] = [
    { id: "preview", label: "Preview" },
    { id: "code", label: "Code" },
    {
      id: "docs",
      label: "Props & Docs",
      hasContent: hasDocsContent,
      badgeTooltip: "Props and documentation available",
    },
    {
      id: "prompt",
      label: "AI Prompt",
      hasContent: hasPromptContent,
      badgeTooltip: "AI prompt generated",
    },
  ];

  const handleToggleFavorite = () => {
    sound.playClick(850);
    toggleFavorite.mutate({
      id: component.id,
      favorite: !component.favorite,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteComponent.mutateAsync(component.id);
      toast.success("Component deleted", {
        description: `"${component.name}" removed from catalog.`,
      });
      onClose();
    } catch {
      toast.error("Failed to delete component");
    }
  };

  const npmCmd = component.dependencies && component.dependencies.length > 0
    ? `npm i ${component.dependencies.join(" ")}`
    : null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="component-modal-title"
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
          className="w-full max-w-[1040px] max-h-[92vh] rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header: 4 controls max (Title + meta, Star, Edit, Context menu with Delete, Close) */}
          <div className="px-5 py-3.5 border-b border-hairline flex items-center justify-between gap-3 shrink-0 select-none bg-surface-1">
            {/* Title + quiet mono category & framework/styling */}
            <div className="flex items-center gap-3 min-w-0">
              <h2
                id="component-modal-title"
                className="text-[18px] font-semibold tracking-[-0.4px] text-ink truncate leading-tight"
              >
                {component.name}
              </h2>

              <div className="flex items-center gap-2 font-mono text-xs text-ink-subtle shrink-0">
                {component.category && (
                  <span className="capitalize">{component.category}</span>
                )}
                <span className="text-ink-subtle/50">·</span>
                <span>
                  {component.framework.toLowerCase()} · {component.styling.toLowerCase().replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Right: Star, Edit, Menu, Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Star toggle */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={component.favorite ? "Unstar component" : "Star component"}
                title={component.favorite ? "Starred" : "Star component"}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  component.favorite
                    ? "text-warn"
                    : "text-ink-subtle hover:text-ink hover:bg-surface-2"
                )}
              >
                <Star className={cn("w-4 h-4", component.favorite && "fill-warn")} />
              </button>

              {/* Edit button */}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(750);
                    onClose();
                    onEdit(component);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                  title="Edit component (E)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              {/* Context menu for Delete */}
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

          {/* 2. Tab row: Underline tabs with content markers */}
          <div className="px-5 bg-surface-1">
            <TabsUnderline
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          {/* 3. Tab Body: unmount hidden tabs eagerly */}
          <div className="p-5 overflow-y-auto flex-1 bg-surface-1">
            {/* TAB 1: PREVIEW (unmounts completely when not active) */}
            {activeTab === "preview" && (
              <DeviceFrame
                runtimeNote={
                  component.framework === "HTML_CSS"
                    ? "Native DOM + Tailwind"
                    : "React 18 · Babel"
                }
              >
                {(viewport, refreshKey) => (
                  <ComponentLivePreview
                    key={refreshKey}
                    code={component.code}
                    name={component.name}
                    category={component.category}
                    framework={component.framework}
                    viewport={viewport}
                    hideToolbar={true}
                    className="w-full border-0 bg-transparent rounded-none"
                  />
                )}
              </DeviceFrame>
            )}

            {/* TAB 2: CODE */}
            {activeTab === "code" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-surface-2/40 border border-hairline overflow-hidden flex flex-col">
                  {/* Top bar with labeled Copy Code button */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-hairline bg-surface-2/60 select-none">
                    <span className="font-mono text-[11px] text-ink-subtle uppercase">
                      Component Source
                    </span>
                    <CopyButton
                      textToCopy={component.code}
                      label="Copy code"
                      showText={true}
                      className="h-6 px-2 text-[11px] rounded text-ink-muted hover:text-ink hover:bg-surface-3"
                    />
                  </div>

                  <div className="max-h-[min(60vh,560px)] overflow-auto p-3.5 font-mono text-[12px] leading-[22px]">
                    <CodeBlock
                      code={component.code}
                      language={getLanguage()}
                      enableSecretMasking={false}
                      className="bg-transparent border-0 p-0 text-xs"
                    />
                  </div>
                </div>

                {/* Usage Example if available */}
                {component.howToUse && (
                  <div className="rounded-lg bg-surface-2/40 border border-hairline overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-hairline bg-surface-2/60 select-none">
                      <span className="font-mono text-[11px] text-ink-subtle uppercase">
                        Usage Example
                      </span>
                      <CopyButton
                        textToCopy={component.howToUse}
                        label="Copy usage"
                        showText={true}
                        className="h-6 px-2 text-[11px] rounded text-ink-muted hover:text-ink hover:bg-surface-3"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-auto p-3.5 font-mono text-[12px] leading-[22px]">
                      <CodeBlock
                        code={component.howToUse}
                        language="typescript"
                        enableSecretMasking={false}
                        className="bg-transparent border-0 p-0 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROPS & DOCS */}
            {activeTab === "docs" && (
              <div className="space-y-4 select-none">
                {/* Description */}
                {component.description && (
                  <div className="p-3.5 rounded-lg bg-surface-2/40 border border-hairline text-xs text-ink-muted leading-relaxed">
                    {component.description}
                  </div>
                )}

                {/* Dependencies command */}
                {npmCmd && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-2/40 border border-hairline text-xs font-mono">
                    <div className="flex items-center gap-2 truncate text-ink-muted">
                      <Terminal className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                      <span className="truncate">{npmCmd}</span>
                    </div>
                    <CopyButton
                      textToCopy={npmCmd}
                      label="Copy npm"
                      showText={true}
                      className="h-6 px-2 text-[11px] rounded text-ink-muted hover:text-ink hover:bg-surface-3 shrink-0"
                    />
                  </div>
                )}

                {/* Props Table */}
                {parsedProps.length > 0 ? (
                  <div className="rounded-lg border border-hairline overflow-hidden bg-surface-1">
                    <div className="grid grid-cols-12 px-3.5 py-2 bg-surface-2/60 border-b border-hairline text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle">
                      <div className="col-span-3">Prop</div>
                      <div className="col-span-3">Type</div>
                      <div className="col-span-2">Default</div>
                      <div className="col-span-4">Description</div>
                    </div>
                    <div className="divide-y divide-hairline">
                      {parsedProps.map((p, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 px-3.5 py-2.5 text-xs hover:bg-surface-2/30 transition-colors items-baseline"
                        >
                          <div className="col-span-3 font-mono font-medium text-ink truncate pr-2">
                            {p.prop}
                          </div>
                          <div className="col-span-3 font-mono text-[11px] text-blue-400 truncate pr-2">
                            {p.type}
                          </div>
                          <div className="col-span-2 font-mono text-[11px] text-ink-subtle truncate pr-2">
                            {p.default || "—"}
                          </div>
                          <div className="col-span-4 text-ink-muted text-[11px] leading-relaxed">
                            {p.description || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  !component.description &&
                  !npmCmd && (
                    <div className="p-8 text-center text-xs font-mono text-ink-subtle">
                      No props or documentation defined for this component.
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB 4: AI PROMPT */}
            {activeTab === "prompt" && (
              <div className="space-y-3">
                {component.aiAgentPrompt ? (
                  <div className="rounded-lg bg-surface-2/40 border border-hairline overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-hairline bg-surface-2/60 select-none">
                      <span className="font-mono text-[11px] text-ink-subtle uppercase">
                        AI Agent Implementation Prompt
                      </span>
                      <CopyButton
                        textToCopy={component.aiAgentPrompt}
                        label="Copy prompt"
                        showText={true}
                        className="h-6 px-2 text-[11px] rounded text-ink-muted hover:text-ink hover:bg-surface-3"
                      />
                    </div>
                    <div className="max-h-[min(60vh,560px)] overflow-auto p-3.5 font-mono text-[12px] leading-[22px]">
                      <CodeBlock
                        code={component.aiAgentPrompt}
                        language="markdown"
                        enableSecretMasking={false}
                        className="bg-transparent border-0 p-0 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-ink-subtle border border-dashed border-hairline rounded-lg">
                    No AI prompt generated for this component yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Component"
        description={`Are you sure you want to delete "${component.name}"? This action cannot be undone.`}
        confirmText="Delete Component"
        variant="danger"
      />
    </>
  );
}
