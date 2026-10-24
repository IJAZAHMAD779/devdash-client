"use client";

import { useState } from "react";
import {
  X,
  Blocks,
  Copy,
  Check,
  Terminal,
  FileCode2,
  Play,
  Sliders,
  Bot,
  Plus,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  ComponentFramework,
  ComponentStyling,
  SynthesizedComponentResult,
} from "@/types/component";
import {
  useSynthesizeComponent,
  useGenerateComponent,
  useCreateComponent,
} from "@/hooks/use-components";
import { ComponentLivePreview } from "./component-live-preview";
import { CodeBlock } from "@/components/ui/code-block";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ComponentSynthesizerModal({
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const [mode, setMode] = useState<"synthesize" | "generate">("synthesize");
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "props" | "prompt">("preview");

  // Inputs
  const [inputCode, setInputCode] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [framework, setFramework] = useState<ComponentFramework>("REACT");
  const [styling, setStyling] = useState<ComponentStyling>("TAILWIND");
  const [preferredCategory, setPreferredCategory] = useState("");

  // Result state
  const [result, setResult] = useState<SynthesizedComponentResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Mutations
  const synthesizeMutation = useSynthesizeComponent();
  const generateMutation = useGenerateComponent();
  const createComponentMutation = useCreateComponent();

  const isProcessing = synthesizeMutation.isPending || generateMutation.isPending;

  if (!isOpen) return null;

  const handleCopy = async (text: string, key: string, label: string) => {
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleRun = async () => {
    sound.playClick(800);
    if (mode === "synthesize") {
      if (!inputCode.trim()) {
        toast.error("Please paste component code to synthesize");
        return;
      }
      synthesizeMutation.mutate(
        { code: inputCode, targetFramework: framework, styling },
        {
          onSuccess: (data) => {
            setResult(data);
            setActiveTab("preview");
            sound.playSuccess();
            toast.success("Component synthesized successfully");
          },
          onError: (err: any) => {
            toast.error(err?.message || "Synthesis failed. Please try again.");
          },
        }
      );
    } else {
      if (!inputPrompt.trim()) {
        toast.error("Please enter a prompt to generate the component");
        return;
      }
      generateMutation.mutate(
        {
          prompt: inputPrompt,
          category: preferredCategory || undefined,
          framework,
          styling,
        },
        {
          onSuccess: (data) => {
            setResult(data);
            setActiveTab("preview");
            sound.playSuccess();
            toast.success("Component generated successfully");
          },
          onError: (err: any) => {
            toast.error(err?.message || "Generation failed. Please try again.");
          },
        }
      );
    }
  };

  const handleSaveToDevDash = async () => {
    if (!result) return;
    sound.playClick(1000);

    createComponentMutation.mutate(
      {
        name: result.name,
        description: result.description,
        category: result.category,
        framework: result.framework,
        styling: result.styling,
        code: result.code,
        tags: [result.category, result.framework.toLowerCase(), result.styling.toLowerCase()],
        aiAgentPrompt: result.aiAgentPrompt,
        howToUse: result.howToUse,
        dependencies: result.dependencies,
        propsSchema: result.propsSchema,
      },
      {
        onSuccess: () => {
          sound.playSuccess();
          toast.success(`Saved "${result.name}" to DevDash library!`);
          if (onSaved) onSaved();
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to save component to library");
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-1 border border-hairline rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Top Header */}
        <div className="px-5 py-3.5 bg-surface-2/60 border-b border-hairline flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-3 border border-hairline flex items-center justify-center text-ink shrink-0">
              <Blocks className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-ink">
                  Component Synthesizer & Architect
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-blue-400 font-medium">
                  Gemini Engine
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Analyze and generate production-ready components with auto-categorization & AI agent prompts
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-surface-3/90 p-1 border border-hairline">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  setMode("synthesize");
                }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  mode === "synthesize"
                    ? "bg-surface-1 text-ink shadow-xs border border-hairline"
                    : "text-ink-tertiary hover:text-ink"
                )}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Code to Asset</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  setMode("generate");
                }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  mode === "generate"
                    ? "bg-surface-1 text-ink shadow-xs border border-hairline"
                    : "text-ink-tertiary hover:text-ink"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Prompt to Component</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer border border-hairline"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Body: Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left Column: Input Panel */}
          <div className="w-full lg:w-[42%] border-b lg:border-b-0 lg:border-r border-hairline bg-surface-1/40 flex flex-col p-4 space-y-3 overflow-y-auto">
            {/* Context Notice */}
            <div className="text-[11px] text-ink-muted">
              {mode === "synthesize"
                ? "Paste any raw React, Next.js, or HTML snippet. The AI will extract category, props, npm packages, and a prompt for other AI agents."
                : "Describe the UI component you need. The AI will generate full production code, documentation, and the master agent prompt."}
            </div>

            {/* Input Editor */}
            {mode === "synthesize" ? (
              <div className="flex-1 flex flex-col space-y-1.5 min-h-[220px]">
                <label className="text-xs font-medium text-ink flex items-center justify-between">
                  <span>Source Code</span>
                  <span className="text-[10px] font-mono text-ink-tertiary">TSX / JSX / HTML</span>
                </label>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={`// Paste component code here...\nexport function MyButton({ children }) {\n  return <button className="px-4 py-2 bg-blue-600 rounded-lg">{children}</button>;\n}`}
                  className="flex-1 w-full p-3 rounded-xl bg-surface-2 border border-hairline text-ink text-xs font-mono resize-none focus:outline-none focus:border-primary/50 placeholder:text-ink-subtle transition-colors min-h-[220px]"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-1.5 min-h-[200px]">
                <label className="text-xs font-medium text-ink flex items-center justify-between">
                  <span>Component Prompt</span>
                  <span className="text-[10px] font-mono text-ink-tertiary">Natural Language</span>
                </label>
                <textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="e.g. Minimalist dark-mode subscription tier card with yearly 20% discount badge, checkmark benefits list, and royal blue primary CTA button..."
                  className="flex-1 w-full p-3 rounded-xl bg-surface-2 border border-hairline text-ink text-xs leading-relaxed resize-none focus:outline-none focus:border-primary/50 placeholder:text-ink-subtle transition-colors min-h-[200px]"
                />
              </div>
            )}

            {/* Config Selectors */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] text-ink-tertiary block mb-1">Framework</label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as ComponentFramework)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-2 border border-hairline text-ink text-xs focus:outline-none cursor-pointer"
                >
                  <option value="REACT">React</option>
                  <option value="NEXTJS">Next.js</option>
                  <option value="HTML_CSS">HTML & CSS</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-ink-tertiary block mb-1">Styling</label>
                <select
                  value={styling}
                  onChange={(e) => setStyling(e.target.value as ComponentStyling)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-2 border border-hairline text-ink text-xs focus:outline-none cursor-pointer"
                >
                  <option value="TAILWIND">Tailwind CSS</option>
                  <option value="VANILLA_CSS">Vanilla CSS</option>
                </select>
              </div>
            </div>

            {mode === "generate" && (
              <div>
                <label className="text-[11px] text-ink-tertiary block mb-1">Target Category (Optional)</label>
                <input
                  type="text"
                  value={preferredCategory}
                  onChange={(e) => setPreferredCategory(e.target.value)}
                  placeholder="e.g. card, button, modal, auth, navigation..."
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-2 border border-hairline text-ink text-xs focus:outline-none placeholder:text-ink-subtle"
                />
              </div>
            )}

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRun}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover active:scale-[0.99] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{mode === "synthesize" ? "Analyzing with Gemini..." : "Synthesizing Component..."}</span>
                </>
              ) : (
                <>
                  <Blocks className="w-3.5 h-3.5" />
                  <span>{mode === "synthesize" ? "Synthesize & Extract Prompt" : "Generate Component"}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Results & Inspection Panel */}
          <div className="flex-1 flex flex-col bg-surface-1 overflow-hidden min-h-0">
            {result ? (
              <>
                {/* Result Top Sub-header & Segmented Tabs */}
                <div className="px-4 py-2 bg-surface-2/40 border-b border-hairline flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-xs text-ink truncate">{result.name}</span>
                    <span className="text-ink-tertiary">·</span>
                    <span className="text-[11px] font-mono text-ink-muted px-2 py-0.5 rounded bg-surface-3 border border-hairline capitalize">
                      {result.category}
                    </span>
                  </div>

                  {/* 4 Inspection Tabs */}
                  <div className="flex items-center rounded-lg bg-surface-3/80 p-0.5 border border-hairline">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick(700);
                        setActiveTab("preview");
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                        activeTab === "preview"
                          ? "bg-surface-1 text-ink shadow-xs border border-hairline"
                          : "text-ink-tertiary hover:text-ink"
                      )}
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick(700);
                        setActiveTab("code");
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                        activeTab === "code"
                          ? "bg-surface-1 text-ink shadow-xs border border-hairline"
                          : "text-ink-tertiary hover:text-ink"
                      )}
                    >
                      <FileCode2 className="w-3 h-3" />
                      <span>Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick(700);
                        setActiveTab("props");
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                        activeTab === "props"
                          ? "bg-surface-1 text-ink shadow-xs border border-hairline"
                          : "text-ink-tertiary hover:text-ink"
                      )}
                    >
                      <Terminal className="w-3 h-3" />
                      <span>Docs & Deps</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick(700);
                        setActiveTab("prompt");
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                        activeTab === "prompt"
                          ? "bg-primary text-white shadow-xs"
                          : "text-ink-tertiary hover:text-ink"
                      )}
                    >
                      <Bot className="w-3 h-3" />
                      <span>AI Agent Prompt</span>
                    </button>
                  </div>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-auto p-4">
                  {/* Tab 1: Live Interactive Preview */}
                  {activeTab === "preview" && (
                    <div className="h-full flex flex-col space-y-3">
                      <div className="text-[11px] text-ink-muted flex items-center justify-between">
                        <span>Interactive Sandbox Canvas (React 18 + Tailwind)</span>
                        <span className="font-mono text-[10px] text-ink-subtle">Click & hover to test states</span>
                      </div>
                      <div className="flex-1 min-h-[380px]">
                        <ComponentLivePreview
                          code={result.code}
                          name={result.name}
                          category={result.category}
                          framework={result.framework}
                          className="h-full min-h-[380px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Clean Source Code */}
                  {activeTab === "code" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">Production Source Code</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(result.code, "code", "Source code")}
                          className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-medium text-ink-muted hover:text-ink border border-hairline inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedKey === "code" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedKey === "code" ? "Copied!" : "Copy Code"}</span>
                        </button>
                      </div>
                      <CodeBlock
                        code={result.code}
                        language={result.framework === "HTML_CSS" ? "html" : "typescript"}
                      />
                    </div>
                  )}

                  {/* Tab 3: Props & Dependencies */}
                  {activeTab === "props" && (
                    <div className="space-y-5">
                      {/* Dependencies Card */}
                      <div className="p-3.5 rounded-xl bg-surface-2 border border-hairline space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-ink-tertiary" />
                            <span>Required NPM Dependencies</span>
                          </span>
                          {result.dependencies.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `npm i ${result.dependencies.join(" ")}`,
                                  "deps",
                                  "Install command"
                                )
                              }
                              className="text-[11px] text-ink-muted hover:text-ink px-2 py-0.5 rounded bg-surface-3 border border-hairline inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedKey === "deps" ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy npm install</span>
                            </button>
                          )}
                        </div>

                        {result.dependencies.length > 0 ? (
                          <div className="font-mono text-xs text-blue-400 bg-surface-3 p-2 rounded-lg border border-hairline flex items-center gap-2">
                            <span className="text-ink-tertiary select-none">$</span>
                            <span>npm i {result.dependencies.join(" ")}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-ink-tertiary font-mono">
                            Zero third-party dependencies required. Standard React only.
                          </div>
                        )}
                      </div>

                      {/* How To Use Snippet */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">Usage Snippet</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(result.howToUse, "usage", "Usage snippet")}
                            className="text-[11px] text-ink-muted hover:text-ink px-2 py-0.5 rounded bg-surface-2 hover:bg-surface-3 border border-hairline inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedKey === "usage" ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy Usage</span>
                          </button>
                        </div>
                        <CodeBlock
                          code={result.howToUse}
                          language="typescript"
                        />
                      </div>

                      {/* Props Schema Table */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-ink">Props Schema</span>
                        {result.propsSchema && result.propsSchema.length > 0 ? (
                          <div className="rounded-xl border border-hairline overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-surface-2/80 text-ink-tertiary border-b border-hairline font-mono text-[11px]">
                                <tr>
                                  <th className="p-2.5 font-medium">Prop</th>
                                  <th className="p-2.5 font-medium">Type</th>
                                  <th className="p-2.5 font-medium">Default</th>
                                  <th className="p-2.5 font-medium">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-hairline bg-surface-1">
                                {result.propsSchema.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-surface-2/40 transition-colors">
                                    <td className="p-2.5 font-mono text-blue-400 font-semibold">
                                      {item.prop}
                                    </td>
                                    <td className="p-2.5 font-mono text-ink-muted">{item.type}</td>
                                    <td className="p-2.5 font-mono text-ink-subtle">
                                      {item.default || "—"}
                                    </td>
                                    <td className="p-2.5 text-ink-muted leading-relaxed">
                                      {item.description}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-3 text-xs text-ink-tertiary bg-surface-2 rounded-xl border border-hairline">
                            No customizable props defined. Component is self-contained.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 4: AI Agent Master Prompt */}
                  {activeTab === "prompt" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-surface-2 border border-hairline space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold text-ink">
                              Reusable Master Prompt for AI Agents
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(result.aiAgentPrompt, "agent-prompt", "AI Agent Prompt")}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            {copiedKey === "agent-prompt" ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === "agent-prompt" ? "Copied!" : "Copy Master Prompt"}</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-ink-muted leading-relaxed">
                          This reverse-engineered prompt captures the exact design tokens, interaction mechanics, and props architecture. Feed it into Claude, Cursor, Antigravity, or Gemini to recreate or adapt this component into any future project.
                        </p>

                        <div className="p-3.5 rounded-xl bg-black/60 border border-hairline font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap select-all max-h-[320px] overflow-y-auto">
                          {result.aiAgentPrompt}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Studio Footer: Save to Library */}
                <div className="px-5 py-3 bg-surface-2/60 border-t border-hairline flex items-center justify-between">
                  <div className="text-xs text-ink-muted">
                    Ready to keep in your personal workspace catalog.
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveToDevDash}
                    disabled={createComponentMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover active:scale-[0.99] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {createComponentMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Save to DevDash Library</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-tertiary">
                  <Blocks className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-semibold text-ink">No Component Synthesized Yet</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Paste raw code on the left to extract metadata and AI prompts, or write a description to generate one from scratch.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
