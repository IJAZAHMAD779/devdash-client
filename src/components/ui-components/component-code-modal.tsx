"use client";

import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Edit2,
  Star,
  ChevronDown,
  ChevronUp,
  Package,
  Code2,
  Blocks,
  BookOpen,
  Eye,
} from "lucide-react";
import { UIComponentItem, ComponentPropItem } from "@/types/component";
import { CodeBlock } from "@/components/ui/code-block";
import { ComponentLivePreview } from "./component-live-preview";
import { useToggleComponentFavorite } from "@/hooks/use-components";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
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
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedUsage, setCopiedUsage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFavorite = useToggleComponentFavorite();

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

  const handleCopyCode = async () => {
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(component.code);
      setCopiedCode(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleCopyPrompt = async () => {
    if (!component.aiAgentPrompt) return;
    sound.playSuccess();
    try {
      await navigator.clipboard.writeText(component.aiAgentPrompt);
      setCopiedPrompt(true);
      toast.success("AI Agent Master Prompt copied to clipboard");
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const handleCopyNpmInstall = async () => {
    if (!component.dependencies || component.dependencies.length === 0) return;
    sound.playClick(900);
    const cmd = `npm i ${component.dependencies.join(" ")}`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedNpm(true);
      toast.success(`Copied: ${cmd}`);
      setTimeout(() => setCopiedNpm(false), 2000);
    } catch {
      toast.error("Failed to copy npm command");
    }
  };

  const handleCopyHowToUse = async () => {
    if (!component.howToUse) return;
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(component.howToUse);
      setCopiedUsage(true);
      toast.success("Usage example copied");
      setTimeout(() => setCopiedUsage(false), 2000);
    } catch {
      toast.error("Failed to copy usage example");
    }
  };

  const handleToggleFavorite = () => {
    sound.playClick(850);
    toggleFavorite.mutate({
      id: component.id,
      favorite: !component.favorite,
    });
  };

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
        className="w-full max-w-5xl max-h-[92vh] rounded-2xl bg-canvas border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="px-5 py-3.5 bg-surface-1 border-b border-hairline flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
          {/* Left: Component Title & Badges */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold tracking-[-0.3px] text-ink truncate">
              {component.name}
            </h2>
            {component.category && (
              <span className="hidden sm:inline-block text-xs font-normal text-ink-muted capitalize">
                · {component.category}
              </span>
            )}
            {component.aiAgentPrompt && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono font-medium text-blue-400">
                <Blocks className="w-2.5 h-2.5" />
                <span>AI Prompt Ready</span>
              </span>
            )}
          </div>

          {/* Right: Quick actions + Segmented tab toggle */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Star Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "p-1.5 rounded-lg border border-hairline transition-colors cursor-pointer",
                component.favorite
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-surface-2 text-ink-tertiary hover:text-ink hover:bg-surface-3"
              )}
              title={component.favorite ? "Starred" : "Star component"}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  component.favorite && "fill-amber-400"
                )}
              />
            </button>

            {/* Quick Copy Code Button */}
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer flex items-center justify-center"
              title="Copy code"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Segmented Tab Bar */}
            <div className="flex items-center rounded-lg bg-surface-2 p-1 border border-hairline text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(850);
                  setActiveTab("preview");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1.5",
                  activeTab === "preview"
                    ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                    : "text-ink-muted hover:text-ink border border-transparent"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(850);
                  setActiveTab("code");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1.5",
                  activeTab === "code"
                    ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                    : "text-ink-muted hover:text-ink border border-transparent"
                )}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(850);
                  setActiveTab("docs");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1.5 relative",
                  activeTab === "docs"
                    ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                    : "text-ink-muted hover:text-ink border border-transparent"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Props & Docs</span>
                {(parsedProps.length > 0 || (component.dependencies && component.dependencies.length > 0)) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(850);
                  setActiveTab("prompt");
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1.5 relative",
                  activeTab === "prompt"
                    ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                    : "text-ink-muted hover:text-ink border border-transparent"
                )}
              >
                <Blocks className="w-3.5 h-3.5 text-blue-400" />
                <span>AI Prompt</span>
                {component.aiAgentPrompt && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={() => {
                  sound.playClick(750);
                  onClose();
                  onEdit(component);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
                title="Edit component"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>Edit</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick(600);
                onClose();
              }}
              className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ml-1"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-canvas">
          {/* TAB 1: PREVIEW */}
          {activeTab === "preview" && (
            <div className="rounded-2xl overflow-hidden shadow-inner">
              <ComponentLivePreview
                code={component.code}
                name={component.name}
                category={component.category}
                framework={component.framework}
                className="w-full min-h-[480px] border-hairline"
              />
            </div>
          )}

          {/* TAB 2: CODE */}
          {activeTab === "code" && (
            <div className="relative rounded-2xl bg-surface-1 border border-hairline overflow-hidden p-4 sm:p-5 shadow-inner">
              <div
                className={cn(
                  "transition-all duration-200 overflow-hidden font-mono text-xs",
                  !isExpanded ? "max-h-[420px]" : "max-h-none"
                )}
              >
                <CodeBlock
                  code={component.code}
                  language={getLanguage()}
                  enableSecretMasking={false}
                  className="bg-transparent border-0 p-0 text-xs"
                />
              </div>

              {!isExpanded && (
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-surface-1 via-surface-1/80 to-transparent" />
              )}

              <div className="relative z-10 flex justify-center mt-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(800);
                    setIsExpanded(!isExpanded);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink hover:text-white transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <span>{isExpanded ? "Show less" : "Show more"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROPS & DOCS */}
          {activeTab === "docs" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Dependencies Card */}
              {component.dependencies && component.dependencies.length > 0 && (
                <div className="rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-ink">NPM Dependencies</h4>
                        <p className="text-[11px] text-ink-muted">Packages required to run this component</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyNpmInstall}
                      className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-mono text-ink-muted hover:text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedNpm ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>npm i {component.dependencies.join(" ")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {component.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="px-2.5 py-1 rounded-md bg-surface-2 border border-hairline font-mono text-xs text-ink flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Snippet */}
              {component.howToUse && (
                <div className="rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-ink">Quick Usage Example</h4>
                        <p className="text-[11px] text-ink-muted">Drop-in integration code</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyHowToUse}
                      className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedUsage ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Usage</span>
                    </button>
                  </div>

                  <div className="rounded-xl bg-canvas border border-hairline p-3 font-mono text-xs text-ink/90 overflow-x-auto">
                    <pre><code>{component.howToUse}</code></pre>
                  </div>
                </div>
              )}

              {/* Props Table */}
              <div className="rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Component Props Interface</h4>
                    <p className="text-[11px] text-ink-muted">Structured parameter definitions</p>
                  </div>
                </div>

                {parsedProps.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-hairline bg-surface-2/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-2 text-ink-muted uppercase tracking-wider text-[10px] font-mono border-b border-hairline">
                        <tr>
                          <th className="px-3.5 py-2.5 font-medium">Prop</th>
                          <th className="px-3.5 py-2.5 font-medium">Type</th>
                          <th className="px-3.5 py-2.5 font-medium">Default</th>
                          <th className="px-3.5 py-2.5 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {parsedProps.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-2/60 transition-colors">
                            <td className="px-3.5 py-2.5 font-mono text-emerald-400 font-medium">
                              {item.prop}
                            </td>
                            <td className="px-3.5 py-2.5 font-mono text-blue-400 text-[11px]">
                              {item.type}
                            </td>
                            <td className="px-3.5 py-2.5 font-mono text-ink-subtle text-[11px]">
                              {item.default || "—"}
                            </td>
                            <td className="px-3.5 py-2.5 text-ink-muted text-xs">
                              {item.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl bg-surface-2/40 border border-hairline p-6 text-center space-y-1">
                    <p className="text-xs text-ink-muted">No structured props schema documented yet.</p>
                    <p className="text-[11px] text-ink-subtle">
                      Use the AI Synthesizer to automatically extract props from component code.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AI AGENT PROMPT */}
          {activeTab === "prompt" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Blocks className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-ink">
                        Master Prompt for AI Coding Agents
                      </h3>
                      <p className="text-[11px] text-ink-muted">
                        Reverse-engineered specification ready for Gemini, Claude, Cursor, Copilot, or ChatGPT
                      </p>
                    </div>
                  </div>

                  {component.aiAgentPrompt && (
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Copied Master Prompt!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Master Prompt</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {component.aiAgentPrompt ? (
                  <div className="rounded-xl bg-canvas border border-hairline p-4 font-mono text-xs text-ink/90 whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto select-text shadow-inner">
                    {component.aiAgentPrompt}
                  </div>
                ) : (
                  <div className="rounded-xl bg-surface-2/40 border border-hairline p-8 text-center space-y-2">
                    <Blocks className="w-6 h-6 text-ink-tertiary mx-auto" />
                    <p className="text-xs font-medium text-ink">
                      No AI Agent Prompt recorded for this component
                    </p>
                    <p className="text-[11px] text-ink-muted max-w-md mx-auto">
                      This component was created manually before the AI Synthesizer. You can copy the code and run it through the <strong>AI Synthesizer</strong> to instantly generate the full master prompt, props table, and dependencies!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
