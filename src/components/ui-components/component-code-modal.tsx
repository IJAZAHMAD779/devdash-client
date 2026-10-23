"use client";

import { useState } from "react";
import {
  X,
  FileCode,
  Copy,
  Check,
  Edit2,
  Play,
  Code2,
  FolderKanban,
  Tag,
} from "lucide-react";
import { UIComponentItem } from "@/types/component";
import { CodeBlock } from "@/components/ui/code-block";
import { ComponentLivePreview } from "./component-live-preview";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  component: UIComponentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (component: UIComponentItem) => void;
}

export function ComponentCodeModal({
  component,
  isOpen,
  onClose,
  onEdit,
}: Props) {
  const [activeTab, setActiveTab] = useState<"code" | "usage" | "preview">("code");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !component) return null;

  const getLanguage = () => {
    if (component.framework === "VUE") return "html";
    if (component.framework === "SVELTE") return "html";
    if (component.framework === "HTML_CSS") return "html";
    return "typescript";
  };

  const getFileExtension = () => {
    switch (component.framework) {
      case "REACT":
      case "NEXTJS":
        return ".tsx";
      case "VUE":
        return ".vue";
      case "SVELTE":
        return ".svelte";
      case "HTML_CSS":
        return ".html";
      default:
        return ".tsx";
    }
  };

  const handleCopyCode = async () => {
    sound.playClick(900);
    const codeToCopy =
      activeTab === "usage" && component.previewCode
        ? component.previewCode
        : component.code;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const fileName = `${component.name.toLowerCase().replace(/\s+/g, "-")}${getFileExtension()}`;
  const isHtmlCss = component.framework === "HTML_CSS";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick(600);
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-4xl h-[85vh] max-h-[85vh] rounded-xl bg-canvas border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* VS Code Title Bar */}
        <div className="h-11 px-4 bg-surface-1 border-b border-hairline flex items-center justify-between gap-3 shrink-0 select-none">
          {/* Left: Window controls + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-tertiary font-mono truncate">
              <span>components</span>
              <span>/</span>
              <span className="text-ink-muted">{component.category || "general"}</span>
              <span>/</span>
              <span className="text-ink font-medium">{fileName}</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-mono text-ink-muted hover:text-ink transition-colors cursor-pointer"
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onEdit && (
              <button
                onClick={() => {
                  sound.playClick(750);
                  onClose();
                  onEdit(component);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-mono text-ink-muted hover:text-ink transition-colors cursor-pointer"
                title="Edit component"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick(600);
                onClose();
              }}
              className="p-1 rounded text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ml-1"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VS Code Editor Tabs Bar */}
        <div className="h-10 px-2 bg-surface-1/60 border-b border-hairline flex items-center justify-between gap-2 shrink-0 select-none overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            {/* Active File Tab */}
            <button
              onClick={() => setActiveTab("code")}
              className={cn(
                "h-8 px-3 rounded-t text-xs font-mono inline-flex items-center gap-2 border-t-2 transition-colors cursor-pointer whitespace-nowrap",
                activeTab === "code"
                  ? "bg-canvas border-primary text-ink font-medium"
                  : "bg-surface-1/40 border-transparent text-ink-tertiary hover:text-ink hover:bg-surface-2/60"
              )}
            >
              <FileCode className="w-3.5 h-3.5 text-primary" />
              <span>{fileName}</span>
            </button>

            {/* Usage Example Tab (if previewCode exists) */}
            {component.previewCode && (
              <button
                onClick={() => setActiveTab("usage")}
                className={cn(
                  "h-8 px-3 rounded-t text-xs font-mono inline-flex items-center gap-2 border-t-2 transition-colors cursor-pointer whitespace-nowrap",
                  activeTab === "usage"
                    ? "bg-canvas border-primary text-ink font-medium"
                    : "bg-surface-1/40 border-transparent text-ink-tertiary hover:text-ink hover:bg-surface-2/60"
                )}
              >
                <Code2 className="w-3.5 h-3.5 text-ink-muted" />
                <span>Usage.tsx</span>
              </button>
            )}

            {/* Live Sandbox Preview Tab — strictly HTML/CSS only */}
            {isHtmlCss && (
              <button
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "h-8 px-3 rounded-t text-xs font-mono inline-flex items-center gap-2 border-t-2 transition-colors cursor-pointer whitespace-nowrap",
                  activeTab === "preview"
                    ? "bg-canvas border-primary text-emerald-400 font-medium"
                    : "bg-surface-1/40 border-transparent text-ink-tertiary hover:text-emerald-400 hover:bg-surface-2/60"
                )}
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Preview</span>
              </button>
            )}
          </div>

          {/* Component Metadata Labels — Clean text without pill background */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-ink-tertiary pr-2 shrink-0">
            <span className="text-sky-400 font-medium">{component.framework}</span>
            <span>·</span>
            <span className="text-cyan-300 font-medium">{component.styling}</span>
            <span>·</span>
            <span className="text-ink-muted capitalize">{component.category || "general"}</span>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 min-h-0 bg-canvas overflow-y-auto overscroll-contain touch-pan-y">
          {activeTab === "preview" && isHtmlCss ? (
            <div className="p-4 h-full">
              <ComponentLivePreview
                code={component.code}
                name={component.name}
                className="h-full min-h-[400px]"
              />
            </div>
          ) : (
            <div className="p-4">
              <CodeBlock
                code={
                  activeTab === "code"
                    ? component.code
                    : component.previewCode || component.code
                }
                language={getLanguage()}
                className="rounded-lg border border-hairline"
              />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-7 px-3 bg-surface-1 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-ink-tertiary shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span>{component.name}</span>
            {component.project && (
              <span className="inline-flex items-center gap-1 text-ink-muted">
                <FolderKanban className="w-3 h-3" />
                <span>{component.project.title}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {component.tags && component.tags.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                <span>{component.tags.map((t) => `#${t}`).join(" ")}</span>
              </div>
            )}
            <span>UTF-8</span>
            <span className="uppercase">{getLanguage()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
