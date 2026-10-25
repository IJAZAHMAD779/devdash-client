"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  FolderOpen,
  Terminal,
  RefreshCw,
  Plus,
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
import { DeviceFrame } from "./device-frame";
import { CodeBlock } from "@/components/ui/code-block";
import { CopyButton } from "@/components/snippets/copy-button";
import { TabsUnderline, TabItem } from "./tabs-underline";
import { SnippetPopover, SnippetPopoverOption } from "@/components/snippets/snippet-popover";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const FRAMEWORK_OPTIONS: SnippetPopoverOption<ComponentFramework>[] = [
  { value: "REACT", label: "React" },
  { value: "NEXTJS", label: "Next.js" },
  { value: "VUE", label: "Vue" },
  { value: "SVELTE", label: "Svelte" },
  { value: "HTML_CSS", label: "HTML/CSS" },
];

const STYLING_OPTIONS: SnippetPopoverOption<ComponentStyling>[] = [
  { value: "TAILWIND", label: "Tailwind CSS" },
  { value: "CSS_MODULES", label: "CSS Modules" },
  { value: "VANILLA_CSS", label: "Vanilla CSS" },
  { value: "STYLED_COMPONENTS", label: "Styled Components" },
];

type ResultTab = "preview" | "code" | "props" | "prompt";

export function ComponentSynthesizerModal({ isOpen, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<"synthesize" | "generate">("synthesize");
  const [activeTab, setActiveTab] = useState<ResultTab>("preview");

  // Inputs
  const [inputCode, setInputCode] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [framework, setFramework] = useState<ComponentFramework>("REACT");
  const [styling, setStyling] = useState<ComponentStyling>("TAILWIND");
  const [preferredCategory, setPreferredCategory] = useState("");

  // Result state
  const [result, setResult] = useState<SynthesizedComponentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mutations
  const synthesizeMutation = useSynthesizeComponent();
  const generateMutation = useGenerateComponent();
  const createComponentMutation = useCreateComponent();

  const isProcessing = synthesizeMutation.isPending || generateMutation.isPending;

  // Auto-grow textarea up to 50vh
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = window.innerHeight * 0.5;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 220), maxHeight)}px`;
    }
  }, [inputCode, inputPrompt]);

  // Keyboard shortcut: Cmd/Ctrl + Enter runs synthesis, Esc cancels
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        sound.playClick(600);
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isProcessing) {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, inputCode, inputPrompt, mode, framework, styling, preferredCategory, isProcessing]);

  if (!isOpen) return null;

  // Tab key handling for code
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (!e.shiftKey) {
        const next = inputCode.substring(0, start) + "  " + inputCode.substring(end);
        setInputCode(next);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        }, 0);
      } else {
        if (inputCode.substring(start - 2, start) === "  ") {
          const next = inputCode.substring(0, start - 2) + inputCode.substring(end);
          setInputCode(next);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = Math.max(0, start - 2);
          }, 0);
        }
      }
    }
  };

  const handleRun = async () => {
    sound.playClick(800);
    setErrorMsg(null);

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
            const msg = err?.message || "Synthesis failed. Please try again.";
            setErrorMsg(msg);
            toast.error(msg);
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
            const msg = err?.message || "Generation failed. Please try again.";
            setErrorMsg(msg);
            toast.error(msg);
          },
        }
      );
    }
  };

  const handleSaveToCatalog = () => {
    if (!result) return;
    sound.playClick(850);
    createComponentMutation.mutate(
      {
        name: result.name,
        description: result.description,
        category: result.category || preferredCategory || "general",
        framework: result.framework,
        styling: result.styling,
        code: result.code,
        dependencies: result.dependencies,
        propsSchema: result.propsSchema,
        howToUse: result.howToUse,
        aiAgentPrompt: result.aiAgentPrompt,
        tags: [result.category || "ui", result.framework.toLowerCase()],
      },
      {
        onSuccess: () => {
          sound.playSuccess();
          toast.success(`"${result.name}" saved to component library`);
          if (onSaved) onSaved();
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to save component");
        },
      }
    );
  };

  const resultTabs: TabItem<ResultTab>[] = [
    { id: "preview", label: "Preview" },
    { id: "code", label: "Code" },
    { id: "props", label: "Props & Docs", hasContent: Boolean(result?.propsSchema?.length || result?.dependencies?.length) },
    { id: "prompt", label: "AI Prompt", hasContent: Boolean(result?.aiAgentPrompt) },
  ];

  const npmCmd = result?.dependencies && result.dependencies.length > 0
    ? `npm i ${result.dependencies.join(" ")}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="synthesizer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick(600);
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[1100px] max-h-[92vh] rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title, Subtitle, Underline Mode Toggle, Gemini Engine mono label, Close */}
        <div className="px-5 py-3 border-b border-hairline flex flex-wrap items-center justify-between gap-3 shrink-0 select-none bg-surface-1">
          <div className="flex items-center gap-3">
            <div>
              <h2
                id="synthesizer-modal-title"
                className="text-base font-semibold tracking-[-0.4px] text-ink leading-tight"
              >
                AI Component Synthesizer
              </h2>
              <p className="text-[11px] text-ink-subtle mt-0.5">
                Transform code into design system assets or generate from natural language
              </p>
            </div>

            <span className="font-mono text-[10px] text-ink-subtle/80 bg-surface-2 px-1.5 py-0.5 rounded border border-hairline">
              gemini-flash
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Underline Toggle with high contrast */}
            <div className="flex items-center gap-2 border-b border-hairline text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(850);
                  setMode("synthesize");
                }}
                className={cn(
                  "pb-1.5 transition-colors relative",
                  mode === "synthesize"
                    ? "text-ink font-semibold"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                <span>Code to Asset</span>
                {mode === "synthesize" && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-accent rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick(850);
                  setMode("generate");
                }}
                className={cn(
                  "pb-1.5 transition-colors relative",
                  mode === "generate"
                    ? "text-ink font-semibold"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                <span>Prompt to Component</span>
                {mode === "generate" && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-accent rounded-full" />
                )}
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                sound.playClick(600);
                onClose();
              }}
              aria-label="Close modal"
              className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-Pane Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-hairline overflow-hidden">
          {/* LEFT PANE: Inputs & Controls */}
          <div className="flex flex-col h-full overflow-hidden bg-surface-1">
            <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
              {/* Popovers row: Framework & Styling */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-ink-subtle text-[11px]">Framework:</span>
                  <SnippetPopover
                    options={FRAMEWORK_OPTIONS}
                    value={framework}
                    onChange={(val) => setFramework(val)}
                  />
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-ink-subtle text-[11px]">Styling:</span>
                  <SnippetPopover
                    options={STYLING_OPTIONS}
                    value={styling}
                    onChange={(val) => setStyling(val)}
                  />
                </div>

                {mode === "generate" && (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-ink-subtle text-[11px]">Category:</span>
                    <input
                      type="text"
                      value={preferredCategory}
                      onChange={(e) => setPreferredCategory(e.target.value)}
                      placeholder="e.g. navigation"
                      className="h-7 px-2 rounded-md bg-surface-2 text-xs font-mono text-ink border border-hairline focus:outline-none focus:border-accent w-28 placeholder:text-ink-subtle/50"
                    />
                  </div>
                )}
              </div>

              {/* Main Input Field */}
              {mode === "synthesize" ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-subtle">
                    <span>Source Code (JSX / TSX / HTML)</span>
                    <span>Tab indents</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    onKeyDown={handleCodeKeyDown}
                    placeholder="// Paste raw React component, SVG asset, or HTML code..."
                    spellCheck={false}
                    className="w-full min-h-[260px] p-3 rounded-md bg-surface-2/70 border border-hairline text-ink font-mono text-[13px] leading-[20px] resize-none focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Natural Language Component Prompt
                  </span>
                  <textarea
                    ref={textareaRef}
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="e.g. Build a dense dark-mode Kanban column header with active task count, popover options menu, and drag handle..."
                    spellCheck={false}
                    className="w-full min-h-[260px] p-3 rounded-md bg-surface-2/70 border border-hairline text-ink text-xs leading-relaxed resize-none focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              )}

              {/* Server error line with retry */}
              {errorMsg && (
                <div className="flex items-center justify-between gap-2 p-2 rounded text-xs font-mono text-rose-300 bg-rose-500/10 border border-rose-500/20">
                  <span className="truncate">{errorMsg}</span>
                  <button
                    type="button"
                    onClick={handleRun}
                    className="inline-flex items-center gap-1 text-ink underline hover:text-white shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}
            </div>

            {/* Left Footer: Standard-sized primary button right-aligned */}
            <div className="px-4 py-2.5 border-t border-hairline bg-surface-1 flex items-center justify-between select-none">
              <span className="text-[11px] font-mono text-ink-subtle">
                <kbd className="border border-hairline px-1 py-0.2 rounded bg-surface-2 text-ink-muted">
                  ⌘ Enter
                </kbd>{" "}
                to run
              </span>

              <button
                type="button"
                onClick={handleRun}
                disabled={isProcessing}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm",
                  isProcessing && "opacity-60 cursor-not-allowed"
                )}
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isProcessing
                    ? "Synthesizing..."
                    : mode === "synthesize"
                    ? "Synthesize & Extract Prompt"
                    : "Generate Component"}
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT PANE: Results / Empty State */}
          <div className="flex flex-col h-full overflow-hidden bg-surface-1">
            {result ? (
              <>
                {/* Result Tabs & Save Button Header */}
                <div className="px-4 pt-2.5 border-b border-hairline flex items-center justify-between select-none bg-surface-1">
                  <TabsUnderline
                    tabs={resultTabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="border-b-0"
                  />

                  <button
                    type="button"
                    onClick={handleSaveToCatalog}
                    disabled={createComponentMutation.isPending}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm shrink-0 mb-1.5"
                  >
                    {createComponentMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    <span>Save to Catalog</span>
                  </button>
                </div>

                {/* Result Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* TAB 1: PREVIEW */}
                  {activeTab === "preview" && (
                    <DeviceFrame
                      runtimeNote={
                        result.framework === "HTML_CSS"
                          ? "Native DOM + Tailwind"
                          : "React 18 · Babel"
                      }
                    >
                      {(viewport, refreshKey) => (
                        <ComponentLivePreview
                          key={refreshKey}
                          code={result.code}
                          name={result.name}
                          category={result.category}
                          framework={result.framework}
                          viewport={viewport}
                          hideToolbar={true}
                          className="w-full border-0 bg-transparent rounded-none"
                        />
                      )}
                    </DeviceFrame>
                  )}

                  {/* TAB 2: CODE */}
                  {activeTab === "code" && (
                    <div className="rounded-lg bg-surface-2/40 border border-hairline overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-hairline bg-surface-2/60 select-none">
                        <span className="font-mono text-[11px] text-ink-subtle uppercase">
                          Generated Code
                        </span>
                        <CopyButton
                          textToCopy={result.code}
                          label="Copy code"
                          showText={true}
                          className="h-6 px-2 text-[11px] rounded text-ink-muted hover:text-ink hover:bg-surface-3"
                        />
                      </div>
                      <div className="max-h-[min(55vh,480px)] overflow-auto p-3 font-mono text-[12px] leading-[22px]">
                        <CodeBlock
                          code={result.code}
                          language="typescript"
                          enableSecretMasking={false}
                          className="bg-transparent border-0 p-0 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PROPS & DOCS */}
                  {activeTab === "props" && (
                    <div className="space-y-3 select-none">
                      <div className="p-3 rounded-lg bg-surface-2/40 border border-hairline text-xs text-ink-muted leading-relaxed">
                        <div className="font-medium text-ink mb-1">{result.name}</div>
                        {result.description}
                      </div>

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

                      {result.propsSchema && result.propsSchema.length > 0 && (
                        <div className="rounded-lg border border-hairline overflow-hidden bg-surface-1">
                          <div className="grid grid-cols-12 px-3 py-2 bg-surface-2/60 border-b border-hairline text-[11px] font-mono uppercase tracking-[0.08em] text-ink-subtle">
                            <div className="col-span-3">Prop</div>
                            <div className="col-span-3">Type</div>
                            <div className="col-span-2">Default</div>
                            <div className="col-span-4">Description</div>
                          </div>
                          <div className="divide-y divide-hairline">
                            {result.propsSchema.map((p, idx) => (
                              <div
                                key={idx}
                                className="grid grid-cols-12 px-3 py-2 text-xs hover:bg-surface-2/30 transition-colors items-baseline"
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
                      )}
                    </div>
                  )}

                  {/* TAB 4: AI PROMPT */}
                  {activeTab === "prompt" && (
                    <div className="rounded-lg bg-surface-2/40 border border-hairline overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-hairline bg-surface-2/60 select-none">
                        <span className="font-mono text-[11px] text-ink-subtle uppercase">
                          AI Agent Master Prompt
                        </span>
                        <CopyButton
                          textToCopy={result.aiAgentPrompt}
                          label="Copy prompt"
                          showText={true}
                          className="h-6 px-2 text-[11px] rounded text-ink-muted hover:text-ink hover:bg-surface-3"
                        />
                      </div>
                      <div className="max-h-[min(55vh,480px)] overflow-auto p-3 font-mono text-[12px] leading-[22px]">
                        <CodeBlock
                          code={result.aiAgentPrompt}
                          language="markdown"
                          enableSecretMasking={false}
                          className="bg-transparent border-0 p-0 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Centered single-line muted empty state (NO big icon box) */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
                <p className="text-xs font-mono text-ink-subtle max-w-xs leading-relaxed">
                  No component synthesized yet. Enter code or prompt on the left and run synthesis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
